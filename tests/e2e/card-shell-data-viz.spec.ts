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
  await expect(card.locator('.ds-data-viz-card-chart ds-chart-donut')).toHaveCount(1);
  await expect(card.locator('.ds-data-viz-card-legend ds-chart-legend')).toHaveCount(1);
});

test('CardDataVizLine composes a fitting line chart with a static legend', async ({ page }) => {
  const card = page.locator('#line-card');
  const chartRegion = card.locator('.ds-data-viz-card-chart');
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
  const chartRegion = card.locator('.ds-data-viz-card-chart');
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

type CartesianMetrics = {
  width: number;
  height: number;
  widthAttribute: number;
  heightAttribute: number;
  viewBox: string | null;
  fontSize: string;
  gridStroke: string;
  primaryStroke?: string;
  secondaryStroke?: string;
  pointRadius?: string;
  barRadius?: string;
  plotWidth: number;
  plotHeight: number;
};

const readCartesianMetrics = async (
  chart: import('@playwright/test').Locator,
  kind: 'line' | 'stacked' | 'bar',
): Promise<CartesianMetrics> =>
  chart.evaluate((element, chartKind) => {
    const svg = element.querySelector('svg')!;
    const svgRect = svg.getBoundingClientRect();
    const label = element.querySelector<SVGTextElement>(
      chartKind === 'line'
        ? '.chart-line__axis-label'
        : chartKind === 'stacked'
          ? '.chart-bar-stacked__axis-label'
          : '.chart-bar__axis-label',
    )!;
    const gridline = element.querySelector<SVGLineElement>(
      chartKind === 'line'
        ? '.chart-line__gridline'
        : chartKind === 'stacked'
          ? '.chart-bar-stacked__gridline'
          : '.chart-bar__gridline',
    )!;
    const gridRect = gridline.getBoundingClientRect();

    if (chartKind === 'line') {
      const path = element.querySelector<SVGPathElement>('.chart-line__path')!;
      const point = element.querySelector<SVGCircleElement>('.chart-line__point')!;
      return {
        width: svgRect.width,
        height: svgRect.height,
        widthAttribute: Number(svg.getAttribute('width')),
        heightAttribute: Number(svg.getAttribute('height')),
        viewBox: svg.getAttribute('viewBox'),
        fontSize: getComputedStyle(label).fontSize,
        gridStroke: getComputedStyle(gridline).strokeWidth,
        primaryStroke: getComputedStyle(path).strokeWidth,
        secondaryStroke: getComputedStyle(point).strokeWidth,
        pointRadius: getComputedStyle(point).r,
        plotWidth: gridRect.width,
        plotHeight: path.getBoundingClientRect().height,
      };
    }

    const bar = element.querySelector<SVGRectElement>(
      chartKind === 'stacked'
        ? '.chart-bar-stacked__segment-shape--rounded'
        : '.chart-bar__bar--rounded',
    )!;
    const separator =
      chartKind === 'stacked'
        ? element.querySelector<SVGLineElement>('.chart-bar-stacked__segment-separator')
        : null;
    const barRect = bar.getBoundingClientRect();
    return {
      width: svgRect.width,
      height: svgRect.height,
      widthAttribute: Number(svg.getAttribute('width')),
      heightAttribute: Number(svg.getAttribute('height')),
      viewBox: svg.getAttribute('viewBox'),
      fontSize: getComputedStyle(label).fontSize,
      gridStroke: getComputedStyle(gridline).strokeWidth,
      secondaryStroke: separator ? getComputedStyle(separator).strokeWidth : undefined,
      barRadius: getComputedStyle(bar).rx,
      plotWidth: gridRect.width,
      plotHeight: barRect.height,
    };
  }, kind);

const expectFixedVisualMetrics = (
  before: CartesianMetrics,
  after: CartesianMetrics,
) => {
  expect(after.viewBox).toBeNull();
  expect(after.fontSize).toBe(before.fontSize);
  expect(after.gridStroke).toBe(before.gridStroke);
  expect(after.primaryStroke).toBe(before.primaryStroke);
  expect(after.secondaryStroke).toBe(before.secondaryStroke);
  expect(after.pointRadius).toBe(before.pointRadius);
  expect(after.barRadius).toBe(before.barRadius);
};

for (const chartCase of [
  { cardId: 'line-card', selector: 'ds-chart-line', kind: 'line' as const },
  { cardId: 'bar-card', selector: 'ds-chart-bar-stacked', kind: 'stacked' as const },
  { cardId: 'regular-bar-card', selector: 'ds-chart-bar', kind: 'bar' as const },
]) {
  test(`${chartCase.selector} reflows across card sizes without scaling visual primitives`, async ({
    page,
  }) => {
    const card = page.locator(`#${chartCase.cardId}`);
    const shell = card.locator('ds-card-shell-data-viz');
    const chart = card.locator(chartCase.selector);
    const before = await readCartesianMetrics(chart, chartCase.kind);

    expect(before.viewBox).toBeNull();
    expect(before.widthAttribute).toBeCloseTo(before.width, 1);
    expect(before.heightAttribute).toBeCloseTo(before.height, 1);

    await card.evaluate(element => {
      (element as HTMLElement & { cardWidth: 'lg' }).cardWidth = 'lg';
    });
    await expect(shell).toHaveCSS('width', '600px');
    await expect
      .poll(() => chart.locator('svg').evaluate(element => Number(element.getAttribute('width'))))
      .toBeGreaterThan(before.widthAttribute);

    const after = await readCartesianMetrics(chart, chartCase.kind);
    expect(after.width).toBeGreaterThan(before.width);
    expect(after.height).toBeGreaterThan(before.height);
    expect(after.plotWidth).toBeGreaterThan(before.plotWidth);
    expect(after.plotHeight).toBeGreaterThan(before.plotHeight);
    expect(after.widthAttribute).toBeCloseTo(after.width, 1);
    expect(after.heightAttribute).toBeCloseTo(after.height, 1);
    expectFixedVisualMetrics(before, after);
  });
}

test('fill donut keeps token typography and ring thickness while its measured diameter changes', async ({
  page,
}) => {
  const card = page.locator('#donut-card');
  const chart = card.locator('ds-chart-donut');
  const svg = chart.locator('svg');
  const value = chart.locator('.chart-donut__center-value');

  const before = {
    diameter: await svg.evaluate(element => Number(element.getAttribute('width'))),
    fontSize: await value.evaluate(element => getComputedStyle(element).fontSize),
    thickness: await chart.getAttribute('thickness'),
  };

  await card.evaluate(element => {
    (element as HTMLElement & { cardWidth: 'lg' }).cardWidth = 'lg';
  });
  await expect
    .poll(() => svg.evaluate(element => Number(element.getAttribute('width'))))
    .toBeGreaterThanOrEqual(before.diameter);

  expect(await value.evaluate(element => getComputedStyle(element).fontSize)).toBe(
    before.fontSize,
  );
  expect(await chart.getAttribute('thickness')).toBe(before.thickness);
  await expect(chart).toHaveJSProperty('thickness', '--dimension-size-200');
});
