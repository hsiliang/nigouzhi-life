import { describe, expect, it } from 'vitest';
import { content } from '../src/content';
import { applyAction, applyChoice, applyMini, availableActions, beginDay, endDay, goalStates, rollEvent } from '../src/engine/day';
import { newGame } from '../src/engine/state';
import { feudOf } from '../src/engine/systems';
import { CHAR_IDS, ROOM_IDS, type Action, type CharId, type GameState, type Goal, type StepResult } from '../src/engine/types';
import { estimateFirstClearMinutes } from '../tools/estimate-time';

const allActions = (s: GameState): Action[] => ROOM_IDS.flatMap((r) => availableActions(s, content, r));

function forGoal(s: GameState, g: Goal, acts: Action[]): Action | undefined {
  const f = feudOf(s, content);
  if (g.k === 'talk') return acts.find((a) => a.kind === 'talk' && a.who === g.who);
  if (g.k === 'mini') return acts.find((a) => a.kind === 'mini' && a.id === g.id);
  if (g.k === 'work') return acts.find((a) => a.kind === 'work');
  if (g.k === 'clean') return acts.find((a) => a.kind === 'clean');
  if (g.k === 'affinity') return acts.find((a) => a.kind === 'gift' && a.who === g.who) ?? acts.find((a) => a.kind === 'talk' && a.who === g.who);
  if (g.k === 'stat' && g.stat === 'coins') return acts.find((a) => a.kind === 'work');
  if (g.k === 'stat' && g.stat === 'happiness') return acts.find((a) => a.kind === 'clean');
  if (g.k === 'stat' && g.stat === 'complaints') return acts.find((a) => a.kind === 'clean');
  if (g.k === 'stat' && g.stat === 'mood') return acts.find((a) => a.kind === 'rest');
  if (g.k === 'feud' && f && s.feud) {
    return acts.find((a) => a.kind === 'feudHear')
      ?? acts.find((a) => a.kind === 'feudMediate' && a.method === f.best);
  }
  return undefined;
}

function decideTenant(s: GameState): Action {
  const t = content.tenants.find((x) => x.id === s.tenant!.id)!;
  return { kind: 'tenantDecide', verdict: t.type === 'normal' ? 'welcome' : t.type === 'silent' ? 'watch' : 'evict' };
}

function step(s: GameState, a: Action, miniScore: number): GameState {
  const r: StepResult = applyAction(s, a, content);
  return r.startMini ? applyMini(r.state, r.startMini, miniScore, content).state : r.state;
}

/** A plain player: chases the day's goals, scores a modest 2 on mini games, otherwise rests. */
function playThrough(hero: CharId, seed: number) {
  let s = newGame(hero, seed);
  let plays = 0, stuck = 0;
  while (!s.finished) {
    plays += 1;
    if (plays > 240) throw new Error(`${hero} stuck around day ${s.day}`);
    s = beginDay(s, content).state;
    const def = content.days[s.day - 1];
    while (s.slot < 3) {
      const ev = rollEvent(s, content);
      s = ev.state;
      if (ev.event?.choices) s = applyChoice(s, ev.event, 0, content).state;
      if (s.slot >= 3) break;
      if (s.tenant) s = applyAction(s, decideTenant(s), content).state;
      const goals = [def.goal, def.bonus[0].goal, def.bonus[1].goal];
      const done = goalStates(s, def);
      const acts = allActions(s);
      const next = goals.map((g, i) => (done[i] ? undefined : forGoal(s, g, acts))).find(Boolean);
      s = step(s, next ?? { kind: 'rest' }, 2);
    }
    const r = endDay(s, content);
    if (!r.passed) stuck += 1;
    s = r.state;
  }
  return { state: s, plays, failures: stuck };
}

describe('full playthrough', () => {
  it.each(CHAR_IDS)('%s reaches their ending', (hero) => {
    for (const seed of [11, 222, 3333]) {
      const r = playThrough(hero, seed);
      expect(r.state.finished).toBe(true);
      expect(r.state.seenTenants.length).toBeGreaterThanOrEqual(10);
      expect(r.state.resolvedFeuds.length).toBeGreaterThanOrEqual(6);
      expect(r.state.bans).toBeGreaterThanOrEqual(1);
      expect(r.plays).toBeLessThan(90);
    }
  });
});

describe('length', () => {
  it('takes at least 65 minutes on a first clear', () => {
    const e = estimateFirstClearMinutes(content);
    expect(e.total).toBeGreaterThanOrEqual(65);
  });
});
