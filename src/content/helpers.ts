import type { CharId, DayDef, Effects, Goal, MiniId, StatKey } from '../engine/types';
import { S } from './script';

export const talk = (who: CharId): Goal => ({ k: 'talk', who });
export const mini = (id: MiniId, min = 1): Goal => ({ k: 'mini', id, min });
export const stat = (s: StatKey, op: '>=' | '<=', value: number): Goal => ({ k: 'stat', stat: s, op, value });
export const aff = (who: CharId, min: number): Goal => ({ k: 'affinity', who, min });
export const work: Goal = { k: 'work' };
export const clean: Goal = { k: 'clean' };
export const tenant: Goal = { k: 'tenant' };
export const feud: Goal = { k: 'feud' };

interface DayArgs {
  n: number; title: string; goal: [Goal, string]; a: [Goal, string]; b: [Goal, string];
  intro: string; outro: string;
  tenant?: string; feud?: string; absent?: DayDef['absent']; force?: CharId[]; startFx?: Effects; scriptedBan?: boolean;
}
export function day(x: DayArgs): DayDef {
  return {
    day: x.n, chapter: Math.ceil(x.n / 5), title: x.title,
    goal: x.goal[0], goalText: x.goal[1],
    bonus: [{ goal: x.a[0], text: x.a[1] }, { goal: x.b[0], text: x.b[1] }],
    intro: S(x.intro), outro: S(x.outro),
    tenant: x.tenant, feud: x.feud, absent: x.absent, force: x.force, startFx: x.startFx, scriptedBan: x.scriptedBan,
  };
}
