import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/skeleton.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('keeps atomic placeholders hidden while the owner exposes busy state', async ({ page }) => {
  await expect(page.locator('section')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('ds-skeleton')).toHaveCount(4);

  for (const skeleton of await page.locator('ds-skeleton').all()) {
    await expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  }
});

test('matches selected metric canvases and resolves numeric width to pixels', async ({ page }) => {
  await expect(page.locator('#text')).toHaveClass(/skeleton--text-text-body-medium/);
  await expect(page.locator('#icon')).toHaveClass(/skeleton--icon-md/);
  await expect(page.locator('#icon')).toHaveClass(/skeleton--rounded/);
  await expect(page.locator('#control')).toHaveClass(/ds-control--md/);
  await expect(page.locator('#control')).toHaveCSS('width', '160px');
});

test('uses concise background contexts with explicit faint support', async ({ page }) => {
  const skeleton = page.locator('#text');
  const contexts = [
    ['faint', '--color-foreground-quaternary', '--color-shimmer-shimmer'],
    ['medium', '--color-foreground-on-medium-background-quaternary', '--color-shimmer-shimmer-on-medium-background'],
    ['bold', '--color-foreground-on-bold-background-quaternary', '--color-shimmer-shimmer-on-bold-background'],
    ['strong', '--color-foreground-on-strong-background-quaternary', '--color-shimmer-shimmer-on-strong-background'],
    ['translucent', '--color-translucent-foreground-quaternary', '--color-translucent-shimmer'],
    ['inverted', '--color-inverted-foreground-quaternary', '--color-inverted-shimmer'],
    ['media', '--color-media-foreground-quaternary', '--color-media-shimmer'],
    ['navigation', '--color-navigation-foreground-quaternary', '--color-navigation-shimmer'],
    ['always-dark', '--color-always-dark-foreground-quaternary', '--color-always-dark-shimmer'],
  ] as const;
  const tokenValue = (token: string) => page.evaluate(name => (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  ), token);

  for (const [background, baseToken, shimmerToken] of contexts) {
    await skeleton.evaluate((element, value) => {
      (element as HTMLElement & { background: string }).background = value;
    }, background);
    await expect(skeleton).toHaveClass(new RegExp(`skeleton--background-${background}`));
    await expect.poll(() => skeleton.evaluate(element => (
      getComputedStyle(element).getPropertyValue('--ds-skeleton-base').trim()
    ))).toBe(await tokenValue(baseToken));
    await expect.poll(() => skeleton.evaluate(element => (
      getComputedStyle(element).getPropertyValue('--ds-shimmer').trim()
    ))).toBe(await tokenValue(shimmerToken));
  }
});

test('supports static mode and removes shimmer motion under reduced motion', async ({ page }) => {
  await expect(page.locator('#static .skeleton__shape')).not.toHaveClass(/ds-shimmer-surface/);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await expect.poll(() => page.locator('#text .skeleton__shape').evaluate(element => (
    getComputedStyle(element, '::after').display
  ))).toBe('none');
});

test('has no detectable accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
