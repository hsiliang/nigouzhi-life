import { describe, expect, it } from 'vitest';
import { applyAction, applyMini, availableActions, beginDay, endDay, rollEvent, starsFor, whereIs } from '../src/engine/day';
import { newGame } from '../src/engine/state';
import { applyEffects, isFeuding } from '../src/engine/systems';
import { deserialize, fromSaveCode, serialize, toSaveCode } from '../src/engine/save';
import type { CharId, GameState, TenantType, Verdict } from '../src/engine/types';
import { fixture } from './fixture';

const content = fixture();
const fresh = (hero: CharId = 'doudou', seed = 7): GameState => beginDay(newGame(hero, seed), content).state;
const fx = (s: GameState, e: Parameters<typeof applyEffects>[1]) => applyEffects(s, e, content);

function finishDay(s: GameState, work = true, clean = true) {
  let cur = s;
  if (work) cur = applyAction(cur, { kind: 'work' }, content).state;
  if (clean) cur = applyAction(cur, { kind: 'clean' }, content).state;
  while (cur.slot < 3) cur = applyAction(cur, { kind: 'rest' }, content).state;
  return endDay(cur, content);
}

describe('new game', () => {
  it('starts on day 1 slot 0 in building 1', () => {
    const s = newGame('kaka', 1);
    expect([s.day, s.slot, s.buildingNo, s.hero]).toEqual([1, 0, 1, 'kaka']);
  });
});

describe('day and chapter flow', () => {
  it('moves to the next day after passing', () => {
    expect(finishDay(fresh()).nextDay).toBe(2);
  });
  it('repeats the day without game over when the main goal fails', () => {
    const r = finishDay(fresh(), false, false);
    expect(r.passed).toBe(false);
    expect(r.nextDay).toBe(1);
    expect(r.state.finished).toBe(false);
  });
  it('gives one star for the main goal and one for each bonus', () => {
    expect(finishDay(fresh(), true, false).stars).toBe(2);
    expect(finishDay(fresh(), true, true).stars).toBe(3);
  });
  it('holds the chapter until nine stars are earned', () => {
    let s = fresh();
    for (let i = 0; i < 5; i++) {
      const r = finishDay(s, true, false);
      s = beginDay({ ...r.state, day: r.nextDay }, content).state;
      if (i < 4) expect(r.nextDay).toBe(i + 2);
      else {
        expect(r.nextDay).toBe(6);
      }
    }
    let low = fresh();
    const stars = { 1: 1, 2: 1, 3: 2, 4: 1, 5: 1 };
    low = { ...low, day: 5, maxDay: 5, stars };
    const blocked = finishDay(low, true, false);
    expect(blocked.replaying).toBe(true);
    expect(blocked.nextDay).toBe(1);
    const again = finishDay(beginDay(blocked.state, content).state, true, false);
    expect(again.nextDay).toBe(2);
    const unlocked = finishDay(beginDay(again.state, content).state, true, true);
    expect(unlocked.nextDay).toBe(6);
  });
  it('keeps best stars when a day is replayed worse', () => {
    const s = { ...fresh(), stars: { 1: 3 } };
    expect(finishDay(s, true, false).state.stars[1]).toBe(3);
  });
  it('finishes the game after day 40', () => {
    const stars = Object.fromEntries(Array.from({ length: 39 }, (_, i) => [i + 1, 3]));
    const s = beginDay({ ...fresh(), day: 40, maxDay: 40, stars }, content).state;
    const r = finishDay(s);
    expect(r.finished).toBe(true);
    expect(r.lines.length).toBeGreaterThan(0);
  });
  it('does not soft-lock when a talk goal targets the hero', () => {
    const custom = fixture();
    custom.days[0].goal = { k: 'talk', who: 'doudou' };
    expect(starsFor(fresh('doudou'), custom.days[0])).toBeGreaterThan(0);
  });
});

describe('jealousy', () => {
  it('triggers a brawl at 100 and falls back to 30', () => {
    const r = fx({ ...fresh(), jealousy: 95 }, { jealousy: 10 });
    expect(r.signals).toContainEqual({ type: 'brawl' });
    expect(r.state.jealousy).toBe(30);
    expect(r.state.brawls).toBe(1);
  });
});

describe('complaints', () => {
  const at = (n: number) => ({ ...fresh(), complaints: n });
  it('sends a note at 40', () => expect(fx(at(35), { complaints: 5 }).signals).toContainEqual({ type: 'note' }));
  it('sends a warning at 70', () => expect(fx({ ...at(65), complaintTier: 1 }, { complaints: 5 }).signals).toContainEqual({ type: 'warning' }));
  it('sends the police at 85 and someone disappears', () => {
    const r = fx({ ...at(80), complaintTier: 2 }, { complaints: 5 });
    const police = r.signals.find((x) => x.type === 'police');
    expect(police).toBeTruthy();
    const who = (police as { who: CharId }).who;
    expect(who).not.toBe('doudou');
    expect(r.state.absent[who]).toBeGreaterThan(r.state.day);
  });
  it('bans the building at 100, moves to the next one and ends the day', () => {
    const r = fx({ ...at(90), complaintTier: 3 }, { complaints: 20 });
    expect(r.signals).toContainEqual({ type: 'ban', buildingNo: 2 });
    expect(r.state.buildingNo).toBe(2);
    expect(r.state.complaints).toBe(30);
    expect(r.state.slot).toBe(3);
    expect(r.state.bans).toBe(1);
  });
  it('does not repeat a tier signal before dropping below it', () => {
    const once = fx(at(35), { complaints: 5 });
    expect(fx(once.state, { complaints: 1 }).signals).toEqual([]);
  });
});

describe('scripted ban', () => {
  const banned = () => {
    const custom = fixture();
    custom.days[1].scriptedBan = true;
    return custom;
  };
  it('moves the building once without losing the day', () => {
    const c = banned();
    const r = beginDay({ ...newGame('doudou', 7), day: 2, maxDay: 2, complaints: 60 }, c);
    expect(r.signals).toContainEqual({ type: 'ban', buildingNo: 2 });
    expect([r.state.buildingNo, r.state.bans, r.state.complaints, r.state.slot]).toEqual([2, 1, 30, 0]);
  });
  it('does not ban again when the day is replayed', () => {
    const c = banned();
    const first = beginDay({ ...newGame('doudou', 7), day: 2, maxDay: 2 }, c).state;
    const again = beginDay({ ...first, started: false }, c).state;
    expect(again.buildingNo).toBe(2);
  });
});

describe('tenants', () => {
  const withTenant = (id: TenantType) => ({ ...fresh(), tenant: { id, clues: 0 }, coins: 100, happiness: 50 });
  const decide = (id: TenantType, verdict: Verdict) => applyAction(withTenant(id), { kind: 'tenantDecide', verdict }, content);
  const result = (r: ReturnType<typeof decide>) => r.signals.find((x) => x.type === 'tenantResult') as { correct: boolean };
  it('rewards evicting a scammer', () => {
    const r = decide('scam', 'evict');
    expect(result(r).correct).toBe(true);
    expect(r.state.coins).toBeGreaterThan(100);
    expect(r.state.tenant).toBeNull();
    expect(r.state.progress.tenantDone).toBe(true);
  });
  it('punishes letting a scammer stay', () => {
    const r = decide('scam', 'welcome');
    expect(result(r).correct).toBe(false);
    expect(r.state.coins).toBeLessThan(100);
    expect(r.state.happiness).toBeLessThan(50);
  });
  it('rewards evicting an advertiser and raises complaints when kept', () => {
    expect(result(decide('ad', 'evict')).correct).toBe(true);
    expect(decide('ad', 'watch').state.complaints).toBeGreaterThan(0);
  });
  it('accepts either watch or evict for a silent tenant', () => {
    expect(result(decide('silent', 'watch')).correct).toBe(true);
    expect(result(decide('silent', 'evict')).correct).toBe(true);
  });
  it('punishes evicting a normal tenant', () => {
    const r = decide('normal', 'evict');
    expect(result(r).correct).toBe(false);
    expect(r.state.happiness).toBeLessThan(50);
  });
  it('does not use a time slot to decide but does to investigate', () => {
    const s = withTenant('scam');
    expect(applyAction(s, { kind: 'tenantDecide', verdict: 'evict' }, content).state.slot).toBe(0);
    expect(applyAction(s, { kind: 'tenantAsk', helper: 'taoshu' }, content).state.slot).toBe(1);
  });
});

describe('feuds', () => {
  const feuding = (hero: CharId = 'doudou') => ({ ...fresh(hero), feud: { id: 'f1', heard: [] as CharId[] }, happiness: 50 });
  it('keeps feuding characters out of the same room', () => {
    const s = feuding();
    expect(whereIs(s, 'kaka', content)).not.toBe(whereIs(s, 'beibei', content));
    expect(isFeuding(s, 'kaka', content)).toBe(true);
  });
  it('lowers happiness every day until resolved', () => {
    const r = finishDay(feuding(), true, false);
    expect(r.state.happiness).toBeLessThan(50);
  });
  it('requires hearing both sides before mediating', () => {
    expect(availableActions(feuding(), content, 'courtyard').some((a) => a.kind === 'feudMediate')).toBe(false);
    const s = { ...feuding(), feud: { id: 'f1', heard: ['kaka', 'beibei'] as CharId[] } };
    expect(availableActions(s, content, 'courtyard').some((a) => a.kind === 'feudMediate')).toBe(true);
  });
  it('resolves with the right method and stays on with the wrong one', () => {
    const s = { ...feuding(), feud: { id: 'f1', heard: ['kaka', 'beibei'] as CharId[] }, coins: 100 };
    expect(applyAction(s, { kind: 'feudMediate', method: 'message' }, content).state.feud).not.toBeNull();
    const ok = applyAction(s, { kind: 'feudMediate', method: 'gift' }, content);
    expect(ok.state.feud).toBeNull();
    expect(ok.state.resolvedFeuds).toContain('f1');
    expect(ok.state.progress.feudDone).toBe(true);
  });
  it('counts the hero as already heard when the hero is in the feud', () => {
    const s = beginDay({ ...newGame('kaka', 3), feud: { id: 'f1', heard: [] } }, content).state;
    expect(s.feud?.heard).toContain('kaka');
  });
  it('keeps a rarely seen character findable while they are in a feud', () => {
    const custom = fixture();
    custom.feuds[0].a = 'panghu';
    const s = beginDay({ ...newGame('doudou', 7), feud: { id: 'f1', heard: [] } }, custom).state;
    expect(whereIs(s, 'panghu', custom)).not.toBeNull();
  });
  it('never lets the police take someone in a feud', () => {
    for (let seed = 1; seed < 30; seed++) {
      const s = { ...fresh('doudou', seed), feud: { id: 'f1', heard: [] as CharId[] }, complaints: 80, complaintTier: 2 };
      const p = fx(s, { complaints: 5 }).signals.find((x) => x.type === 'police') as { who: CharId };
      expect(['kaka', 'beibei']).not.toContain(p.who);
    }
  });
});

describe('schedule', () => {
  it('is stable for the same day and slot', () => {
    const s = fresh();
    expect(whereIs(s, 'kaka', content)).toBe(whereIs(s, 'kaka', content));
  });
  it('hides panghu unless forced', () => {
    const s = fresh();
    expect(whereIs(s, 'panghu', content)).toBeNull();
    expect(whereIs({ ...s, forced: ['panghu'] }, 'panghu', content)).toBe('courtyard');
  });
  it('puts absent characters in the police station', () => {
    const s = { ...fresh(), absent: { taoshu: 5 } };
    expect(whereIs(s, 'taoshu', content)).toBe('police');
    expect(whereIs({ ...s, day: 5 }, 'taoshu', content)).toBe('courtyard');
  });
  it('never lists the hero as an NPC to talk to', () => {
    const acts = availableActions(fresh('kaka'), content, 'gym');
    expect(acts.some((a) => a.kind === 'talk' && a.who === 'kaka')).toBe(false);
    expect(acts.some((a) => a.kind === 'talk' && a.who === 'beibei')).toBe(true);
  });
  it('always offers rest so a tired player cannot get stuck', () => {
    const s = { ...fresh(), energy: 0, coins: 0 };
    for (const room of ['courtyard', 'police', 'lab'] as const) {
      expect(availableActions(s, content, room).some((a) => a.kind === 'rest')).toBe(true);
    }
  });
});

describe('actions and rewards', () => {
  it('applies hero skill to work income', () => {
    const base = applyAction(fresh('doudou'), { kind: 'work' }, content).state.coins;
    const boosted = applyAction(fresh('zhuangzhuang'), { kind: 'work' }, content).state.coins;
    expect(boosted - base).toBe(10);
  });
  it('rotates chatter and raises affinity', () => {
    const first = applyAction(fresh(), { kind: 'talk', who: 'kaka' }, content);
    expect(first.state.affinity.kaka).toBeGreaterThan(0);
    expect(first.state.chatIndex.kaka).toBe(1);
    expect(first.state.progress.talked).toContain('kaka');
  });
  it('asks the UI to start a mini game then records its best score', () => {
    const s = fresh();
    const started = applyAction(s, { kind: 'mini', id: 'kaka' }, content);
    expect(started.startMini).toBe('kaka');
    expect(started.state.slot).toBe(0);
    const done = applyMini(applyMini(started.state, 'kaka', 3, content).state, 'kaka', 1, content);
    expect(done.state.progress.minis.kaka).toBe(3);
    expect(done.state.slot).toBe(2);
  });
  it('rolls each event at most once', () => {
    let s = fresh();
    const seen: string[] = [];
    for (let i = 0; i < 400; i++) {
      const r = rollEvent({ ...s, seed: i }, content);
      if (r.event) { seen.push(r.event.id); s = r.state; }
    }
    expect(seen).toEqual(['e1']);
  });
  it('clamps stats to their ranges', () => {
    const r = fx({ ...fresh(), mood: 95, energy: 5, coins: 3 }, { mood: 50, energy: -50, coins: -9 });
    expect([r.state.mood, r.state.energy, r.state.coins]).toEqual([100, 0, 0]);
  });
});

describe('saves', () => {
  it('round-trips through serialize', () => {
    const s = fresh();
    expect(deserialize(serialize(s))).toEqual(s);
  });
  it('round-trips through the save code with chinese-free text', () => {
    const s = fresh();
    const code = toSaveCode(s);
    expect(code).toMatch(/^[A-Za-z0-9+/=_-]+$/);
    expect(fromSaveCode(code)).toEqual(s);
  });
  it.each(['', 'not json', '{"version":99}', '{"version":1}', 'null', '[]'])('rejects corrupt save %s', (bad) => {
    expect(deserialize(bad)).toBeNull();
  });
  it('rejects a corrupt save code', () => expect(fromSaveCode('@@@')).toBeNull());
});
