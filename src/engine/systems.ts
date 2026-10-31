import { hash } from './rng';
import { CHAR_IDS, type CharId, type Content, type Effects, type GameSignal, type GameState, type StatKey } from './types';

export const JEALOUSY_MAX = 100;
const STATS: StatKey[] = ['energy', 'mood', 'coins', 'happiness', 'jealousy', 'complaints'];
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

const tierOf = (complaints: number) => (complaints >= 85 ? 3 : complaints >= 70 ? 2 : complaints >= 40 ? 1 : 0);

export const feudOf = (s: GameState, content: Content) => (s.feud ? content.feuds.find((f) => f.id === s.feud!.id) ?? null : null);
export function isFeuding(s: GameState, who: CharId, content: Content) {
  const f = feudOf(s, content);
  return !!f && (f.a === who || f.b === who);
}

function policeTarget(s: GameState, content: Content): CharId {
  const free = CHAR_IDS.filter((c) => c !== s.hero && !isFeuding(s, c, content) && !s.forced.includes(c) && !((s.absent[c] ?? 0) > s.day));
  if (free.includes('taoshu') && hash(s.seed, s.day, 'cop') % 2 === 0) return 'taoshu';
  return free[hash(s.seed, s.day, 'cop2') % free.length];
}

/** The single way stats change, so jealousy and complaint triggers can never be bypassed. */
export function applyEffects(state: GameState, fx: Effects, content: Content): { state: GameState; signals: GameSignal[] } {
  const s = structuredClone(state);
  const signals: GameSignal[] = [];
  const skill = content.characters[s.hero].skill;
  for (const key of STATS) {
    let v = fx[key];
    if (!v) continue;
    if (key === 'jealousy' && v > 0) v = Math.round(v * (skill.jealousyScale ?? 1));
    if (key === 'complaints' && v > 0) v = Math.round(v * (skill.complaintScale ?? 1));
    if (key === 'mood' && v > 0) v += skill.moodGain ?? 0;
    s[key] = key === 'coins' ? Math.max(0, s.coins + v) : clamp(s[key] + v, 0, key === 'complaints' || key === 'jealousy' ? 999 : 100);
  }
  for (const [who, v] of Object.entries(fx.affinity ?? {})) {
    s.affinity[who as CharId] = clamp(s.affinity[who as CharId] + (v ?? 0), 0, 100);
  }
  if (s.jealousy >= JEALOUSY_MAX) {
    s.jealousy = 30; s.brawls += 1;
    signals.push({ type: 'brawl' });
  }
  if (s.complaints >= 100) {
    s.buildingNo += 1; s.bans += 1; s.complaints = 30; s.slot = 3;
    s.happiness = clamp(s.happiness - 10, 0, 100); s.complaintTier = 0;
    signals.push({ type: 'ban', buildingNo: s.buildingNo });
    return { state: s, signals };
  }
  const tier = tierOf(s.complaints);
  if (tier > s.complaintTier) {
    if (tier === 1) signals.push({ type: 'note' });
    if (tier === 2) signals.push({ type: 'warning' });
    if (tier === 3) {
      const who = policeTarget(s, content);
      s.absent[who] = s.day + 2;
      signals.push({ type: 'police', who });
    }
  }
  s.complaintTier = tier;
  return { state: s, signals };
}
