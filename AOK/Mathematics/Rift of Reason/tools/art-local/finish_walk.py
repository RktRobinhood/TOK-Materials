"""Turn the anchor frame + 5 edits into a 6-frame walk sheet in the shipped format, and measure it.

Usage: python3 -I finish_walk.py --base <input.png> --out <dir> --name <sheet> [--reg 0:0.40] [--margin 4]
                                 <frame2.png> ... <frame6.png>
<input.png> is the padded, enlarged anchor frame from prep_walk_frame.py; its .json sidecar gives the
geometry. Frame 1 of the sheet is the anchor itself; the edits are the other frames in cycle order.
- Every image is resized to the input's canvas (the edit returns another size at the same aspect),
  then scaled by 1/k back to the shipped pixel size, so the geometry is the shipped frame's.
- Alpha <= 12 snaps to 0 (VAE floor) and opaque specks under 40 px that float free of the figure are dropped.
- Each edit is registered to the anchor on the head (translation only, SSD via FFT on a band of the
  figure, by default its top 40 %; use e.g. --reg 0.25:0.60 to skip swinging antennae), then shifted
  vertically so its lowest foot sits on the anchor's ground row. What remains of the head's movement
  is the bob, which is printed.
- The cell is the shipped cell, widened (never narrowed) to fit every frame with --margin px to spare,
  keeping the figure's horizontal place. The build re-packs frames anyway; the sheet is for measuring.
Writes <out>/<sheet>.png (6 cells), <out>/frames/frame_N.png and <out>/report.json.
"""
import argparse, json, os
from collections import deque
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('--base', required=True)
ap.add_argument('--out', required=True)
ap.add_argument('--name', required=True)
ap.add_argument('--reg', default='0:0.40')
ap.add_argument('--margin', type=int, default=4)
ap.add_argument('edits', nargs='+')
A = ap.parse_args()
geo = json.load(open(A.base.rsplit('.', 1)[0] + '.json'))
K = geo['k']
CW, CH = geo['cell']
OFF = geo['off']
REG = [float(v) for v in A.reg.split(':')]
os.makedirs(f'{A.out}/frames', exist_ok=True)


def drop_specks(a, min_px=40):
    m = a[:, :, 3] > 24
    h, w = m.shape
    lab = np.zeros((h, w), np.int32)
    sizes = [0]
    for y0, x0 in zip(*np.nonzero(m)):
        if lab[y0, x0]:
            continue
        n = len(sizes); sizes.append(0)
        q = deque([(y0, x0)]); lab[y0, x0] = n
        while q:
            y, x = q.popleft(); sizes[n] += 1
            for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= yy < h and 0 <= xx < w and m[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = n; q.append((yy, xx))
    small = [i for i, s in enumerate(sizes) if 0 < s < min_px]
    if small:
        a[np.isin(lab, small)] = 0
    return a, len(small)


def load(p, size):
    im = Image.open(p).convert('RGBA')
    if im.size != size:
        im = im.resize(size, Image.LANCZOS)
    im = im.resize((size[0] // K, size[1] // K), Image.LANCZOS)
    a = np.array(im)
    a[:, :, 3] = np.where(a[:, :, 3] <= 12, 0, a[:, :, 3])
    a[a[:, :, 3] == 0] = 0
    a, n = drop_specks(a)
    return Image.fromarray(a), n


def plate(im):
    a = np.array(im).astype(np.float32)
    return a[:, :, :3].mean(2) * a[:, :, 3] / 255 + 0.5 * a[:, :, 3]


def shift_to(ref, im):
    """Translation that puts im's head band on ref's (SSD via FFT, zero-padded so nothing wraps)."""
    ys = np.nonzero((np.array(ref)[:, :, 3] > 24).any(1))[0]
    fh = ys.max() - ys.min()
    y0, y1 = ys.min() + int(fh * REG[0]), ys.min() + int(fh * REG[1])
    R = plate(ref)[y0:y1]
    I = plate(im)
    H, W = I.shape
    h, w = R.shape
    P = np.zeros((H + h, W + w), np.float32); P[:H, :W] = I
    T = np.zeros_like(P); T[:h, :w] = R
    corr = np.fft.irfft2(np.fft.rfft2(P) * np.conj(np.fft.rfft2(T)), s=P.shape)
    I2 = np.pad(np.cumsum(np.cumsum(P * P, 0), 1), ((1, 0), (1, 0)))
    win = I2[h:, w:] - I2[:-h, w:] - I2[h:, :-w] + I2[:-h, :-w]
    ssd = win[:H + 1, :W + 1] - 2 * corr[:H + 1, :W + 1]
    dy, dx = np.unravel_index(np.argmin(ssd), ssd.shape)
    return int(dx), int(dy - y0)  # ref's band (at x=0, y=y0) is found here in im


def lowest_row(im):
    return int(np.nonzero((np.array(im)[:, :, 3] > 60).any(1))[0].max())


size = Image.open(A.base).size
loaded = [load(p, size) for p in [A.base] + A.edits]
frames = [f for f, _ in loaded]
base = frames[0]
ground = lowest_row(base)
placed, report = [], []
for i, f in enumerate(frames):
    dx, dy = (0, 0) if i == 0 else shift_to(base, f)
    canvas = Image.new('RGBA', f.size, (0, 0, 0, 0))
    canvas.paste(f, (-dx, -dy))                # head now on the anchor's head
    drop = ground - lowest_row(canvas)         # then the lowest foot onto the ground row
    g = Image.new('RGBA', f.size, (0, 0, 0, 0)); g.paste(canvas, (0, drop))
    placed.append(g)
    report.append(dict(frame=i + 1, src=os.path.basename(([A.base] + A.edits)[i]), head_shift=[dx, dy], bob=-drop,
                       specks_dropped=loaded[i][1]))
# cell: the shipped cell, widened symmetrically / heightened upward until every frame fits with a margin
boxes = [g.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox() for g in placed]
x0 = min(OFF[0], min(b[0] for b in boxes) - A.margin)
x1 = max(OFF[0] + CW, max(b[2] for b in boxes) + A.margin)
grow = max(OFF[0] - x0, x1 - OFF[0] - CW)
x0, x1 = OFF[0] - grow, OFF[0] + CW + grow
y0 = min(OFF[1], min(b[1] for b in boxes) - A.margin)
y1 = max(OFF[1] + CH, max(b[3] for b in boxes) + 1)
cw, ch = x1 - x0, y1 - y0
sheet = Image.new('RGBA', (cw * 6, ch), (0, 0, 0, 0))
for i, g in enumerate(placed):
    cell = g.crop((x0, y0, x1, y1))
    a = np.array(cell)[:, :, 3] > 24
    ys, xs = np.nonzero(a)
    report[i].update(top=int(ys.min()), bottom=int(ys.max()), height=int(ys.max() - ys.min() + 1),
                     cx=round(float(xs.mean()), 1))
    cell.save(f'{A.out}/frames/frame_{i + 1}.png')
    sheet.paste(cell, (i * cw, 0))
sheet.save(f'{A.out}/{A.name}.png')
hs = [r['height'] for r in report]
tops = [r['top'] for r in report]
summary = dict(cell=[cw, ch], shipped_cell=[CW, CH], bottoms=sorted(set(r['bottom'] for r in report)),
               head_top_range_px=max(tops) - min(tops),
               head_top_range_pct=round((max(tops) - min(tops)) / max(hs) * 100, 1),
               centre_drift_px=round(max(r['cx'] for r in report) - min(r['cx'] for r in report), 1))
json.dump(dict(frames=report, summary=summary, reg=A.reg), open(f'{A.out}/report.json', 'w'), indent=1)
for r in report:
    print(r)
print(summary)
