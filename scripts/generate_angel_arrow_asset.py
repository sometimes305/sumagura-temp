from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "characters" / "angel" / "angel_arrow.png"
PREVIEW = ROOT / "assets" / "characters" / "angel" / "angel_arrow_preview.png"

SCALE = 3
W, H = 540, 128
CY = H // 2


def sc_points(points):
    return [(int(x * SCALE), int(y * SCALE)) for x, y in points]


def draw_star(draw, x, y, r, fill):
    x *= SCALE
    y *= SCALE
    r *= SCALE
    draw.line((x - r, y, x + r, y), fill=fill, width=max(1, int(1.3 * SCALE)))
    draw.line((x, y - r, x, y + r), fill=fill, width=max(1, int(1.3 * SCALE)))


def draw_arrow_layer(draw, glow=False):
    y = CY * SCALE
    if glow:
        gold = (255, 238, 88, 145)
        pale = (255, 255, 232, 165)
        line_w = 19 * SCALE
        core_w = 9 * SCALE
    else:
        gold = (255, 232, 62, 225)
        pale = (255, 255, 238, 245)
        fill_gold = (255, 238, 83, 72)
        fill_pale = (255, 255, 238, 95)
        line_w = 8 * SCALE
        core_w = 4 * SCALE

    # Tail fletching: wide enough to read after in-game downscaling.
    tail_gold = [
        [(28, CY), (88, 28), (80, 53), (126, 44), (103, CY)],
        [(28, CY), (88, 100), (80, 75), (126, 84), (103, CY)],
        [(55, CY), (116, 42), (106, 60), (148, CY)],
        [(55, CY), (116, 86), (106, 68), (148, CY)],
    ]
    for pts in tail_gold:
        if glow:
            draw.polygon(sc_points(pts), fill=gold)
        else:
            draw.polygon(sc_points(pts), fill=fill_gold)
            closed = sc_points(pts + [pts[0]])
            draw.line(closed, fill=gold, width=max(1, int(4 * SCALE)), joint="curve")

    tail_core = [
        [(42, CY), (89, 40), (83, 57), (114, CY)],
        [(42, CY), (89, 88), (83, 71), (114, CY)],
    ]
    for pts in tail_core:
        if glow:
            draw.polygon(sc_points(pts), fill=pale)
        else:
            draw.polygon(sc_points(pts), fill=fill_pale)
            draw.line(sc_points(pts + [pts[0]]), fill=pale, width=max(1, int(2 * SCALE)), joint="curve")

    # Shaft.
    draw.line((94 * SCALE, y, 414 * SCALE, y), fill=gold, width=line_w)
    draw.line((104 * SCALE, y, 400 * SCALE, y), fill=pale, width=core_w)
    draw.line((136 * SCALE, y - 12 * SCALE, 392 * SCALE, y - 8 * SCALE), fill=(255, 255, 255, 130 if glow else 205), width=max(1, int(2 * SCALE)))

    # Arrowhead: large luminous diamond/leaf point.
    head = [(382, CY), (456, 20), (516, CY), (456, 108)]
    if glow:
        draw.polygon(sc_points(head), fill=gold)
    else:
        draw.polygon(sc_points(head), fill=fill_gold)
        draw.line(sc_points(head + [head[0]]), fill=gold, width=max(1, int(7 * SCALE)), joint="curve")
    inner_head = [(414, CY), (456, 36), (496, CY), (456, 92)]
    if glow:
        draw.polygon(sc_points(inner_head), fill=pale)
    else:
        draw.polygon(sc_points(inner_head), fill=fill_pale)
        draw.line(sc_points(inner_head + [inner_head[0]]), fill=pale, width=max(1, int(3 * SCALE)), joint="curve")
    draw.line(sc_points([(414, CY), (492, CY)]), fill=(255, 248, 158, 255), width=core_w)
    draw.line(sc_points([(452, 37), (492, CY), (452, 91)]), fill=(255, 252, 215, 190), width=max(1, int(2 * SCALE)))


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    glow = Image.new("RGBA", (W * SCALE, H * SCALE), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    draw_arrow_layer(gd, glow=True)
    glow = glow.filter(ImageFilter.GaussianBlur(5 * SCALE))

    crisp = Image.new("RGBA", (W * SCALE, H * SCALE), (0, 0, 0, 0))
    cd = ImageDraw.Draw(crisp)
    draw_arrow_layer(cd, glow=False)

    sparkle = Image.new("RGBA", (W * SCALE, H * SCALE), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sparkle)
    for x, y, r in [(134, 43, 8), (197, 83, 6), (305, 44, 5), (368, 84, 7), (481, 33, 6), (72, 87, 6)]:
        draw_star(sd, x, y, r, (255, 249, 185, 230))
    sparkle = sparkle.filter(ImageFilter.GaussianBlur(0.45 * SCALE))

    img = Image.alpha_composite(glow, crisp)
    img = Image.alpha_composite(img, sparkle)
    img = img.resize((W, H), Image.Resampling.LANCZOS)
    img.save(OUT)

    preview = Image.new("RGBA", (W, H), (10, 16, 28, 255))
    preview.alpha_composite(img)
    ImageDraw.Draw(preview).rectangle((0, H - 1, W, H), fill=(71, 85, 105, 255))
    preview.save(PREVIEW)
    print(OUT)
    print(PREVIEW)


if __name__ == "__main__":
    main()
