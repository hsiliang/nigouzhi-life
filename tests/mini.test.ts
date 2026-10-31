import { describe, expect, it } from 'vitest';
import { games } from '../src/mini/games';
import { CHAR_IDS } from '../src/engine/types';

describe('mini games', () => {
  it.each(CHAR_IDS)('%s has a game of 30 to 45 seconds', (id) => {
    const g = games[id];
    expect(g.id).toBe(id);
    expect(g.duration).toBeGreaterThanOrEqual(30);
    expect(g.duration).toBeLessThanOrEqual(45);
  });
  it.each(CHAR_IDS)('%s has ascending star thresholds and rules', (id) => {
    const [a, b, c] = games[id].thresholds;
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
    expect(games[id].rules.length).toBeGreaterThan(8);
  });
});
