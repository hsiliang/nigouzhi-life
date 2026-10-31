import { tr } from '../i18n';

export type Child = Node | string | number | null | undefined | false;
type Props = Record<string, unknown>;

/** Tiny element builder. Every string child goes through tr() so language switching cannot be forgotten. */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props: Props = {}, ...kids: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    else if (k === 'class') el.className = v as string;
    else if (k === 'html') el.innerHTML = v as string;
    else el.setAttribute(k, String(v));
  }
  append(el, kids);
  return el;
}
export function append(el: Element, kids: Child[]) {
  for (const kid of kids) {
    if (kid === null || kid === undefined || kid === false) continue;
    el.append(kid instanceof Node ? kid : tr(String(kid)));
  }
}
export const clear = (el: Element) => { el.textContent = ''; };
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
export const sprite = (id: string, view: 'front' | 'side' | 'back' = 'front') => asset(`sprites/${id}-${view}.webp`);
export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
