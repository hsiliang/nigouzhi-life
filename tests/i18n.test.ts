import { describe, expect, it } from 'vitest';
import { content } from '../src/content';
import { toHans } from '../src/i18n';

describe('simplified chinese', () => {
  it('converts the catchphrase', () => expect(toHans('你購置的')).toBe('你购置的'));
  it('converts the title and common words', () => {
    expect(toHans('老闆來了')).toBe('老板来了');
    expect(toHans('購置大樓')).toBe('购置大楼');
  });
  it('uses mainland forms for words OpenCC keeps', () => expect(toHans('妳欸牠瞇嘴砲')).toBe('你诶它眯嘴炮'));
  it('leaves no traditional-only characters in the whole script', () => {
    const out = toHans(JSON.stringify(content));
    expect(out.match(/[購樓幫這裡還後為個們時點過對說會開關動體愛國發長門問聽見車東書學應實現處與專業]/g)).toBeNull();
  });
});
