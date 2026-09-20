import { expect, test } from '@playwright/test';

for (const [timezoneId, time] of [
  ['America/Los_Angeles', /5:00\sPM/],
  ['Pacific/Kiritimati', /2:00\sPM/],
] as const) {
  test.describe(timezoneId, () => {
    test.use({ locale: 'de-DE', timezoneId });
    test('English defaults and UTC chart dates stay consistent across viewer timezones @cross-browser', async ({
      page,
    }) => {
      await page.goto('/formatting.html');
      const chart = page.locator('#dates');
      await expect(chart.locator('.chart__tick--x').first()).toHaveText('Sep 10');
      await expect(chart.locator('.chart__tick--y').first()).toHaveText('12,345.5');
      await chart.locator('svg').press('Home');
      await expect(chart.locator('.chart__status')).toContainText('Sep 10, 2026');
      await expect(chart.locator('.chart__status')).toContainText('12,345.5');
      await expect(page.locator('#number .slider__value')).toHaveText('12,345.5');
      await expect(page.locator('#message time')).toHaveText(time);
      await expect(page.locator('#message time')).toHaveAttribute(
        'datetime',
        '2026-09-10T00:00:00Z'
      );
      await chart.evaluate((element: HTMLDsChartElement) => {
        element.locale = 'de-DE';
      });
      await expect(chart.locator('.chart__tick--y').first()).toHaveText('12.345,5');
      await chart.evaluate((element: HTMLDsChartElement) => {
        element.locale = 'invalid_locale';
      });
      await expect(chart.locator('.chart__tick--y').first()).toHaveText('12,345.5');
    });
  });
}
