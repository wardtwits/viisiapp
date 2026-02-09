const { test, expect } = require('@playwright/test');

test('valid words submit in demo', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/demo.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const submitWord = async (word) => {
    for (const ch of word) {
      await page.locator('.demo-key', { hasText: ch }).first().click();
    }
    await page.waitForTimeout(50);
  };

  await submitWord('SLATE');
  await expect(page.locator('#foundCount')).toHaveText('1 / 5');

  await submitWord('STEAL');
  await expect(page.locator('#foundCount')).toHaveText('2 / 5');

  await submitWord('TALES');
  await expect(page.locator('#foundCount')).toHaveText('3 / 5');
});
