import { npcsIn, goalStates } from '../engine/day';
import { content } from '../content';
import { chapterTitles } from '../content/signals';
import type { DayDef, GameState, RoomId } from '../engine/types';
import { ROOM_IDS } from '../engine/types';
import { boss } from './boss';
import { clear, h } from './dom';

const SLOTS = ['早上', '下午', '晚上', '深夜'];

function meter(label: string, value: number, cls: string) {
  return h('div', { class: `meter ${cls}` }, h('span', { class: 'meter-label' }, label),
    h('span', { class: 'meter-track' }, h('i', { style: `width:${Math.min(100, value)}%` })));
}

export function renderHud(host: HTMLElement, s: GameState, onMenu: () => void) {
  const def = content.days[s.day - 1];
  clear(host);
  host.append(
    h('div', { class: 'hud-top' },
      h('button', { class: 'icon-btn', onClick: onMenu, 'aria-label': '選單', 'data-testid': 'menu' }, '☰'),
      h('div', { class: 'hud-title' },
        h('b', {}, `第 ${s.day} 天・${SLOTS[Math.min(s.slot, 3)]}`),
        h('small', {}, `第 ${def.chapter} 章 ${chapterTitles[def.chapter - 1]}`)),
      h('div', { class: 'coins' }, '🪙 ', s.coins),
      h('button', { class: 'boss-btn', onClick: () => boss.toggle(), 'data-testid': 'boss-btn' }, '老闆來了')),
    h('div', { class: 'meters' },
      meter('精力', s.energy, 'm-energy'), meter('心情', s.mood, 'm-mood'), meter('幸福', s.happiness, 'm-happy'),
      meter('嫉妒', s.jealousy, 'm-jealous'), meter('投訴', s.complaints, 'm-complain')),
    goalStrip(s, def));
}

function goalStrip(s: GameState, def: DayDef) {
  const [main, a, b] = goalStates(s, def);
  const row = (done: boolean, text: string, star: string) => h('li', { class: done ? 'done' : '' }, h('span', { class: 'tick' }, done ? '✔' : star), text);
  return h('ul', { class: 'goals' }, row(main, def.goalText, '★'), row(a, def.bonus[0].text, '☆'), row(b, def.bonus[1].text, '☆'));
}

/** Rooms worth a glow: where the day's unmet goals can be advanced. */
export function hintRooms(s: GameState): Set<RoomId> {
  const def = content.days[s.day - 1];
  const out = new Set<RoomId>();
  const states = goalStates(s, def);
  const goals = [def.goal, def.bonus[0].goal, def.bonus[1].goal];
  goals.forEach((g, i) => {
    if (states[i]) return;
    if (g.k === 'talk') ROOM_IDS.forEach((r) => { if (npcsIn(s, r, content).includes(g.who)) out.add(r); });
    if (g.k === 'mini') ROOM_IDS.forEach((r) => { if (content.rooms[r].owner === g.id) out.add(r); });
    if (g.k === 'clean' || g.k === 'tenant') out.add('courtyard');
    if (g.k === 'feud' && s.feud) {
      ROOM_IDS.forEach((r) => { if (npcsIn(s, r, content).some((w) => { const f = content.feuds.find((x) => x.id === s.feud!.id)!; return !s.feud!.heard.includes(w) && (w === f.a || w === f.b); })) out.add(r); });
      if (out.size === 0) { out.add('courtyard'); out.add('rooftop'); }
    }
  });
  return out;
}
