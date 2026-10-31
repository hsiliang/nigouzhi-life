import { deserialize, serialize } from '../engine/save';
import type { CharId, GameState } from '../engine/types';
import type { Lang } from '../i18n';

const SAVE = 'nigouzhi.save.v1', PREFS = 'nigouzhi.prefs.v1', META = 'nigouzhi.meta.v1';
const memory = new Map<string, string>();

/** Storage can throw in private mode or embedded browsers; fall back to memory so the game keeps running. */
function read(key: string): string | null {
  try { return localStorage.getItem(key) ?? memory.get(key) ?? null; } catch { return memory.get(key) ?? null; }
}
function write(key: string, value: string) {
  memory.set(key, value);
  try { localStorage.setItem(key, value); } catch { /* kept in memory */ }
}
function remove(key: string) {
  memory.delete(key);
  try { localStorage.removeItem(key); } catch { /* nothing to remove */ }
}

export interface Prefs { voice: boolean; music: boolean; sfx: boolean; lang: Lang | null; asked: boolean }
export interface Meta { endings: CharId[]; bestBans: number; tenants: string[] }

function json<T>(key: string, fallback: T): T {
  try { return { ...fallback, ...JSON.parse(read(key) ?? '{}') }; } catch { return fallback; }
}
export const loadPrefs = () => json<Prefs>(PREFS, { voice: true, music: true, sfx: true, lang: null, asked: false });
export const savePrefs = (p: Prefs) => write(PREFS, JSON.stringify(p));
export const loadMeta = () => json<Meta>(META, { endings: [], bestBans: 0, tenants: [] });
export const saveMeta = (m: Meta) => write(META, JSON.stringify(m));
export const saveGame = (s: GameState) => write(SAVE, serialize(s));
export const clearGame = () => remove(SAVE);
export function loadGame(): GameState | null {
  const raw = read(SAVE);
  return raw ? deserialize(raw) : null;
}
