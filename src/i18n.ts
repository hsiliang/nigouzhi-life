import table from './i18n-t2s.json';

export type Lang = 'hant' | 'hans';
let lang: Lang = 'hant';
const map = table as Record<string, string>;

export const setLang = (l: Lang) => { lang = l; document.documentElement.lang = l === 'hans' ? 'zh-Hans' : 'zh-Hant'; };
export const getLang = () => lang;
export const defaultLang = (): Lang => (/^zh-(cn|sg|hans)/i.test(navigator.language) ? 'hans' : 'hant');

/** Content is authored in Traditional Chinese; Simplified is a per-character swap. */
export function toHans(text: string): string {
  let out = '';
  for (const ch of text) out += map[ch] ?? ch;
  return out;
}
export const tr = (text: string) => (lang === 'hans' ? toHans(text) : text);
