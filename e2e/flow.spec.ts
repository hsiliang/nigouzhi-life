import { expect, test, type Page } from '@playwright/test';
import { newGame } from '../src/engine/state';
import type { CharId, GameState } from '../src/engine/types';
import { advanceDialog, trackErrors } from './helpers';

async function loadAt(page: Page, day: number, hero: CharId, extra: Partial<GameState> = {}) {
  const stars = Object.fromEntries(Array.from({ length: day - 1 }, (_, i) => [i + 1, 3]));
  const s: GameState = { ...newGame(hero, 5), day, maxDay: day, stars, ...extra };
  await page.addInitScript((save) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('nigouzhi.save.v1', save);
    localStorage.setItem('nigouzhi.prefs.v1', JSON.stringify({ voice: false, music: false, sfx: false, lang: 'hant', asked: true }));
  }, JSON.stringify(s));
  await page.goto('/?fastmini');
  await page.getByTestId('resume').click();
  if (!extra.started) {
    await page.getByTestId('day-card').click();
    await advanceDialog(page);
  }
}
const room = (page: Page, r: string) => page.locator(`[data-room=${r}]`).click();

test('finishes the game through the real UI and unlocks the ending', async ({ page }) => {
  const errors = trackErrors(page);
  await loadAt(page, 40, 'doudou', { started: true, slot: 2, progress: { talked: [], minis: { zhuangzhuang: 3 }, tenantDone: false, feudDone: false, worked: false, cleaned: true } });
  await room(page, 'courtyard');
  await page.locator('[data-action=rest]').click();
  for (let i = 0; i < 400 && !(await page.getByTestId('next-day').isVisible()); i++) await advanceDialog(page).then(() => page.waitForTimeout(40));
  await expect(page.getByTestId('next-day')).toHaveText('看結局');
  await page.getByTestId('next-day').click();
  await page.getByTestId('to-title').click();
  await expect(page.getByTestId('resume')).toHaveCount(0);
  await page.getByRole('button', { name: '圖鑑' }).click();
  await expect(page.locator('.album p').first()).toContainText('已解鎖結局 1 / 10');
  expect(errors).toEqual([]);
});

test('evicts a tenant through the sheet', async ({ page }) => {
  const errors = trackErrors(page);
  await loadAt(page, 12, 'kaka');
  await room(page, 'courtyard');
  await expect(page.locator('.sheet-note')).toContainText('王姐');
  await page.getByRole('button', { name: '移出大樓' }).click();
  await advanceDialog(page);
  await expect(page.locator('.tenant-token')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('hears both sides and mediates a feud', async ({ page }) => {
  const errors = trackErrors(page);
  await loadAt(page, 16, 'yao');
  await expect(page.locator('.npc.feud')).toHaveCount(2);
  await page.locator('.room:has(.npc[alt="豆豆"])').click();
  await page.getByRole('button', { name: '聽聽說法' }).first().click();
  await advanceDialog(page);
  await page.locator('.room:has(.npc[alt="卡卡"])').click();
  await page.getByRole('button', { name: '聽聽說法' }).first().click();
  await advanceDialog(page);
  await room(page, 'courtyard');
  await page.getByRole('button', { name: /送點心意/ }).click();
  await advanceDialog(page);
  await expect(page.locator('.npc.feud')).toHaveCount(0);
  expect(errors).toEqual([]);
});
