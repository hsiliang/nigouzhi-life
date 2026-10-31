/** Deterministic 32-bit hash so schedules and rolls survive save and reload. */
export function hash(...parts: (string | number)[]): number {
  let h = 2166136261;
  for (const ch of parts.join('|')) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return h >>> 0;
}
export const chance = (p: number, ...parts: (string | number)[]) => hash(...parts) / 2 ** 32 < p;
export const pick = <T,>(items: readonly T[], ...parts: (string | number)[]): T => items[hash(...parts) % items.length];
