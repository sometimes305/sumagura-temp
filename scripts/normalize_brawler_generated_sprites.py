from pathlib import Path

from PIL import Image, ImageDraw
import numpy as np


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "characters" / "brawler" / "brawler_source"
OUT = ROOT / "assets" / "characters" / "brawler"
FRAME = 128
WIDE_FRAME = 224


def remove_green(cell):
    cell = cell.convert("RGBA")
    px = cell.load()
    w, h = cell.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            # GPT image often adds a slight green lighting falloff. Keep the
            # threshold broad enough to remove that while preserving Zane.
            greenish = g > 92 and g > r + 18 and g > b + 18 and g > r * 1.08 and g > b * 1.08
            vivid_key = g > 105 and r < 120 and b < 120
            if greenish or vivid_key:
                px[x, y] = (0, 0, 0, 0)
    return cell


def content_box(img):
    alpha = img.getchannel("A")
    return alpha.getbbox()


def find_components(arr, threshold=12):
    alpha = arr[..., 3] > threshold
    h, w = alpha.shape
    seen = np.zeros_like(alpha, dtype=bool)
    components = []
    lum = arr[..., 0].astype(np.float32) * 0.299 + arr[..., 1].astype(np.float32) * 0.587 + arr[..., 2].astype(np.float32) * 0.114

    for sy in range(h):
        for sx in range(w):
            if not alpha[sy, sx] or seen[sy, sx]:
                continue
            stack = [(sx, sy)]
            seen[sy, sx] = True
            pts = []
            while stack:
                x, y = stack.pop()
                pts.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and alpha[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((nx, ny))
            xs = np.array([p[0] for p in pts])
            ys = np.array([p[1] for p in pts])
            dark = int(np.sum(lum[ys, xs] < 220))
            components.append({
                "pts": pts,
                "area": len(pts),
                "bbox": (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1),
                "cx": float(xs.mean()),
                "cy": float(ys.mean()),
                "dark": dark,
            })
    return components


def component_distance(a, b):
    ax0, ay0, ax1, ay1 = a["bbox"]
    bx0, by0, bx1, by1 = b["bbox"]
    dx = max(bx0 - ax1, ax0 - bx1, 0)
    dy = max(by0 - ay1, ay0 - by1, 0)
    return (dx * dx + dy * dy) ** 0.5


def remove_detached_artifacts(img, min_area=20):
    arr = np.array(img.convert("RGBA"))
    components = find_components(arr)
    if not components:
        return Image.fromarray(arr, "RGBA")

    h, w = arr.shape[:2]
    main = max(components, key=lambda c: (c["dark"] * 3, c["area"]))
    main_area = max(1, main["area"])
    max_dim = max(w, h)
    keep = np.zeros((h, w), dtype=bool)

    for comp in components:
        dist = component_distance(comp, main)
        x0, y0, x1, y1 = comp["bbox"]
        edge = x0 <= 2 or y0 <= 2 or x1 >= w - 2 or y1 >= h - 2
        sizable = comp["area"] >= max(min_area, main_area * 0.025)
        close = dist <= max(12, max_dim * 0.17)
        large_effect = comp["area"] >= main_area * 0.12 and dist <= max_dim * 0.38
        body_detail = comp["dark"] >= 18 and dist <= max_dim * 0.22
        edge_chip = edge and comp["area"] < main_area * 0.18 and dist > max(4, max_dim * 0.025)
        should_keep = comp is main or ((sizable and close) or large_effect or body_detail)
        if edge_chip:
            should_keep = False
        if should_keep:
            for x, y in comp["pts"]:
                keep[y, x] = True

    arr[~keep, 3] = 0
    return Image.fromarray(arr, "RGBA")


def find_anchor(img, bbox):
    arr = np.array(img.convert("RGBA"))
    x0, y0, x1, y1 = bbox
    alpha = arr[..., 3] > 18
    lum = arr[..., 0].astype(np.float32) * 0.299 + arr[..., 1].astype(np.float32) * 0.587 + arr[..., 2].astype(np.float32) * 0.114
    body = alpha & (lum < 225)
    yy = np.arange(arr.shape[0])[:, None]
    lower = body & (yy >= y0 + (y1 - y0) * 0.52)
    ys, xs = np.where(lower)
    if len(xs) < 10:
        ys, xs = np.where(body)
    if len(xs) < 10:
        ys, xs = np.where(alpha)
    if len(xs) == 0:
        return ((x0 + x1) / 2, y1)
    return (float(np.median(xs)), float(ys.max()))


def prepare_cell(cell):
    cell = remove_green(cell)
    bbox = content_box(cell)
    if not bbox:
        return {"img": cell, "bbox": None, "anchor": (cell.width / 2, cell.height)}
    anchor_x, anchor_y = find_anchor(cell, bbox)
    return {"img": cell, "bbox": bbox, "anchor": (anchor_x, anchor_y)}


def normalize_sequence(cells, target_h=98, target_w=112, baseline=116, frame_w=FRAME, frame_h=FRAME):
    prepared = [prepare_cell(c) for c in cells]
    extents = []
    for item in prepared:
        bbox = item["bbox"]
        if not bbox:
            continue
        x0, y0, x1, y1 = bbox
        ax, ay = item["anchor"]
        extents.append((ax - x0, x1 - ax, ay - y0, y1 - ay))

    if extents:
        max_left = max(e[0] for e in extents)
        max_right = max(e[1] for e in extents)
        max_up = max(e[2] for e in extents)
        max_down = max(e[3] for e in extents)
        scale = min(target_w / max(1, max_left + max_right), target_h / max(1, max_up + max_down))
    else:
        scale = 1.0

    frames = []
    for item in prepared:
        bbox = item["bbox"]
        out = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
        if not bbox:
            frames.append(out)
            continue
        x0, y0, x1, y1 = bbox
        ax, ay = item["anchor"]
        subject = item["img"].crop(bbox)
        sw, sh = subject.size
        nw = max(1, int(round(sw * scale)))
        nh = max(1, int(round(sh * scale)))
        subject = subject.resize((nw, nh), Image.Resampling.LANCZOS)
        anchor_x = (ax - x0) * scale
        anchor_y = (ay - y0) * scale
        x = int(round(frame_w / 2 - anchor_x))
        y = int(round(baseline - anchor_y))
        out.alpha_composite(subject, (x, y))
        frames.append(cleanup_frame(out))
    return frames


def normalize_frame(cell, target_h=86, target_w=92, baseline=90):
    return normalize_sequence([cell], target_h=target_h, target_w=target_w, baseline=baseline)[0]


def cleanup_frame(img):
    arr = np.array(img.convert("RGBA"))
    r = arr[..., 0].astype(np.float32)
    g = arr[..., 1].astype(np.float32)
    b = arr[..., 2].astype(np.float32)
    greenish = (
        ((g > 92) & (g > r + 18) & (g > b + 18) & (g > r * 1.08) & (g > b * 1.08))
        | ((g > 105) & (r < 120) & (b < 120))
    )
    arr[greenish, 3] = 0
    return remove_small_components(Image.fromarray(arr, "RGBA"))


def remove_small_components(img, min_area=256):
    arr = np.array(img.convert("RGBA"))
    for comp in find_components(arr, threshold=12):
        if comp["area"] >= min_area:
            continue
        for x, y in comp["pts"]:
            arr[y, x, 3] = 0
    return Image.fromarray(arr, "RGBA")


def stabilize_frames(frames, target_cx=None, target_bottom=116):
    stabilized = []
    for frame in frames:
        if target_cx is None:
            target_cx = frame.width / 2
        bbox = frame.getchannel("A").getbbox()
        if not bbox:
            stabilized.append(frame)
            continue
        x0, y0, x1, y1 = bbox
        cx = (x0 + x1) / 2
        dx = int(round(target_cx - cx))
        dy = int(round(target_bottom - y1))
        out = Image.new("RGBA", frame.size, (0, 0, 0, 0))
        out.alpha_composite(frame, (dx, dy))
        stabilized.append(out)
    return stabilized


def non_green_mask(img):
    arr = np.array(img.convert("RGBA"))
    r = arr[..., 0].astype(np.float32)
    g = arr[..., 1].astype(np.float32)
    b = arr[..., 2].astype(np.float32)
    a = arr[..., 3]
    greenish = ((g > 135) & (g > r * 1.45) & (g > b * 1.45)) | ((g > 115) & (r < 95) & (b < 95))
    return (~greenish) & (a > 0)


def split_grid(path, cols, rows):
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    cw = w / cols
    ch = h / rows
    cells = []
    for row in range(rows):
        for col in range(cols):
            box = (
                int(round(col * cw)),
                int(round(row * ch)),
                int(round((col + 1) * cw)),
                int(round((row + 1) * ch)),
            )
            cells.append(img.crop(box))
    return cells


def split_by_clusters(path, row_counts):
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    mask = non_green_mask(img)
    cells = []

    for row, count in enumerate(row_counts):
        y0 = int(round(row * h / len(row_counts)))
        y1 = int(round((row + 1) * h / len(row_counts)))
        row_mask = mask[y0:y1, :]
        proj = row_mask.sum(axis=0).astype(np.float64)
        xs = np.where(proj > 3)[0]
        if len(xs) == 0:
            # Fallback to equal slots when generation fails to put content in a row.
            cw = w / count
            for col in range(count):
                cells.append(img.crop((int(col * cw), y0, int((col + 1) * cw), y1)))
            continue

        x_min = float(xs.min())
        x_max = float(xs.max())
        centers = np.linspace(x_min, x_max, count)
        positions = xs.astype(np.float64)
        weights = proj[xs] + 1.0

        for _ in range(28):
            distances = np.abs(positions[:, None] - centers[None, :])
            labels = distances.argmin(axis=1)
            new_centers = centers.copy()
            for i in range(count):
                sel = labels == i
                if np.any(sel):
                    new_centers[i] = np.average(positions[sel], weights=weights[sel])
            if np.max(np.abs(new_centers - centers)) < 0.25:
                centers = new_centers
                break
            centers = new_centers

        centers.sort()
        boundaries = [0]
        for i in range(count - 1):
            boundaries.append(int(round((centers[i] + centers[i + 1]) / 2)))
        boundaries.append(w)

        for i in range(count):
            x0 = max(0, boundaries[i] - 10)
            x1 = min(w, boundaries[i + 1] + 10)
            segment_mask = row_mask[:, x0:x1]
            ys, xcols = np.where(segment_mask)
            if len(xcols) > 0:
                bx0 = max(0, x0 + int(xcols.min()) - 18)
                bx1 = min(w, x0 + int(xcols.max()) + 19)
                by0 = max(y0, y0 + int(ys.min()) - 18)
                by1 = min(y1, y0 + int(ys.max()) + 19)
                cells.append(img.crop((bx0, by0, bx1, by1)))
            else:
                cells.append(img.crop((x0, y0, x1, y1)))

    return cells


def find_row_centers(img, y0, y1, count):
    mask = non_green_mask(img)[y0:y1, :]
    proj = mask.sum(axis=0).astype(np.float64)
    xs = np.where(proj > 3)[0]
    if len(xs) == 0:
        slot = img.width / count
        return np.linspace(slot / 2, img.width - slot / 2, count)

    centers = np.linspace(float(xs.min()), float(xs.max()), count)
    positions = xs.astype(np.float64)
    weights = proj[xs] + 1.0
    for _ in range(35):
        distances = np.abs(positions[:, None] - centers[None, :])
        labels = distances.argmin(axis=1)
        new_centers = centers.copy()
        for i in range(count):
            sel = labels == i
            if np.any(sel):
                new_centers[i] = np.average(positions[sel], weights=weights[sel])
        if np.max(np.abs(new_centers - centers)) < 0.2:
            centers = new_centers
            break
        centers = new_centers
    centers.sort()
    return centers


def split_centered_slots(path, row_counts, width_factor=0.84):
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    cells = []

    for row, count in enumerate(row_counts):
        y0 = int(round(row * h / len(row_counts)))
        y1 = int(round((row + 1) * h / len(row_counts)))
        centers = find_row_centers(img, y0, y1, count)
        diffs = np.diff(centers)
        slot_w = w / count
        neighbor_w = float(diffs.min()) if len(diffs) else slot_w
        crop_w = min(slot_w * 1.05, neighbor_w * width_factor)
        for center in centers:
            x0 = int(round(center - crop_w / 2))
            x1 = int(round(center + crop_w / 2))
            if x0 < 0:
                x1 -= x0
                x0 = 0
            if x1 > w:
                x0 -= x1 - w
                x1 = w
            cells.append(img.crop((max(0, x0), y0, min(w, x1), y1)))
    return cells


def split_by_components(path, expected=16, cols=4):
    img = Image.open(path).convert("RGBA")
    keyed = remove_green(img)
    arr = np.array(keyed)
    components = find_components(arr, threshold=12)
    components = [
        c for c in components
        if c["area"] >= 500 and (c["bbox"][2] - c["bbox"][0]) >= 16 and (c["bbox"][3] - c["bbox"][1]) >= 20
    ]
    components.sort(key=lambda c: c["area"], reverse=True)
    components = components[:expected]
    if len(components) < expected:
        rows = max(1, int(np.ceil(expected / cols)))
        return split_grid(path, cols, rows)[:expected]

    components.sort(key=lambda c: (c["cy"], c["cx"]))
    rows = [components[i:i + cols] for i in range(0, expected, cols)]
    ordered = []
    for row in rows:
        ordered.extend(sorted(row, key=lambda c: c["cx"]))

    cells = []
    for comp in ordered:
        x0, y0, x1, y1 = comp["bbox"]
        pad = 22
        crop = keyed.crop((
            max(0, x0 - pad),
            max(0, y0 - pad),
            min(keyed.width, x1 + pad),
            min(keyed.height, y1 + pad),
        ))
        cells.append(crop)
    return cells


def write_sheet(name, frames):
    frame_w = frames[0].width if frames else FRAME
    frame_h = frames[0].height if frames else FRAME
    sheet = Image.new("RGBA", (frame_w * len(frames), frame_h), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        sheet.alpha_composite(frame, (i * frame_w, 0))
    path = OUT / name
    sheet.save(path)
    return path


def label_preview(sheets):
    rows = []
    for name, path in sheets:
        rows.append((name, Image.open(path).convert("RGBA")))
    label_h = 18
    width = max(img.width for _, img in rows)
    height = sum(img.height + label_h for _, img in rows)
    preview = Image.new("RGBA", (width, height), (16, 19, 29, 255))
    d = ImageDraw.Draw(preview)
    y = 0
    for name, img in rows:
        d.rectangle((0, y, width, y + label_h), fill=(32, 40, 58, 255))
        d.text((4, y + 3), name, fill=(226, 232, 240, 255))
        preview.alpha_composite(img, (0, y + label_h))
        y += img.height + label_h
    out = OUT / "brawler_chibi_preview.png"
    preview.save(out)
    return out


def optional_grid(name, cols, rows, count, target_h=104, target_w=160):
    path = SRC / name
    if not path.exists():
        return None
    return normalize_sequence(
        split_grid(path, cols, rows)[:count],
        target_h=target_h,
        target_w=target_w,
        frame_w=WIDE_FRAME,
        frame_h=FRAME,
    )


def main():
    body_src = SRC / "brawler_motion_master_trace_v1.png"
    raw = split_by_components(body_src, 40, cols=8)

    idle_raw = raw[0:4]
    run_raw = [raw[4], raw[5], raw[6], raw[5]]
    ground = split_grid(SRC / "brawler_ground_attacks_trace_v2.png", 4, 4)
    neutral_raw = ground[0:4]
    side_raw = ground[4:8]
    up_raw = ground[8:12]
    down_raw = ground[12:16]
    air = split_grid(SRC / "brawler_air_attacks_trace_v2.png", 4, 3)
    air_neutral_raw = air[0:4]
    air_side_raw = split_grid(SRC / "brawler_air_side_axe_v2.png", 4, 1)
    air_down_key_raw = air[8:12]
    air_down_raw = [
        air_down_key_raw[0],
        air_down_key_raw[1],
        air_down_key_raw[2],
        air_down_key_raw[2],
        air_down_key_raw[3],
        air_down_key_raw[3],
        air_down_key_raw[3],
        air_down_key_raw[0],
    ]
    grab_raw = raw[36]
    throw_raw = raw[37]
    dodge_raw = raw[38]
    ledge_raw = raw[39]

    def norm(cells, target_h=96, target_w=210):
        return normalize_sequence(
            cells,
            target_h=target_h,
            target_w=target_w,
            frame_w=WIDE_FRAME,
            frame_h=FRAME,
        )

    idle_frames = norm(idle_raw)
    run_frames = norm(run_raw)
    neutral_keys = norm(neutral_raw)
    side_keys = norm(side_raw)
    up_keys = norm(up_raw)
    down_keys = norm(down_raw)
    air_neutral_keys = norm(air_neutral_raw)
    air_side_keys = norm(air_side_raw)
    air_down_keys = norm(air_down_raw)
    misc_keys = norm([grab_raw, throw_raw, dodge_raw, ledge_raw])
    jump_keys = norm([raw[24], raw[24]])
    fall_keys = norm([raw[31], raw[31]])
    jump_body = jump_keys[0]

    jump_frames = jump_keys
    fall_frames = fall_keys
    idle_anim_frames = [idle_frames[0], idle_frames[1]]

    neutral_attack_frames = [
        idle_frames[0],
        neutral_keys[0],
        neutral_keys[1],
        neutral_keys[2],
        neutral_keys[3],
        neutral_keys[2],
        neutral_keys[1],
        idle_frames[1],
    ]
    side_attack_frames = [
        idle_frames[0],
        side_keys[0],
        side_keys[1],
        side_keys[2],
        side_keys[2],
        side_keys[3],
        side_keys[3],
        idle_frames[1],
    ]
    up_attack_frames = [
        idle_frames[0],
        up_keys[0],
        up_keys[1],
        up_keys[2],
        up_keys[2],
        up_keys[3],
        up_keys[3],
        idle_frames[1],
    ]
    down_attack_frames = [
        idle_frames[0],
        down_keys[0],
        down_keys[1],
        down_keys[2],
        down_keys[2],
        down_keys[3],
        down_keys[3],
        idle_frames[1],
    ]
    air_neutral_frames = [
        jump_body,
        air_neutral_keys[0],
        air_neutral_keys[1],
        air_neutral_keys[2],
        air_neutral_keys[2],
        air_neutral_keys[1],
        air_neutral_keys[3],
        jump_body,
    ]
    air_side_frames = [
        jump_body,
        air_side_keys[0],
        air_side_keys[1],
        air_side_keys[2],
        air_side_keys[2],
        air_side_keys[3],
        air_side_keys[3],
        jump_body,
    ]
    air_down_frames = air_down_keys

    grab_body, throw_body, dodge_body, ledge_body = misc_keys

    sheets = []
    def add(name, frames, stabilize=False, target_cx=None, target_bottom=116):
        if stabilize:
            frames = stabilize_frames(frames, target_cx=target_cx, target_bottom=target_bottom)
        sheets.append((name, write_sheet(name, frames)))

    add("brawler_idle_sheet.png", idle_anim_frames)
    add("brawler_run_sheet.png", run_frames)
    add("brawler_attack_neutral_sheet.png", neutral_attack_frames)
    add("brawler_attack_side_sheet.png", side_attack_frames)
    add("brawler_attack_up_sheet.png", up_attack_frames)
    add("brawler_attack_down_sheet.png", down_attack_frames)
    add("brawler_jump_sheet.png", jump_frames)
    add("brawler_fall_sheet.png", fall_frames)
    add("brawler_hurt_sheet.png", [dodge_body, dodge_body, jump_body])
    add("brawler_charge_sheet.png", [idle_frames[0], idle_frames[1], idle_frames[2], idle_frames[3]])
    add("brawler_air_neutral_sheet.png", air_neutral_frames)
    add("brawler_air_side_sheet.png", air_side_frames)
    add("brawler_air_down_sheet.png", air_down_frames)
    add("brawler_grab_sheet.png", [idle_frames[0], grab_body, throw_body, throw_body, throw_body, throw_body, grab_body, idle_frames[1]])
    add("brawler_dodge_sheet.png", [dodge_body, dodge_body, dodge_body, dodge_body])
    add("brawler_throw_sheet.png", [grab_body, throw_body, throw_body, throw_body, side_keys[3], side_keys[2], idle_frames[1], idle_frames[0]])
    add("brawler_ledge_sheet.png", [ledge_body, ledge_body, idle_frames[0], idle_frames[1]])

    preview = label_preview(sheets)
    print("Generated brawler sheets:")
    for _, path in sheets:
        print(" ", path.relative_to(ROOT))
    print(" ", preview.relative_to(ROOT))


if __name__ == "__main__":
    main()


