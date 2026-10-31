import { describe, expect, it } from 'vitest';
import { content } from '../src/content';
import { voiceData } from '../src/content/voices';
import { CHAR_IDS, type Goal } from '../src/engine/types';

const chars = (lines: { text: string }[]) => lines.reduce((n, l) => n + [...l.text].length, 0);
const goals = (): Goal[] => content.days.flatMap((d) => [d.goal, d.bonus[0].goal, d.bonus[1].goal]);

describe('content volume', () => {
  it('has forty consecutive days in eight chapters of five', () => {
    expect(content.days.map((d) => d.day)).toEqual(Array.from({ length: 40 }, (_, i) => i + 1));
    expect(content.days.map((d) => d.chapter)).toEqual(Array.from({ length: 40 }, (_, i) => Math.ceil((i + 1) / 5)));
  });
  it('has at least 14,000 characters of main story', () => {
    expect(content.days.reduce((n, d) => n + chars(d.intro) + chars(d.outro), 0)).toBeGreaterThanOrEqual(14000);
  });
  it.each(CHAR_IDS)('%s has at least 30 chatter lines', (id) => {
    expect(content.chatter[id].length).toBeGreaterThanOrEqual(30);
  });
  it('has at least 80 random events with unique ids', () => {
    expect(content.events.length).toBeGreaterThanOrEqual(80);
    expect(new Set(content.events.map((e) => e.id)).size).toBe(content.events.length);
  });
  it.each(CHAR_IDS)('%s has a personal ending of at least 300 characters', (id) => {
    expect(chars(content.endings[id])).toBeGreaterThanOrEqual(300);
  });
  it('has at least 12 tenants of every type and 8 feuds', () => {
    expect(content.tenants.length).toBeGreaterThanOrEqual(12);
    expect(new Set(content.tenants.map((t) => t.type)).size).toBe(4);
    expect(content.feuds.length).toBeGreaterThanOrEqual(8);
  });
  it.each(CHAR_IDS)('%s has a hero aside for each chapter', (id) => {
    expect(content.heroAsides[id]).toHaveLength(8);
  });
});

describe('content integrity', () => {
  it('keeps character background out of the game data', () => {
    for (const c of Object.values(content.characters)) {
      expect(Object.keys(c)).not.toEqual(expect.arrayContaining(['bio']));
      for (const key of ['age', 'home', 'job']) expect(c).not.toHaveProperty(key);
    }
  });
  it('only asks for mini games that some room offers', () => {
    const owners = new Set(Object.values(content.rooms).map((r) => r.owner));
    for (const g of goals()) if (g.k === 'mini') expect(owners.has(g.id)).toBe(true);
    for (const id of CHAR_IDS) expect(owners.has(id)).toBe(true);
  });
  it('schedules a work action or owner for every room but the police station', () => {
    for (const r of Object.values(content.rooms)) if (r.id !== 'police') expect(r.work).toBeTruthy();
  });
  it('uses every tenant and feud on exactly one day', () => {
    for (const t of content.tenants) expect(content.days.filter((d) => d.tenant === t.id)).toHaveLength(1);
    for (const f of content.feuds) expect(content.days.filter((d) => d.feud === f.id)).toHaveLength(1);
  });
  it('gives feud and tenant goals only to days that have one', () => {
    for (const d of content.days) for (const g of [d.goal, d.bonus[0].goal, d.bonus[1].goal]) {
      if (g.k === 'tenant') expect(d.tenant).toBeTruthy();
      if (g.k === 'feud') expect(d.feud).toBeTruthy();
    }
  });
  it('forces rare characters onto days that require talking to them', () => {
    for (const d of content.days) for (const g of [d.goal, d.bonus[0].goal, d.bonus[1].goal]) {
      if (g.k === 'talk' && g.who === 'panghu') expect(d.force).toContain('panghu');
    }
  });
  it('stays inside the agreed taste line', () => {
    const banned = ['做愛', '性交', '陰莖', '陰道', '射精', '高潮', '裸照', '人老師長得', '白痴媽媽'];
    const all = JSON.stringify(content);
    for (const w of banned) expect(all).not.toContain(w);
  });
  it('never names the off-screen people as speakers', () => {
    const allowed = new Set([...CHAR_IDS, 'narrator', 'tenant', 'neighbor', 'police']);
    const walk = (v: unknown): void => {
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') {
        const o = v as Record<string, unknown>;
        if (typeof o.who === 'string' && typeof o.text === 'string') expect(allowed.has(o.who)).toBe(true);
        Object.values(o).forEach(walk);
      }
    };
    walk(content);
  });
});

describe('voice lines', () => {
  const spoken = new Set<string>();
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      if (typeof o.who === 'string' && typeof o.text === 'string') spoken.add(`${o.who}|${o.text}`);
      Object.values(o).forEach(walk);
    }
  };
  walk(content);
  it.each(CHAR_IDS)('%s has 10 to 15 voiced lines that all exist in the script', (id) => {
    expect(voiceData[id].length).toBeGreaterThanOrEqual(10);
    expect(voiceData[id].length).toBeLessThanOrEqual(15);
    expect(voiceData[id].filter((t) => !spoken.has(`${id}|${t}`))).toEqual([]);
  });
});
