"""Cut one frame out of a shipped walk sheet and pad + enlarge it as the input for a qwen21_edit leg edit.

Usage: python3 -I prep_walk_frame.py <sheet.webp> <frame 1-6> <out.png> [--k 3]
The frame is padded to 1.3x its width and 1.12x its height (the stride and a lifted foot need room),
placed 6 % down from the top, then enlarged k times. <out>.json records the geometry that
finish_walk.py needs to undo it: cell size, padded size, the cell's offset inside the pad, and k.
"""
import json, sys
from PIL import Image

args = sys.argv[1:]
k = 3
if '--k' in args:
    i = args.index('--k'); k = int(args[i + 1]); del args[i:i + 2]
sheet, n, out = args[0], int(args[1]), args[2]
im = Image.open(sheet).convert('RGBA')
fw, fh = im.width // 6, im.height
cell = im.crop(((n - 1) * fw, 0, n * fw, fh))
pw, ph = int(fw * 1.3), int(fh * 1.12)
off = ((pw - fw) // 2, int(fh * 0.06))
pad = Image.new('RGBA', (pw, ph), (0, 0, 0, 0))
pad.paste(cell, off)
pad.resize((pw * k, ph * k), Image.LANCZOS).save(out)
json.dump(dict(sheet=sheet, frame=n, cell=[fw, fh], pad=[pw, ph], off=list(off), k=k),
          open(out.rsplit('.', 1)[0] + '.json', 'w'), indent=1)
print(out, (pw * k, ph * k))
