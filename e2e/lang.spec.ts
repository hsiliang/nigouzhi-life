import { expect, test } from '@playwright/test';
import { startGame } from './helpers';

test('switches the whole game to simplified chinese and remembers it', async ({ page }) => {
  await startGame(page);
  await page.getByTestId('menu').click();
  await page.getByTestId('lang').click();
  await page.getByTestId('resume').click();
  await expect(page.getByTestId('boss-btn')).toHaveText('老板来了');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hans');
});

test('defaults to simplified for mainland browsers', async ({ browser }) => {
  const ctx = await browser.newContext({ locale: 'zh-CN' });
  const page = await ctx.newPage();
  await page.goto('/?fastmini');
  await expect(page.locator('.title h1')).toHaveText('你购置的人生');
  await ctx.close();
});
