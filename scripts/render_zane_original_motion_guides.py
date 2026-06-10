from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "characters" / "sword" / "zane_source"

FRAME_W = 220
FRAME_H = 150
BODY_X = 76
BODY_Y = 38
BODY_H = 60
SWORD_LEN = 70


ATTACKS = [
    ("neutral", "NEUTRAL", None, 12, [0, 3, 6, 9]),
    ("side", "SIDE", None, 20, [0, 4, 8, 12, 16, 19]),
    ("up", "UP", None, 16, [0, 4, 8, 12, 15]),
    ("down slide", "DOWN", "slide", 24, [0, 5, 10, 16, 23]),
    ("air neutral spin", "AIR_NEUTRAL", "spin", 24, [0, 4, 8, 12, 16, 20]),
    ("air side", "AIR_SIDE", None, 20, [0, 6, 12, 19]),
    ("air down", "AIR_DOWN", "slash_down", 25, [0, 6, 12, 18, 24]),
]


def clamp_progress(timer, total):
    return max(0.0, min(0.999, timer / max(1, total)))


def original_pose(current_attack_type, atk_type, timer, total, facing_right=True):
    sign = 1 if facing_right else -1
    cx = BODY_X
    y = BODY_Y
    foot_y = BODY_Y + BODY_H
    arm_root_x = cx
    arm_root_y = y + 25
    hand_x = cx + sign * 15
    hand_y = y + 40
    angle_deg = sign * 30
    progress = clamp_progress(timer, total)

    if atk_type == "slide" or current_attack_type == "DOWN":
        angle_deg = sign * 90
        arm_root_x = cx + sign * 20
        arm_root_y = foot_y - 15
        hand_x = cx + sign * 45
        hand_y = foot_y - 5
    elif current_attack_type == "NEUTRAL":
        angle_deg = sign * 90
        ext = progress * 60 if progress < 0.5 else (1 - progress) * 60
        arm_root_x = cx
        arm_root_y = y + 25
        hand_x = cx + sign * (15 + ext)
        hand_y = y + 30
    elif current_attack_type == "SIDE":
        angle_deg = sign * (45 + 90 * progress)
    elif current_attack_type in ("UP", "AIR_UP"):
        angle_deg = sign * (-60 + 120 * progress)
    elif current_attack_type == "AIR_SIDE":
        angle_deg = sign * (120 - 90 * progress)
    elif atk_type in ("meteor", "down", "slash_down") or current_attack_type == "AIR_DOWN":
        angle_deg = 180
    elif atk_type == "spin":
        angle_deg = progress * 720
    else:
        angle_deg = sign * 45

    if current_attack_type != "NEUTRAL" and atk_type != "slide" and current_attack_type != "DOWN":
        import math

        rad = math.radians(angle_deg)
        arm_root_x = cx
        arm_root_y = y + 25
        hand_x = cx + math.sin(rad) * 20
        hand_y = (y + 25) - math.cos(rad) * 20

    return {
        "arm_root": (arm_root_x, arm_root_y),
        "hand": (hand_x, hand_y),
        "angle": angle_deg,
        "progress": progress,
    }


def draw_stick(draw, pose, low=False):
    if low:
        head = (BODY_X + 20, BODY_Y + BODY_H - 15)
        hip = (BODY_X - 10, BODY_Y + BODY_H - 10)
        draw.ellipse((head[0] - 10, head[1] - 10, head[0] + 10, head[1] + 10), outline=(235, 242, 255), width=3)
        draw.line((head[0], head[1], hip[0], hip[1]), fill=(235, 242, 255), width=3)
        draw.line((head[0], head[1], BODY_X + 45, BODY_Y + BODY_H), fill=(235, 242, 255), width=3)
    else:
        draw.ellipse((BODY_X - 10, BODY_Y, BODY_X + 10, BODY_Y + 20), outline=(235, 242, 255), width=3)
        draw.line((BODY_X, BODY_Y + 20, BODY_X, BODY_Y + 50), fill=(235, 242, 255), width=3)
        draw.line((BODY_X, BODY_Y + 50, BODY_X - 10, BODY_Y + 70), fill=(235, 242, 255), width=3)
        draw.line((BODY_X, BODY_Y + 50, BODY_X + 10, BODY_Y + 70), fill=(235, 242, 255), width=3)
    draw.line((*pose["arm_root"], *pose["hand"]), fill=(255, 213, 94), width=4)


def draw_sword(draw, pose):
    import math

    hx, hy = pose["hand"]
    rad = math.radians(pose["angle"])
    tip_x = hx + math.sin(rad) * SWORD_LEN
    tip_y = hy - math.cos(rad) * SWORD_LEN
    guard_dx = math.cos(rad) * 11
    guard_dy = math.sin(rad) * 11
    draw.line((hx, hy, tip_x, tip_y), fill=(130, 210, 255), width=5)
    draw.line((hx, hy, tip_x, tip_y), fill=(245, 250, 255), width=2)
    draw.line((hx - guard_dx, hy + guard_dy, hx + guard_dx, hy - guard_dy), fill=(247, 201, 72), width=4)
    draw.ellipse((hx - 4, hy - 4, hx + 4, hy + 4), fill=(247, 201, 72))


def draw_frame(name, attack_type, atk_type, timer, total):
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (18, 22, 32, 255))
    draw = ImageDraw.Draw(img)
    pose = original_pose(attack_type, atk_type, timer, total)
    draw.rectangle((0, 0, FRAME_W - 1, FRAME_H - 1), outline=(48, 58, 82), width=1)
    draw.text((6, 5), f"{name} f{timer}", fill=(226, 232, 240))
    draw.line((0, BODY_Y + BODY_H, FRAME_W, BODY_Y + BODY_H), fill=(58, 68, 92), width=1)
    draw_stick(draw, pose, low=(atk_type == "slide" or attack_type == "DOWN"))
    draw_sword(draw, pose)
    draw.text((6, FRAME_H - 18), f"angle {pose['angle']:.0f}", fill=(148, 163, 184))
    return img


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    label_h = 22
    row_gap = 10
    width = max(len(timers) for _, _, _, _, timers in ATTACKS) * FRAME_W
    height = sum(FRAME_H + label_h + row_gap for _ in ATTACKS) - row_gap
    sheet = Image.new("RGBA", (width, height), (12, 15, 23, 255))
    draw = ImageDraw.Draw(sheet)
    y = 0
    for name, attack_type, atk_type, total, timers in ATTACKS:
        draw.rectangle((0, y, width, y + label_h), fill=(30, 39, 56, 255))
        draw.text((8, y + 5), f"{name}: original stick pose formula, total {total}f", fill=(226, 232, 240))
        y += label_h
        for i, timer in enumerate(timers):
            frame = draw_frame(name, attack_type, atk_type, timer, total)
            sheet.alpha_composite(frame, (i * FRAME_W, y))
        y += FRAME_H + row_gap

    out = OUT / "zane_original_motion_guides.png"
    sheet.save(out)
    print(out.relative_to(ROOT))


if __name__ == "__main__":
    main()
