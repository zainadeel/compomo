import { expect, test } from '@playwright/test';
import { expectDefiniteBounds, expectGeometryClose } from './rendered-geometry';

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

test('uses the visible label for its accessible name unless overridden', async ({ page }) => {
  const control = page.locator('#standalone-customize');
  const trigger = control.getByRole('button', { name: 'Visible fields', exact: true });
  await expect(trigger).toContainText('Visible fields');
  await trigger.click();
  await expect(page.getByRole('menu', { name: 'Visible fields', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();

  await control.evaluate((el: HTMLDsDataCustomizeElement) => {
    el.label = 'Card details';
  });
  await expect(control.getByRole('button')).toHaveAccessibleName('Card details');
  await control.evaluate((el: HTMLDsDataCustomizeElement) => {
    el.ariaLabel = 'Card details on map';
  });
  await expect(control.getByRole('button')).toHaveAccessibleName('Card details on map');
  await control.getByRole('button').click();
  await expect(page.getByRole('menu', { name: 'Card details on map', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');

  await control.evaluate((el: HTMLDsDataCustomizeElement) => {
    el.ariaLabel = ' ';
    el.label = ' ';
  });
  await expect(control.getByRole('button')).toHaveAccessibleName('Customize');
});

test('resizes standalone toolbar controls while preserving names and keyboard access @cross-browser', async ({
  page,
}) => {
  const toolbar = page.locator('#standalone-toolbar');
  const controls = [
    { id: 'views', label: 'West region', role: 'combobox' as const },
    { id: 'filter', label: 'Filter', role: 'combobox' as const },
    { id: 'group', label: 'Group', role: 'button' as const },
    { id: 'sort', label: 'Sort', role: 'button' as const },
    { id: 'customize', label: 'Visible fields', role: 'button' as const },
  ];
  const names: string[] = [];
  await expectDefiniteBounds(toolbar, { label: 'wide standalone toolbar', width: 960 });
  for (const control of controls) {
    const trigger = toolbar.locator(`#standalone-${control.id}`).getByRole(control.role);
    await expect(trigger).toContainText(control.label);
    names.push((await trigger.getAttribute('aria-label'))!);
  }

  await toolbar.evaluate(el => {
    el.style.width = '240px';
  });
  await expectDefiniteBounds(toolbar, { label: 'compact standalone toolbar', width: 240 });
  for (const [index, control] of controls.entries()) {
    const trigger = toolbar.locator(`#standalone-${control.id}`).getByRole(control.role);
    await expect(trigger).not.toContainText(control.label);
    await expect(trigger).toHaveAccessibleName(names[index]);
    const bounds = await expectDefiniteBounds(trigger, { label: `compact ${control.id}` });
    expectGeometryClose(bounds.width, bounds.height, `square ${control.id} trigger`);
  }
  const scroll = await toolbar.getByRole('toolbar').evaluate(el => ({
    width: el.clientWidth,
    content: el.scrollWidth,
  }));
  expectGeometryClose(scroll.content, scroll.width, 'compact controls fit the toolbar');

  const customize = toolbar.locator('#standalone-customize').getByRole('button');
  await customize.focus();
  await expect(page.getByRole('tooltip', { name: 'Visible fields', exact: true })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menu', { name: 'Visible fields', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(customize).toBeFocused();

  await toolbar.evaluate(el => {
    el.style.width = '960px';
  });
  for (const control of controls) {
    await expect(
      toolbar.locator(`#standalone-${control.id}`).getByRole(control.role)
    ).toContainText(control.label);
  }
});
