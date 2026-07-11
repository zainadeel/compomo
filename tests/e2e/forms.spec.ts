import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.goto('/forms.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('submits, validates, and resets form-associated controls', async ({ page }) => {
  await page.locator('#submit').click();
  expect(await page.evaluate(() => (window as typeof window & { __submitted?: unknown }).__submitted)).toBeUndefined();

  await page.locator('ds-input input').fill('person@example.com');
  await page.locator('#terms').click();
  await page.locator('#region').evaluate((element: HTMLDsSelectElement) => { element.value = 'ca'; });
  await page.locator('#tier [data-radio-item]').first().click();
  await page.locator('#alert-fieldset').evaluate((element: HTMLFieldSetElement) => { element.disabled = true; });
  await expect(page.locator('#alerts')).toHaveAttribute('aria-disabled', 'true');
  await page.locator('#alert-fieldset').evaluate((element: HTMLFieldSetElement) => { element.disabled = false; });
  await expect(page.locator('#alerts')).not.toHaveAttribute('aria-disabled', 'true');
  await page.locator('#alerts').evaluate((element: HTMLDsToggleElement) => { element.click(); });
  await page.locator('#submit').click();

  await expect.poll(() => page.evaluate(() => (window as typeof window & { __submitted?: unknown }).__submitted)).toEqual({
    email: 'person@example.com',
    terms: 'accepted',
    region: 'ca',
    tier: 'standard',
    alerts: 'enabled',
  });

  await page.locator('#reset').click();
  await expect(page.locator('ds-input input')).toHaveValue('');
  await expect(page.locator('#terms')).toHaveAttribute('aria-checked', 'false');
});

test('exposes overridable localized accessibility labels', async ({ page }) => {
  await expect(page.locator('ds-pagination nav')).toHaveAttribute('aria-label', 'Paginación');
  await expect(page.locator('ds-pagination button').first()).toHaveAttribute('aria-label', 'Página anterior');
  await expect(page.locator('ds-pagination button').last()).toHaveAttribute('aria-label', 'Página siguiente');
});

test('has no serious or critical accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  const highImpact = results.violations.filter(violation =>
    violation.impact === 'serious' || violation.impact === 'critical'
  );
  expect(highImpact).toEqual([]);
});
