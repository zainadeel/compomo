import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/card-chart.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});
test('owns chart heading, actions, body, and token-based dimensions', async ({ page }) => {
  const shell = page.locator('#viz-shell');
  await expect(shell.locator('.card-chart__title')).toHaveText('Fuel trend');
  await expect(shell.locator('.card-chart__actions ds-button-unfilled')).toHaveCount(1);
  await expect(shell.locator('.card-chart__body #viz-content')).toHaveText('Visualization content');
  await expect(shell).toHaveCSS('width', '400px');
});

test('polar definition retains the unified chart and static external legend composition', async ({ page }) => {
  const card = page.locator('#donut-card');
  await expect(card.locator('.card-chart__title')).toHaveText('Availability status');
  await expect(card.locator('.card-chart__chart ds-chart')).toHaveCount(1);
  await expect(card.locator('.card-chart__legend ds-chart-legend')).toHaveCount(1);
});

test('uses the shared one-pixel internal gap for stacked bar segments', async ({ page }) => {
  const rectangles = page.locator('#chart-card ds-chart rect.chart__mark');
  await expect(rectangles).toHaveCount(6);
  const gap = await rectangles.evaluateAll(elements => {
    const lower = (elements[0] as SVGRectElement).getBBox();
    const upper = (elements[1] as SVGRectElement).getBBox();
    return lower.y - (upper.y + upper.height);
  });
  expect(gap).toBeCloseTo(1, 2);
});

test('chart variant composes ds-chart with a static external legend', async ({ page }) => {
  const card = page.locator('#chart-card');
  const chart = card.locator('ds-chart');
  const legend = card.locator('ds-chart-legend');
  await expect(card.locator('.card-chart__title')).toHaveText('Vehicle activity');
  await expect(card.locator('.card-chart__chart ds-chart')).toHaveCount(1);
  await expect(legend).toHaveJSProperty('highlightOnHover', false);

  const [regionBox, chartBox] = await Promise.all([
    card.locator('.card-chart__chart').boundingBox(),
    chart.locator('svg').boundingBox(),
  ]);
  expect(regionBox).not.toBeNull();
  expect(chartBox).not.toBeNull();
  expect(chartBox!.width).toBeLessThanOrEqual(regionBox!.width);
});

test('chart geometry grows with the card while visual primitives stay constant', async ({ page }) => {
  const card = page.locator('#chart-card');
  const chart = card.locator('ds-chart');
  const before = await chart.evaluate(element => {
    const svg = element.querySelector('svg')!;
    const tick = element.querySelector<SVGTextElement>('.chart__tick')!;
    const grid = element.querySelector<SVGLineElement>('.chart__grid')!;
    return {
      width: Number(svg.getAttribute('width')),
      fontSize: getComputedStyle(tick).fontSize,
      strokeWidth: getComputedStyle(grid).strokeWidth,
    };
  });
  await card.evaluate(element => { (element as HTMLElement & { cardWidth: 'lg' }).cardWidth = 'lg'; });
  await expect(card).toHaveCSS('width', '600px');
  await expect.poll(() => chart.locator('svg').evaluate(element => Number(element.getAttribute('width')))).toBeGreaterThan(before.width);
  expect(await chart.locator('.chart__tick').first().evaluate(element => getComputedStyle(element).fontSize)).toBe(before.fontSize);
  expect(await chart.locator('.chart__grid').first().evaluate(element => getComputedStyle(element).strokeWidth)).toBe(before.strokeWidth);
});
