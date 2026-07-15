import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/loader.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('leaves nested busy semantics on the owner', async ({ page }) => {
  const button = page.getByRole('button');
  const nested = page.locator('#nested');

  await expect(button).toHaveAttribute('aria-busy', 'true');
  await expect(button).toHaveAccessibleName('Saving');
  await expect(nested.locator('[role="status"]')).toHaveCount(0);
  await expect(nested.locator('.loader')).toHaveAttribute('aria-hidden', 'true');
});

test('exposes contextual polite status text for standalone use', async ({ page }) => {
  const standalone = page.locator('#standalone');
  const status = standalone.getByRole('status');

  await expect(status).toHaveAttribute('aria-live', 'polite');
  await expect(status.locator('.visually-hidden')).toHaveText('Loading vehicle details');
  await expect(status.locator('.loader')).toHaveAttribute('aria-hidden', 'true');
});

test('inherits owner color when color is omitted', async ({ page }) => {
  const button = page.getByRole('button');
  const nested = page.locator('#nested .loader');

  await expect(nested).toHaveCSS(
    'color',
    await button.evaluate(element => getComputedStyle(element).color),
  );
});

test('stops rotation while preserving the glyph under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');

  const loader = page.locator('#standalone .loader');
  await expect(loader).toHaveCSS('animation-name', 'none');
  await expect(loader.locator('svg')).toBeVisible();
  await expect(page.locator('#standalone').getByRole('status')).toHaveCount(1);
});

test('has no detectable accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
