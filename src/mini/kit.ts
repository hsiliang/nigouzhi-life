import { audio } from '../audio/audio';
import { h, sprite } from '../ui/dom';
import type { MiniCtl } from './runner';

export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];
export async function loop(ctl: MiniCtl, step: (dt: number) => void) {
  while (!ctl.over) step(await ctl.frame());
}
export const tag = (text: string, cls = '') => h('div', { class: `mg-tag ${cls}` }, text);
export const face = (id: string, cls = '', view: 'front' | 'side' | 'back' = 'front') => h('img', { class: `mg-face ${cls}`, src: sprite(id, view), alt: '' });
export const emoji = (ch: string, cls = '') => h('div', { class: `mg-emoji ${cls}` }, ch);
export const place = (el: HTMLElement, x: number, y: number) => { el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`; };
export function floatText(host: HTMLElement, text: string, good: boolean) {
  const f = h('div', { class: `mg-float ${good ? 'up' : 'down'}` }, text);
  host.append(f);
  setTimeout(() => f.remove(), 700);
  audio.sfx(good ? 'pop' : 'bad');
}
export const onTap = (el: HTMLElement, fn: (e: PointerEvent) => void) => el.addEventListener('pointerdown', (e) => { e.preventDefault(); fn(e); });
