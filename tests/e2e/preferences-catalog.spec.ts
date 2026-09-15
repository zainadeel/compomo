import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/preferences-catalog.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('customizes a non-table catalog with toggle-only rows', async ({ page }) => {
  const control = page.locator('#toggle-only');
  const menu = control.getByRole('menu', { name: 'Customize view' });

  await expect(menu).toBeVisible();
  await expect(control.getByText('Data', { exact: true })).toBeVisible();
  await expect(control.getByText('Options', { exact: true })).toBeVisible();

  // Switch rows, and no drag handle anywhere in the catalog.
  const rows = menu.getByRole('menuitemcheckbox');
  await expect(rows.filter({ hasText: 'Driver ID' })).toHaveCount(1);
  await expect(control.locator('.menu-item__handle')).toHaveCount(0);

  // Nothing is locked: no catalog row is disabled, unlike the table's last column.
  await expect(rows.filter({ has: page.locator('[aria-disabled="true"]') })).toHaveCount(0);

  // Every entry stays hideable, including the last visible one.
  for (const label of ['Driver ID', 'Vehicle MMY', 'Motion detail']) {
    await rows.filter({ hasText: label }).click();
  }
  await expect
    .poll(() => control.evaluate((element: HTMLDsDataPreferencesElement) => element.hiddenFieldIds))
    .toEqual(['driverId', 'vehicleMmy', 'motion']);
});

test('keeps the table catalog reorderable with its last column locked', async ({ page }) => {
  const control = page.locator('#table-catalog');
  const menu = control.getByRole('menu', { name: 'Customize table' });

  await expect(menu).toBeVisible();
  // Drag handles and the default menu name are unchanged for a table.
  await expect(control.locator('.menu-item__handle').first()).toBeVisible();

  // Driver is the only visible data column left, so the table locks it.
  const driver = menu.getByRole('menuitemcheckbox').filter({ hasText: 'Driver' }).first();
  await expect(driver).toHaveAttribute('aria-disabled', 'true');
  await expect(driver).toHaveAttribute('aria-checked', 'true');

  // A hidden column stays togglable back on.
  const status = menu.getByRole('menuitemcheckbox').filter({ hasText: 'Status' }).first();
  await expect(status).not.toHaveAttribute('aria-disabled', 'true');
  await status.click();
  await expect
    .poll(() => control.evaluate((element: HTMLDsDataPreferencesElement) => element.hiddenFieldIds))
    .toEqual(['vehicle']);
});
