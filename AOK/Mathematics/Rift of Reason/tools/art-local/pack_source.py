"""Lay finished walk frames out as a source sheet that tools/build-assets.mjs can slice ("type": "walk").

Usage: python3 -I pack_source.py <out.png> <row-1 frames dir> [<row-2 frames dir> ...] [--gap 48]
Each frames dir holds frame_1.png ... frame_6.png from finish_walk.py (one row per sheet id, in the
order of the sheets.json "rows" list). Every frame is trimmed to its alpha box and stood on one ground
line, with --gap px of clear space between frames and rows, so the build finds 6 separate figures per row.
The build re-trims each figure, puts its lowest pixel on the cell's ground line and centres it on the
alpha-weighted middle of its upper 60 %, so nothing else about the layout matters.
"""
import sys
from PIL import Image

args = sys.argv[1:]
gap = 48
if '--gap' in args:
    i = args.index('--gap'); gap = int(args[i + 1]); del args[i:i + 2]
out, dirs = args[0], args[1:]
rows = []
for d in dirs:
    fr = []
    for n in range(1, 7):
        im = Image.open(f'{d}/frame_{n}.png').convert('RGBA')
        fr.append(im.crop(im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()))
    rows.append(fr)
W = max(sum(f.width for f in r) + gap * 7 for r in rows)
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
