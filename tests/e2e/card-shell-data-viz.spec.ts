import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/card-shell-data-viz.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('owns data-viz heading, actions, body, and token-based dimensions', async ({ page }) => {
  const shell = page.locator('#viz-shell');
  await expect(shell.locator('.card-shell-data-viz__title')).toHaveText('Fuel trend');
  await expect(shell.locator('.card-shell-data-viz__actions ds-button-unfilled')).toHaveCount(1);
  await expect(shell.locator('.card-shell-data-viz__body #viz-content')).toHaveText('Visualization content');

  const dimensions = await shell.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  expect(dimensions.width).toBe(400);
  expect(dimensions.height).toBeGreaterThanOrEqual(400);
});

test('CardDataVizDonut composes the dedicated data-viz shell', async ({ page }) => {
  const card = page.locator('#donut-card');
  await expect(card.locator('ds-card-shell-data-viz')).toHaveCount(1);
  await expect(card.locator('ds-card')).toHaveCount(0);
  await expect(card.locator('.card-shell-data-viz__title')).toHaveText('Availability status');
  await expect(card.locator('.card-data-viz-donut__chart-region')).toContainText('Donut chart');
  await expect(card.locator('.card-data-viz-donut__legend-region')).toContainText('Donut legend');
});

test('CardDataVizLine composes a fitting line chart with a static legend', async ({ page }) => {
  const card = page.locator('#line-card');
  const chartRegion = card.locator('.card-data-viz-line__chart-region');
  const chart = card.locator('ds-chart-line');
  const legend = card.locator('ds-chart-legend');
  const legendRows = legend.locator('.chart-legend__item');

  await expect(card.locator('ds-card-shell-data-viz')).toHaveCount(1);
  await expect(card.locator('.card-shell-data-viz__title')).toHaveText('Fuel trend');
  await expect(chartRegion.locator('ds-chart-line')).toHaveCount(1);
  await expect(legend).toHaveJSProperty('highlightOnHover', false);

  const [regionBox, chartBox] = await Promise.all([
    chartRegion.boundingBox(),
    chart.locator('svg').boundingBox(),
  ]);
  expect(regionBox).not.toBeNull();
  expect(chartBox).not.toBeNull();
  expect(chartBox!.width).toBeLessThanOrEqual(regionBox!.width);

  await legendRows.first().hover();
  await expect
    .poll(() =>
      legendRows.evaluateAll(elements => elements.map(row => getComputedStyle(row).opacity))
    )
    .toEqual(['1', '1']);
});

test('CardDataVizBar composes stacked bars with a static legend', async ({ page }) => {
  const card = page.locator('#bar-card');
  const chartRegion = card.locator('.card-data-viz-bar__chart-region');
  const chart = card.locator('ds-chart-bar-stacked');
  const legend = card.locator('ds-chart-legend');
  const legendRows = legend.locator('.chart-legend__item');

  await expect(card.locator('ds-card-shell-data-viz')).toHaveCount(1);
  await expect(card.locator('.card-shell-data-viz__title')).toHaveText('Vehicle activity');
  await expect(chartRegion.locator('ds-chart-bar-stacked')).toHaveCount(1);
  await expect(legend).toHaveJSProperty('highlightOnHover', false);

  const [regionBox, chartBox] = await Promise.all([
    chartRegion.boundingBox(),
    chart.locator('svg').boundingBox(),
  ]);
  expect(regionBox).not.toBeNull();
  expect(chartBox).not.toBeNull();
  expect(chartBox!.width).toBeLessThanOrEqual(regionBox!.width);

  await legendRows.first().hover();
  await expect
    .poll(() =>
      legendRows.evaluateAll(elements => elements.map(row => getComputedStyle(row).opacity))
    )
    .toEqual(['1', '1']);
});
