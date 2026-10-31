import './style.css';
import { audio } from './audio/audio';
import { newGame } from './engine/state';
import type { CharId, GameState, MiniId } from './engine/types';
import { defaultLang, setLang } from './i18n';
import { games } from './mini/games';
import { playMini } from './mini/runner';
import { boss } from './ui/boss';
import { h, sprite } from './ui/dom';
import { Game, registerMiniTitles } from './ui/game';
import { albumScreen, heroSelect, settingsModal, titleScreen, workCheck } from './ui/screens';
import { clearGame, loadGame, loadPrefs } from './ui/store';

const app = document.getElementById('app')!;
const prefs = loadPrefs();
setLang(prefs.lang ?? defaultLang());
audio.configure(prefs);
registerMiniTitles(Object.fromEntries(Object.values(games).map((g) => [g.id, g.title])));
window.addEventListener('pointerdown', () => audio.unlock());
window.addEventListener('keydown', () => audio.unlock());
void boss;

let game: Game | null = null;
const show = (el: HTMLElement) => app.replaceChildren(el);

function settings() {
  const modal = settingsModal(prefs, () => game?.state ?? loadGame(), {
    close: () => modal.remove(),
    relang: () => location.reload(),
    quit: () => { modal.remove(); game = null; title(); },
    load: (s) => { modal.remove(); start(s); },
  });
  app.append(modal);
}

function start(s: GameState) {
  game = new Game(s, settings, ending);
  show(game.el);
  game.replaceState(s);
  void game.run();
}

function ending() {
  clearGame();
  const hero = game!.state.hero;
  game = null;
  audio.bgm('warm');
  show(h('div', { class: 'title' },
    h('img', { class: 'mini-face', src: sprite(hero), alt: '' }),
    h('h1', {}, '全劇終'), h('p', { class: 'title-sub' }, '換一位朋友再活一次，還有不同的結局等著你。'),
    h('button', { class: 'btn primary', 'data-testid': 'to-title', onClick: title }, '回到標題')));
}

function pickHero() {
  show(heroSelect((id: CharId) => {
    clearGame();
    start(newGame(id, (Date.now() & 0xffffff) ^ id.length));
  }, title));
}

function title() {
  audio.bgm('title');
  show(titleScreen(!!loadGame(), {
    start: pickHero,
    resume: () => { const s = loadGame(); if (s) start(s); },
    album: () => show(albumScreen(title)),
    settings,
  }));
  if (!prefs.asked) app.append(workCheck(prefs, () => app.querySelector('[data-testid=work-check]')?.remove()));
}

title();

if (import.meta.env.DEV) Object.assign(window, { __nigou: { audio, mini: (id: MiniId) => playMini(app, id), game: () => game } });
