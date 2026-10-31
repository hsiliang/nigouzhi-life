import { roomArt } from '../art/rooms';
import { content } from '../content';
import { npcsIn } from '../engine/day';
import { isFeuding } from '../engine/systems';
import type { GameState, RoomId } from '../engine/types';
import { ROOM_IDS } from '../engine/types';
import { audio } from '../audio/audio';
import { clear, h, sprite, wait } from './dom';
import { hintRooms } from './hud';

const WALK_MS = 620;
const FACES_RIGHT = new Set(['kaka']);

export class Building {
  el = h('div', { class: 'building', 'data-testid': 'building' });
  private hero = h('div', { class: 'hero-token' });
  private heroImg = h('img', { alt: '' });
  private rooms = new Map<RoomId, HTMLElement>();
  private here: RoomId = 'courtyard';
  onRoom: (room: RoomId) => void = () => {};

  constructor(private s: GameState) {
    for (const id of ROOM_IDS) {
      const room = content.rooms[id];
      const btn = h('button', { class: `room room-${id}`, 'data-room': id, onClick: () => this.onRoom(id) },
        h('div', { class: 'room-art', html: roomArt[id] }),
        h('div', { class: 'room-people' }),
        h('span', { class: 'room-name' }, room.name));
      this.rooms.set(id, btn);
      this.el.append(btn);
    }
    this.heroImg.src = sprite(s.hero);
    this.hero.append(h('span', { class: 'you' }, '你'), this.heroImg);
    this.el.append(this.hero);
    new ResizeObserver(() => this.place(false)).observe(this.el);
  }

  update(s: GameState) {
    this.s = s;
    const hints = hintRooms(s);
    for (const id of ROOM_IDS) {
      const room = this.rooms.get(id)!;
      room.classList.toggle('hint', hints.has(id));
      const box = room.querySelector('.room-people')!;
      clear(box);
      const npcs = npcsIn(s, id, content);
      npcs.forEach((who, i) => {
        const left = ((i + 1) / (npcs.length + 1)) * 100;
        box.append(h('img', {
          class: `npc${isFeuding(s, who, content) ? ' feud' : ''}`, src: sprite(who, isFeuding(s, who, content) ? 'back' : 'front'),
          alt: content.characters[who].name, title: content.characters[who].name, style: `left:${left}%;animation-delay:${i * .3}s`,
        }));
      });
      if (id === 'courtyard' && s.tenant) box.append(h('span', { class: 'tenant-token', style: `--look:${content.tenants.find((t) => t.id === s.tenant!.id)!.look}` }, '🧳'));
    }
    this.el.dataset.building = String(s.buildingNo);
  }

  private spot(room: RoomId) {
    const b = this.el.getBoundingClientRect();
    const r = this.rooms.get(room)!.getBoundingClientRect();
    return { x: r.left - b.left + r.width * .5, y: r.bottom - b.top - 4 };
  }

  private place(animated: boolean) {
    const p = this.spot(this.here);
    this.hero.style.transition = animated ? `transform ${WALK_MS}ms ease-in-out` : 'none';
    this.hero.style.transform = `translate(${p.x}px, ${p.y}px)`;
  }

  async walkTo(room: RoomId) {
    if (room === this.here) return;
    const from = this.spot(this.here), to = this.spot(room);
    this.here = room;
    this.heroImg.src = sprite(this.s.hero, Math.abs(to.y - from.y) > 40 && to.y < from.y ? 'back' : 'side');
    const facesRight = FACES_RIGHT.has(this.s.hero);
    this.heroImg.style.transform = (to.x > from.x) === facesRight ? 'none' : 'scaleX(-1)';
    this.hero.classList.add('walking');
    audio.sfx('step');
    this.place(true);
    await wait(WALK_MS);
    this.hero.classList.remove('walking');
    this.heroImg.src = sprite(this.s.hero);
    this.heroImg.style.transform = 'none';
  }
}
