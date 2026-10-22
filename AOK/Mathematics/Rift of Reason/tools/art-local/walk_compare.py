"""Before/after evidence for a rebuilt walk sheet: a still panel and an animated GIF.

Usage: python3 -I walk_compare.py <before sheet> <after sheet> <out prefix> [--map scene.webp] [--band 0:0.40]
Writes <out prefix>-panel.png and <out prefix>.gif.
- Panel: BEFORE and AFTER rows, each frame at 300 px (cell height) on a split night/parchment tile, with
  the ground row (red) and a fixed line through frame 1's head (cyan, the middle of the --band) drawn across every frame, so the bob shows
  as the head leaving the cyan line. Under each row: the 6 frames at the map's 70 px figure size on the
  split tile and on a patch of the map. Head bob, x drift and head scale come from head_track.py.
- GIF: before and after side by side at 300 px, plus the 70 px map-size pair, at the map's 160 ms per frame.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw, ImageFont
from head_track import bbox, frames_of, head_track

args = sys.argv[1:]
opt = {}
for k in ('--map', '--band'):
    if k in args:
        i = args.index(k); opt[k] = args[i + 1]; del args[i:i + 2]
BEFORE, AFTER, OUT = args
BAND = tuple(float(v) for v in opt.get('--band', '0:0.40').split(':'))
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


def measure(path):
    fr = frames_of(path)
    rows = head_track(fr, ref=0, ds=1, band=BAND)
    fh = max(bbox(f)[3] - bbox(f)[1] + 1 for f in fr)
    ys = [r['y'] for r in rows]; xs = [r['x'] for r in rows]; ss = [r['scale'] for r in rows]
    bots = [bbox(f)[3] for f in fr]
    return fr, dict(bob=max(ys) - min(ys), pct=round((max(ys) - min(ys)) / fh * 100, 1), xd=max(xs) - min(xs),
                    s0=min(ss), s1=max(ss), ground=max(bots) - min(bots), fw=fr[0].width, fh=fr[0].height,
                    top0=round(bbox(fr[0])[1] + (BAND[0] + BAND[1]) / 2 * fh), bottom=max(bots))


def strip(fr, m, label, colour):
    s = 300 / m['fh']
    cw = round(m['fw'] * s)
    W = 10 + 6 * (cw + 8) + 10
    small = []
    for f in fr:  # 70 px figure height, as on the map (90 units per cell, ~70 of them figure)
        k = 70 / (bbox(f)[3] - bbox(f)[1] + 1)
        small.append(f.resize((max(1, round(f.width * k)), max(1, round(f.height * k))), Image.LANCZOS))
    sw = max(x.width for x in small) + 6
    W = max(W, 10 + 6 * (sw + 6) * 2 + 40)
    im = Image.new('RGB', (W, 30 + 300 + 30 + 104 + 10), INK)
    d = ImageDraw.Draw(im)
    d.text((10, 6), f"{label}: head bob {m['bob']} px ({m['pct']} %), x drift {m['xd']} px, head scale "
           f"{m['s0']:.2f}-{m['s1']:.2f}, ground spread {m['ground']} px, frame {m['fw']}x{m['fh']}", fill=colour, font=F)
    gy, hy = round(m['bottom'] * s), round(m['top0'] * s)
    for i, f in enumerate(fr):
        t = split_tile(cw, 300)
        big = f.resize((cw, 300), Image.LANCZOS)
        t.paste(big, (0, 0), big)
        td = ImageDraw.Draw(t)
        td.line((0, gy, cw, gy), fill=(232, 56, 79)); td.line((0, hy, cw, hy), fill=(63, 224, 208))
        im.paste(t, (10 + i * (cw + 8), 30))
        d.text((12 + i * (cw + 8), 334), f'{i + 1}', fill=(200, 200, 210), font=S)
    d.text((10, 352), '70 px, split tile:', fill=(200, 200, 210), font=S)
    for i, x in enumerate(small):
        t = split_tile(sw, 84); t.paste(x, ((sw - x.width) // 2, 84 - x.height - 4), x)
        im.paste(t, (10 + i * (sw + 6), 368))
        if patch is not None:
            p = patch.resize((sw, 84)); p.paste(x, ((sw - x.width) // 2, 84 - x.height - 4), x)
            im.paste(p, (40 + 6 * (sw + 6) + i * (sw + 6), 368))
    if patch is not None:
        d.text((40 + 6 * (sw + 6), 352), 'on the map:', fill=(200, 200, 210), font=S)
    return im


fb, mb = measure(BEFORE)
fa, ma = measure(AFTER)
name = os.path.basename(AFTER).split('.')[0]
top = strip(fb, mb, 'BEFORE (shipped)', (255, 120, 120))
bot = strip(fa, ma, 'AFTER (rebuilt)', (63, 224, 208))
W = max(top.width, bot.width)
pan = Image.new('RGB', (W, 40 + top.height + bot.height + 10), INK)
ImageDraw.Draw(pan).text((10, 10), f'{name}: before / after at 300 px and 70 px (red = ground row, cyan = fixed line through the head in frame 1)',
                         fill=PARCH, font=B)
pan.paste(top, (0, 40)); pan.paste(bot, (0, 40 + top.height + 10))
pan.save(f'{OUT}-panel.png')

# GIF: before | after at 300 px, then the 70 px pair, 160 ms per frame (js/screens/map.js)
frames = []
for i in range(6):
    tiles = []
    for fr, m, lab in ((fb, mb, 'before'), (fa, ma, 'after')):
        s = 300 / m['fh']; cw = round(m['fw'] * s)
        t = split_tile(cw, 300); big = fr[i].resize((cw, 300), Image.LANCZOS); t.paste(big, (0, 0), big)
        td = ImageDraw.Draw(t)
        td.line((0, round(m['top0'] * s), cw, round(m['top0'] * s)), fill=(63, 224, 208))
        td.text((4, 4), f"{lab} {m['pct']} %", fill=(239, 227, 200), font=F)
        k = 70 / (bbox(fr[i])[3] - bbox(fr[i])[1] + 1)
        sm = fr[i].resize((max(1, round(fr[i].width * k)), max(1, round(fr[i].height * k))), Image.LANCZOS)
        p = (patch.resize((120, 96)) if patch is not None else split_tile(120, 96))
        p.paste(sm, ((120 - sm.width) // 2, 96 - sm.height - 4), sm)
        tiles.append((t, p))
    W = sum(t.width for t, _ in tiles) + 30
    g = Image.new('RGB', (W, 300 + 96 + 30), INK)
    x = 10
    for t, p in tiles:
        g.paste(t, (x, 10)); g.paste(p, (x + (t.width - 120) // 2, 320)); x += t.width + 10
    frames.append(g.convert('P', palette=Image.ADAPTIVE))
frames[0].save(f'{OUT}.gif', save_all=True, append_images=frames[1:], duration=160, loop=0)
print(f'{OUT}-panel.png', f'{OUT}.gif', 'before', mb, 'after', ma)
