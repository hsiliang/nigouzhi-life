import { audio } from '../audio/audio';
import { content } from '../content';
import type { MiniId } from '../engine/types';
import { boss } from '../ui/boss';
import { h, sprite, wait } from '../ui/dom';
import { games } from './games';

export interface MiniCtl {
  /** Resolves on the next animation frame once the game is not paused; gives elapsed seconds since last call. */
  frame(): Promise<number>;
  score(n: number): void;
  readonly seconds: number;
  readonly duration: number;
  readonly over: boolean;
}
export interface MiniGame {
  id: MiniId; title: string; rules: string; duration: number;
  /** thresholds[n] is the raw score needed for n+1 stars. */
  thresholds: [number, number, number];
  run(host: HTMLElement, ctl: MiniCtl): Promise<void>;
}

class Controller implements MiniCtl {
  private last = performance.now();
  private raw = 0;
  seconds = 0;
  constructor(readonly duration: number, private onScore: (n: number) => void, private onTick: (left: number) => void) {}
  get over() { return this.seconds >= this.duration; }
  get paused() { return boss.active || document.hidden; }
  score(n: number) { this.raw = Math.max(0, this.raw + n); this.onScore(this.raw); }
  get total() { return this.raw; }
  frame() {
    return new Promise<number>((resolve) => {
      const step = (now: number) => {
        if (this.paused) { this.last = now; requestAnimationFrame(step); return; }
        const dt = Math.min(.1, (now - this.last) / 1000);
        this.last = now;
        this.seconds += dt;
        this.onTick(Math.max(0, this.duration - this.seconds));
        resolve(dt);
      };
      requestAnimationFrame(step);
    });
  }
}

/** `?fastmini` shortens games so end-to-end tests can run them all. */
const durationOf = (g: MiniGame) => (location.search.includes('fastmini') ? 1 : g.duration);
const starsOf = (g: MiniGame, raw: number) => g.thresholds.filter((t) => raw >= t).length;

/** Full flow: rules card, countdown, play, result. Resolves with 0-3 stars. */
export async function playMini(host: HTMLElement, id: MiniId): Promise<number> {
  const game = games[id];
  const overlay = h('div', { class: 'mini', 'data-testid': 'mini' });
  host.append(overlay);
  await new Promise<void>((resolve) => {
    overlay.append(h('div', { class: 'mini-card' },
      h('img', { class: 'mini-face', src: sprite(id), alt: '' }),
      h('h2', {}, game.title), h('p', {}, game.rules),
      h('p', { class: 'mini-goal' }, `目標：${game.thresholds[0]} 分一星、${game.thresholds[2]} 分三星`),
      h('button', { class: 'btn primary', 'data-testid': 'mini-start', onClick: () => { audio.sfx('tap'); resolve(); } }, '開始')));
  });
  overlay.textContent = '';
  audio.bgm('mini');
  const scoreEl = h('b', {}, '0'), timeEl = h('b', {}, String(game.duration));
  const bar = h('div', { class: 'mini-bar' }, h('span', {}, '分數 ', scoreEl), h('span', {}, content.characters[id].name), h('span', {}, '剩 ', timeEl, ' 秒'));
  const field = h('div', { class: 'mini-field', 'data-testid': 'mini-field' });
  overlay.append(bar, field);
  const ctl = new Controller(durationOf(game), (n) => { scoreEl.textContent = String(n); }, (left) => { timeEl.textContent = String(Math.ceil(left)); });
  await game.run(field, ctl);
  const stars = starsOf(game, ctl.total);
  audio.sfx(stars ? 'star' : 'bad');
  overlay.textContent = '';
  await new Promise<void>((resolve) => {
    overlay.append(h('div', { class: 'mini-card' },
      h('h2', {}, stars ? '過關！' : '可惜！'), h('p', { class: 'mini-stars' }, '★'.repeat(stars) + '☆'.repeat(3 - stars)),
      h('p', {}, `得分 ${ctl.total}`),
      h('button', { class: 'btn primary', 'data-testid': 'mini-done', onClick: () => { audio.sfx('tap'); resolve(); } }, '回到大樓')));
  });
  overlay.remove();
  await wait(0);
  return stars;
}
