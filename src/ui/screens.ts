import { audio } from '../audio/audio';
import { content } from '../content';
import { toHans, getLang, setLang } from '../i18n';
import { fromSaveCode, toSaveCode } from '../engine/save';
import { CHAR_IDS, type CharId, type GameState } from '../engine/types';
import { h, sprite } from './dom';
import { clearGame, loadMeta, savePrefs, type Prefs } from './store';

export function titleScreen(hasSave: boolean, on: { start(): void; resume(): void; album(): void; settings(): void }) {
  const row = CHAR_IDS.slice(0, 10).map((id, i) => h('img', { src: sprite(id), alt: '', style: `--i:${i}` }));
  return h('div', { class: 'title' },
    h('div', { class: 'title-crowd' }, ...row),
    h('h1', {}, '你購置的人生'),
    h('p', { class: 'title-sub' }, '十個網友，一棟破樓，一張假裝很真的通知'),
    hasSave ? h('button', { class: 'btn primary', 'data-testid': 'resume', onClick: on.resume }, '繼續上次的人生') : null,
    h('button', { class: `btn ${hasSave ? '' : 'primary'}`, 'data-testid': 'new-game', onClick: on.start }, hasSave ? '重新開始' : '開始購置人生'),
    h('div', { class: 'title-row' },
      h('button', { class: 'btn small ghost', onClick: on.album }, '圖鑑'),
      h('button', { class: 'btn small ghost', onClick: on.settings, 'data-testid': 'settings' }, '設定')));
}

export function workCheck(prefs: Prefs, done: () => void) {
  const pick = (working: boolean) => () => {
    prefs.asked = true;
    if (working) { prefs.voice = false; prefs.music = false; prefs.sfx = false; }
    savePrefs(prefs);
    audio.configure(prefs);
    audio.sfx('tap');
    done();
  };
  return h('div', { class: 'modal-layer', 'data-testid': 'work-check' }, h('div', { class: 'modal' },
    h('h2', {}, '你現在在上班嗎？'), h('p', {}, '答「是」就全程靜音。之後可以在設定裡打開聲音。隨時按「老闆來了」或 Esc 可以切換成假報表。'),
    h('button', { class: 'btn primary', 'data-testid': 'working', onClick: pick(true) }, '是，我在摸魚'),
    h('button', { class: 'btn', 'data-testid': 'not-working', onClick: pick(false) }, '不是，放心開聲音')));
}

export function heroSelect(onPick: (id: CharId) => void, onBack: () => void) {
  const detail = h('div', { class: 'hero-detail' });
  let chosen: CharId = 'zhuangzhuang';
  const cards = new Map<CharId, HTMLElement>();
  const show = (id: CharId) => {
    chosen = id;
    cards.forEach((c, k) => c.classList.toggle('on', k === id));
    const c = content.characters[id];
    detail.replaceChildren(
      h('img', { src: sprite(id), alt: '' }),
      h('div', {}, h('h2', {}, c.name), h('small', {}, `${c.age}・${c.home}・${c.job}`), h('p', {}, c.bio),
        h('p', { class: 'skill' }, h('b', {}, `專長：${c.skill.name}`), ' ', c.skill.desc)));
  };
  const grid = h('div', { class: 'hero-grid' }, ...CHAR_IDS.map((id) => {
    const card = h('button', { class: 'hero-card', 'data-hero': id, onClick: () => { audio.sfx('tap'); show(id); } },
      h('img', { src: sprite(id), alt: '' }), h('span', {}, content.characters[id].name));
    cards.set(id, card);
    return card;
  }));
  show(chosen);
  return h('div', { class: 'select' },
    h('h2', {}, '選擇你的人生'), grid, detail,
    h('div', { class: 'title-row' },
      h('button', { class: 'btn small ghost', onClick: onBack }, '返回'),
      h('button', { class: 'btn primary', 'data-testid': 'hero-confirm', onClick: () => onPick(chosen) }, '就是我了')));
}

export function albumScreen(onBack: () => void) {
  const meta = loadMeta();
  const rows = CHAR_IDS.map((id) => {
    const c = content.characters[id];
    const done = meta.endings.includes(id);
    return h('div', { class: 'album-row' }, h('img', { src: sprite(id), alt: '' }),
      h('div', {}, h('b', {}, c.name), h('small', {}, `${c.home}・${c.job}`), h('p', {}, c.bio), h('em', {}, done ? '個人結局已解鎖' : '個人結局未解鎖')));
  });
  return h('div', { class: 'album' },
    h('h2', {}, '大樓住戶圖鑑'), h('p', {}, `已解鎖結局 ${meta.endings.length} / 10，見過新租客 ${meta.tenants.length} / ${content.tenants.length}，最高封樓 ${meta.bestBans} 次`),
    h('div', { class: 'album-list' }, ...rows), h('button', { class: 'btn', onClick: onBack }, '返回'));
}

export function settingsModal(prefs: Prefs, getState: () => GameState | null, on: { close(): void; load(s: GameState): void; quit(): void; relang(): void }) {
  const toggle = (key: 'voice' | 'music' | 'sfx', label: string) => {
    const input = h('input', { type: 'checkbox', 'data-testid': `toggle-${key}` }) as HTMLInputElement;
    input.checked = prefs[key];
    input.addEventListener('change', () => { prefs[key] = input.checked; savePrefs(prefs); audio.configure(prefs); });
    return h('label', { class: 'toggle' }, label, input);
  };
  const code = h('textarea', { rows: 3, placeholder: '在這裡貼上存檔碼，再按匯入', 'data-testid': 'save-code' }) as HTMLTextAreaElement;
  const note = h('p', { class: 'sheet-note' });
  const say = (t: string) => { note.textContent = getLang() === 'hans' ? toHans(t) : t; };
  const s = getState();
  return h('div', { class: 'modal-layer', 'data-testid': 'settings-modal' }, h('div', { class: 'modal' },
    h('h2', {}, '設定'), toggle('voice', '語音'), toggle('music', '音樂'), toggle('sfx', '音效'),
    h('label', { class: 'toggle' }, '語言',
      h('button', { class: 'btn small', 'data-testid': 'lang', onClick: () => { const next = getLang() === 'hans' ? 'hant' : 'hans'; prefs.lang = next; setLang(next); savePrefs(prefs); on.relang(); } }, getLang() === 'hans' ? '切換成繁體' : '切換成简体')),
    h('h3', {}, '手機和電腦互通存檔'), code,
    h('div', { class: 'title-row' },
      s ? h('button', { class: 'btn small', 'data-testid': 'export', onClick: () => { code.value = toSaveCode(s); code.select(); void navigator.clipboard?.writeText(code.value).catch(() => {}); say('存檔碼已產生，複製到另一台裝置貼上即可。'); } }, '匯出') : null,
      h('button', { class: 'btn small', 'data-testid': 'import', onClick: () => { const v = fromSaveCode(code.value); if (v) on.load(v); else say('這串存檔碼看起來壞掉了。'); } }, '匯入')),
    note,
    s ? h('button', { class: 'btn small ghost', onClick: on.quit }, '回到標題') : null,
    h('button', { class: 'btn small danger', onClick: () => { if (s && !note.dataset.confirm) { note.dataset.confirm = '1'; say('再按一次就會刪除目前的存檔。'); return; } clearGame(); location.reload(); } }, '刪除存檔'),
    h('button', { class: 'btn primary', 'data-testid': 'settings-close', onClick: on.close }, '關閉')));
}

