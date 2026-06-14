from pathlib import Path
import math

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "characters" / "angel" / "angel_shockwave_sheet.png"
PREVIEW = ROOT / "assets" / "characters" / "angel" / "angel_shockwave_preview.png"
CHECK = ROOT / "assets" / "characters" / "angel" / "check" / "17_down_shockwave_v1_preview.png"

FRAME = 320
FRAMES = 6
CENTER = FRAME // 2
HIT_RADIUS = 140
SCALE = 3


def ellipse_box(cx, cy, rx, ry):
    return (
        int((cx - rx) * SCALE),
        int((cy - ry) * SCALE),
        int((cx + rx) * SCALE),
        int((cy + ry) * SCALE),
    )


def draw_star(draw, x, y, r, fill):
    x *= SCALE
    y *= SCALE
    r *= SCALE
    w = max(1, int(1.4 * SCALE))
    draw.line((x - r, y, x + r, y), fill=fill, width=w)
    draw.line((x, y - r, x, y + r), fill=fill, width=w)


def draw_ring(draw, cx, cy, r, width, color, alpha=255, start=0, end=360):
    rgba = (color[0], color[1], color[2], alpha)
    box = ellipse_box(cx, cy, r, r)
    draw.arc(box, start=start, end=end, fill=rgba, width=max(1, int(width * SCALE)))


def make_frame(index):
    # The third visible frame is the hit frame: radius matches the 140px attack radius.
    t_values = [0.08, 0.34, 0.62, 1.00, 1.13, 1.24]
    t = t_values[index]
    radius = HIT_RADIUS * t
    alpha_curve = [70, 125, 195, 245, 145, 70][index]

    glow = Image.new("RGBA", (FRAME * SCALE, FRAME * SCALE), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)

    # Soft divine disk, intentionally very transparent so it does not hide fighters.
    disk_alpha = [16, 24, 34, 42, 24, 12][index]
    gd.ellipse(ellipse_box(CENTER, CENTER, radius * 0.98, radius * 0.98), fill=(255, 241, 170, disk_alpha))

    # Wide old-stickman-inspired semicircle sweep: the readable base shape.
    gd.arc(
        ellipse_box(CENTER, CENTER, radius, radius),
        start=200,
        end=340,
        fill=(255, 238, 112, max(30, alpha_curve // 2)),
        width=max(1, int((10 + index * 1.2) * SCALE)),
    )
    gd.arc(
        ellipse_box(CENTER, CENTER, radius * 0.78, radius * 0.78),
        start=20,
        end=160,
        fill=(255, 255, 230, max(24, alpha_curve // 3)),
        width=max(1, int((5 + index) * SCALE)),
    )

    glow = glow.filter(ImageFilter.GaussianBlur(4 * SCALE))

    crisp = Image.new("RGBA", (FRAME * SCALE, FRAME * SCALE), (0, 0, 0, 0))
    cd = ImageDraw.Draw(crisp)
    ring_color = (255, 235, 92)
    core_color = (255, 255, 232)

    draw_ring(cd, CENTER, CENTER, radius, 4.8, ring_color, alpha_curve)
    draw_ring(cd, CENTER, CENTER, radius * 0.83, 2.6, core_color, max(40, alpha_curve - 40))

    # Ground-hugging lower arc from the original stickman shockwave.
    cd.arc(
        ellipse_box(CENTER, CENTER, radius * 0.96, radius * 0.58),
        start=190,
        end=350,
        fill=(255, 245, 160, max(45, alpha_curve)),
        width=max(1, int(5.5 * SCALE)),
    )

    # Small radial shards around the peak frame.
    shard_alpha = [0, 55, 105, 185, 90, 35][index]
    for deg in range(0, 360, 30):
        if index < 1:
            continue
        wobble = math.sin(index * 1.7 + deg * 0.13) * 5
        a = math.radians(deg + wobble)
        inner = radius * (0.88 + 0.04 * math.sin(deg))
        outer = radius * (1.05 + 0.04 * math.cos(deg))
        x1 = CENTER + math.cos(a) * inner
        y1 = CENTER + math.sin(a) * inner
        x2 = CENTER + math.cos(a) * outer
        y2 = CENTER + math.sin(a) * outer
        cd.line((x1 * SCALE, y1 * SCALE, x2 * SCALE, y2 * SCALE), fill=(255, 252, 210, shard_alpha), width=max(1, int(2.2 * SCALE)))

    # A few fixed sparkles that stay subtle and do not imply extra hitboxes.
    sparkle_alpha = [0, 70, 125, 210, 105, 50][index]
    for x, y, r in [(72, 108, 5), (248, 98, 6), (88, 224, 4), (238, 220, 5), (160, 42, 5)]:
        if radius > abs(x - CENTER) * 0.55 + abs(y - CENTER) * 0.25:
            draw_star(cd, x, y, r, (255, 249, 190, sparkle_alpha))

    img = Image.alpha_composite(glow, crisp)
    return img.resize((FRAME, FRAME), Image.Resampling.LANCZOS)


def make_reference_frame():
    img = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Literal old stickman-style shockwave: filled top semicircle.
    d.pieslice((CENTER - HIT_RADIUS, CENTER - HIT_RADIUS, CENTER + HIT_RADIUS, CENTER + HIT_RADIUS), 180, 360, fill=(255, 234, 167, 190))
    d.arc((CENTER - HIT_RADIUS, CENTER - HIT_RADIUS, CENTER + HIT_RADIUS, CENTER + HIT_RADIUS), 180, 360, fill=(255, 255, 230, 240), width=4)
    return img


def label(draw, xy, text):
    draw.text(xy, text, fill=(226, 232, 240, 255))


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    CHECK.parent.mkdir(parents=True, exist_ok=True)
    frames = [make_frame(i) for i in range(FRAMES)]
    sheet = Image.new("RGBA", (FRAME * FRAMES, FRAME), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        sheet.alpha_composite(frame, (i * FRAME, 0))
    sheet.save(OUT)

    label_h = 30
    preview = Image.new("RGBA", (FRAME * FRAMES, FRAME * 2 + label_h * 2), (13, 19, 31, 255))
    d = ImageDraw.Draw(preview)
    label(d, (8, 8), "STICKMAN shockwave reference")
    ref = make_reference_frame()
    for i in range(FRAMES):
        preview.alpha_composite(ref, (i * FRAME, label_h))
        d.text((i * FRAME + 8, label_h + 8), str(i + 1), fill=(226, 232, 240, 255))
    y = FRAME + label_h
    label(d, (8, y + 8), "ANGEL shockwave candidate - frame 4 reaches radius 140")
    y += label_h
    for i, frame in enumerate(frames):
        preview.alpha_composite(frame, (i * FRAME, y))
        d.text((i * FRAME + 8, y + 8), str(i + 1), fill=(226, 232, 240, 255))
        if i == 3:
            d.ellipse((i * FRAME + CENTER - HIT_RADIUS, y + CENTER - HIT_RADIUS, i * FRAME + CENTER + HIT_RADIUS, y + CENTER + HIT_RADIUS), outline=(255, 255, 255, 110), width=1)
    preview.save(PREVIEW)
    preview.save(CHECK)
    print(OUT)
    print(PREVIEW)
    print(CHECK)


if __name__ == "__main__":
    main()
