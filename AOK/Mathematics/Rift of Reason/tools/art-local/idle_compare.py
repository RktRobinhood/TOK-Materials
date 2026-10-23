"""Measure an avatar idle-loop sheet and show it beside the shipped still.

Usage: python3 -I idle_compare.py <shipped idle> <idle-loop sheet> <out prefix> [--frames 12] [--map scene.webp]
       [--band 0:0.30] [--fps 8] [--raw <sprite-animator dir>]
Writes <out prefix>-panel.png, <out prefix>.gif and <out prefix>.json, and prints the measurements:
- ground: spread of the lowest opaque row (alpha > 128) over the frames, px. Feet planted means 0.
- head / feet: where the head (--band slice of frame 1's figure height, default the top 30 %; mothkins use
  0.25:0.50 so the antennae don't decide) and the feet (bottom 7 %) of frame 1 best match in every other frame,
  searched over shifts of up to 8 px at scale 1 (an idle loop does not zoom); the largest |dx| and |dy|, px at
  the sheet's own size, and the larger as % of the figure height (the FAL-271 bar, "inside 3 px" on its 160 px
  frames, is about 2.5 %). Also head_track.py's scale search, as a check that the head keeps its size.
- pink: soft edge pixels (0 < alpha < 250) with the H3 plate's magenta cast: hue 290-330 degrees, R and B both
  40+ above G and B at least 0.75 R (the fringe is near #FF00FF; a red scarf's rose highlight has B ~0.7 R).
  Summed over all frames, and per frame on the shipped still as the baseline; --raw <sprite-animator dir> also
  counts the same frames straight out of H3, before the despill.
- step: the largest mean |premultiplied RGBA| change between two frames that play next to each other in a ping-pong loop
  (0-1 scale); 'wrap' is the same between the last and first frame, if the loop were played straight through.
Panel: the shipped still and frames 1, 4, 7, 10 and 12 at 300 px on a split night/parchment tile, with the
ground row (red) and a fixed line through the head in frame 1 (cyan); under it every frame at the map's 70 px
figure height on the split tile and on a patch of the map. GIF: still | loop at 300 px plus the 70 px pair,
played ping-pong at --fps.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from head_track import bbox, frames_of, head_track

args = sys.argv[1:]
opt = {'--frames': '12', '--band': '0:0.30', '--fps': '8'}
for k in ('--map', '--band', '--frames', '--fps', '--raw'):
    if k in args:
        i = args.index(k); opt[k] = args[i + 1]; del args[i:i + 2]
STILL, SHEET, OUT = args
N, FPS = int(opt['--frames']), int(opt['--fps'])
BAND = tuple(float(v) for v in opt['--band'].split(':'))
NIGHT, PARCH, INK = (20, 18, 31), (239, 227, 200), (8, 8, 12)
F = ImageFont.load_default(size=16); B = ImageFont.load_default(size=20); S = ImageFont.load_default(size=13)
patch = None
if '--map' in opt:
    mp = Image.open(opt['--map']).convert('RGB')
    patch = mp.crop((int(mp.width * 0.40), int(mp.height * 0.45), int(mp.width * 0.40) + 90, int(mp.height * 0.45) + 96))


def split_tile(w, h):
    t = Image.new('RGB', (w, h), NIGHT)
    ImageDraw.Draw(t).rectangle((w // 2, 0, w, h), fill=PARCH)
    return t


def pink(im):
    a = np.array(im.convert('RGBA')).astype(np.float32)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    soft = (al > 0) & (al < 250)
    mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
    d = np.where(mx > mn, mx - mn, 1)
    hue = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    cast = soft & (mx > mn) & (hue >= 290) & (hue <= 330) & (r - g >= 40) & (b - g >= 40) & (b >= 0.75 * r)
    return int(cast.sum()), int(soft.sum())


def plate(im):
    a = np.array(im).astype(np.float32)
    return a[:, :, :3].mean(2) * a[:, :, 3] / 255 + 0.5 * a[:, :, 3]


def shift_track(frames, band, r=8):
    """(dx, dy) per frame at which frame 1's band best matches, scale 1, within +-r px."""
    x0, y0, x1, y1 = bbox(frames[0])
    ya, yb = y0 + int((y1 - y0 + 1) * band[0]), y0 + int((y1 - y0 + 1) * band[1])
    P = [np.pad(plate(f), r) for f in frames]
    ref = P[0][ya + r:yb + r, x0 + r:x1 + 1 + r]
    out = []
    for Q in P:
        best = min((float(((Q[ya + r + dy:yb + r + dy, x0 + r + dx:x1 + 1 + r + dx] - ref) ** 2).mean()), dx, dy)
                   for dy in range(-r, r + 1) for dx in range(-r, r + 1))
        out.append((best[1], best[2]))
    return out


still = Image.open(STILL).convert('RGBA')
fr = frames_of(SHEET, N)
rows = head_track(fr, ref=0, ds=1, band=BAND)
head = shift_track(fr, BAND)
feet = shift_track(fr, (0.93, 1.0))
boxes = [bbox(f) for f in fr]
fh = max(b[3] - b[1] + 1 for b in boxes)
arr = [np.array(f).astype(np.float32) / 255 for f in fr]
arr = [np.dstack([a[..., :3] * a[..., 3:], a[..., 3:]]) for a in arr]  # premultiplied: hidden RGB doesn't count
order = list(range(N)) + list(range(N - 2, 0, -1))
steps = [float(np.abs(arr[order[i]] - arr[order[(i + 1) % len(order)]]).mean()) for i in range(len(order))]
pk = [pink(f) for f in fr]
m = dict(sheet=os.path.basename(SHEET), frames=N, frame=f'{fr[0].width}x{fr[0].height}', figure_h=fh,
         ground_spread=int(max(b[3] for b in boxes) - min(b[3] for b in boxes)),
         feet_dx=max(abs(v[0]) for v in feet), feet_dy=max(abs(v[1]) for v in feet),
         head_dx=max(abs(v[0]) for v in head), head_dy=max(abs(v[1]) for v in head), head=head, feet=feet,
         head_pct=round(max(max(abs(v[0]), abs(v[1])) for v in head) / fh * 100, 1),
         head_scale=[min(r['scale'] for r in rows), max(r['scale'] for r in rows)],
         pink_edge=sum(p[0] for p in pk), soft_edge=sum(p[1] for p in pk), pink_edge_still=pink(still)[0],
         pink_edge_raw=(sum(pink(Image.open(f"{opt['--raw']}/frames/frame_{i:03d}.png"))[0] for i in range(N))
                        if '--raw' in opt else None),
         step_max=round(max(steps), 4), step_mean=round(sum(steps) / len(steps), 4),
         wrap=round(float(np.abs(arr[-1] - arr[0]).mean()), 4), head_rows=rows)
json.dump(m, open(f'{OUT}.json', 'w'), indent=1, default=int)

# ---- panel ----
fw, fhh = fr[0].width, fr[0].height
s = 300 / fhh
cw = round(fw * s)
sk = 300 / (still.getbbox()[3] - still.getbbox()[1])
still_big = still.crop(still.getbbox()).resize((round(still.getbbox()[2] * sk - still.getbbox()[0] * sk), 300), Image.LANCZOS)
pick = [0, 3, 6, 9, N - 1]
W = 20 + still_big.width + 16 + len(pick) * (cw + 8)
k70 = 70 / fh
small = [f.resize((max(1, round(f.width * k70)), max(1, round(f.height * k70))), Image.LANCZOS) for f in fr]
s_k = 70 / (still.getbbox()[3] - still.getbbox()[1])
still_small = still.crop(still.getbbox()).resize((max(1, round(still_big.width * s_k / sk)), 70), Image.LANCZOS)
sw = max(x.width for x in small + [still_small]) + 6
W = max(W, 20 + (N + 1) * (sw + 4) + 10)
H = 40 + 30 + 300 + 26 + 18 + 84 + (18 + 84 if patch is not None else 0) + 16
pan = Image.new('RGB', (W, H), INK)
d = ImageDraw.Draw(pan)
d.text((10, 8), f"{m['sheet']}: shipped still vs idle loop, 300 px and 70 px (red = ground row, cyan = head line of frame 1)",
       fill=PARCH, font=B)
d.text((10, 40), f"ground spread {m['ground_spread']} px, feet |dx| {m['feet_dx']} / |dy| {m['feet_dy']} px, head |dx| {m['head_dx']} / |dy| "
       f"{m['head_dy']} px ({m['head_pct']} %), head scale {m['head_scale'][0]:.2f}-{m['head_scale'][1]:.2f}, pink edge px {m['pink_edge']} "
       f"(raw H3 {m['pink_edge_raw']}, still {m['pink_edge_still']}), frame {m['frame']}", fill=(63, 224, 208), font=F)
y0 = 70
t = split_tile(still_big.width, 300); t.paste(still_big, (0, 0), still_big); pan.paste(t, (10, y0))
d.text((12, y0 + 302), 'shipped still', fill=(255, 120, 120), font=S)
gy = round(max(b[3] for b in boxes) * s)
hy = round((boxes[0][1] + (BAND[0] + BAND[1]) / 2 * fh) * s)
for j, i in enumerate(pick):
    t = split_tile(cw, 300)
    big = fr[i].resize((cw, 300), Image.LANCZOS)
    t.paste(big, (0, 0), big)
    td = ImageDraw.Draw(t)
    td.line((0, gy, cw, gy), fill=(232, 56, 79)); td.line((0, hy, cw, hy), fill=(63, 224, 208))
    x = 26 + still_big.width + j * (cw + 8)
    pan.paste(t, (x, y0)); d.text((x + 2, y0 + 302), f'loop {i + 1}', fill=(63, 224, 208), font=S)
y1 = y0 + 300 + 26
rowsets = [('70 px, split tile (shipped still, then loop frames 1-%d):' % N, None)]
if patch is not None:
    rowsets.append(('70 px on the map:', patch))
for label, bg in rowsets:
    d.text((10, y1), label, fill=(200, 200, 210), font=S)
    for i, x in enumerate([still_small] + small):
        tt = bg.resize((sw, 84)) if bg is not None else split_tile(sw, 84)
        tt.paste(x, ((sw - x.width) // 2, 84 - x.height - 4), x)
        pan.paste(tt, (10 + i * (sw + 4) + (6 if i else 0), y1 + 18))
    y1 += 18 + 84
pan.save(f'{OUT}-panel.png')

# ---- GIF ----
gif = []
for i in order:
    g = Image.new('RGB', (10 + still_big.width + 10 + cw + 10, 10 + 300 + 10 + 96 + 10), INK)
    t = split_tile(still_big.width, 300); t.paste(still_big, (0, 0), still_big); g.paste(t, (10, 10))
    t = split_tile(cw, 300); big = fr[i].resize((cw, 300), Image.LANCZOS); t.paste(big, (0, 0), big)
    ImageDraw.Draw(t).line((0, hy, cw, hy), fill=(63, 224, 208)); g.paste(t, (20 + still_big.width, 10))
    for x0, im in ((10 + (still_big.width - 120) // 2, still_small), (20 + still_big.width + (cw - 120) // 2, small[i])):
        p = patch.resize((120, 96)) if patch is not None else split_tile(120, 96)
        p.paste(im, ((120 - im.width) // 2, 96 - im.height - 4), im)
        g.paste(p, (x0, 320))
    gif.append(g.convert('P', palette=Image.ADAPTIVE))
gif[0].save(f'{OUT}.gif', save_all=True, append_images=gif[1:], duration=round(1000 / FPS), loop=0)
print(json.dumps({k: v for k, v in m.items() if k not in ('head_rows', 'head', 'feet')}, default=int))
