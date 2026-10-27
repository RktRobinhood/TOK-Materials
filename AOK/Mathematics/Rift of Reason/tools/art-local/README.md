# Local art tools (Python + Pillow)

Dev-only helpers for editing the game's shipped art with the local image model (ComfyUI, `qwen21_edit`) and
finishing the results on the CPU. They came out of the FAL-271 style trial and were first used to rebuild
the owlet and mothkin walk sheets (#163, slice A). Nothing here is loaded by the game, and the build
(`node tools/build-assets.mjs`) does not need them.

**Needs:** Python 3.11 or newer, Pillow 10+ and NumPy 1.26+ (tested with Python 3.14, Pillow 12.1 and
NumPy 2.3). No other packages, no GPU, no network. Run them from the game folder with `python3 -I`.
Python is not installed on the teacher's machine; these run on the art machine only.

**Method in one line:** edit the shipped image, never draw fresh. Every new walk frame is a
"change only its legs and feet" edit of one shipped frame (the anchor), so head, clothes and props stay
registered to the pixel. Then a Pillow finish puts each frame's lowest foot on the anchor's ground row.

## Walk sheets

| Script | What it does | Inputs → outputs |
|---|---|---|
| `prep_walk_frame.py` | Cuts one frame out of a shipped walk sheet, pads it (1.3 × width, 1.12 × height) and enlarges it 3 × as the edit input. | `<sheet.webp> <frame 1-6> <out.png> [--k 3]` → `out.png` + `out.json` (cell, pad, offset, k) |
| `finish_walk.py` | Turns the anchor + 5 edited frames into a 6-frame sheet (`--balance 1`: see big tails below): resizes each edit back to the shipped pixel size, snaps alpha ≤ 12 to 0, drops loose specks, registers each frame to the anchor on the head (translation only), then drops it so the lowest foot sits on the anchor's ground row. Widens the cell if the stride needs it. | `--base <prep png> --out <dir> --name <sheet> [--reg 0:0.40] edit2.png … edit6.png` → `<sheet>.png`, `frames/frame_N.png`, `report.json` |
| `deshadow.py` | Clears the soft ground shadow a leg edit paints under the feet (it survives the alpha ≤ 12 snap and smears on the map): in the lowest 12 % of the figure, pixels with alpha < 160 more than 3 px from a solid pixel go. `--like` first resizes the edit to the prep frame's canvas, so later `swing_part.py` boxes use prep coordinates. A dark **line** under the feet is opaque and stays: drop that render instead. | `<edit.png> <out.png> [--like prep.png] [--band 0.12] [--soft 160] [--near 3]` |
| `swing_part.py` | Swings one loose part (scarf ends, cape hem, antennae) a few degrees from its root on the CPU: the shipped pixels are sheared, ramped in smoothly from a cut line, never redrawn. Use it where a "change only the scarf" edit redraws the part (it did on #163). `--fade top:PX` bends cloth that carries on past the box; `--protect` keeps a wing tip or foot out of the part. | `<in.png> <out.png> --cut x:X\|y:Y --angle DEG --box X0,Y0,X1,Y1 [--ramp PX] [--fade EDGE:PX] [--protect X0,Y0,X1,Y1] [--hue LO:HI …] [--debug dbg.png]` |
| `pack_source.py` | Lays one or more finished rows out as a source PNG that `build-assets.mjs` slices with `"type": "walk"` (6 separate figures per row on one ground line). | `<out.png> <row-1 frames dir> [<row-2 frames dir>] [--gap 48]` |
| `head_track.py` | Measures the head through a walk cycle: scale and position of each frame's head against a reference frame, then the bob (range of head y) in px and % of figure height. **The acceptance measure for walk sheets.** | `<sheet> [frames] [--ref 2] [--band 0:0.40] [--ds 2]` → printed lines |
| `walk_audit.py` | Audits every avatar walk sheet: height spread, ground spread, centre drift, edge contact, stray blobs, plus one panel per sheet. | `<assets/avatars dir> <out dir>` → `walk-metrics.json`, `walk-<sheet>.png` |
| `walk_compare.py` | Before/after evidence for one sheet: a panel at 300 px and 70 px on split night/parchment (and on the map) with the measurements, and a side-by-side GIF at the map's 160 ms per frame. | `<before> <after> <out prefix> [--map scene.webp] [--band 0:0.40]` → `-panel.png`, `.gif` |

**Big tails (foxes, #163 slice D): use the grid.** The build centres each walk frame on the middle of its upper 60 %,
and a fox tail sits in that band, so swinging it slid the head 3–4 px. Run `finish_walk.py --balance 1` (frames 2–6
move at most 1 px so the whole figure's centre stays within 2 px; frame 1 stays put), pack with
`pack_source.py --grid`, and give the sheet `"register": "grid"` in `sheets.json`, as the raven and fox walk sheets do.

`--reg` / `--band` choose which slice of the figure's height counts as "the head". The default (top 40 %)
suits owlets, frogs, foxes and ravens. Mothkins' tall antennae swing, so use `--reg 0.25:0.60` and
`--band 0.25:0.60` for them, which matches on the face.

Walk-sheet steps:

```
python3 -I tools/art-local/prep_walk_frame.py assets/avatars/owlet-girl-walk.webp 1 <scratch>/owlet-girl-f1-x3.png
# copy the png into ComfyUI/input/, render the leg edits with render_queue.py (template qwen21_edit)
python3 -I tools/art-local/swing_part.py <down.png> <down-sw.png> --cut x:425 --angle 9 --box 120,530,425,1020 --debug <dbg.png>
python3 -I tools/art-local/finish_walk.py --base <scratch>/owlet-girl-f1-x3.png --out <scratch>/owlet-girl \
    --name owlet-girl-walk down-sw.png pass.png contactB.png down2-sw.png pass2.png
python3 -I tools/art-local/head_track.py <scratch>/owlet-girl/owlet-girl-walk.png --ref 1 --ds 1
python3 -I tools/art-local/pack_source.py design/source-assets/1-avatars/owlet-walk-163.png <boy frames> <girl frames>
node tools/build-assets.mjs --only owlet
python3 -I tools/art-local/walk_compare.py <old webp> assets/avatars/owlet-girl-walk.webp <scratch>/owlet-girl \
    --map assets/scenes/map.webp
```

The prompts, seeds and picks for the #163 rebuild are in
`design/source-assets/1-avatars/walk-163-generation.json` (owlets, mothkins) and `walk-163-d-generation.json`
(ravens, foxes).

**Frame 1 is load-bearing.** The map shows walk frame 1 whenever the avatar stands still, and the trailer's
"heroes" scene cuts the legs out of frame 1 of five sheets (fox-girl, frogling-boy, raven-girl, owlet-boy,
mothkin-girl) with hand-placed polygons in `js/ui/trailer-scenes.js` (`walkRigs`, pixel coordinates in the
first cell). If a rebuild moves frame 1 by even a pixel, `tools/test/trailer.test.mjs` fails: shift or refit
that sheet's rig and the test's `feetBegin` / `footLandmarks` rows, then look at the trailer, not only the test.
A frame with both feet planted under the body rigs best; a wide stride turns long shanks into sticks.

## Idle loops

The map avatars' idle loops (#163, slice B) animate the shipped idle still with `sprite-animator` (MiniMax H3
first-and-last-frame image-to-video, local ComfyUI; the artist agent's skill). The still is the first and the
last frame, so the loop starts and ends on the shipped pixels.

| Script | What it does | Inputs → outputs |
|---|---|---|
| `finish_idle.py` | Takes the first 12 frames of a `sprite-animator --frame-size 512 --alpha chroma` run, crops all of them with one union box (nothing is re-centred per frame), scales them together to `--height` px, then runs `despill.py` on the small frames: the magenta fringe goes and the outline is repainted after the resize, so it stays crisp. | `<sprite-animator dir> <out dir> [--frames 12] [--height 236] [--outline 1]` → `small/`, `frames/`, `sprite_sheet.png`, `preview.gif` |
| `pack_source.py --grid` | Lays the finished rows out as an exact grid of equal cells for `"register": "grid"` in `sheets.json`. | `<out.png> <row-1 frames dir> [<row-2 frames dir>] --frames 12 --grid` |
| `stabilize_head.py` | Holds the head still where H3 tilted it into the blink: counter-shifts each frame's head so a bright warm feature (pencil, gold button) stays where frame 1 has it, full above the face and ramped to 0 at the neck (body and feet untouched, nothing redrawn). Used on raven-boy. | `<small frames dir> <out dir>/small <band y0:y1> <x0:x1>`, then `despill.py <out dir>/small <out dir> 1` |
| `idle_compare.py` | Measures a built idle sheet (ground row, feet and head shift at scale 1, magenta edge pixels against the raw H3 frames and the shipped still, frame-to-frame step) and draws the 300 px / 70 px panel and a ping-pong GIF beside the shipped still. **The acceptance measure for idle loops.** | `<shipped idle> <idle sheet> <out prefix> [--map scene.webp] [--raw <sprite-animator dir>] [--band 0:0.30]` → `-panel.png`, `.gif`, `.json` |

Idle-loop steps (the prompts, seeds and ComfyUI prompt ids are in
`design/source-assets/1-avatars/idle-loop-163-generation.json`):

```
sprite-animator animate --input <scratch>/owlet-girl-idle.png --output <scratch>/owlet-girl \
    --prompt "<breath, one slow blink, one cloth sway; feet planted, head in place, no shake>" \
    --size 512 --length 124 --frames 12 --frame-size 512 --fps 8 --loop pingpong --steps 20 --seed 28101 --alpha chroma
python3 -I tools/art-local/finish_idle.py <scratch>/owlet-girl <scratch>/owlet-girl-fin
python3 -I tools/art-local/pack_source.py design/source-assets/1-avatars/owlet-idle-loop-163.png \
    <scratch>/owlet-boy-fin/frames <scratch>/owlet-girl-fin/frames --frames 12 --grid
node tools/build-assets.mjs --only owlet-idle-loop
python3 -I tools/art-local/idle_compare.py assets/avatars/owlet-girl-idle.webp assets/avatars/owlet-girl-idle-loop.webp \
    <scratch>/owlet-girl --map assets/scenes/map.webp --raw <scratch>/owlet-girl
```

Always pass `--alpha chroma`: the default `auto` falls back to rembg when the plate drifts, and rembg downloads
an unapproved 1 GB model. Never `--alpha rembg`. **Why `"register": "grid"`:** the walk packer centres each frame
on the alpha-weighted middle of its upper 60 %; in an idle loop the swaying scarf moves that middle, and the
re-centred owlet-boy slid 5 px sideways with its feet planted. Mothkins: measure the head with `--band 0.25:0.50`.

## Cutouts and comparisons

| Script | What it does | Inputs → outputs |
|---|---|---|
| `despill.py` | Removes the magenta fringe that a chroma-key matte (e.g. `sprite-animator`'s H3 loop) leaves on soft edge pixels: edge RGB is regrown from the solid interior, alpha unchanged. With a third argument it also repaints the dark outline on the outer N px. Use this, **not** `sprite-animator --alpha rembg`, which downloads an unapproved 1 GB model. | `<frames dir> <out dir> [outline px]` → `frames/`, `sprite_sheet.png`, `preview.gif` |
| `compare_panel.py` | Side-by-side of any images at 300 px and 70 px figure height, on night and on a patch of a map scene. | `<out.png> <title> <map scene> label=path …` |
