"""Lay every sprite on a magenta-tinted board so bad cut-outs stand out."""
import sys
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parent.parent
ids = 'guangge kaka zhuangzhuang dayi taoshu tangyuan yao panghu doudou beibei'.split()
start, end = int(sys.argv[2]), int(sys.argv[3])
board = Image.new('RGB', (1000, 300 * (end - start)), (120, 180, 150))
for r, cid in enumerate(ids[start:end]):
    for c, v in enumerate(('front', 'side', 'back')):
        im = Image.open(ROOT / 'public' / 'sprites' / f'{cid}-{v}.webp').convert('RGBA')
        im.thumbnail((320, 290))
        board.paste(im, (10 + c * 330, r * 300 + 5), im)
board.save(sys.argv[1])
