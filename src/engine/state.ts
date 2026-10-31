import { CHAR_IDS, type CharId, type DayProgress, type GameState } from './types';

export const emptyProgress = (): DayProgress => ({ talked: [], minis: {}, tenantDone: false, feudDone: false, worked: false, cleaned: false });

export function newGame(hero: CharId, seed: number): GameState {
  return {
    version: 1, hero, seed, day: 1, maxDay: 1, slot: 0, started: false,
    energy: 80, mood: 60, coins: 50, happiness: 40, jealousy: 10, complaints: 0,
    complaintTier: 0, buildingNo: 1, bans: 0, brawls: 0,
    affinity: Object.fromEntries(CHAR_IDS.map((c) => [c, 0])) as Record<CharId, number>,
    chatIndex: {}, stars: {}, progress: emptyProgress(), absent: {}, forced: [],
    tenant: null, feud: null, resolvedFeuds: [], seenTenants: [], seenEvents: [], album: [], finished: false,
  };
}
