import { chance, hash } from './rng';
import { emptyProgress } from './state';
import { applyEffects, feudOf, isFeuding } from './systems';
import { CHAR_IDS, type Action, type CharId, type Content, type DayDef, type DayResult, type Effects, type GameEvent, type GameSignal, type GameState, type Goal, type Line, type MiniId, type RoomId, type StepResult, type TenantType, type Verdict } from './types';

const CHAPTER_STARS = 9;
const GIFT_COST = 15, APOLOGY_COST = 20, MEDIATE_GIFT_COST = 30;
const say = (text: string): Line => ({ who: 'narrator', text });
const dayDef = (s: GameState, c: Content) => c.days[s.day - 1];

function baseRoom(s: GameState, who: CharId, c: Content): RoomId | null {
  if ((s.absent[who] ?? 0) > s.day) return 'police';
  const ch = c.characters[who];
  if (!s.forced.includes(who) && !isFeuding(s, who, c) && !chance(ch.presence ?? 1, s.seed, s.day, who, 'here')) return null;
  return ch.schedule[Math.min(s.slot, 2)];
}

/** Where an NPC is right now; null when off-screen. The hero is never an NPC. */
export function whereIs(s: GameState, who: CharId, c: Content): RoomId | null {
  if (who === s.hero) return null;
  const room = baseRoom(s, who, c);
  const f = feudOf(s, c);
  if (f && f.b === who && f.a !== s.hero && room === baseRoom(s, f.a, c)) return room === 'courtyard' ? 'rooftop' : 'courtyard';
  return room;
}

export const npcsIn = (s: GameState, room: RoomId, c: Content) => CHAR_IDS.filter((id) => whereIs(s, id, c) === room);

export function availableActions(s: GameState, c: Content, room: RoomId): Action[] {
  if (s.slot >= 3) return [];
  const out: Action[] = [];
  const npcs = npcsIn(s, room, c);
  const r = c.rooms[room];
  const f = feudOf(s, c);
  for (const who of npcs) {
    if (room === 'police') { out.push({ kind: 'talk', who }); continue; }
    if (f && s.feud && (f.a === who || f.b === who) && !s.feud.heard.includes(who)) out.push({ kind: 'feudHear', who });
    out.push({ kind: 'talk', who });
    if (s.tenant) out.push({ kind: 'tenantAsk', helper: who });
    if (s.coins >= GIFT_COST) out.push({ kind: 'gift', who });
  }
  if (r.work && s.energy >= 10) out.push({ kind: 'work', room });
  if (r.owner && s.energy >= 10) out.push({ kind: 'mini', id: r.owner });
  if (room === 'courtyard') {
    if (s.energy >= 5) out.push({ kind: 'clean' });
    if (s.coins >= APOLOGY_COST) out.push({ kind: 'apologize' });
    if (s.tenant) for (const verdict of ['welcome', 'watch', 'evict'] as Verdict[]) out.push({ kind: 'tenantDecide', verdict });
  }
  if (f && s.feud && [f.a, f.b].every((w) => s.feud!.heard.includes(w))) {
    if (room === 'courtyard') {
      out.push({ kind: 'feudMediate', method: 'message' });
      if (s.coins >= MEDIATE_GIFT_COST) out.push({ kind: 'feudMediate', method: 'gift' });
    }
    if (room === 'rooftop') out.push({ kind: 'feudMediate', method: 'sunset' });
  }
  out.push({ kind: 'rest' });
  return out;
}

function goalMet(s: GameState, g: Goal): boolean {
  switch (g.k) {
    case 'talk': return g.who === s.hero || s.progress.talked.includes(g.who);
    case 'mini': return (s.progress.minis[g.id] ?? -1) >= g.min;
    case 'stat': return g.op === '>=' ? s[g.stat] >= g.value : s[g.stat] <= g.value;
    case 'affinity': return g.who === s.hero || s.affinity[g.who] >= g.min;
    case 'tenant': return s.progress.tenantDone;
    case 'feud': return s.progress.feudDone;
    case 'work': return s.progress.worked;
    case 'clean': return s.progress.cleaned;
  }
}
export function goalStates(s: GameState, def: DayDef): boolean[] {
  return [goalMet(s, def.goal), goalMet(s, def.bonus[0].goal), goalMet(s, def.bonus[1].goal)];
}
export function starsFor(s: GameState, def: DayDef): number {
  const [main, a, b] = goalStates(s, def);
  return main ? 1 + Number(a) + Number(b) : 0;
}

/** Applies the day's scripted setup exactly once; a save reloaded mid-day skips it. */
export function beginDay(state: GameState, c: Content): StepResult {
  const def = c.days[state.day - 1];
  if (state.started) return { state, lines: [], signals: [] };
  let s = structuredClone(state);
  s.started = true; s.slot = 0; s.progress = emptyProgress(); s.forced = def.force ?? [];
  const lines: Line[] = [...def.intro];
  const signals: GameSignal[] = [];
  for (const who of s.forced) delete s.absent[who];
  for (const [who, n] of Object.entries(def.absent ?? {})) if (who !== s.hero) s.absent[who as CharId] = s.day + (n ?? 0);
  if (def.tenant) {
    if (s.seenTenants.includes(def.tenant)) s.progress.tenantDone = true;
    else if (!s.tenant) {
      s.tenant = { id: def.tenant, clues: 0 };
      lines.push(...c.tenants.find((t) => t.id === def.tenant)!.intro);
    }
  }
  if (def.feud) {
    if (s.resolvedFeuds.includes(def.feud)) s.progress.feudDone = true;
    else if (!s.feud) {
      s.feud = { id: def.feud, heard: [] };
      lines.push(...c.feuds.find((f) => f.id === def.feud)!.cause);
    }
  }
  const f = feudOf(s, c);
  if (f) { delete s.absent[f.a]; delete s.absent[f.b]; }
  if (f && s.feud && (f.a === s.hero || f.b === s.hero) && !s.feud.heard.includes(s.hero)) s.feud.heard.push(s.hero);
  if (s.day > 5 && s.hero !== 'taoshu' && !s.forced.includes('taoshu') && !isFeuding(s, 'taoshu', c)
    && !((s.absent.taoshu ?? 0) > s.day) && chance(0.06, s.seed, s.day, 'vanish')) {
    s.absent.taoshu = s.day + 2;
    lines.push(say('桃叔的房門上貼了一張紙：「人已被帶走，有事燒紙。」'));
  }
  if (def.chapter !== c.days[Math.max(0, s.day - 2)].chapter || s.day === 1) {
    const aside = c.heroAsides[s.hero][def.chapter - 1];
    if (aside) lines.push({ who: s.hero, text: aside });
  }
  if (def.scriptedBan && !s.seenEvents.includes(`ban-${s.day}`)) {
    s.seenEvents.push(`ban-${s.day}`);
    s.buildingNo += 1; s.bans += 1; s.complaints = 30; s.complaintTier = 0;
    signals.push({ type: 'ban', buildingNo: s.buildingNo });
  }
  if (def.startFx) {
    const r = applyEffects(s, def.startFx, c);
    s = r.state; signals.push(...r.signals);
  }
  return { state: s, lines, signals };
}

function gain(s: GameState, fx: Effects, c: Content, lines: Line[], signals: GameSignal[] = [], advance = true): StepResult {
  const r = applyEffects(s, fx, c);
  if (advance && r.state.slot < 3) r.state.slot += 1;
  return { state: r.state, lines, signals: [...signals, ...r.signals] };
}

function verdictOutcome(type: TenantType, v: Verdict): { correct: boolean; fx: Effects } {
  if (type === 'scam') return v === 'evict' ? { correct: true, fx: { happiness: 8, coins: 30 } } : { correct: false, fx: { happiness: -8, coins: -60 } };
  if (type === 'ad') return v === 'evict' ? { correct: true, fx: { happiness: 5, coins: 10 } } : { correct: false, fx: { complaints: v === 'welcome' ? 12 : 8, coins: v === 'welcome' ? -20 : 0 } };
  if (type === 'silent') return v === 'welcome' ? { correct: false, fx: { mood: -2 } } : { correct: true, fx: { happiness: 3 } };
  if (v === 'evict') return { correct: false, fx: { happiness: -8, mood: -5 } };
  return { correct: true, fx: v === 'welcome' ? { happiness: 6, mood: 5 } : { happiness: 2 } };
}

export function applyAction(state: GameState, a: Action, c: Content): StepResult {
  const s = structuredClone(state);
  const skill = c.characters[s.hero].skill;
  switch (a.kind) {
    case 'talk': {
      const pool = c.chatter[a.who];
      const i = s.chatIndex[a.who] ?? 0;
      s.chatIndex[a.who] = i + 1;
      if (!s.progress.talked.includes(a.who)) s.progress.talked.push(a.who);
      const talk = c.characters[a.who].talkFx ?? {};
      return gain(s, { ...talk, mood: 2 + (talk.mood ?? 0), energy: -3, affinity: { [a.who]: 5 + (skill.talkAffinity ?? 0) } }, c, pool[i % pool.length]);
    }
    case 'work': {
      const room = a.room ? c.rooms[a.room] : Object.values(c.rooms).find((r) => r.work)!;
      const job = room.work!;
      s.progress.worked = true;
      return gain(s, { ...job.fx, coins: (job.fx.coins ?? 0) + (skill.workCoins ?? 0) }, c, job.lines);
    }
    case 'rest':
      return gain(s, { energy: 30 + (skill.restEnergy ?? 0), mood: 5 }, c, [say('你找了個角落放空，假裝自己在思考人生。')]);
    case 'clean':
      s.progress.cleaned = true;
      return gain(s, { complaints: -12, happiness: 2, energy: -8 }, c, [say('你把中庭掃了一遍，鄰居的白眼少了一點。')]);
    case 'apologize':
      return gain(s, { coins: -APOLOGY_COST, complaints: -20 }, c, [say('你提著伴手禮挨家挨戶道歉，鄰居勉強收下了，並表示下不為例。')]);
    case 'gift':
      return gain(s, { coins: -GIFT_COST, affinity: { [a.who]: 10 } }, c, [{ who: a.who, text: '給我的？你購置的，這麼客氣。', fx: 'heart' }]);
    case 'mini':
      return { state: s, lines: [], signals: [], startMini: a.id };
    case 'tenantAsk': {
      const t = c.tenants.find((x) => x.id === s.tenant!.id)!;
      const lines = skill.tenantInsight ? t.clues : [t.clues[s.tenant!.clues % t.clues.length]];
      s.tenant!.clues += 1;
      return gain(s, { energy: -3, affinity: { [a.helper]: 2 } }, c, lines);
    }
    case 'tenantDecide': {
      const t = c.tenants.find((x) => x.id === s.tenant!.id)!;
      const o = verdictOutcome(t.type, a.verdict);
      s.tenant = null; s.seenTenants.push(t.id); s.progress.tenantDone = o.correct;
      const sig: GameSignal = { type: 'tenantResult', correct: o.correct, verdict: a.verdict, tenantType: t.type };
      return gain(s, o.fx, c, a.verdict === 'evict' ? t.caught : [], [sig], false);
    }
    case 'feudHear': {
      const f = feudOf(s, c)!;
      s.feud!.heard.push(a.who);
      return gain(s, { energy: -3 }, c, a.who === f.a ? f.sideA : f.sideB);
    }
    case 'feudMediate': {
      const f = feudOf(s, c)!;
      const cost = a.method === 'gift' ? { coins: -MEDIATE_GIFT_COST } : {};
      if (a.method !== f.best) return gain(s, { ...cost, mood: -3 }, c, f.wrong);
      s.feud = null; s.resolvedFeuds.push(f.id); s.progress.feudDone = true;
      return gain(s, { ...cost, happiness: 6, affinity: { [f.a]: 8, [f.b]: 8 } }, c, f.peace, [{ type: 'feudResolved', id: f.id }]);
    }
  }
}

export function applyMini(state: GameState, id: MiniId, rawScore: number, c: Content): StepResult {
  const s = structuredClone(state);
  const score = Math.max(0, Math.min(3, Math.round(rawScore)));
  s.progress.minis[id] = Math.max(s.progress.minis[id] ?? -1, score);
  const skill = c.characters[s.hero].skill;
  return gain(s, { coins: score * 10 + (score ? skill.miniCoins ?? 0 : 0), mood: score * 3, energy: -8, affinity: { [id]: score * 2 } }, c, []);
}

export function rollEvent(state: GameState, c: Content): { state: GameState; event: GameEvent | null; signals: GameSignal[] } {
  if (state.day < 2 || !chance(0.3, state.seed, state.day, state.slot, 'ev')) return { state, event: null, signals: [] };
  const pool = c.events.filter((e) => !state.seenEvents.includes(e.id) && (e.minDay ?? 0) <= state.day);
  if (!pool.length) return { state, event: null, signals: [] };
  const event = pool[hash(state.seed, state.day, state.slot, 'which') % pool.length];
  const r = applyEffects(state, event.fx ?? {}, c);
  r.state.seenEvents.push(event.id);
  return { state: r.state, event, signals: r.signals };
}

export function applyChoice(state: GameState, event: GameEvent, index: number, c: Content) {
  const choice = event.choices![index];
  return { ...applyEffects(state, choice.fx ?? {}, c), lines: choice.lines };
}

const chapterDays = (ch: number, c: Content) => c.days.filter((d) => d.chapter === ch);

export function chapterStars(s: GameState, ch: number, c: Content) {
  return chapterDays(ch, c).reduce((sum, d) => sum + (s.stars[d.day] ?? 0), 0);
}
export const chapterUnlocked = (s: GameState, ch: number, c: Content) => ch === 1 || chapterStars(s, ch - 1, c) >= CHAPTER_STARS;

function nextAfterPass(s: GameState, def: DayDef, c: Content) {
  const days = chapterDays(def.chapter, c);
  const last = days[days.length - 1].day;
  if (s.day < last && s.day >= s.maxDay) return { nextDay: s.day + 1, replaying: false, finished: false };
  if (chapterStars(s, def.chapter, c) >= CHAPTER_STARS) {
    if (last >= c.days.length) return { nextDay: s.day, replaying: false, finished: true };
    return { nextDay: last + 1, replaying: false, finished: false };
  }
  const lowest = days.reduce((low, d) => ((s.stars[d.day] ?? 0) < (s.stars[low.day] ?? 0) ? d : low), days[0]);
  return { nextDay: lowest.day, replaying: true, finished: false };
}

export function endDay(state: GameState, c: Content): DayResult {
  const def = dayDef(state, c);
  const stars = starsFor(state, def);
  const goals = goalStates(state, def);
  const passed = stars > 0;
  const s = structuredClone(state);
  s.stars[s.day] = Math.max(s.stars[s.day] ?? 0, stars);
  s.maxDay = Math.max(s.maxDay, s.day);
  if (s.feud) s.happiness = Math.max(0, s.happiness - 4);
  if (s.tenant && c.tenants.find((t) => t.id === s.tenant!.id)?.type === 'scam') s.coins = Math.max(0, s.coins - 10);
  s.energy = Math.min(100, s.energy + 50);
  s.jealousy = Math.min(95, s.jealousy + 3);
  s.complaints = Math.min(95, s.complaints + 2);
  const flow = passed ? nextAfterPass(s, def, c) : { nextDay: s.day, replaying: false, finished: false };
  const lines: Line[] = passed ? [...def.outro] : [say('今天的目標沒完成。壯壯拍拍你：「沒事，明天的你會替今天的你擦屁股。」')];
  if (flow.replaying) lines.push(say('這一章的星星還不夠 9 顆，回去把表現最差的一天重過吧。'));
  if (flow.finished) { s.finished = true; lines.push(...c.endings[s.hero]); }
  s.day = flow.nextDay; s.started = false; s.slot = 0;
  return { state: s, stars, passed, goals, lines, ...flow };
}
