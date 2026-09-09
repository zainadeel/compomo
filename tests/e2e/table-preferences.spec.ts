import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/table-preferences.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('shares controlled preferences across tabs and restores focus @cross-browser', async ({
  page,
}) => {
  const trigger = page.getByRole('button', { name: 'Table preferences' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Table preferences', exact: true });
  await expect(dialog.getByRole('tab', { name: 'Filters', exact: true })).toHaveCSS('height', '32px');
  await expect(dialog.getByRole('tab', { name: 'Filters', exact: true })).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await dialog.getByRole('option', { name: 'Driving', exact: true }).click();
  await dialog.getByRole('tab', { name: 'Sort', exact: true }).click();
  await dialog.getByRole('menuitem', { name: 'Status', exact: true }).click();
  await dialog.getByRole('tab', { name: 'Group', exact: true }).click();
  await dialog.getByRole('option', { name: 'Status', exact: true }).click();
  await dialog.getByRole('option', { name: 'Descending', exact: true }).click();
  await dialog.getByRole('tab', { name: 'Customize', exact: true }).click();
  await dialog.getByRole('menuitemcheckbox', { name: 'Vehicle', exact: true }).click();
  await expect
    .poll(() =>
      page.locator('#preferences').evaluate((el: HTMLDsTablePreferencesElement) => ({
        values: el.values,
        sort: el.sort,
        grouping: el.grouping,
        hidden: el.hiddenColumnIds,
      }))
    )
    .toEqual({
      values: { status: ['driving'] },
      sort: { columnId: 'status', direction: 'asc' },
      grouping: { columnId: 'status', direction: 'desc' },
      hidden: ['vehicle'],
    });
  await dialog.getByRole('tab', { name: 'Filters', exact: true }).click();
  await expect(dialog.getByRole('option', { name: 'Driving', exact: true })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('fits a mobile viewport and supports keyboard tab switching and outside dismissal @cross-browser', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const trigger = page.getByRole('button', { name: 'Table preferences' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Table preferences', exact: true });
  await expect(dialog.getByRole('tab', { name: 'Filters', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(dialog.getByRole('tab', { name: 'Sort', exact: true })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  const bounds = await dialog.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(375);
  await page.locator('#after').click();
  await expect(dialog).toHaveCount(0);
});
