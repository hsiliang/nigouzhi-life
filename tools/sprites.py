"""Cut the three views out of each character sheet into white-outlined sticker webps."""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ni

ROOT = Path(__file__).resolve().parent.parent
ROLES = ROOT / 'Roles'
OUT = ROOT / 'public' / 'sprites'
HEIGHT, BORDER = 360, 7


def source(name, cache):
    path = ROLES / name
    if name == 'kaka.jpg':
        path = Path(cache) / 'kaka.jpg'
    return Image.open(path).convert('RGB')


def flood_mask(rgb, tol):
    a = np.asarray(rgb).astype(float)
    h, w, _ = a.shape
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bg = np.median(border, axis=0)
    dist = np.linalg.norm(a - bg, axis=2)
    cand = dist < tol
    # soft floor shadows: greyish and in the lowest band only
    chroma = a.max(axis=2) - a.min(axis=2)
    band = np.zeros((h, w), bool)
    band[int(h * .80):] = True
    cand |= band & (dist < tol * 2.8) & (chroma < 34) & (a.mean(axis=2) > 120)
    labels, _ = ni.label(cand)
    edge = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
    bgmask = np.isin(labels, list(edge))
    fg = ~bgmask
    fg = ni.binary_opening(fg, iterations=2)
    return keep_largest(fg)


def outline_mask(rgb):
    """For white-bodied art on a near-white ground: trust the closed ink outline."""
    ink = np.asarray(rgb).astype(float).mean(axis=2) < 135
    solid = ni.binary_fill_holes(ni.binary_dilation(ink, iterations=3))
    return keep_largest(ni.binary_erosion(solid, iterations=3))


def keep_largest(fg):
    labels, n = ni.label(fg)
    if n == 0:
        return fg
    sizes = ni.sum(fg, labels, range(1, n + 1))
    return labels == (int(np.argmax(sizes)) + 1)


def rembg_mask(rgb):
    from rembg import remove, new_session
    global SESSION
    if 'SESSION' not in globals():
        SESSION = new_session('isnet-anime')
    alpha = remove(rgb, session=SESSION, only_mask=True, post_process_mask=True)
    return keep_largest(ni.binary_fill_holes(np.asarray(alpha) > 128))


def sticker(rgb, fg):
    ys, xs = np.where(fg)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    rgb, fg = rgb.crop((x0, y0, x1, y1)), fg[y0:y1, x0:x1]
    scale = (HEIGHT - BORDER * 2) / fg.shape[0]
    w = round(fg.shape[1] * scale)
    rgb = rgb.resize((w, HEIGHT - BORDER * 2), Image.LANCZOS)
    mask = Image.fromarray((fg * 255).astype('uint8')).resize(rgb.size, Image.LANCZOS)
    mask = mask.filter(ImageFilter.GaussianBlur(.6))
    canvas = Image.new('RGBA', (w + BORDER * 2, HEIGHT), (255, 255, 255, 0))
    outline = np.asarray(mask.point(lambda v: 255 if v > 90 else 0))
    pad = np.pad(outline > 0, BORDER)
    grown = ni.binary_dilation(pad, iterations=BORDER)
    ring = Image.fromarray((grown * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(.9))
    canvas.paste((255, 255, 255, 255), (0, 0), ring)
    canvas.paste(rgb, (BORDER, BORDER), mask)
    return canvas


def main(cache):
    OUT.mkdir(parents=True, exist_ok=True)
    spec = json.loads((ROOT / 'tools' / 'sprite-boxes.json').read_text())
    for cid, s in spec.items():
        src = source(s['file'], cache)
        d = ImageDraw.Draw(src)
        for x0, y0, x1, y1, col in s.get('scrub', []):
            d.rectangle((x0, y0, x1, y1), fill=col)
        for view in ('front', 'side', 'back'):
            rgb = src.crop(tuple(s[view]))
            fg = {'rembg': lambda: rembg_mask(rgb),
                  'outline': lambda: outline_mask(rgb),
                  'flood': lambda: flood_mask(rgb, s.get('tol', 30))}[s['method']]()
            sticker(rgb, fg).save(OUT / f'{cid}-{view}.webp', quality=86, method=6)
            print(cid, view, 'coverage %.0f%%' % (fg.mean() * 100))


if __name__ == '__main__':
    main(sys.argv[1])
