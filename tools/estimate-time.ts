import type { Content } from '../src/engine/types';

const READ_CHARS_PER_MIN = 400;
const SECONDS_PER_ACTION = 11, SECONDS_PER_DAY_FRAME = 14, MINI_OVERHEAD = 12;

/** Lower bound for a first clear: required reading, required mini games and the taps between them. */
export function estimateFirstClearMinutes(c: Content) {
  const chars = c.days.reduce((n, d) => n + [...d.intro, ...d.outro].reduce((m, l) => m + [...l.text].length, 0), 0);
  const reading = chars / READ_CHARS_PER_MIN;
  const actions = (c.days.length * (3 * SECONDS_PER_ACTION + SECONDS_PER_DAY_FRAME)) / 60;
  const requiredMinis = c.days.filter((d) => d.goal.k === 'mini').length;
  const minis = (requiredMinis * (35 + MINI_OVERHEAD)) / 60;
  return { reading, actions, minis, requiredMinis, total: reading + actions + minis };
}
