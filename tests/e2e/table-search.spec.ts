import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/table-search.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('keeps input focus while slash, arrows, and Enter add a canonical field tag @cross-browser', async ({
  page,
}) => {
  const search = page.locator('#search');
  const input = search.getByRole('combobox', { name: 'Search vehicles' });

  await expect(input).toHaveCSS('font-size', '14px');
  await expect(input).toHaveCSS('line-height', '20px');
  await expect(search.getByRole('button', { name: 'Choose search fields' })).toBeVisible();
  await input.fill('ab');
  await input.press('/');
  await expect(search.getByRole('listbox', { name: 'Choose search fields' })).toBeVisible();
  await expect(input).toHaveValue('ab');
  await expect(input).toBeFocused();
  await expect(search.getByRole('option')).toHaveText([
    'Vehicle ID',
    'Vehicle make',
    'Vehicle model',
    'Vehicle year',
    'Driver name',
    'Driver ID',
  ]);

  const firstActive = await input.getAttribute('aria-activedescendant');
  await input.press('ArrowDown');
  await expect
    .poll(() => input.getAttribute('aria-activedescendant'))
    .not.toBe(firstActive);
  const secondActive = await input.getAttribute('aria-activedescendant');
  await input.press('ArrowLeft');
  await expect(input).toBeFocused();
  expect(await input.getAttribute('aria-activedescendant')).toBe(secondActive);
  expect(await input.evaluate((element: HTMLInputElement) => element.selectionStart)).toBe(1);

  await input.press('Enter');
  await expect(search.getByRole('listbox')).toHaveCount(0);
  await expect(input).toBeFocused();
  await expect(search.locator('ds-tag')).toHaveJSProperty('label', 'Vehicle make');
  await expect(search.locator('ds-tag')).toHaveJSProperty('size', 'md');
  await expect(search.locator('ds-tag')).toHaveJSProperty('isInset', true);
  await expect(search.locator('ds-tag')).toHaveJSProperty('insetDepth', 'double');
  await expect
    .poll(() =>
      search.evaluate(
        (element: HTMLElement & { selectedFieldIds: string[] }) => element.selectedFieldIds
      )
    )
    .toEqual(['vehicleMake']);
});

test('edits query before Backspace removes the last field and supports multiple OR scopes', async ({
  page,
}) => {
  const search = page.locator('#search');
  const input = search.getByRole('combobox', { name: 'Search vehicles' });

  await input.focus();
  await input.press('/');
  await input.press('Enter');
  await input.press('/');
  await input.press('ArrowDown');
  await input.press('Enter');
  await expect
    .poll(() =>
      search.evaluate(
        (element: HTMLElement & { selectedFieldIds: string[] }) => element.selectedFieldIds
      )
    )
    .toEqual(['vehicleId', 'vehicleModel']);

  await input.fill('sam');
  await input.press('Backspace');
  await expect(input).toHaveValue('sa');
  await expect(search.locator('ds-tag')).toHaveCount(2);

  await input.fill('');
  await input.press('Backspace');
  await expect
    .poll(() =>
      search.evaluate(
        (element: HTMLElement & { selectedFieldIds: string[] }) => element.selectedFieldIds
      )
    )
    .toEqual(['vehicleId']);
  await expect(search.locator('ds-tag')).toHaveCount(1);

  await search.getByRole('button', { name: 'Clear search' }).click();
  await expect(input).toHaveValue('');
  await expect(search.locator('ds-tag')).toHaveCount(0);
  await expect(input).toBeFocused();
});

test('has no detectable accessibility violations in the open field menu', async ({ page }) => {
  const input = page.getByRole('combobox', { name: 'Search vehicles' });
  await input.focus();
  await input.press('/');
  await expect(page.getByRole('listbox', { name: 'Choose search fields' })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
