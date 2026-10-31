import type { Line, LineFx, Speaker } from '../engine/types';

const NAMES: Record<string, Speaker> = {
  光哥: 'guangge', 卡卡: 'kaka', 壯壯: 'zhuangzhuang', 大姨: 'dayi', 桃叔: 'taoshu', 湯圓: 'tangyuan',
  瑤老師: 'yao', 胖虎: 'panghu', 豆豆: 'doudou', 貝貝: 'beibei', 旁白: 'narrator', 鄰居: 'neighbor', 警察: 'police', 租客: 'tenant',
};

/** Turns "光哥：台詞 #sweat" lines into Line objects so the script reads like a script. */
export function S(src: string): Line[] {
  return src.split('\n').map((l) => l.trim()).filter(Boolean).map((raw) => {
    const m = raw.match(/^(.+?)：(.*?)(?:\s*#(\w+))?$/);
    if (!m || !NAMES[m[1]]) throw new Error(`bad script line: ${raw}`);
    const line: Line = { who: NAMES[m[1]], text: m[2] };
    if (m[3]) line.fx = m[3] as LineFx;
    return line;
  });
}
