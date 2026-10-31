import { expect, type Page } from '@playwright/test';

export function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return errors;
}
export async function advanceDialog(page: Page, max = 200) {
  for (let i = 0; i < max; i++) {
    if (await page.getByTestId('choices').isVisible().catch(() => false)) await page.getByTestId('choices').locator('button').first().click();
    if (!(await page.getByTestId('dialog').isVisible().catch(() => false))) return;
    await page.getByTestId('dialog').click({ position: { x: 20, y: 20 }, force: true }).catch(() => {});
  }
}
export async function startGame(page: Page, url = '/?fastmini', hero?: string) {
  await page.goto(url);
  await page.getByTestId('working').click();
  await page.getByTestId('new-game').click();
  if (hero) await page.locator(`[data-hero=${hero}]`).click();
  await page.getByTestId('hero-confirm').click();
  await page.getByTestId('day-card').click();
  await advanceDialog(page);
  await expect(page.getByTestId('building')).toBeVisible();
}
