import { CHAR_IDS, ROOM_IDS, type CharId, type Content, type DayDef, type RoomId } from '../src/engine/types';

const say = (text: string) => [{ who: 'narrator' as const, text }];
const each = <T,>(f: (id: CharId) => T) => Object.fromEntries(CHAR_IDS.map((c) => [c, f(c)])) as Record<CharId, T>;

function day(n: number): DayDef {
  return {
    day: n, chapter: Math.ceil(n / 5), title: `D${n}`, intro: say('早'), outro: say('晚'),
    goal: { k: 'work' }, goalText: '工作',
    bonus: [{ goal: { k: 'stat', stat: 'coins', op: '>=', value: 0 }, text: '錢' }, { goal: { k: 'clean' }, text: '掃' }],
  };
}
export function fixture(): Content {
  return {
    characters: each((id) => ({
      id, name: id, pitch: 1,
      schedule: (id === 'kaka' ? ['gym', 'gym', 'gym'] : id === 'beibei' ? ['gym', 'gym', 'gym'] : ['courtyard', 'courtyard', 'courtyard']) as [RoomId, RoomId, RoomId],
      presence: id === 'panghu' ? 0 : 1,
      skill: { name: '', desc: '', ...(id === 'zhuangzhuang' ? { workCoins: 10 } : {}) },
    })),
    rooms: Object.fromEntries(ROOM_IDS.map((r, i) => [r, {
      id: r, name: r, floor: 0, owner: r === 'gym' ? 'kaka' : undefined,
      work: r === 'courtyard' ? { label: '做事', fx: { coins: 20, energy: -10 }, lines: say('做事') } : undefined,
    }])) as Content['rooms'] & Record<string, never>,
    days: Array.from({ length: 40 }, (_, i) => day(i + 1)),
    chatter: each(() => [say('嗨'), say('再嗨')]),
    events: [{ id: 'e1', lines: say('事件'), fx: { mood: 1 } }],
    tenants: (['silent', 'ad', 'scam', 'normal'] as const).map((type) => ({
      id: type, name: type, type, look: '', intro: say('來了'), clues: say('線索'), caught: say('走吧'),
    })),
    feuds: [{ id: 'f1', a: 'kaka', b: 'beibei', best: 'gift', cause: say('吵'), sideA: say('甲'), sideB: say('乙'), wrong: say('沒用'), peace: say('和好') }],
    endings: each(() => say('完')),
    heroAsides: each(() => Array(8).fill('心聲')),
  };
}
