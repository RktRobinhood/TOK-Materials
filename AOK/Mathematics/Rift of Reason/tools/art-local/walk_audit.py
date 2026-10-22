"""Measure every walk sheet frame by frame and draw an audit panel per sheet.

Usage: python3 -I walk_audit.py <assets/avatars dir> <out dir>
Writes walk-metrics.json and one panel per sheet plus an all-sheets overview.
"""
import json, sys, os
from PIL import Image, ImageDraw, ImageFont
import numpy as np

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
FONT = ImageFont.load_default(size=16)
SMALL = ImageFont.load_default(size=12)
species = ['fox', 'frogling', 'mothkin', 'owlet', 'raven']
sheets = [f'{s}-{g}' for s in species for g in ('boy', 'girl')]
import os as _os
sheets = [n for n in sheets if _os.path.exists(f'{SRC}/{n}-walk.webp')]


def components(mask):
    """Count connected opaque blobs (4-neighbour) and return their pixel sizes."""
    from collections import deque
    h, w = mask.shape
    seen = np.zeros_like(mask, bool)
    sizes = []
    ys, xs = np.nonzero(mask)
    for y0, x0 in zip(ys, xs):
        if seen[y0, x0]:
            continue
        q = deque([(y0, x0)]); seen[y0, x0] = True; n = 0
        while q:
            y, x = q.popleft(); n += 1
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                yy, xx = y + dy, x + dx
                if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and not seen[yy, xx]:
                    seen[yy, xx] = True; q.append((yy, xx))
        sizes.append(n)
    return sorted(sizes, reverse=True)


metrics = {}
for name in sheets:
    im = Image.open(f'{SRC}/{name}-walk.webp').convert('RGBA')
    W, H = im.size
    fw = W // 6
    a = np.array(im)[:, :, 3]
    frames = []
    for i in range(6):
        al = a[:, i * fw:(i + 1) * fw]
        m = al > 24
        ys, xs = np.nonzero(m)
        top, bot, lft, rgt = ys.min(), ys.max(), xs.min(), xs.max()
        cx = float(xs.mean())
        # feet: lowest 6% of the figure; their centre is the anchor a walker plants on.
        foot = m[bot - max(3, int((bot - top) * 0.06)):bot + 1]
        fy, fx = np.nonzero(foot)
        comps = components(m[::2, ::2])  # half-res is enough to find stray blobs
        semi = ((al > 8) & (al < 200)).sum() / max(1, m.sum())
        frames.append(dict(top=int(top), bottom=int(bot), left=int(lft), right=int(rgt),
                           height=int(bot - top + 1), width=int(rgt - lft + 1), cx=round(cx, 1),
                           footx=round(float(fx.mean()), 1),
                           touches=[s for s, t in (('top', top <= 1), ('bottom', bot >= H - 2), ('left', lft <= 1), ('right', rgt >= fw - 2)) if t],
                           blobs=len(comps), stray=[c for c in comps[1:] if c > 3], semi=round(float(semi), 3)))
    hs = [f['height'] for f in frames]; bs = [f['bottom'] for f in frames]; cxs = [f['cx'] for f in frames]
    metrics[name] = dict(size=[W, H], frame=[fw, H], frames=frames,
                         height_range=max(hs) - min(hs), height_pct=round((max(hs) - min(hs)) / max(hs) * 100, 1),
                         ground_range=max(bs) - min(bs), cx_range=round(max(cxs) - min(cxs), 1),
                         fill_pct=round(max(hs) / H * 100, 1),
                         drawn_px_at_AV90=round(90 * max(hs) / H, 1))

    # ---- panel: frames at 300 px tall with bbox + ground line, an onion skin, and the 70 px row ----
    S = 300 / H
    cell = int(fw * S)
    pad = 10
    pw = pad + 6 * (cell + pad) + cell + 2 * pad
    ph = 40 + 300 + 30 + 110 + 30
    pan = Image.new('RGB', (pw, ph), (20, 18, 31))
    d = ImageDraw.Draw(pan)
    m = metrics[name]
    d.text((pad, 8), f"{name}-walk  sheet {W}x{H}  frame {fw}x{H}  |  height spread {m['height_range']}px ({m['height_pct']}%)  "
           f"ground spread {m['ground_range']}px  centre drift {m['cx_range']}px  fill {m['fill_pct']}%", fill=(239, 227, 200), font=FONT)
    onion = Image.new('RGBA', (cell, 300), (0, 0, 0, 0))
    gl = int(max(bs) * S)
    for i, f in enumerate(frames):
        fr = im.crop((i * fw, 0, (i + 1) * fw, H)).resize((cell, 300), Image.LANCZOS)
        x0 = pad + i * (cell + pad)
        bg = Image.new('RGB', (cell, 300), (36, 32, 52))
        bg.paste(fr, (0, 0), fr)
        pan.paste(bg, (x0, 40))
        d.rectangle((x0 + f['left'] * S, 40 + f['top'] * S, x0 + f['right'] * S, 40 + f['bottom'] * S), outline=(63, 224, 208))
        d.line((x0, 40 + gl, x0 + cell, 40 + gl), fill=(232, 56, 79))
        d.line((x0 + f['cx'] * S, 40, x0 + f['cx'] * S, 340), fill=(242, 182, 50))
        d.text((x0 + 3, 343), f"{i+1}: h{f['height']} b{f['bottom']} cx{f['cx']:.0f}" + (' EDGE ' + ','.join(f['touches']) if f['touches'] else ''),
               fill=(255, 120, 120) if f['touches'] else (200, 200, 210), font=SMALL)
        tint = Image.new('RGBA', fr.size, (255, 255, 255, 0))
        al2 = fr.getchannel('A').point(lambda v: v // 4)
        tint.putalpha(al2)
        onion = Image.alpha_composite(onion, tint)
    x0 = pad + 6 * (cell + pad) + pad
    ob = Image.new('RGB', (cell, 300), (36, 32, 52)); ob.paste(onion, (0, 0), onion)
    pan.paste(ob, (x0, 40))
    d.line((x0, 40 + gl, x0 + cell, 40 + gl), fill=(232, 56, 79))
    d.text((x0, 343), 'all 6 overlaid', fill=(200, 200, 210), font=SMALL)
    # 70 px row: each frame at the game's map size, on the map's dark ground
    y70 = 380
    d.text((pad, y70 - 6), '70 px (map size), frames 1-6:', fill=(239, 227, 200), font=SMALL)
    for i in range(6):
        fr = im.crop((i * fw, 0, (i + 1) * fw, H))
        h70 = 90  # map draws the whole frame at 90 units; ~70 px of that is the figure
        fr = fr.resize((int(fw * h70 / H), h70), Image.LANCZOS)
        bg = Image.new('RGB', (fr.width + 8, h70 + 4), (15, 31, 26)); bg.paste(fr, (4, 2), fr)
        pan.paste(bg, (pad + 220 + i * (fr.width + 14), y70 + 10))
    pan.save(f'{OUT}/walk-{name}.png')

json.dump(metrics, open(f'{OUT}/walk-metrics.json', 'w'), indent=1)
for n, m in metrics.items():
    fr = m['frames']
    print(f"{n:14s} frame {m['frame'][0]}x{m['frame'][1]} heights {[f['height'] for f in fr]} bottoms {[f['bottom'] for f in fr]} "
          f"cx {[int(f['cx']) for f in fr]} footx {[int(f['footx']) for f in fr]} fill {m['fill_pct']}% drawn {m['drawn_px_at_AV90']} "
          f"edge {[f['touches'] for f in fr if f['touches']]} stray {[f['stray'][:3] for f in fr if f['stray']]} semi {[f['semi'] for f in fr]}")
