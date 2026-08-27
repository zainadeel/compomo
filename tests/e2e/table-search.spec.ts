import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/table-search.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('keeps input focus while slash, arrows, and Enter add a canonical field chip @cross-browser', async ({
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
  await expect.poll(() => input.getAttribute('aria-activedescendant')).not.toBe(firstActive);
  const secondActive = await input.getAttribute('aria-activedescendant');
  await input.press('ArrowLeft');
  await expect(input).toBeFocused();
  expect(await input.getAttribute('aria-activedescendant')).toBe(secondActive);
  expect(await input.evaluate((element: HTMLInputElement) => element.selectionStart)).toBe(1);

  await input.press('Enter');
  await expect(search.getByRole('listbox')).toHaveCount(0);
  await expect(input).toBeFocused();
  const chip = search.locator('ds-chip');
  await expect(chip).toHaveJSProperty('label', 'Vehicle make');
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
    .toEqual(['vehicleMake']);

  await search.getByRole('button', { name: 'Remove Vehicle make' }).click();
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
  const slash = search.getByRole('button', { name: 'Choose search fields' });
  const slashWidth = await slash.evaluate(element => element.getBoundingClientRect().width);
  await expect(search.locator('.table-search__slash')).toHaveJSProperty('insetDepth', 'double');
  await expect(search.locator('.table-search__clear')).toHaveJSProperty('size', 'sm');
  await expect(search.locator('.table-search__clear')).toHaveJSProperty('isInset', false);
  expect(slashWidth).toBe(24);
  const clear = search.getByRole('button', { name: 'Clear search' });
  await expect(clear).toBeVisible();
  await expect(search.locator('.table-search__action-divider')).toBeVisible();
  await expect(search.locator('.table-search__actions')).toHaveCSS('column-gap', '4px');
  const [clearBox, slashBox] = await Promise.all([clear.boundingBox(), slash.boundingBox()]);
  const controlBox = await search.locator('.table-search__control').boundingBox();
  expect(clearBox).not.toBeNull();
  expect(slashBox).not.toBeNull();
  expect(controlBox).not.toBeNull();
  expect(clearBox!.x).toBeLessThan(slashBox!.x);
  expect(Math.round(slashBox!.y - controlBox!.y)).toBe(4);
  expect(Math.round(controlBox!.y + controlBox!.height - (slashBox!.y + slashBox!.height))).toBe(4);
  expect(Math.round(controlBox!.x + controlBox!.width - (slashBox!.x + slashBox!.width))).toBe(4);
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
  await expect(slash).toBeVisible();
  await expect
    .poll(() => slash.evaluate(element => element.getBoundingClientRect().width))
    .toBe(slashWidth);
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
