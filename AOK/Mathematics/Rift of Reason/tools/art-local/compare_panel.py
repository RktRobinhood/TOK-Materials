"""Side-by-side comparison at 300 px and 70 px (figure height), on night and on a crop of the map scene.
Usage: python3 -I compare_panel.py <out.png> <title> <map scene> <label=path> ...
Each image is trimmed to its alpha box first, so the figure itself is 300 / 70 px tall.
"""
import sys
from PIL import Image, ImageDraw, ImageFont
OUT, TITLE, MAP = sys.argv[1:4]
items = [a.split('=', 1) for a in sys.argv[4:]]
F = ImageFont.load_default(size=15); B = ImageFont.load_default(size=18)
NIGHT = (20, 18, 31)
mp = Image.open(MAP).convert('RGB')
patch = mp.crop((int(mp.width * 0.40), int(mp.height * 0.45), int(mp.width * 0.40) + 140, int(mp.height * 0.45) + 110))
def trim(im):
    im = im.convert('RGBA'); return im.crop(im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox())
def fit(im, h):
    s = h / im.height; return im.resize((max(1, round(im.width * s)), h), Image.LANCZOS)
cells = []
for lab, p in items:
    im = trim(Image.open(p))
    big = fit(im, 300); small = fit(im, 70)
    cw = max(big.width, 300) + 20
    c = Image.new('RGB', (cw, 300 + 140 + 50), (8, 8, 12)); d = ImageDraw.Draw(c)
    t = Image.new('RGB', (cw - 20, 300), NIGHT); t.paste(big, ((t.width - big.width) // 2, 0), big); c.paste(t, (10, 30))
    d.text((10, 6), lab, fill=(239, 227, 200), font=F)
    s1 = Image.new('RGB', (110, 110), NIGHT); s1.paste(small, ((110 - small.width) // 2, 20), small); c.paste(s1, (10, 340))
    s2 = patch.copy(); s2.paste(small, ((s2.width - small.width) // 2, 20), small); c.paste(s2, (130, 340))
    d.text((10, 455), '70 px on night / on the map', fill=(180, 180, 190), font=F)
    cells.append(c)
W = sum(c.width for c in cells) + 10
out = Image.new('RGB', (W, cells[0].height + 40), (8, 8, 12)); d = ImageDraw.Draw(out)
d.text((10, 10), TITLE, fill=(239, 227, 200), font=B)
x = 5
for c in cells: out.paste(c, (x, 40)); x += c.width
out.save(OUT)
