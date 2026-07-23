import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/text.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('uses native semantics independently from the visual recipe', async ({ page }) => {
  await expect(page.locator('#default > p')).toHaveText('Default paragraph');
  await expect(page.locator('#heading > h3')).toHaveText('Semantic heading');
  await expect(page.locator('#heading')).toHaveClass(/ds-text--display-small/);
  await expect(page.locator('#label > label')).toHaveAttribute('for', 'named-input');
});

test('inherits owner color and keeps one-line metric height atomic', async ({ page }) => {
  const owner = page.locator('main');
  const text = page.locator('#default');

  await expect(text).toHaveClass(/ds-text--color-inherit/);
  await expect(text).toHaveCSS(
    'color',
    await owner.evaluate(element => getComputedStyle(element).color),
  );
  const metrics = await text.evaluate(element => {
    const style = getComputedStyle(element);
    return {
      height: element.getBoundingClientRect().height,
      lineHeight: Number.parseFloat(style.lineHeight),
    };
  });
  expect(metrics.height).toBe(metrics.lineHeight);
});

test('applies bounded line truncation to the inner semantic element', async ({ page }) => {
  const text = page.locator('#truncated');
  const inner = text.locator('p');

  await expect(text).toHaveClass(/ds-text--truncate-2/);
  await expect(inner).toHaveCSS('overflow', 'hidden');
  await expect.poll(() => inner.evaluate(element => (
    getComputedStyle(element).webkitLineClamp
  ))).toBe('2');
});

test('uses solid underline for links and dotted underline for hidden interaction triggers', async ({ page }) => {
  const linkText = page.locator('#link-text');
  const tooltipText = page.locator('#tooltip-text');

  await expect(linkText).toHaveClass(/ds-text--decoration-underline/);
  await expect(linkText.locator('xpath=..')).toHaveAttribute('href', '#docs');
  await expect(tooltipText).toHaveClass(/ds-text--decoration-dotted-underline/);
  await expect(tooltipText.locator('xpath=..')).toHaveAttribute('aria-describedby', 'term-tooltip');
  await expect(page.locator('#term-tooltip')).toHaveRole('tooltip');
  const decorationColors = await linkText.evaluate(element => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-foreground-tertiary)';
    document.body.append(probe);
    const result = {
      solid: getComputedStyle(element).textDecorationColor,
      tertiary: getComputedStyle(probe).color,
    };
    probe.remove();
    return result;
  });
  await expect(tooltipText).toHaveCSS('text-decoration-color', decorationColors.tertiary);
  expect(decorationColors.solid).toBe(decorationColors.tertiary);
});

test('keeps generating text readable and static under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');

  const shimmer = page.locator('#shimmer > span');
  await expect(shimmer).toHaveText('Generating summary');
  await expect(shimmer).toHaveCSS('animation-name', 'none');
});

test('uses tabular glyph widths only when requested', async ({ page }) => {
  await expect(page.locator('#numbers')).toHaveCSS('font-variant-numeric', 'tabular-nums');
  await expect(page.locator('#default')).toHaveCSS('font-variant-numeric', 'normal');
});

test('has no detectable accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
