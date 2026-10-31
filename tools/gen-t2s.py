"""Build the per-character Traditional to Simplified table from characters the game really uses."""
import json, re
from pathlib import Path
from opencc import OpenCC

ROOT = Path(__file__).resolve().parent.parent
conv = OpenCC('t2s')
chars = set()
for path in list((ROOT / 'src').rglob('*.ts')) + [ROOT / 'src/content/voiceLines.json', ROOT / 'index.html']:
    chars |= set(re.findall(r'[㐀-鿿]', path.read_text()))
table = {c: conv.convert(c) for c in sorted(chars) if conv.convert(c) != c}
table.update({'妳': '你', '欸': '诶', '牠': '它', '瞇': '眯', '砲': '炮'})  # OpenCC keeps these; mainland readers use the swapped forms
(ROOT / 'src/i18n-t2s.json').write_text(json.dumps(table, ensure_ascii=False, indent=0, sort_keys=True))
print(len(chars), 'characters,', len(table), 'differ')
