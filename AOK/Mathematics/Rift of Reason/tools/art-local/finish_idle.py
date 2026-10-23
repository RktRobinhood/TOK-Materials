"""Turn a sprite-animator (MiniMax H3) idle loop into finished frames at the game's size.

Order matters (board note on FAL-271): downscale first, then despill and repaint the outline, because a
resize after the repaint softens the outline again.
1. Reads the first N unique frames (frame_000 ... ) that `sprite-animator animate --frame-size 512` wrote.
2. Snaps alpha <= 12 (the matte floor) to 0 and drops loose specks under --speck px (after the resize).
3. Crops every frame to the union box of all frames (one crop for all, so nothing is re-centred per frame),
   then scales them together so the union is --height px tall.
4. Runs despill.py on the result: edge RGB regrown from the solid interior, outline repainted on --outline px.
Usage: python3 -I finish_idle.py <sprite-animator dir> <out dir> [--frames 12] [--height 236] [--outline 1] [--speck 24]
Writes <out>/small/ (resized), <out>/frames/frame_NNN.png (finished), <out>/sprite_sheet.png, <out>/preview.gif.
"""
import os, subprocess, sys
from collections import deque
import numpy as np
from PIL import Image

args = sys.argv[1:]
opt = {'--frames': 12, '--height': 236, '--outline': 1, '--speck': 24}
for k in list(opt):
    if k in args:
        i = args.index(k); opt[k] = int(args[i + 1]); del args[i:i + 2]
SRC, OUT = args[0], args[1]
os.makedirs(f'{OUT}/small', exist_ok=True)

frames = []
for n in range(opt['--frames']):
    im = np.array(Image.open(f'{SRC}/frames/frame_{n:03d}.png').convert('RGBA'))
    im[:, :, 3] = np.where(im[:, :, 3] <= 12, 0, im[:, :, 3])
    frames.append(im)
mask = np.any([f[:, :, 3] > 0 for f in frames], axis=0)
ys, xs = np.nonzero(mask)
box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
s = opt['--height'] / (box[3] - box[1])
size = (max(1, round((box[2] - box[0]) * s)), opt['--height'])


def drop_specks(a, min_px):
    """Clear 8-connected islands (alpha > 40) smaller than min_px, and the faint pixels around them."""
    solid = a[:, :, 3] > 40
    seen = np.zeros_like(solid)
    h, w = solid.shape
    keep = np.zeros_like(solid)
    for y0, x0 in zip(*np.nonzero(solid)):
        if seen[y0, x0]:
            continue
        comp, q = [], deque([(y0, x0)])
        seen[y0, x0] = True
        while q:
            y, x = q.popleft(); comp.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    v, u = y + dy, x + dx
                    if 0 <= v < h and 0 <= u < w and solid[v, u] and not seen[v, u]:
                        seen[v, u] = True; q.append((v, u))
        if len(comp) >= min_px:
            for y, x in comp:
                keep[y, x] = True
    # faint pixels survive only next to a kept island
    grown = keep.copy()
    for dy in (-2, -1, 0, 1, 2):
        for dx in (-2, -1, 0, 1, 2):
            grown |= np.roll(np.roll(keep, dy, 0), dx, 1)
    a[:, :, 3] = np.where(keep | (grown & ~solid), a[:, :, 3], 0)
    return a, int(solid.sum() - keep.sum())


dropped = 0
for n, f in enumerate(frames):
    im = Image.fromarray(f, 'RGBA').crop(box).resize(size, Image.LANCZOS)
    a = np.array(im)
    a[:, :, 3] = np.where(a[:, :, 3] <= 12, 0, a[:, :, 3])
    a, d = drop_specks(a, opt['--speck'])
    dropped += d
    Image.fromarray(a, 'RGBA').save(f'{OUT}/small/frame_{n:03d}.png')

here = os.path.dirname(os.path.abspath(__file__))
subprocess.run([sys.executable, '-I', f'{here}/despill.py', f'{OUT}/small', OUT, str(opt['--outline'])], check=True)
print(f'{SRC} -> {OUT}: {opt["--frames"]} frames, union box {box}, scale {s:.3f}, frame {size[0]}x{size[1]}, '
      f'speck px dropped {dropped}')
