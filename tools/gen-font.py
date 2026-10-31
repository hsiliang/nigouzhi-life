"""Subset the two OFL fonts: jf open huninn for Traditional, ZCOOL KuaiLe for Simplified."""
import json, sys
from pathlib import Path
from fontTools import subset

ROOT = Path(__file__).resolve().parent.parent
table = json.loads((ROOT / 'src/i18n-t2s.json').read_text())
text = ''.join(p.read_text() for p in (ROOT / 'src').rglob('*.ts')) + (ROOT / 'src/content/voiceLines.json').read_text()
EXTRA = {chr(c) for c in range(0x20, 0x7f)} | set('，。！？、：；「」『』（）…～─・★☆✔✘▼')
base = {c for c in text if ord(c) > 0x2000 and ord(c) < 0xffff and not 0x2600 <= ord(c) <= 0x27bf and c != '️'}
sets = {
    'game.woff2': (sys.argv[1], base - set(table.values()) | EXTRA),
    'game-hans.woff2': (sys.argv[2], {table.get(c, c) for c in base} | EXTRA),
}
for name, (source, chars) in sets.items():
    opts = subset.Options(flavor='woff2', layout_features=['*'], desubroutinize=True)
    font = subset.load_font(source, opts)
    cmap = font.getBestCmap()
    print(name, 'missing:', ''.join(sorted(c for c in chars if ord(c) not in cmap)))
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=[ord(c) for c in chars])
    sub.subset(font)
    subset.save_font(font, str(ROOT / 'public/fonts' / name), opts)
