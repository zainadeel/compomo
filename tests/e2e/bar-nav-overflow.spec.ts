import { expect, test } from '@playwright/test';

test.describe('BarNav responsive overflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.__setShellWidth === 'function');
    await expect(page.locator('ds-bar-nav .bar-nav__tabs-probe')).toHaveCount(1);
  });

  test('wide viewport shows tab row; narrow collapses; widen restores', async ({ page }) => {
    await page.evaluate(() => window.__setShellWidth(900));
    await expect(page.locator('.bar-nav__tabs-visible')).toBeVisible();
    await expect(page.locator('.bar-nav__tab-trigger')).toHaveCount(0);

    await page.evaluate(() => window.__setShellWidth(320));
    await expect(page.locator('.bar-nav__tab-trigger')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.bar-nav__tabs-visible')).toHaveCount(0);

    await page.evaluate(() => window.__setShellWidth(900));
    await expect(page.locator('.bar-nav__tabs-visible')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.bar-nav__tab-trigger')).toHaveCount(0);
  });

  test('collapsed menu splits dividers into multiple sections', async ({ page }) => {
    await page.evaluate(() => window.__setShellWidth(320));
    await expect(page.locator('.bar-nav__tab-trigger')).toBeVisible({ timeout: 5000 });

    await page.locator('.bar-nav__tab-trigger').click();
    await expect(page.locator('.menu-popup')).toBeVisible();
    await expect(page.locator('.menu-section')).toHaveCount(2);

    const selected = page.locator('.menu-item[aria-current="true"]');
    await expect(selected).toHaveCount(1);
    await expect(selected).toContainText('Events');
  });

  test('escape closes menu and returns focus to trigger', async ({ page }) => {
    await page.evaluate(() => window.__setShellWidth(320));
    await expect(page.locator('.bar-nav__tab-trigger')).toBeVisible({ timeout: 5000 });

    const trigger = page.locator('.bar-nav__tab-trigger');
    await trigger.click();
    await expect(page.locator('.menu-popup')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('.menu-popup')).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
});

declare global {
  interface Window {
    __setShellWidth: (px: number) => void;
  }
}
