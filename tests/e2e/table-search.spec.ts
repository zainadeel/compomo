import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/table-search.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('filters the slash menu while input focus, arrows, and Enter add a canonical field chip @cross-browser', async ({
  page,
}) => {
  const search = page.locator('#search');
  const input = search.getByRole('combobox', { name: 'Search vehicles' });

  await expect(input).toHaveCSS('font-size', '14px');
  await expect(input).toHaveCSS('line-height', '20px');
  await expect(search.getByRole('button', { name: 'Choose search fields' })).toHaveCount(0);
  await input.fill('ab');
  await input.press('/');
  await expect(search.getByRole('listbox', { name: 'Choose search fields' })).toBeVisible();
  await expect(input).toHaveValue('');
  await expect(input).toBeFocused();
  await input.fill('driv');
  await expect(search.getByRole('option')).toHaveText(['Driver name', 'Driver ID']);
  await expect
    .poll(() => search.evaluate((element: HTMLElement & { value: string }) => element.value))
    .toBe('ab');

  const firstActive = await input.getAttribute('aria-activedescendant');
  await input.press('ArrowDown');
  await expect.poll(() => input.getAttribute('aria-activedescendant')).not.toBe(firstActive);
  const secondActive = await input.getAttribute('aria-activedescendant');
  await input.press('ArrowLeft');
  await expect(input).toBeFocused();
  expect(await input.getAttribute('aria-activedescendant')).toBe(secondActive);
  expect(await input.evaluate((element: HTMLInputElement) => element.selectionStart)).toBe(3);

  await input.press('Enter');
  await expect(search.getByRole('listbox')).toHaveCount(0);
  await expect(input).toBeFocused();
  const chip = search.locator('ds-chip');
  await expect(chip).toHaveJSProperty('label', 'Driver ID');
  await expect(chip).toHaveJSProperty('size', 'md');
  await expect(chip).toHaveJSProperty('isInset', true);
  await expect(chip).toHaveJSProperty('insetDepth', 'double');
  await expect(chip).toHaveCSS('height', '24px');
  await expect
    .poll(() =>
      search.evaluate(
        (element: HTMLElement & { selectedFieldIds: string[] }) => element.selectedFieldIds
      )
    )
    .toEqual(['driverId']);
  await expect(input).toHaveValue('ab');

  await search.getByRole('button', { name: 'Remove Driver ID' }).click();
  await expect
    .poll(() =>
      search.evaluate(
        (element: HTMLElement & { selectedFieldIds: string[] }) => element.selectedFieldIds
      )
    )
    .toEqual([]);
  await expect(input).toBeFocused();
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
  await expect(search.locator('ds-chip')).toHaveCount(2);

  await input.fill('');
  await input.press('Backspace');
  await expect
    .poll(() =>
      search.evaluate(
        (element: HTMLElement & { selectedFieldIds: string[] }) => element.selectedFieldIds
      )
    )
    .toEqual(['vehicleId']);
  await expect(search.locator('ds-chip')).toHaveCount(1);

  await input.fill('sam');
  await expect(search.getByRole('button', { name: 'Choose search fields' })).toHaveCount(0);
  await expect(search.getByRole('button', { name: 'Clear search' })).toBeVisible();
  await search.getByRole('button', { name: 'Clear search' }).click();
  await expect(input).toHaveValue('');
  await expect(search.locator('ds-chip')).toHaveCount(0);
  await expect
    .poll(() =>
      search.evaluate(
        (element: HTMLElement & { selectedFieldIds: string[] }) => element.selectedFieldIds
      )
    )
    .toEqual([]);
  await expect(search.locator('.table-search__action-divider')).toHaveCount(0);
  await expect(input).toBeFocused();
});

test('treats Backspace as undoing the slash menu before editing query or removing fields', async ({
  page,
}) => {
  const search = page.locator('#search');
  const input = search.getByRole('combobox', { name: 'Search vehicles' });
  const listbox = search.getByRole('listbox', { name: 'Choose search fields' });

  await input.fill('ab');
  await input.press('/');
  await expect(listbox).toBeVisible();

  await input.press('Backspace');
  await expect(listbox).toHaveCount(0);
  await expect(input).toHaveValue('ab');
  await expect(input).toBeFocused();

  await input.fill('');
  await input.press('/');
  await input.press('Enter');
  await expect(search.locator('ds-chip')).toHaveCount(1);

  await input.press('/');
  await expect(listbox).toBeVisible();
  await input.press('Backspace');
  await expect(listbox).toHaveCount(0);
  await expect(search.locator('ds-chip')).toHaveCount(1);

  await input.press('Backspace');
  await expect(search.locator('ds-chip')).toHaveCount(0);
});

test('has no detectable accessibility violations in the open field menu', async ({ page }) => {
  const input = page.getByRole('combobox', { name: 'Search vehicles' });
  await input.focus();
  await input.press('/');
  await expect(page.getByRole('listbox', { name: 'Choose search fields' })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('keeps the native input borderless and fills the search editor', async ({ page }) => {
  const input = page.locator('ds-table-search input').first();
  await expect(input).toHaveCSS('border-top-width', '0px');
  await expect(input).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(page.locator('.table-search__editor').first()).toHaveCSS('display', 'flex');
  const inputBox = await input.boundingBox();
  const editorBox = await page.locator('.table-search__editor').first().boundingBox();
  expect(inputBox!.width).toBeCloseTo(editorBox!.width, 0);
});
