import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/icon.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('is decorative by default and labelled only when independently informative', async ({ page }) => {
  const decorative = page.locator('#decorative .icon');
  const informative = page.locator('#informative .icon');

  await expect(decorative).toHaveAttribute('role', 'presentation');
  await expect(decorative).toHaveAttribute('aria-hidden', 'true');
  await expect(decorative).not.toHaveAttribute('aria-label');
  await expect(informative).toHaveAttribute('role', 'img');
  await expect(informative).toHaveAttribute('aria-label', 'Notifications');
  await expect(informative).not.toHaveAttribute('aria-hidden');
});

test('inherits currentColor when color is omitted', async ({ page }) => {
  const owner = page.locator('#owner');
  const icon = page.locator('#decorative .icon');

  await expect(icon).toHaveCSS(
    'color',
    await owner.evaluate(element => getComputedStyle(element).color),
  );
});

test('infers the flag catalog from canonical Flag names', async ({ page }) => {
  const flag = page.locator('#flag');

  await expect(flag).not.toHaveAttribute('flag');
  await expect(flag.locator('.icon__svg svg')).toHaveCount(1);
  await expect(flag.locator('.icon')).toHaveAttribute('aria-label', 'Canada');
});

test('keeps an empty fixed-size box for invalid names', async ({ page }) => {
  const invalid = page.locator('#invalid .icon');

  await expect(invalid.locator('svg')).toHaveCount(0);
  const box = await invalid.boundingBox();
  expect(box?.width).toBeGreaterThan(0);
  expect(box?.height).toBeGreaterThan(0);
  expect(box?.width).toBe(box?.height);
});

test('has no detectable accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
