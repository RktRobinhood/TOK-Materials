"""Remove the magenta fringe the H3 chroma matte leaves on soft edge pixels.

Each pixel within 2 px of the edge (or with alpha < 250) takes its RGB from the nearest pixel that is solidly inside the figure
(alpha >= 250), grown outwards a few px at a time. Alpha is unchanged, so the silhouette and its
anti-aliasing stay as they are. Alpha <= 12 (the VAE / matte floor) is snapped to 0.
Usage: python3 -I despill.py <frames dir> <out dir> [outline px]
Also writes sprite_sheet.png (4 columns) and preview.gif (8 fps) in <out dir>.
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter

SRC, OUT = sys.argv[1], sys.argv[2]
OUTLINE = int(sys.argv[3]) if len(sys.argv) > 3 else 0  # px of outline to repaint, 0 = none
OUTLINE_GAIN = 0.3  # darken the local colour: the shipped outline follows the hue (dark red on the scarf, dark brown on feathers)
os.makedirs(f'{OUT}/frames', exist_ok=True)


def despill(im):
    a = np.array(im.convert('RGBA')).astype(np.float32)
    al = a[:, :, 3]
    # 'solid' = 2 px inside the opaque edge: the matte tints the outermost opaque band too
    inner = np.array(Image.fromarray(al.astype('uint8')).filter(ImageFilter.MinFilter(5))).astype(np.float32)
    solid = inner >= 250
    rgb = a[:, :, :3] * solid[..., None]
    w = solid.astype(np.float32)
    acc, wt = rgb.copy(), w.copy()
    known = solid.copy()
    out = a[:, :, :3].copy()
    for _ in range(8):  # grow interior colour outwards by 8 px
        s_rgb = np.zeros_like(acc); s_w = np.zeros_like(wt)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
            s_rgb += np.roll(np.roll(acc, dy, 0), dx, 1)
            s_w += np.roll(np.roll(wt, dy, 0), dx, 1)
        new = (~known) & (s_w > 0)
        acc[new] = s_rgb[new] / s_w[new][:, None]
        wt[new] = 1
        known |= new
    fix = (~solid) & known
    out[fix] = acc[fix]
    if OUTLINE:
        # repaint the art's dark outline on the outermost ~2 px (the H3 matte blends it away)
        edge = np.array(Image.fromarray(al.astype('uint8')).filter(ImageFilter.MinFilter(OUTLINE * 2 + 1))) < 250
        band = edge & (al > 0)
        out[band] = out[band] * OUTLINE_GAIN
    al = np.where(al <= 12, 0, al)
    return Image.fromarray(np.dstack([out, al]).clip(0, 255).astype('uint8'), 'RGBA')


names = sorted(n for n in os.listdir(SRC) if n.endswith('.png'))
frames = []
for n in names:
    f = despill(Image.open(f'{SRC}/{n}'))
    f.save(f'{OUT}/frames/{n}'); frames.append(f)
w, h = frames[0].size
cols = 4
sheet = Image.new('RGBA', (cols * w, -(-len(frames) // cols) * h), (0, 0, 0, 0))
for i, f in enumerate(frames):
    sheet.paste(f, ((i % cols) * w, (i // cols) * h))
sheet.save(f'{OUT}/sprite_sheet.png')
bg = [Image.alpha_composite(Image.new('RGBA', f.size, (20, 18, 31, 255)), f).convert('P', palette=Image.ADAPTIVE) for f in frames]
bg[0].save(f'{OUT}/preview.gif', save_all=True, append_images=bg[1:], duration=125, loop=0)
print(len(frames), 'frames', w, 'x', h)
