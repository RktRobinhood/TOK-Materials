"""Lay finished walk frames out as a source sheet that tools/build-assets.mjs can slice ("type": "walk").

Usage: python3 -I pack_source.py <out.png> <row-1 frames dir> [<row-2 frames dir> ...] [--gap 48] [--frames 6]
Each frames dir holds frame_1.png ... frame_6.png from finish_walk.py, or frame_000.png ... from finish_idle.py
(one row per sheet id, in the order of the sheets.json "rows" list; --frames per row, as in sheets.json). Every frame is trimmed to its alpha box and stood on one ground
line, with --gap px of clear space between frames and rows, so the build finds that many separate figures per row.
The build re-trims each figure, puts its lowest pixel on the cell's ground line and centres it on the
alpha-weighted middle of its upper 60 %, so nothing else about the layout matters.
--grid (idle loops, sheets.json "register": "grid"): no trimming and no gaps. The frames of a row must all be
the same size (finish_idle.py crops them with one box); they are laid out as an exact grid of equal cells,
each frame stood on the bottom of its cell and centred across it, so the build keeps the registration.
"""
import os, sys
from PIL import Image

args = sys.argv[1:]
gap, n_frames = 48, 6
if '--gap' in args:
    i = args.index('--gap'); gap = int(args[i + 1]); del args[i:i + 2]
grid = '--grid' in args
if grid:
    args.remove('--grid')
if '--frames' in args:
    i = args.index('--frames'); n_frames = int(args[i + 1]); del args[i:i + 2]
out, dirs = args[0], args[1:]
rows = []
for d in dirs:
    fr = []
    for n in range(n_frames):
        name = f'{d}/frame_{n + 1}.png' if os.path.exists(f'{d}/frame_1.png') else f'{d}/frame_{n:03d}.png'
        im = Image.open(name).convert('RGBA')
        fr.append(im if grid else im.crop(im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()))
    rows.append(fr)
if grid:
    if any(f.size != r[0].size for r in rows for f in r):
        sys.exit('--grid: every frame of a row must be the same size')
    cw, ch = max(r[0].width for r in rows), max(r[0].height for r in rows)
    sheet = Image.new('RGBA', (cw * n_frames, ch * len(rows)), (0, 0, 0, 0))
    for ri, r in enumerate(rows):
        for i, f in enumerate(r):
            sheet.paste(f, (i * cw + (cw - f.width) // 2, ri * ch + ch - f.height))
    sheet.save(out)
    print(out, sheet.size, 'grid of', cw, 'x', ch)
    sys.exit()
W = max(sum(f.width for f in r) + gap * (n_frames + 1) for r in rows)
hs = [max(f.height for f in r) for r in rows]
sheet = Image.new('RGBA', (W, sum(hs) + gap * (len(rows) + 1)), (0, 0, 0, 0))
y = gap
for r, h in zip(rows, hs):
    x = gap
    for f in r:
        sheet.paste(f, (x, y + h - f.height))
        x += f.width + gap
    y += h + gap
sheet.save(out)
print(out, sheet.size)
