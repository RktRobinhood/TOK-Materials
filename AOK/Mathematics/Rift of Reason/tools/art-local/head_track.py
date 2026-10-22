"""Track the head through a walk cycle: scale and position of each frame's head relative to frame 2.

The head (top 40% of the figure) should keep one size in every frame and move only a few px.
For each frame we search scale 0.84-1.16 and shift for the best colour match of the reference head.
Usage: python3 -I head_track.py <png-or-webp sheet> [frames=6] [--ref 2] [--band 0:0.40] [--ds 2]
--ref is the 1-based frame whose head is the reference (default 2, as in the FAL-271 audit).
--band picks the head as a slice of the reference figure's height (default its top 40 %); use e.g.
0.20:0.55 for mothkins so the swinging antennae don't decide the match. --ds 1 measures at full
resolution (slower; x/y are otherwise in 2 px steps).
Prints one line per frame, then the bob: the range of the head's y, in px and in % of the tallest figure.
"""
import sys
import numpy as np
from PIL import Image


def frames_of(path, n=6):
    im = Image.open(path).convert('RGBA')
    fw = im.width // n
    return [im.crop((i * fw, 0, (i + 1) * fw, im.height)) for i in range(n)]


def bbox(fr):
    a = np.array(fr)[:, :, 3] > 24
    ys, xs = np.nonzero(a)
    return xs.min(), ys.min(), xs.max(), ys.max()


def head_track(frames, ref=1, ds=2, band=(0.0, 0.40)):
    rf = frames[ref]
    x0, y0, x1, y1 = bbox(rf)
    head = rf.crop((x0, y0 + int((y1 - y0) * band[0]), x1 + 1, y0 + int((y1 - y0) * band[1])))
    def plate(im):
        a = np.array(im).astype(np.float32)
        return a[:, :, :3].mean(2) * a[:, :, 3] / 255 + 0.5 * a[:, :, 3]
    out = []
    for k, fr in enumerate(frames):
        I = plate(fr.resize((fr.width // ds, fr.height // ds), Image.BILINEAR))
        H, W = I.shape
        I2c = np.pad(np.cumsum(np.cumsum(I * I, 0), 1), ((1, 0), (1, 0)))
        FI = np.fft.rfft2(I)
        best = None
        for s in np.arange(0.84, 1.165, 0.01):
            w, h = max(4, int(head.width * s / ds)), max(4, int(head.height * s / ds))
            if w > W or h > H:
                continue
            T = plate(head.resize((w, h), Image.BILINEAR))
            Tp = np.zeros_like(I); Tp[:h, :w] = T
            corr = np.fft.irfft2(FI * np.conj(np.fft.rfft2(Tp)), s=I.shape)[:H - h + 1, :W - w + 1]
            win = I2c[h:, w:] - I2c[:-h, w:] - I2c[h:, :-w] + I2c[:-h, :-w]
            ssd = (win[:H - h + 1, :W - w + 1] - 2 * corr + (T * T).sum()) / (w * h)
            dy, dx = np.unravel_index(np.argmin(ssd), ssd.shape)
            e = ssd[dy, dx]
            if best is None or e < best[0]:
                best = (e, s, int(dx) * ds, int(dy) * ds)
        out.append(dict(frame=k + 1, scale=round(float(best[1]), 2), x=best[2], y=best[3], err=round(float(best[0]), 1)))
    return out


if __name__ == '__main__':
    args = sys.argv[1:]
    opt = {}
    for k in ('--ref', '--band', '--ds'):
        if k in args:
            i = args.index(k); opt[k] = args[i + 1]; del args[i:i + 2]
    n = int(args[1]) if len(args) > 1 else 6
    frames = frames_of(args[0], n)
    band = tuple(float(v) for v in opt.get('--band', '0:0.40').split(':'))
    rows = head_track(frames, ref=int(opt.get('--ref', 2)) - 1, ds=int(opt.get('--ds', 2)), band=band)
    for r in rows:
        print(r)
    fh = max(bbox(f)[3] - bbox(f)[1] + 1 for f in frames)
    ys = [r['y'] for r in rows]; xs = [r['x'] for r in rows]; ss = [r['scale'] for r in rows]
    print(f"bob {max(ys) - min(ys)} px = {round((max(ys) - min(ys)) / fh * 100, 1)} % of {fh} px; "
          f"x drift {max(xs) - min(xs)} px; scale {min(ss):.2f}-{max(ss):.2f}")
