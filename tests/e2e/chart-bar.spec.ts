import { expect, test } from '@playwright/test';

test('rounds only the bar corners away from the zero axis', async ({ page }) => {
  await page.goto('/chart-bar.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');

  const chart = page.locator('#chart');
  const roundedBars = chart.locator('.chart-bar__bar--rounded');
  const squareBases = chart.locator('.chart-bar__bar--square-base');

  await expect(roundedBars).toHaveCount(4);
  await expect(squareBases).toHaveCount(4);
  await expect(roundedBars.first()).toHaveCSS('rx', '2px');

  const geometry = await squareBases.evaluateAll(bases =>
    bases.map(base => {
      const y = Number(base.getAttribute('y'));
      const height = Number(base.getAttribute('height'));
      return {
        bottom: y + height,
        rx: getComputedStyle(base).rx,
      };
    })
  );

  for (const base of geometry) {
    expect(base.bottom).toBeCloseTo(200, 5);
    expect(base.rx).toBe('auto');
  }
});
