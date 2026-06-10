# Zane Motion Pack Spec

This pack extends the approved integrated SIDE attack approach to the rest of
Zane's sword animations.

## Runtime Rules

- Gameplay data stays in `js/game.js`: damage, hitboxes, frame duration, lag, and knockback are unchanged.
- The sprite sheets only change visual poses.
- Runtime frames use a 192x128 source cell with foot baseline at y=116.
- Attack sheets use integrated swords, so the procedural canvas sword is not drawn over them.
- Normalization uses body/feet anchors instead of full-image center, because sword extension must not move the character body.

## Source Sheets

| Source | Runtime output | Layout |
| --- | --- | --- |
| `zane_body_weapon_master_v1.png` | idle, run, jump, fall, hurt, charge, grab, dodge, throw, ledge | 4x4 |
| `zane_attack_neutral_integrated_v1.png` | neutral attack | 2x2 |
| `zane_side_attack_integrated_v1.png` | side attack | 3x2 |
| `zane_attack_up_integrated_v1.png` | up attack | 3x2, first five cells |
| `zane_attack_down_integrated_v1.png` | down attack | 3x2, first five cells |
| `zane_air_neutral_integrated_v1.png` | air neutral attack | 3x2 |
| `zane_air_side_integrated_v1.png` | air side attack | 2x2 |
| `zane_air_down_integrated_v1.png` | air down attack | 3x2, first five cells |
