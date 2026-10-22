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
| `finish_walk.py` | Turns the anchor + 5 edited frames into a 6-frame sheet: resizes each edit back to the shipped pixel size, snaps alpha ≤ 12 to 0, drops loose specks, registers each frame to the anchor on the head (translation only), then drops it so the lowest foot sits on the anchor's ground row. Widens the cell if the stride needs it. | `--base <prep png> --out <dir> --name <sheet> [--reg 0:0.40] edit2.png … edit6.png` → `<sheet>.png`, `frames/frame_N.png`, `report.json` |
| `swing_part.py` | Swings one loose part (scarf ends, cape hem, antennae) a few degrees from its root on the CPU: the shipped pixels are sheared, ramped in smoothly from a cut line, never redrawn. Use it where a "change only the scarf" edit redraws the part (it did on #163). `--fade top:PX` bends cloth that carries on past the box; `--protect` keeps a wing tip or foot out of the part. | `<in.png> <out.png> --cut x:X\|y:Y --angle DEG --box X0,Y0,X1,Y1 [--ramp PX] [--fade EDGE:PX] [--protect X0,Y0,X1,Y1] [--hue LO:HI …] [--debug dbg.png]` |
| `pack_source.py` | Lays one or more finished rows out as a source PNG that `build-assets.mjs` slices with `"type": "walk"` (6 separate figures per row on one ground line). | `<out.png> <row-1 frames dir> [<row-2 frames dir>] [--gap 48]` |
| `head_track.py` | Measures the head through a walk cycle: scale and position of each frame's head against a reference frame, then the bob (range of head y) in px and % of figure height. **The acceptance measure for walk sheets.** | `<sheet> [frames] [--ref 2] [--band 0:0.40] [--ds 2]` → printed lines |
| `walk_audit.py` | Audits every avatar walk sheet: height spread, ground spread, centre drift, edge contact, stray blobs, plus one panel per sheet. | `<assets/avatars dir> <out dir>` → `walk-metrics.json`, `walk-<sheet>.png` |
| `walk_compare.py` | Before/after evidence for one sheet: a panel at 300 px and 70 px on split night/parchment (and on the map) with the measurements, and a side-by-side GIF at the map's 160 ms per frame. | `<before> <after> <out prefix> [--map scene.webp] [--band 0:0.40]` → `-panel.png`, `.gif` |

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
`design/source-assets/1-avatars/walk-163-generation.json`.

**Frame 1 is load-bearing.** The map shows walk frame 1 whenever the avatar stands still, and the trailer's
"heroes" scene cuts the legs out of frame 1 of five sheets (fox-girl, frogling-boy, raven-girl, owlet-boy,
mothkin-girl) with hand-placed polygons in `js/ui/trailer-scenes.js` (`walkRigs`, pixel coordinates in the
first cell). If a rebuild moves frame 1 by even a pixel, `tools/test/trailer.test.mjs` fails: shift or refit
that sheet's rig and the test's `feetBegin` / `footLandmarks` rows, then look at the trailer, not only the test.
A frame with both feet planted under the body rigs best; a wide stride turns long shanks into sticks.

## Cutouts and comparisons

| Script | What it does | Inputs → outputs |
|---|---|---|
| `despill.py` | Removes the magenta fringe that a chroma-key matte (e.g. `sprite-animator`'s H3 loop) leaves on soft edge pixels: edge RGB is regrown from the solid interior, alpha unchanged. With a third argument it also repaints the dark outline on the outer N px. Use this, **not** `sprite-animator --alpha rembg`, which downloads an unapproved 1 GB model. | `<frames dir> <out dir> [outline px]` → `frames/`, `sprite_sheet.png`, `preview.gif` |
| `compare_panel.py` | Side-by-side of any images at 300 px and 70 px figure height, on night and on a patch of a map scene. | `<out.png> <title> <map scene> label=path …` |
