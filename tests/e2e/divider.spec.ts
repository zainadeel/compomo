import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/divider.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('is decorative by default and exposes opt-in separator semantics', async ({ page }) => {
  const decorative = page.locator('#decorative');
  const semantic = page.locator('#semantic');

  await expect(decorative).toHaveAttribute('aria-hidden', 'true');
  await expect(decorative).not.toHaveAttribute('role');
  await expect(semantic).toHaveRole('separator');
  await expect(semantic).toHaveAttribute('aria-orientation', 'vertical');
  await expect(semantic).not.toHaveAttribute('aria-hidden');
});

test('uses concise background contexts with explicit faint support', async ({ page }) => {
  const divider = page.locator('#decorative');
  const resolveColor = (token: string) => page.evaluate(cssToken => {
    const probe = document.createElement('div');
    probe.style.backgroundColor = `var(${cssToken})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  }, token);
  const contexts = [
    ['faint', '--color-divider-divider'],
    ['medium', '--color-divider-divider-on-medium-background'],
    ['bold', '--color-divider-divider-on-bold-background'],
    ['strong', '--color-divider-divider-on-strong-background'],
    ['translucent', '--color-translucent-divider'],
    ['inverted', '--color-inverted-divider'],
    ['media', '--color-media-divider'],
    ['navigation', '--color-navigation-divider'],
    ['always-dark', '--color-always-dark-divider'],
  ] as const;

  await expect(divider).not.toHaveAttribute('background');
  await expect(divider).toHaveCSS('background-color', await resolveColor('--color-divider-divider'));

  for (const [background, token] of contexts) {
    await divider.evaluate((element, value) => {
      (element as HTMLElement & { background: string }).background = value;
    }, background);
    await expect(divider).toHaveClass(new RegExp(`divider--background-${background}`));
    await expect(divider).toHaveCSS('background-color', await resolveColor(token));
  }
});

test('resolves parent-selected length and symmetric inset values', async ({ page }) => {
  const semantic = page.locator('#semantic');

  await expect(semantic).toHaveClass(/divider--vertical/);
  await expect(semantic).toHaveClass(/divider--custom-length/);
  await expect.poll(() => semantic.evaluate(element => (
    element.style.getPropertyValue('--_divider-length')
  ))).toBe('var(--dimension-size-300)');
  await expect.poll(() => semantic.evaluate(element => (
    element.style.getPropertyValue('--_divider-inset')
  ))).toBe('var(--dimension-space-100)');
});

test('has no detectable accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
