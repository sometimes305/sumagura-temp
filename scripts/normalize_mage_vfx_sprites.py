from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "effects" / "mage" / "source" / "mage_vfx_master_v1.png"
OUT = ROOT / "assets" / "effects" / "mage"
FRAME = 128


def remove_green(img):
    arr = np.array(img.convert("RGBA"))
    r = arr[..., 0].astype(np.float32)
    g = arr[..., 1].astype(np.float32)
    b = arr[..., 2].astype(np.float32)
    a = arr[..., 3]
    greenish = ((g > 115) & (g > r * 1.32) & (g > b * 1.32)) | ((g > 95) & (r < 90) & (b < 90))
    arr[greenish, 3] = 0
    arr[a < 8, 3] = 0
    return Image.fromarray(arr, "RGBA")


def content_box(img):
    return img.getchannel("A").getbbox()


def find_spans(mask, radius=12):
    cols = mask.any(axis=0)
    expanded = np.zeros_like(cols)
    for idx in np.flatnonzero(cols):
        expanded[max(0, idx - radius):min(cols.size, idx + radius + 1)] = True

    spans = []
    start = None
    for idx, active in enumerate(expanded):
        if active and start is None:
            start = idx
        elif start is not None and not active:
            spans.append((start, idx))
            start = None
    if start is not None:
        spans.append((start, expanded.size))
    return spans


def split_grid(path, cols=6, rows=4):
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    clean = remove_green(img)
    alpha = np.array(clean.getchannel("A"))
    row_bounds = [
        (0.00, 0.23),  # magic projectile
        (0.23, 0.43),  # fire projectile
        (0.42, 0.75),  # fire pillar
        (0.72, 1.00),  # overhead explosion
    ]
    if len(row_bounds) != rows:
        raise RuntimeError("row_bounds must match the expected row count")

    cells = []
    for row, (start_ratio, end_ratio) in enumerate(row_bounds):
        y0 = int(round(start_ratio * h))
        y1 = int(round(end_ratio * h))
        row_alpha = alpha[y0:y1, :]
        spans = find_spans(row_alpha > 8)
        if len(spans) != cols:
            raise RuntimeError(f"Expected {cols} VFX frames in row {row + 1}, found {len(spans)}: {spans}")

        row_cells = []
        for x0, x1 in spans:
            pad = 10
            row_cells.append(img.crop((
                max(0, x0 - pad),
                y0,
                min(w, x1 + pad),
                y1,
            )))
        cells.append(row_cells)
    return cells


def normalize_row(cells, target_w, target_h, frame_w=FRAME, frame_h=FRAME, anchor="center"):
    prepared = []
    max_w = 1
    max_h = 1
    for cell in cells:
        clean = remove_green(cell)
        bbox = content_box(clean)
        prepared.append((clean, bbox))
        if bbox:
            x0, y0, x1, y1 = bbox
            max_w = max(max_w, x1 - x0)
            max_h = max(max_h, y1 - y0)
    scale = min(target_w / max_w, target_h / max_h)

    frames = []
    for clean, bbox in prepared:
        out = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
        if not bbox:
            frames.append(out)
            continue
        subject = clean.crop(bbox)
        sw, sh = subject.size
        nw = max(1, int(round(sw * scale)))
        nh = max(1, int(round(sh * scale)))
        subject = subject.resize((nw, nh), Image.Resampling.LANCZOS)
        if anchor == "base":
            x = int(round(frame_w / 2 - nw / 2))
            y = int(round(frame_h - 5 - nh))
        else:
            x = int(round(frame_w / 2 - nw / 2))
            y = int(round(frame_h / 2 - nh / 2))
        out.alpha_composite(subject, (x, y))
        frames.append(cleanup_alpha(out))
    return frames


def add_fire_glow(subject):
    alpha = subject.getchannel("A")
    glow = Image.new("RGBA", subject.size, (255, 98, 0, 0))
    glow.putalpha(alpha.filter(ImageFilter.GaussianBlur(5)))

    strong = Image.new("RGBA", subject.size, (255, 210, 50, 0))
    strong.putalpha(alpha.filter(ImageFilter.GaussianBlur(2)))

    out = Image.new("RGBA", subject.size, (0, 0, 0, 0))
    out.alpha_composite(glow)
    out.alpha_composite(strong)
    out.alpha_composite(subject)
    return out


def normalize_fire_pillar_row(cells, target_w, target_h, frame_w=FRAME, frame_h=FRAME):
    prepared = []
    best = None
    best_score = -1
    for cell in cells:
        clean = remove_green(cell)
        bbox = content_box(clean)
        if not bbox:
            continue
        x0, y0, x1, y1 = bbox
        subject = clean.crop(bbox)
        score = (y1 - y0) * 3 + np.array(subject.getchannel("A")).sum() / 1000
        prepared.append(subject)
        if score > best_score:
            best = subject
            best_score = score

    if best is None:
        return [Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0)) for _ in range(6)]

    bw, bh = best.size
    base_scale = min(target_w / bw, target_h / bh)
    steps = [
        (0.42, 0.86),
        (0.74, 1.00),
        (1.02, 1.00),
        (1.08, 0.96),
        (0.82, 0.72),
        (0.46, 0.38),
    ]
    frames = []
    for step_scale, alpha_mul in steps:
        out = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
        scale = base_scale * step_scale
        nw = max(1, int(round(bw * scale)))
        nh = max(1, int(round(bh * scale)))
        subject = best.resize((nw, nh), Image.Resampling.LANCZOS)
        subject = add_fire_glow(subject)
        arr = np.array(subject.convert("RGBA"))
        arr[..., 3] = np.clip(arr[..., 3].astype(np.float32) * alpha_mul, 0, 255).astype(np.uint8)
        subject = Image.fromarray(arr, "RGBA")
        x = int(round(frame_w / 2 - nw / 2))
        y = int(round(frame_h - 5 - nh))
        out.alpha_composite(subject, (x, y))
        frames.append(cleanup_alpha(out))
    return frames


def cleanup_alpha(img):
    arr = np.array(img.convert("RGBA"))
    r = arr[..., 0].astype(np.float32)
    g = arr[..., 1].astype(np.float32)
    b = arr[..., 2].astype(np.float32)
    a = arr[..., 3]
    key_green = ((g > 120) & (r < 105) & (b < 105)) | ((g > 150) & (g > r * 1.45) & (g > b * 1.45))
    arr[key_green, 3] = 0
    arr[a < 10, 3] = 0
    return Image.fromarray(arr, "RGBA")


def write_sheet(name, frames):
    sheet = Image.new("RGBA", (FRAME * len(frames), FRAME), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        sheet.alpha_composite(frame, (i * FRAME, 0))
    path = OUT / name
    sheet.save(path)
    return path


def label_preview(rows):
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
    out = OUT / "mage_vfx_preview.png"
    preview.save(out)
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    rows = split_grid(SRC)
    outputs = []

    specs = [
        ("mage_magic_projectile_sheet.png", rows[0], 116, 78, "center"),
        ("mage_fire_projectile_sheet.png", rows[1], 116, 76, "center"),
        ("mage_overhead_explosion_sheet.png", rows[3], 120, 120, "center"),
    ]

    for name, cells, tw, th, anchor in specs:
        frames = normalize_row(cells, tw, th, anchor=anchor)
        path = write_sheet(name, frames)
        outputs.append((name, Image.open(path).convert("RGBA")))

    frames = normalize_row(rows[2], 112, 116, anchor="base")
    path = write_sheet("mage_fire_pillar_sheet.png", frames)
    outputs.insert(2, ("mage_fire_pillar_sheet.png", Image.open(path).convert("RGBA")))

    preview = label_preview(outputs)
    print("Generated mage VFX sheets:")
    for name, _ in outputs:
        print(" ", (OUT / name).relative_to(ROOT))
    print(" ", preview.relative_to(ROOT))


if __name__ == "__main__":
    main()
