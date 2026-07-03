import { expect, test } from '@playwright/test';

test.describe('App shell chrome', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app-shell-chrome.html');
    await page.waitForSelector('ds-panel-nav .panel-nav');
  });

  test('panel nav collapse toggles collapsed state', async ({ page }) => {
    const collapse = page.getByRole('button', { name: 'Collapse navigation' });
    await expect(collapse).toBeVisible();
    await collapse.click();
    await expect(page.locator('.panel-nav--collapsed')).toBeVisible();

    await page.getByRole('button', { name: 'Expand navigation' }).click();
    await expect(page.locator('.panel-nav--collapsed')).toHaveCount(0);
  });

  test('tools drawer sets inert and aria-hidden when resting closed', async ({ page }) => {
    const drawer = page.locator('.panel-tools__drawer');
    const host = page.locator('ds-panel-tools');

    await expect(host).toHaveClass(/panel-tools--drawer-resting/);
    await expect(drawer).toHaveAttribute('aria-hidden', 'true');
    await expect(drawer).toHaveAttribute('inert', '');

    await page.getByRole('button', { name: 'Agents' }).click();
    await expect(host).toHaveClass(/panel-tools--open/);
    await expect(drawer).not.toHaveAttribute('aria-hidden', 'true');
    await expect(drawer).not.toHaveAttribute('inert');

    await page.getByRole('button', { name: 'Agents' }).click();
    await expect(host).toHaveClass(/panel-tools--drawer-resting/, { timeout: 5000 });
    await expect(drawer).toHaveAttribute('aria-hidden', 'true');
    await expect(drawer).toHaveAttribute('inert', '');
  });
});
