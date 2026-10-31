import { audio } from '../audio/audio';
import { content } from '../content';
import { chapterTitles, linesForSignal } from '../content/signals';
import { applyAction, applyChoice, applyMini, availableActions, beginDay, endDay, npcsIn, rollEvent } from '../engine/day';
import { applyEffects } from '../engine/systems';
import type { Action, CharId, DayResult, GameSignal, GameState, Line, MiniId, RoomId } from '../engine/types';
import { playMini } from '../mini/runner';
import { Building } from './building';
import { playLines } from './dialog';
import { h, sprite, wait } from './dom';
import { renderHud } from './hud';
import { loadMeta, saveGame, saveMeta } from './store';

const BRAWL_MINIS: MiniId[] = ['doudou', 'kaka', 'dayi'];
const LABEL_TENANT = { welcome: '歡迎入住', watch: '先觀察', evict: '移出大樓' };
const LABEL_MEDIATE = { message: '幫忙傳話（中庭）', gift: '送點心意 -30 幣（中庭）', sunset: '約到屋頂看夕陽' };

export class Game {
  el = h('div', { class: 'game' });
  private hud = h('div', { class: 'hud' });
  private building: Building;
  private rolled = '';
  private replayLines = false;

  constructor(private s: GameState, private onMenu: () => void, private onFinished: () => void) {
    this.building = new Building(s);
    this.el.append(this.hud, this.building.el);
  }

  get state() { return this.s; }
  replaceState(s: GameState) { this.s = s; this.refresh(); }

  private commit(s: GameState) { this.s = s; saveGame(s); this.refresh(); }
  private refresh() { renderHud(this.hud, this.s, this.onMenu); this.building.update(this.s); }
  private tenantName() { return this.s.tenant ? content.tenants.find((t) => t.id === this.s.tenant!.id)?.name : undefined; }
  private say(lines: Line[], tenantName = this.tenantName()) {
    return playLines(this.el, lines, { skippable: this.replayLines, tenantName });
  }

  async run() {
    while (!this.s.finished) await this.playDay();
    this.onFinished();
  }

  private async playDay() {
    const fresh = !this.s.started;
    this.replayLines = this.s.day < this.s.maxDay || (this.s.stars[this.s.day] ?? 0) > 0;
    const begun = beginDay(this.s, content);
    this.commit(begun.state);
    audio.bgm('day');
    if (fresh) {
      await this.dayCard();
      await this.say(begun.lines);
      await this.signals(begun.signals);
    }
    while (this.s.slot < 3) {
      audio.bgm(this.s.slot === 2 ? 'night' : 'day');
      await this.maybeEvent();
      if (this.s.slot >= 3) break;
      await this.perform(await this.chooseAction());
    }
    await this.finishDay();
  }

  private dayCard() {
    const def = content.days[this.s.day - 1];
    const isChapterStart = (def.day - 1) % 5 === 0;
    return new Promise<void>((resolve) => {
      const card = h('div', { class: 'day-card', 'data-testid': 'day-card', onClick: () => { card.remove(); resolve(); } },
        isChapterStart ? h('small', {}, `第 ${def.chapter} 章`) : null,
        isChapterStart ? h('h1', {}, chapterTitles[def.chapter - 1]) : null,
        h('b', {}, `第 ${def.day} 天：${def.title}`),
        h('p', {}, `購置大樓 ${this.s.buildingNo} 號`), h('em', {}, '點一下開始'));
      this.el.append(card);
    });
  }

  private async maybeEvent() {
    const key = `${this.s.day}-${this.s.slot}`;
    if (this.rolled === key) return;
    this.rolled = key;
    const r = rollEvent(this.s, content);
    if (!r.event) return;
    this.commit(r.state);
    await this.say(r.event.lines);
    if (r.event.choices) {
      const pick = await this.choose(r.event.choices.map((c) => c.label));
      const c = applyChoice(this.s, r.event, pick, content);
      this.commit(c.state);
      await this.say(c.lines);
      await this.signals(c.signals);
    }
    await this.signals(r.signals);
  }

  private choose(labels: string[]) {
    return new Promise<number>((resolve) => {
      const layer = h('div', { class: 'choice-layer' }, ...labels.map((l, i) => h('button', { class: 'btn', onClick: () => { audio.sfx('tap'); layer.remove(); resolve(i); } }, l)));
      this.el.append(layer);
    });
  }

  private async signals(list: GameSignal[]) {
    for (const sig of list) {
      if (sig.type === 'ban') audio.sfx('ban');
      if (sig.type === 'police') audio.sfx('siren');
      if (sig.type === 'tenantResult') audio.sfx(sig.correct ? 'good' : 'bad');
      if (sig.type === 'feudResolved') audio.sfx('good');
      await this.say(linesForSignal(sig, content));
      if (sig.type === 'ban') await this.say([{ who: 'narrator', text: `目前累積封樓 ${this.s.bans} 次，這個成就不太值得炫耀。` }]);
      if (sig.type === 'brawl') {
        const id = BRAWL_MINIS[this.s.brawls % BRAWL_MINIS.length];
        const score = await playMini(this.el, id);
        audio.bgm('day');
        const r = applyEffects(this.s, { mood: score * 3, coins: score * 5 }, content);
        this.commit(r.state);
        await this.signals(r.signals);
      }
    }
  }

  private chooseAction() {
    return new Promise<Action>((resolve) => {
      const open = async (room: RoomId) => {
        this.building.onRoom = () => {};
        audio.sfx('tap');
        await this.building.walkTo(room);
        const picked = await this.actionSheet(room);
        if (picked) resolve(picked);
        else this.building.onRoom = open;
      };
      this.building.onRoom = open;
    });
  }

  private actionSheet(room: RoomId) {
    return new Promise<Action | null>((resolve) => {
      const actions = availableActions(this.s, content, room);
      const close = (a: Action | null) => { audio.sfx('tap'); sheet.remove(); resolve(a); };
      const btn = (a: Action, label: string, cls = '') => h('button', { class: `btn small ${cls}`, 'data-action': a.kind, onClick: () => close(a) }, label);
      const npcRows = npcsIn(this.s, room, content).map((who) => this.npcRow(who, actions, btn));
      const generalLabel = (a: Action): [string, string] | null => {
        switch (a.kind) {
          case 'work': return [content.rooms[room].work!.label, ''];
          case 'mini': return [`玩：${gameTitle(a.id)}`, 'primary'];
          case 'clean': return ['打掃公共區域', ''];
          case 'apologize': return ['送伴手禮道歉 -20 幣', ''];
          case 'tenantDecide': return [LABEL_TENANT[a.verdict], a.verdict === 'evict' ? 'danger' : ''];
          case 'feudMediate': return [LABEL_MEDIATE[a.method], 'primary'];
          case 'rest': return ['休息一下', 'ghost'];
          default: return null;
        }
      };
      const general = actions.flatMap((a) => { const l = generalLabel(a); return l ? [btn(a, l[0], l[1])] : []; });
      const sheet = h('div', { class: 'sheet-layer', 'data-testid': 'sheet', onClick: (e: Event) => { if (e.target === sheet) close(null); } },
        h('div', { class: 'sheet' },
          h('header', {}, h('b', {}, content.rooms[room].name), h('button', { class: 'icon-btn', onClick: () => close(null), 'aria-label': '關閉' }, '✕')),
          this.s.tenant && room === 'courtyard' ? h('p', { class: 'sheet-note' }, `新租客「${this.tenantName()}」在中庭等待壯壯的決定。問問大家再決定也不遲。`) : null,
          ...npcRows, h('div', { class: 'btn-grid' }, ...general)));
      this.el.append(sheet);
    });
  }

  private npcRow(who: CharId, actions: Action[], btn: (a: Action, label: string, cls?: string) => HTMLElement) {
    const mine = actions.filter((a) => (a.kind === 'talk' || a.kind === 'gift' || a.kind === 'feudHear') ? a.who === who : a.kind === 'tenantAsk' && a.helper === who);
    const labels: Record<string, string> = { talk: '聊天', gift: '送禮 -15', feudHear: '聽聽說法', tenantAsk: '問新租客' };
    return h('div', { class: 'npc-row' },
      h('img', { src: sprite(who), alt: '' }),
      h('div', {}, h('b', {}, content.characters[who].name), h('small', {}, `好感 ${this.s.affinity[who]}`)),
      h('div', { class: 'npc-btns' }, ...mine.map((a) => btn(a, labels[a.kind], a.kind === 'feudHear' ? 'primary' : ''))));
  }

  private async perform(a: Action) {
    const r = applyAction(this.s, a, content);
    const name = this.tenantName();
    this.commit(r.state);
    if (a.kind === 'work') audio.sfx('coin');
    await this.say(r.lines, name);
    await this.signals(r.signals);
    if (r.startMini) await this.runMini(r.startMini);
  }

  private async runMini(id: MiniId) {
    const score = await playMini(this.el, id);
    audio.bgm(this.s.slot === 2 ? 'night' : 'day');
    const r = applyMini(this.s, id, score, content);
    this.commit(r.state);
    await this.signals(r.signals);
  }

  private async finishDay() {
    await wait(200);
    const r = endDay(this.s, content);
    if (r.finished) {
      const meta = loadMeta();
      if (!meta.endings.includes(this.s.hero)) meta.endings.push(this.s.hero);
      meta.bestBans = Math.max(meta.bestBans, r.state.bans);
      meta.tenants = [...new Set([...meta.tenants, ...r.state.seenTenants])];
      saveMeta(meta);
      audio.bgm('warm');
    }
    await this.say(r.lines);
    await this.summary(r);
    this.commit(r.state);
  }

  private summary(r: DayResult) {
    audio.sfx(r.stars ? 'star' : 'bad');
    const def = content.days[this.s.day - 1];
    const friends = (Object.keys(content.chatter) as CharId[]).filter((c) => c !== this.s.hero);
    const friend = friends[(this.s.day * 7 + this.s.seed) % friends.length];
    const pool = content.chatter[friend];
    const post = pool[(this.s.day * 3) % pool.length][0].text;
    const rows = [def.goalText, def.bonus[0].text, def.bonus[1].text].map((t, i) => h('li', { class: r.goals[i] ? 'done' : '' }, r.goals[i] ? '✔ ' : '✘ ', t));
    return new Promise<void>((resolve) => {
      const card = h('div', { class: 'modal-layer', 'data-testid': 'summary' }, h('div', { class: 'modal' },
        h('h2', {}, r.passed ? `第 ${def.day} 天結束` : '今天沒過關'),
        h('p', { class: 'mini-stars' }, '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars)),
        h('ul', { class: 'summary-goals' }, ...rows),
        h('div', { class: 'moment' }, h('img', { src: sprite(friend), alt: '' }), h('div', {}, h('b', {}, `${content.characters[friend].name}的動態`), h('p', {}, post))),
        h('button', { class: 'btn primary', 'data-testid': 'next-day', onClick: () => { audio.sfx('tap'); card.remove(); resolve(); } }, r.finished ? '看結局' : r.passed ? '下一天' : '再來一次')));
      this.el.append(card);
    });
  }
}

const gameTitle = (id: MiniId) => titles[id] ?? id;
const titles: Partial<Record<MiniId, string>> = {};
export const registerMiniTitles = (t: Partial<Record<MiniId, string>>) => Object.assign(titles, t);
