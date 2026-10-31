import { test } from '@playwright/test';
import { advanceDialog } from './helpers';

declare const process: { env: Record<string, string | undefined> };
const out = process.env.SHOTS ?? 'test-results/shots';
test('capture key screens', async ({ page }, info) => {
  const tag = info.project.name;
  await page.goto('/?fastmini');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${tag}-1-title.png` });
  await page.getByTestId('working').click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${out}/${tag}-2-title2.png` });
  await page.getByTestId('new-game').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${tag}-3-select.png` });
  await page.getByTestId('hero-confirm').click();
  await page.getByTestId('day-card').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${tag}-4-dialog.png` });
  await advanceDialog(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${tag}-5-building.png` });
  await page.locator('[data-room=courtyard]').click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/${tag}-6-sheet.png` });
});
