import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark']) {
  test(`${theme} settings focus and modal review`, async ({ page }) => {
    await page.goto('/accessibility-journey.html');
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
    await page.locator('html').evaluate((element, theme) => {
      element.dataset.theme = theme;
    }, theme);
    await page.evaluate(() => document.fonts.ready);
    await page.getByRole('textbox', { name: 'Display name' }).focus();
    await expect(page.getByRole('main')).toHaveScreenshot(`${theme}-settings-focus.png`);
    await page.getByRole('button', { name: 'Review changes' }).focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Review notification settings' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Save changes' }).focus();
    await expect(dialog).toHaveScreenshot(`${theme}-review-focus.png`);
  });
}
