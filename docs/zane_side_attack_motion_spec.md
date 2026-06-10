# Zane Side Attack Motion Spec

## Runtime Contract

- Gameplay attack: `sword.attacks.SIDE`
- Gameplay duration: 20 frames
- Visual sheet: `assets/characters/sword/chibi_attack_side_sheet.png`
- Visual frame count: 6
- Layout: 6 runtime frames in a horizontal strip
- Hitboxes, damage, knockback, lag, and timing stay in code. The sprite only changes the pose read.

## Frame Plan

| Sprite frame | Gameplay range | Pose intent |
| --- | --- | --- |
| 1 | 0-2 | Guarded load. Feet planted, body turned right, both hands on hilt near right shoulder, blade diagonal up-back. |
| 2 | 3-5 | Backswing and weight transfer. Front foot starts forward, hips and shoulders coil, cape lags behind. |
| 3 | 6-8 | Active cut start. Front foot plants, torso uncoils, hilt moves in front of chest. |
| 4 | 9-12 | Active cut finish. Blade passes through target line to low-forward, knees bent, weight on front foot. |
| 5 | 13-16 | Follow-through. Sword completes the low-forward diagonal, shoulders settle, no spin. |
| 6 | 17-20 | Recovery. Sword returns to a guarded low diagonal, balanced stance. |

## Art Constraints

- Same chibi body proportions, face, hair, outfit, cape, armor, and palette as the approved Zane body sheet.
- Sword is integrated in the sprite for this attack and held in both hands in every frame.
- The hilt must stay attached to the hands. The blade never floats, orbits, or appears as a separate effect.
- No slash trails, sparks, magic effects, enemies, extra silhouettes, shadows, floor plane, or text.
- Keep the full sword tip visible with extra padding.
- Normalize by body/feet anchor, not by full-image bounding box, so sword extension does not move the character center.
