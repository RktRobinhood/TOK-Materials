# Source art

Save the PNGs from ChatGPT here, one folder per stage of the art epic (#32), using exactly the file name the request in `design/art-requests/ART-REQUESTS.md` gives under **Save as**:

| Folder | Stage | Examples |
|---|---|---|
| `0-style/` | 0: style board (reference only, not sliced) | `style-board.png` |
| `1-avatars/` | 1: avatars and walk cycles | `owlet-sheet.png`, `owlet-walk.png` |
| `2-world/` | 2: title, logo, map, backgrounds, rift effect | `fair.png`, `road-bridge.png`, `rift-fx.png` |
| `3-cast/` | 3: story cast | `sundial.png`, `granny-axiom.png`, `imps.png` |
| `4-caricatures/` | 4: caricatures | `lobstorian-astrophysicat.png`, `legendaries.png` |
| `5-ui/` | 5: items, cards, UI, puzzle props | `items.png`, `card-frames.png` |

Then, from the game folder (`AOK/Mathematics/Rift of Reason`), run:

```
node tools/build-assets.mjs
```

(First time only: `npm install` inside `tools/`.) It cuts every sheet into separate images, saves them as WebP under `assets/`, rewrites `data/assets.js`, and writes `_preview.html` here. Open the preview in a browser to check every cut-out has the right name; under each sheet, "Source sheet" shows the boxes the tool found, numbered in the order they were named.

## When saving

- **The file name matters, the folder does not.** A name the tool doesn't know is listed and ignored. Keep a replaced version by renaming it (e.g. `owlet-sheet-v1.png` is ignored).
- **PNG with a real transparent background** for everything except backgrounds (title, map, fair, stalls, roads, battle table). If ChatGPT gives a checkerboard *painted* into the picture, ask again; the tool can't cut that.
- **Figures must not touch.** The tool finds each figure as a separate island of colour. Small sparkles near a figure are joined to it; anything bigger counts as its own figure.
- **Order is reading order:** rows top to bottom, left to right. If a sheet comes out in a different order, or with a different number of figures than the request asks for, the tool prints a warning and skips that sheet instead of guessing. Fix it by regenerating, or by editing the list for that file in `tools/assets/sheets.json` (no code changes needed). An entry can also be `{ "id": "ui/block-loose", "rotate": 90 }` to turn a piece a quarter clockwise before saving (for things drawn upright that the game uses sideways).
- Walk cycles: two rows (boy, girl) of six frames. If frames touch, the tool falls back to six equal-width cells and says so.
- Backgrounds should be at least 1672×941 (the map at least 2048 wide).

Other options: `--only owlet` (rebuild just matching sheets), `--dry-run` (report only), `--force` (ignore the cache), `--prune` (remove art no sheet produces any more).
