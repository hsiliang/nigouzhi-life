import { audio } from '../audio/audio';
import { content } from '../content';
import type { CharId, Line } from '../engine/types';
import { CHAR_IDS } from '../engine/types';
import { tr } from '../i18n';
import { boss } from './boss';
import { h, sprite } from './dom';

const FX: Record<string, string> = { heart: '❤️', anger: '💢', sweat: '💦', jealous: '🍋', tears: '😭', sparkle: '✨', shake: '💥' };
const SPEAKER_NAMES: Record<string, string> = { narrator: '', neighbor: '鄰居', police: '警察', tenant: '新租客' };
const TYPE_MS = 26;

export interface DialogOptions { skippable?: boolean; tenantName?: string }

export function speakerName(who: string, tenantName?: string) {
  if ((CHAR_IDS as readonly string[]).includes(who)) return content.characters[who as CharId].name;
  if (who === 'tenant' && tenantName) return tenantName;
  return SPEAKER_NAMES[who] ?? '';
}
function portrait(who: string) {
  if ((CHAR_IDS as readonly string[]).includes(who)) return h('img', { class: 'portrait', src: sprite(who), alt: '' });
  const badge = { neighbor: '🏠', police: '👮', tenant: '🧳' }[who];
  return badge ? h('div', { class: 'portrait badge' }, badge) : null;
}

/** Plays lines in order; resolves after the last tap. Tapping mid-line finishes it first. */
export function playLines(host: HTMLElement, lines: Line[], opts: DialogOptions = {}): Promise<void> {
  if (!lines.length) return Promise.resolve();
  return new Promise((resolve) => {
    const textEl = h('p', { class: 'line-text' });
    const nameEl = h('div', { class: 'line-name' });
    const portraitBox = h('div', { class: 'portrait-box' });
    const more = h('div', { class: 'line-more' }, '▼');
    const box = h('div', { class: 'dialog-box' }, nameEl, textEl, more);
    const skip = opts.skippable ? h('button', { class: 'skip', onClick: (e: Event) => { e.stopPropagation(); done(); } }, '跳過') : null;
    const layer = h('div', { class: 'dialog-layer', 'data-testid': 'dialog', role: 'button', tabindex: 0 }, skip, portraitBox, box);
    let i = 0, timer = 0, shown = 0, full = '';
    const finish = () => { clearInterval(timer); timer = 0; textEl.textContent = full; shown = [...full].length; more.classList.add('on'); };
    const show = () => {
      const line = lines[i];
      const who = line.who;
      full = tr(line.text);
      nameEl.textContent = tr(speakerName(who, opts.tenantName));
      nameEl.className = `line-name${nameEl.textContent ? '' : ' empty'}`;
      box.classList.toggle('narration', who === 'narrator');
      portraitBox.replaceChildren();
      const p = portrait(who);
      if (p) portraitBox.append(p);
      if (line.fx) {
        portraitBox.append(h('span', { class: 'line-fx' }, FX[line.fx] ?? ''));
        if (line.fx === 'shake') layer.parentElement?.classList.add('shake');
      }
      more.classList.remove('on');
      textEl.textContent = '';
      shown = 0;
      if (line.voice) audio.playVoice(line.voice);
      const chars = [...full];
      const pitch = (CHAR_IDS as readonly string[]).includes(who) ? content.characters[who as CharId].pitch : 1;
      timer = window.setInterval(() => {
        if (boss.active) return;
        shown += 1;
        textEl.textContent = chars.slice(0, shown).join('');
        if (who !== 'narrator' && shown % 3 === 1 && !line.voice) audio.blip(pitch);
        if (shown >= chars.length) finish();
      }, TYPE_MS);
    };
    const done = () => {
      clearInterval(timer);
      layer.remove();
      window.removeEventListener('keydown', onKey);
      resolve();
    };
    const next = () => {
      if (boss.active) return;
      if (timer) { finish(); return; }
      i += 1;
      if (i >= lines.length) done();
      else show();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); next(); } };
    layer.addEventListener('click', next);
    window.addEventListener('keydown', onKey);
    host.append(layer);
    show();
  });
}
