"""Hold an idle loop's head still where the video model tilted it into the blink (raven-boy, #163 slice B).

Each frame's head is counter-shifted so a bright warm feature (the pencil, a gold button: R > 150, G > 100,
B < 0.6 G, in the --band / x range of the frame) stays where frame 1 has it.
The shift is full above --top of the figure and ramps linearly to 0 at --bottom (the neck), so feet and body stay put.
Usage: python3 -I stabilize_head.py <in frames dir> <out frames dir> <band y0:y1> <x0:x1> [--top 0.36] [--bottom 0.56] [--min 2.5]
Frames whose feature is off by less than --min px are copied unchanged. Bilinear resampling, premultiplied.
Run it on finish_idle.py's small/ frames, then despill.py on the result, so the outline is repainted after the shift."""
import os, sys
import numpy as np
from PIL import Image
args = sys.argv[1:]
opt = {'--top': 0.36, '--bottom': 0.56, '--min': 2.5}
for k in list(opt):
    if k in args:
        i = args.index(k); opt[k] = float(args[i + 1]); del args[i:i + 2]
SRC, OUT, band, xr = args
ya, yb = (float(v) for v in band.split(':')); xa, xb = (float(v) for v in xr.split(':'))
os.makedirs(OUT, exist_ok=True)
names = sorted(n for n in os.listdir(SRC) if n.endswith('.png'))
def feat(a):
    H, W = a.shape[:2]; r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    m = (al > 200) & (r > 150) & (g > 100) & (b < 0.6 * g) & (r > b + 80)
    box = np.zeros_like(m); box[int(H * ya):int(H * yb), int(W * xa):int(W * xb)] = True
    ys, xs = np.nonzero(m & box); return xs.mean(), ys.mean()
frames = [np.array(Image.open(f'{SRC}/{n}').convert('RGBA')).astype(np.float32) for n in names]
al0 = frames[0][..., 3] > 24; ys0 = np.nonzero(al0.any(1))[0]; fy0, fy1 = ys0.min(), ys0.max()
ref = feat(frames[0])
for n, a in zip(names, frames):
    fx, fy = feat(a); dx, dy = fx - ref[0], fy - ref[1]
    if max(abs(dx), abs(dy)) < opt['--min']:
        Image.fromarray(a.clip(0, 255).astype('uint8'), 'RGBA').save(f'{OUT}/{n}'); print(n, 'kept', f'{dx:+.1f}/{dy:+.1f}'); continue
    H, W = a.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    t0, t1 = fy0 + opt['--top'] * (fy1 - fy0), fy0 + opt['--bottom'] * (fy1 - fy0)
    w = np.clip((t1 - yy) / (t1 - t0), 0, 1)
    sx, sy = xx + dx * w, yy + dy * w          # sample from where the head moved to
    pm = a.copy(); pm[..., :3] *= pm[..., 3:] / 255
    x0 = np.floor(sx).astype(int); y0 = np.floor(sy).astype(int); fx_, fy_ = sx - x0, sy - y0
    def at(y, x):
        ok = (x >= 0) & (x < W) & (y >= 0) & (y < H)
        v = pm[np.clip(y, 0, H - 1), np.clip(x, 0, W - 1)]; v[~ok] = 0; return v
    out = (at(y0, x0) * ((1 - fx_) * (1 - fy_))[..., None] + at(y0, x0 + 1) * (fx_ * (1 - fy_))[..., None]
           + at(y0 + 1, x0) * ((1 - fx_) * fy_)[..., None] + at(y0 + 1, x0 + 1) * (fx_ * fy_)[..., None])
    alpha = out[..., 3:]; out[..., :3] = np.where(alpha > 0, out[..., :3] * 255 / np.maximum(alpha, 1e-3), 0)
    Image.fromarray(out.clip(0, 255).astype('uint8'), 'RGBA').save(f'{OUT}/{n}'); print(n, 'shifted', f'{-dx:+.1f}/{-dy:+.1f}')
