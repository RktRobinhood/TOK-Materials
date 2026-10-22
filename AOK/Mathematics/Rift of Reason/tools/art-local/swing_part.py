"""Swing one loose part of a figure (scarf ends, cape flap, antennae) a few degrees from its root, on the CPU.

Usage: python3 -I swing_part.py <in.png> <out.png> --cut x:X|y:Y --angle DEG --box X0,Y0,X1,Y1
                                [--ramp PX] [--fade top:PX] [--protect X0,Y0,X1,Y1 ...]
                                [--hue LO:HI --sat MIN --grow PX --dark V --close PX] [--keep PX] [--debug dbg.png]
The part lies past a cut line, on its low side: --cut x:445 means the part is left of x = 445 (scarf
ends or a cape flap hanging behind a right-facing figure); --cut y:300 means it is above y = 300
(antennae). The part is every opaque pixel inside --box that is past the cut (optionally only pixels
whose hue is in LO:HI degrees with saturation >= MIN, grown by --grow px into pixels darker than --dark (0-1 value) so the outline comes too).
It is sheared by --angle degrees, ramped in smoothly over the first --ramp px past the cut so it bends
at its root instead of breaking off:
  x cut: each column moves down by tan(angle) x its distance from the cut (positive = droops);
  y cut: each row moves left (backwards) by tan(angle) x its height above the cut (positive = tilts back).
The texture is resampled, not redrawn, so it matches the other frames pixel for pixel. The old part is
erased wherever it moved, so the tip doesn't show twice, except within --keep px of the rest of the figure. --debug writes the mask (red), box and cut.
--fade EDGE:PX also ramps the shift in from one box edge (top, bottom, left, right), so cloth that carries on
past that edge bends there instead of tearing. --protect boxes are never part of the part (e.g. a wing tip
or a foot that pokes past the cut), so a part can be "everything past the cut" without a hue mask.
"""
import argparse
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--cut', required=True); ap.add_argument('--angle', type=float, required=True)
ap.add_argument('--box', required=True); ap.add_argument('--ramp', type=float, default=60)
ap.add_argument('--hue'); ap.add_argument('--sat', type=float, default=0.25); ap.add_argument('--grow', type=int, default=6)
ap.add_argument('--dark', type=float, default=0.45)
ap.add_argument('--keep', type=int, default=0)
ap.add_argument('--close', type=int, default=6)
ap.add_argument('--debug')
ap.add_argument('--fade'); ap.add_argument('--protect', action='append', default=[])
A = ap.parse_args()
im = Image.open(A.src).convert('RGBA')
a = np.array(im).astype(np.float32)
H, W = a.shape[:2]
axis, c = A.cut.split(':'); c = float(c)
x0, y0, x1, y1 = [int(v) for v in A.box.split(',')]

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
d = np.maximum(0, c - (xx if axis == 'x' else yy))          # distance past the cut
t = np.clip(d / max(1e-3, A.ramp), 0, 1)
w = t * t * (3 - 2 * t)
if A.fade:
    edge, fp = A.fade.split(':'); fp = float(fp)
    e = {'top': yy - y0, 'bottom': y1 - yy, 'left': xx - x0, 'right': x1 - xx}[edge]
    u = np.clip(e / max(1e-3, fp), 0, 1); w = w * u * u * (3 - 2 * u)
shift = np.tan(np.radians(A.angle)) * d * w                  # px moved at each output pixel

box = np.zeros((H, W), bool); box[y0:y1, x0:x1] = True
part = box & (d > 0) & (a[:, :, 3] > 0)
for pb in A.protect:
    px0, py0, px1, py1 = [int(v) for v in pb.split(',')]; part[py0:py1, px0:px1] = False
if A.hue:
    hsv = np.array(im.convert('RGB').convert('HSV')).astype(np.float32)
    h, s = hsv[:, :, 0] * 360 / 255, hsv[:, :, 1] / 255
    lo, hi = [float(v) for v in A.hue.split(':')]
    inhue = ((h >= lo) & (h <= hi)) if lo <= hi else ((h >= lo) | (h <= hi))
    core = inhue & (s >= A.sat) & (a[:, :, 3] > 128)
    m = Image.fromarray((core * 255).astype('uint8'))
    k = 2 * A.close + 1                           # close small holes (pale highlights in the texture) first
    solid = np.array(m.filter(ImageFilter.MaxFilter(k)).filter(ImageFilter.MinFilter(k))) > 0
    grown = np.array(Image.fromarray((solid * 255).astype('uint8')).filter(ImageFilter.MaxFilter(2 * A.grow + 1))) > 0
    v = hsv[:, :, 2] / 255                        # the grown band takes the hue (saturated) and its dark outline,
    edge = grown & ~solid & ((inhue & ((s >= A.sat) | ((v < A.dark) & (s >= 0.15))))   # never a light neighbour,
                             | (a[:, :, 3] < 200))                                     # but the soft fringe comes along
    part &= solid | edge
# inverse map: the shift depends only on the coordinate it doesn't move, so this is exact
sx, sy = (xx, yy - shift) if axis == 'x' else (xx + shift, yy)

layer = a * part[..., None]
prem = layer.copy(); prem[:, :, :3] *= layer[:, :, 3:4] / 255


def sample(img, sx, sy):
    x0_ = np.floor(sx).astype(int); y0_ = np.floor(sy).astype(int)
    fx, fy = (sx - x0_)[..., None], (sy - y0_)[..., None]
    out = np.zeros_like(img)
    for dy, dx, wt in ((0, 0, (1 - fx) * (1 - fy)), (0, 1, fx * (1 - fy)), (1, 0, (1 - fx) * fy), (1, 1, fx * fy)):
        xi, yi = x0_ + dx, y0_ + dy
        ok = (xi >= 0) & (xi < W) & (yi >= 0) & (yi < H)
        v = np.zeros_like(img); v[ok] = img[yi[ok], xi[ok]]
        out += v * wt
    return out


moved = sample(prem, sx, sy)
base = a.copy()
# keep the old part underneath within --keep px of the rest of the figure, so the part still reads as
# hanging from behind it instead of opening a sliver of background where it used to touch
rest = (a[:, :, 3] > 24) & ~part
near = (np.array(Image.fromarray((rest * 255).astype('uint8')).filter(ImageFilter.MaxFilter(2 * A.keep + 1))) > 0
        if A.keep else np.zeros((H, W), bool))
base[part & (shift > 0.25) & ~near] = 0
bprem = base.copy(); bprem[:, :, :3] *= base[:, :, 3:4] / 255
ma = moved[:, :, 3:4] / 255
outp = moved + bprem * (1 - ma)              # moved part over what's left (premultiplied "over")
oa = outp[:, :, 3:4]
rgb = np.where(oa > 0, outp[:, :, :3] * 255 / np.maximum(oa, 1e-3), 0)
res = np.dstack([rgb, oa[:, :, 0]]).clip(0, 255).astype('uint8')
Image.fromarray(res, 'RGBA').save(A.out)
print(A.out, 'part px', int(part.sum()), 'max shift px', round(float(shift[part].max()) if part.any() else 0, 1))
if A.debug:
    dimg = Image.alpha_composite(Image.new('RGBA', (W, H), (20, 18, 31, 255)), im)
    ov = np.zeros((H, W, 4), 'uint8'); ov[part] = (255, 0, 0, 110)
    dimg = Image.alpha_composite(dimg, Image.fromarray(ov, 'RGBA'))
    dd = ImageDraw.Draw(dimg)
    dd.rectangle((x0, y0, x1, y1), outline=(63, 224, 208), width=3)
    for pb in A.protect:
        dd.rectangle(tuple(int(v) for v in pb.split(',')), outline=(120, 255, 120), width=3)
    dd.line((c, 0, c, H) if axis == 'x' else (0, c, W, c), fill=(242, 182, 50), width=2)
    dimg.save(A.debug)
