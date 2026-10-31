import { CHAR_IDS, type GameState } from './types';

export const serialize = (s: GameState) => JSON.stringify(s);

export function deserialize(text: string): GameState | null {
  try {
    const v = JSON.parse(text);
    const ok = v && v.version === 1 && CHAR_IDS.includes(v.hero) && Number.isFinite(v.day) && Number.isFinite(v.slot)
      && v.affinity && v.progress && v.stars;
    return ok ? (v as GameState) : null;
  } catch {
    return null;
  }
}
export const toSaveCode = (s: GameState) => btoa(serialize(s));
export function fromSaveCode(code: string): GameState | null {
  try {
    return deserialize(atob(code.trim()));
  } catch {
    return null;
  }
}
