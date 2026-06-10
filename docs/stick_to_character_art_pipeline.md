# Stick To Character Art Pipeline

This is the repeatable process for replacing the original stick-figure
fighters with illustrated character art while preserving gameplay feel.

## Core Rule

Keep gameplay semantics in code.

- Hitboxes, damage, knockback, lag, active frames, movement, and attack timing stay in `js/game.js`.
- Character sheets only provide body silhouettes and readable poses.
- Weapons should not be baked into the first shipped sprite pass unless the motion guide is already proven.

The stable approach is:

1. Draw the character body as sprites.
2. Draw the weapon procedurally using the original stick-figure weapon formulas.
3. Adjust only the weapon grip pivot to match the illustrated hand.

This keeps attacks synced with the old stick-figure motion and avoids AI-generated frame drift.

## Recommended Asset Set

For each fighter, start with one body-only master sheet.

- Layout: 4 columns x 4 rows
- Background: flat chroma key, usually `#00ff00`
- No weapon
- No effects
- No shadows
- Full body visible in every slot
- Same scale, outfit, face, palette, and silhouette across all frames

Suggested 4x4 frame map:

| Row | Frames |
| --- | --- |
| 1 | idle 1, idle 2, idle 3, idle 4 |
| 2 | run 1, run 2, run 3, run 4 |
| 3 | jump 1, jump 2, fall 1, fall 2 |
| 4 | neutral-ready, side-ready, up-ready, down/low-ready |

Then generate runtime sheets from that master:

- `chibi_idle_sheet.png`
- `chibi_run_sheet.png`
- `chibi_jump_sheet.png`
- `chibi_fall_sheet.png`
- `chibi_hurt_sheet.png`
- `chibi_charge_sheet.png`
- `chibi_attack_neutral_sheet.png`
- `chibi_attack_side_sheet.png`
- `chibi_attack_up_sheet.png`
- `chibi_attack_down_sheet.png`
- `chibi_air_neutral_sheet.png`
- `chibi_air_side_sheet.png`
- `chibi_air_down_sheet.png`
- `chibi_grab_sheet.png`
- `chibi_throw_sheet.png`
- `chibi_dodge_sheet.png`
- `chibi_ledge_sheet.png`

Zane's current implementation uses 128x128 runtime cells and scales the
rendered sprite down in code.

## Runtime Integration

Add a per-character sprite animation config in `js/game.js`.

For Zane this is currently:

- `SWORD_CHIBI_FRAME = 128`
- `SWORD_CHIBI_FRAME_W = 128`
- `SWORD_CHIBI_BASELINE = 116`
- `SWORD_CHIBI_RENDER_SCALE = 0.78`
- `SWORD_CHIBI_BLADE_LEN = 72`
- `SWORD_CHIBI_BLADE_WIDTH_SCALE = 0.78`
- `SWORD_CHIBI_REACH_SCALE = 0.9`

The important pieces are:

- `resolve...Anim(fighter)` maps action state and attack type to a sprite sheet.
- `get...Frame(anim)` maps gameplay progress to sprite frame index.
- `draw...Sprite(ctx, cx)` draws the body.
- `get...WeaponPose(cx, motion)` preserves the original weapon angles and attack progress.
- `draw...Weapon(ctx, cx, motion)` draws the weapon at the corrected illustrated hand grip.

The character body can be smaller than the 128x128 source cell. Scale it at
runtime rather than regenerating assets for every size adjustment.

## Weapon Motion Rule

Do not ask the image model to invent sword swings for the first pass.

Use the old stick-figure weapon logic as the source of truth:

- `NEUTRAL`: straight thrust
- `SIDE`: 45 to 135 degree swing
- `UP` / `AIR_UP`: -60 to 60 degree swing
- `DOWN`: low slide sword
- `AIR_SIDE`: 120 to 30 degree swing
- `AIR_NEUTRAL`: spin
- `AIR_DOWN`: downward sword

After copying those formulas, adjust only:

- grip pivot x/y
- character render scale
- weapon length/width
- reach scale for thrust or slide

This prevents the common failure mode where the attack looks cool but no
longer matches the hitbox or old motion.

## Generation Prompt Template

Use this shape for a new fighter:

```text
Create a production-ready 4x4 sprite reference sheet for a 2D browser
fighting game.

Subject: <character description>. DO NOT include any weapon, projectile,
effect, trail, text, labels, shadows, scenery, or frame borders. Empty hands
only.

Style: clean anime chibi game sprite art, crisp linework, readable face,
controlled highlights, not photorealistic, not painterly, not over-detailed,
consistent identity and costume across all frames.

Sheet layout: exactly 4 columns x 4 rows, one full-body sprite centered in
each slot with generous padding. Use a perfectly flat solid #00ff00
chroma-key background. No drop shadow or floor contact shadow.

Frame poses:
row 1: idle 1, idle 2, idle 3, idle 4.
row 2: run 1, run 2, run 3, run 4.
row 3: jump 1, jump 2, fall 1, fall 2.
row 4: neutral-ready, side-ready, upward-ready, low/down-ready.

Important negatives: no weapon, no extra character, no duplicate limbs, no
cropped body, no cut-off hair, no cut-off feet, no effects, no background art.
```

## Normalization

Use or adapt `scripts/normalize_zane_generated_sprites.py`.

The normalizer should:

- remove chroma key
- split the 4x4 sheet
- remove detached artifacts
- normalize all frames with one shared scale
- align by body/feet anchor, not full-image center
- output fixed-size runtime sheets
- generate a contact preview

Frame wobble almost always comes from using full bounding-box center instead
of body/feet anchors.

## QA Checklist

Run these before accepting a character:

1. `node --check js/game.js`
2. `node --check js/ui.js`
3. Check every generated sheet:
   - expected dimensions
   - no green pixels
   - no opaque pixels on the outer edge
4. Open local game URL with a cache-buster, for example `?fighter_fix=1`.
5. Test one-player mode.
6. Check idle, run, jump, fall, neutral attack, side attack, up attack, down attack, and air attacks.
7. Verify:
   - no frame-to-frame body jitter
   - no cropped hair, feet, weapon, or cape
   - weapon appears attached to the hand
   - character scale is close to the old stick fighter
   - weapon length is close to the old weapon
   - hitbox timing still feels unchanged

## What Not To Do

- Do not generate every attack frame independently.
- Do not use AI-integrated weapons until the code-driven guide has been validated.
- Do not normalize by full-image center when weapons or capes extend far out.
- Do not keep procedural body motion on top of animated sheets unless it is intentional.
- Do not let visual attack poses override hitbox timing.

## Optional Later Pass

After the code-driven version is accepted, an integrated weapon sheet can be
attempted again.

To do that safely:

1. Render original motion guides from code.
2. Ask the image model to follow those guides exactly.
3. Keep frame count and active timing unchanged.
4. Compare each generated frame against the guide.
5. Only then disable the procedural weapon for that animation.

For Zane, the integrated pass was rejected because the sword floated, clipped,
or moved differently from the original stick-figure motion. The accepted pass
uses body-only sprites plus code-drawn sword.
