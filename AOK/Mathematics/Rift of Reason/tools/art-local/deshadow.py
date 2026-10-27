"""Clear the soft ground shadow an edit paints under the feet, before finish_walk.py.

Usage: python3 -I deshadow.py <edit.png> <out.png> [--like <prep.png>] [--band 0.12] [--soft 160] [--near 3]
qwen21_edit often adds a faint cast shadow under the feet even when the prompt says "no shadow". It sits
below and beside the soles at low alpha, so finish_walk.py's alpha <= 12 snap keeps most of it, and on the
map it reads as a grey smear that moves from frame to frame.
- --like resizes the edit to the prep frame's canvas first (the edit comes back at another size), so the
  coordinates of a later swing_part.py step are the prep frame's.
- In the lowest --band of the figure (by its alpha box), every pixel with alpha < --soft that lies more than
  --near px from a solid pixel (alpha >= 240) is cleared. Soft edges that hug the feet stay; the shadow goes.
Nothing above the band is touched. Prints the cleared pixel count.
"""
import argparse
import numpy as np
from PIL import Image, ImageFilter

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--like'); ap.add_argument('--band', type=float, default=0.12)
ap.add_argument('--soft', type=int, default=160); ap.add_argument('--near', type=int, default=3)
A = ap.parse_args()
im = Image.open(A.src).convert('RGBA')
if A.like:
    size = Image.open(A.like).size
    if im.size != size:
        im = im.resize(size, Image.LANCZOS)
a = np.array(im)
al = a[:, :, 3]
ys = np.nonzero((al > 24).any(1))[0]
top, bot = ys.min(), ys.max()
y0 = int(bot - (bot - top) * A.band)
solid = Image.fromarray(((al >= 240) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2 * A.near + 1))
near = np.array(solid) > 0
clear = (al < A.soft) & (al > 0) & ~near
clear[:y0] = False
a[clear] = 0
Image.fromarray(a).save(A.out)
print(A.out, 'cleared', int(clear.sum()), 'px below y', y0)
