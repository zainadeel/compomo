import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/chart-legend.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('locks percentage formatting to one or two decimal places', async ({ page }) => {
  await expect(page.locator('#legend-one .chart-legend__percentage').last()).toHaveText('89.1%');
  await expect(page.locator('#legend-two .chart-legend__percentage').last()).toHaveText('89.07%');
});

test('keeps right-aligned percentages inside the hover row', async ({ page }) => {
  const legend = page.locator('#legend-two');
  const rows = legend.locator('.chart-legend__item');
  await rows.last().hover();

  const geometry = await rows.evaluateAll(elements => elements.map(row => {
    const percentage = row.querySelector<HTMLElement>('.chart-legend__percentage')!;
    const text = percentage.querySelector<HTMLElement>('.ds-text__element')!;
    const rowRect = row.getBoundingClientRect();
    const percentageRect = percentage.getBoundingClientRect();
    const textRect = text.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(text);
    const glyphRect = range.getBoundingClientRect();

    return {
      rowRight: rowRect.right,
      percentageRight: percentageRect.right,
      textRight: textRect.right,
      glyphRight: glyphRect.right,
      overflow: percentage.scrollWidth - percentage.clientWidth,
      textAlign: getComputedStyle(text).textAlign,
    };
  }));

  for (const row of geometry) {
    expect(row.textAlign).toBe('right');
    expect(row.overflow).toBeLessThanOrEqual(0);
    expect(row.percentageRight).toBeLessThan(row.rowRight);
    expect(row.glyphRight).toBeLessThanOrEqual(row.textRight);
    expect(row.glyphRight).toBeLessThan(row.rowRight);
  }

  expect(new Set(geometry.map(row => row.percentageRight)).size).toBe(1);
});

test('can render as a static key without local hover highlighting', async ({ page }) => {
  const legend = page.locator('#legend-static');
  const rows = legend.locator('.chart-legend__item');

  await expect(legend).toHaveJSProperty('highlightOnHover', false);
  await expect(rows.first()).not.toHaveClass(/ds-interaction-fill/);
  await rows.first().hover();

  await expect
    .poll(() => rows.evaluateAll(elements => elements.map(row => getComputedStyle(row).opacity)))
    .toEqual(['1', '1', '1', '1', '1']);
  await expect
    .poll(() => page.evaluate(() => (window as any).staticLegendHoverCount))
    .toBe(0);
});
