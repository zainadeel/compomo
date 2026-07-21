import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const hoverDonutRing = async (page: Page, chart: Locator) => {
  const svg = chart.locator('.chart-donut__svg');
  await svg.scrollIntoViewIfNeeded();
  const box = await svg.boundingBox();
  if (!box) throw new Error('Donut SVG did not render');
  await page.mouse.move(box.x + box.width / 2 + 4, box.y + 8);
};

test.beforeEach(async ({ page }) => {
  await page.goto('/chart-donut.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('shows chart-owned tooltip for standalone pointer and keyboard interaction', async ({
  page,
}) => {
  const chart = page.locator('#standalone');
  const firstSlice = chart.locator('.chart-donut__svg path').first();

  await hoverDonutRing(page, chart);
  const pointerTooltip = chart.locator('ds-tooltip-data-viz');
  await expect(pointerTooltip).toBeVisible();
  await expect(pointerTooltip.locator('.tooltip-data-viz__label')).toHaveText('Passed');
  await expect(pointerTooltip.locator('.tooltip-data-viz__value')).toHaveText('68');

  await page.locator('h1').hover();
  await expect(pointerTooltip).toHaveCount(0);

  await firstSlice.focus();
  const keyboardTooltip = chart.locator('ds-tooltip-data-viz');
  await expect(keyboardTooltip).toBeVisible();
  await expect(keyboardTooltip.locator('.tooltip-data-viz__label')).toHaveText('Passed');
});

test('does not open a tooltip from external highlight or when explicitly disabled', async ({
  page,
}) => {
  const external = page.locator('#external-highlight');
  await external.evaluate(element => {
    (element as HTMLElement & { activeLabel: string }).activeLabel = 'Passed';
  });

  await expect(external.locator('ds-tooltip-data-viz')).toHaveCount(0);
  await expect(external.locator('.chart-donut__svg path').nth(1)).toHaveAttribute(
    'opacity',
    '0.25',
  );

  const disabled = page.locator('#tooltip-disabled');
  await hoverDonutRing(page, disabled);
  await expect(disabled.locator('ds-tooltip-data-viz')).toHaveCount(0);
});

test('card suppresses redundant tooltip only when a legend owns persistent detail', async ({
  page,
}) => {
  const cardWithLegend = page.locator('#card-with-legend');
  const chartWithLegend = cardWithLegend.locator('ds-chart-donut');
  await expect(chartWithLegend).toHaveJSProperty('showTooltip', false);
  await hoverDonutRing(page, chartWithLegend);
  await expect(chartWithLegend.locator('ds-tooltip-data-viz')).toHaveCount(0);

  const chartOnly = page.locator('#card-chart-only ds-chart-donut');
  await expect(chartOnly).toHaveJSProperty('showTooltip', true);
  await hoverDonutRing(page, chartOnly);
  await expect(chartOnly.locator('ds-tooltip-data-viz')).toBeVisible();
});
