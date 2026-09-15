import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/data-customize.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('hides every field and keeps options in their own section', async ({ page }) => {
  const control = page.locator('#customize');
  await control.getByRole('button', { name: 'Customize view' }).click();

  const menu = page.getByRole('menu', { name: 'Customize view' });
  await expect(menu).toBeVisible();
  await expect(menu.getByText('Data', { exact: true })).toBeVisible();
  await expect(menu.getByText('Options', { exact: true })).toBeVisible();
  // Show and hide is the default, so no row carries a drag handle.
  await expect(menu.locator('.menu-item__handle')).toHaveCount(0);

  const rows = menu.getByRole('menuitemcheckbox');
  for (const label of ['Driver ID', 'Vehicle MMY', 'Motion detail']) {
    await rows.filter({ hasText: label }).click();
  }
  await expect
    .poll(() => control.evaluate((el: HTMLDsDataCustomizeElement) => el.hiddenFieldIds))
    .toEqual(['driverId', 'vehicleMmy', 'motion']);

  // An options row reports separately and never touches the field config.
  await rows.filter({ hasText: 'Show applied filters' }).click();
  await expect(control).toHaveAttribute('data-last-option', 'show-filters');
  await expect
    .poll(() => control.evaluate((el: HTMLDsDataCustomizeElement) => el.hiddenFieldIds))
    .toEqual(['driverId', 'vehicleMmy', 'motion']);
});

test('locks the last visible field when minVisible is raised', async ({ page }) => {
  const control = page.locator('#reorderable');
  await control.getByRole('button', { name: 'Customize columns' }).click();

  const menu = page.getByRole('menu', { name: 'Customize columns' });
  await expect(menu).toBeVisible();
  // Reorder is opt-in, so this one does show drag handles.
  await expect(menu.locator('.menu-item__handle').first()).toBeVisible();

  const driver = menu.getByRole('menuitemcheckbox').filter({ hasText: 'Driver ID' }).first();
  await expect(driver).toHaveAttribute('aria-disabled', 'true');
  await expect(driver).toHaveAttribute('aria-checked', 'true');
});
