"""Pre-generate voiced catchphrases with Microsoft neural voices through edge-tts."""
import asyncio, json
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'voice'
CAST = {
    'guangge': ('zh-CN-YunyangNeural', '-4%', '+0Hz'),
    'kaka': ('zh-CN-YunxiNeural', '-8%', '+0Hz'),
    'zhuangzhuang': ('zh-CN-XiaoxiaoNeural', '+4%', '-14Hz'),
    'dayi': ('zh-CN-shaanxi-XiaoniNeural', '+6%', '+0Hz'),
    'taoshu': ('zh-TW-YunJheNeural', '-6%', '-8Hz'),
    'tangyuan': ('zh-HK-HiuGaaiNeural', '+4%', '+4Hz'),
    'yao': ('zh-CN-XiaoxiaoNeural', '+0%', '+16Hz'),
    'panghu': ('zh-CN-YunjianNeural', '-14%', '-12Hz'),
    'doudou': ('zh-CN-liaoning-XiaobeiNeural', '+6%', '+0Hz'),
    'beibei': ('zh-CN-XiaoyiNeural', '+6%', '+10Hz'),
}


async def one(sem, who, i, text):
    path = OUT / f'{who}-{i}.mp3'
    if path.exists() and path.stat().st_size > 800:
        return
    voice, rate, pitch = CAST[who]
    async with sem:
        for attempt in range(3):
            try:
                await edge_tts.Communicate(text, voice, rate=rate, pitch=pitch).save(str(path))
                return
            except Exception as e:  # the service throttles bursts
                print('retry', who, i, e)
                await asyncio.sleep(2 + attempt * 3)
    raise RuntimeError(f'failed {who}-{i}')


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    data = json.loads((ROOT / 'src' / 'content' / 'voiceLines.json').read_text())
    sem = asyncio.Semaphore(4)
    await asyncio.gather(*(one(sem, w, i, t) for w, lines in data.items() for i, t in enumerate(lines)))


asyncio.run(main())
