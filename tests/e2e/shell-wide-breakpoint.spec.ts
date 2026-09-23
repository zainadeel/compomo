import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/shell-managed.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('reserves the wide desktop boundary without changing chrome @cross-browser', async ({
  page,
}) => {
  const shell = page.locator('#managed-shell');
  await page.setViewportSize({ width: 1919, height: 900 });
  await expect(shell).toHaveAttribute('data-wide-viewport', 'false');
  const header = shell.locator('ds-bar-title');
  const before = await header.boundingBox();
  for (const width of [1920, 2200]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(shell).toHaveAttribute('data-wide-viewport', 'true');
    await expect(shell).toHaveAttribute('responsive-mode', 'desktop');
    await expect(shell.locator('ds-shell-page')).toHaveJSProperty('headerCapacity', 'roomy');
    expect((await header.boundingBox())?.height).toBe(before?.height);
  }
  await page.setViewportSize({ width: 1919, height: 900 });
  await expect(shell).toHaveAttribute('data-wide-viewport', 'false');
});
