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
