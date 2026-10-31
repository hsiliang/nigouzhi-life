import { expect, test } from '@playwright/test';
import { CHAR_IDS } from '../src/engine/types';
import { advanceDialog, startGame, trackErrors } from './helpers';

test('plays a full time slot and autosaves across a reload', async ({ page }) => {
  const errors = trackErrors(page);
  await startGame(page);
  await page.locator('[data-room=courtyard]').click();
  await expect(page.getByTestId('sheet')).toBeVisible();
  await page.locator('[data-action=clean]').click();
  await advanceDialog(page);
  await expect(page.locator('.hud-title b')).toContainText('下午');
  await page.reload();
  await page.getByTestId('resume').click();
  await expect(page.locator('.hud-title b')).toContainText('下午');
  expect(errors).toEqual([]);
});

test('shows names and skills but no character introductions', async ({ page }) => {
  await page.goto('/?fastmini');
  await page.getByTestId('working').click();
  await page.getByRole('button', { name: '圖鑑' }).click();
  await expect(page.locator('.album-row').first()).toContainText('光哥');
  await expect(page.locator('.album')).not.toContainText('南京');
  await expect(page.locator('.album')).not.toContainText('老婆');
  await page.getByRole('button', { name: '返回' }).click();
  await page.getByTestId('new-game').click();
  await page.locator('[data-hero=zhuangzhuang]').click();
  await expect(page.locator('.hero-detail')).toContainText('群主加班魂');
  await expect(page.locator('.hero-detail')).not.toContainText('成都');
  await expect(page.locator('.hero-detail')).not.toContainText('單親');
});

test('has no horizontal scroll and keeps the boss button reachable', async ({ page }) => {
  await startGame(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.getByTestId('boss-btn')).toBeInViewport();
  await page.locator('[data-room=courtyard]').click();
  await expect(page.locator('[data-action=rest]')).toBeInViewport();
});

test('boss key shows a fake sheet, mutes, and comes back', async ({ page }) => {
  await startGame(page);
  await page.getByTestId('boss-btn').click();
  await expect(page.getByTestId('boss')).toBeVisible();
  await expect(page).toHaveTitle(/xlsx/);
  expect(await page.evaluate(() => new Promise((r) => setTimeout(() => r((window as never as { __nigou: { audio: { running: boolean } } }).__nigou.audio.running), 100)))).toBe(false);
  await page.getByTestId('boss-back').click();
  await expect(page.getByTestId('boss')).toBeHidden();
  await expect(page).toHaveTitle('你購置的人生');
});

test('starts cleanly when the save is corrupt', async ({ page }) => {
  const errors = trackErrors(page);
  await page.addInitScript(() => localStorage.setItem('nigouzhi.save.v1', '{oops'));
  await page.goto('/?fastmini');
  await page.getByTestId('working').click();
  await expect(page.getByTestId('resume')).toHaveCount(0);
  await expect(page.getByTestId('new-game')).toBeVisible();
  expect(errors).toEqual([]);
});

test('keeps working when storage throws', async ({ page }) => {
  const errors = trackErrors(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('denied'); } });
  });
  await startGame(page);
  await page.locator('[data-room=courtyard]').click();
  await page.locator('[data-action=clean]').click();
  await advanceDialog(page);
  await expect(page.locator('.hud-title b')).toContainText('下午');
  expect(errors).toEqual([]);
});

test('moves a save between devices with a save code', async ({ page }) => {
  await startGame(page);
  await page.getByTestId('menu').click();
  await page.getByTestId('export').click();
  const code = await page.getByTestId('save-code').inputValue();
  expect(code.length).toBeGreaterThan(100);
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?fastmini');
  await page.getByTestId('working').click();
  await page.getByTestId('settings').click();
  await page.getByTestId('save-code').fill(code);
  await page.getByTestId('import').click();
  await expect(page.getByTestId('building')).toBeVisible();
});

test('pauses a mini game behind the boss key', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('working').click();
  void page.evaluate(() => { (window as never as { __nigou: { mini(id: string): void } }).__nigou.mini('kaka'); });
  await page.getByTestId('mini-start').click();
  await expect(page.locator('.mini-bar')).toBeVisible();
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  const before = await page.locator('.mini-bar span').last().textContent();
  await page.waitForTimeout(1600);
  expect(await page.locator('.mini-bar span').last().textContent()).toBe(before);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('boss')).toBeHidden();
});

for (const id of CHAR_IDS) {
  test(`mini game ${id} runs to its result`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/?fastmini');
    await page.getByTestId('working').click();
    const done = page.evaluate((m) => (window as never as { __nigou: { mini(id: string): Promise<number> } }).__nigou.mini(m), id);
    await page.getByTestId('mini-start').click();
    await expect(page.getByTestId('mini-field')).toBeVisible();
    await page.getByTestId('mini-field').click({ force: true });
    await page.getByTestId('mini-done').click({ timeout: 8000 });
    expect(await done).toBeGreaterThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}
