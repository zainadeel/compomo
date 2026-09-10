import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/table-preferences.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('shares controlled preferences across tabs and restores focus @cross-browser', async ({
  page,
}) => {
  const trigger = page.getByRole('button', { name: 'Configure view' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Configure view', exact: true });
  await expect(dialog.getByRole('tab', { name: 'Filters', exact: true })).toHaveCSS(
    'height',
    '32px'
  );
  await expect(dialog.getByRole('tab', { name: 'Filters', exact: true })).toHaveCSS(
    'background-color',
    'rgba(0, 0, 0, 0)'
  );
  await expect.poll(async () => (await dialog.locator('.filter-menu__category-pane').boundingBox())?.width).toBe(200);
  await dialog.getByRole('option', { name: 'Driving', exact: true }).click();
  await expect(page.locator('#preferences')).toHaveJSProperty('values', {});
  await dialog.getByRole('button', { name: 'Apply', exact: true }).click();
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
  const trigger = page.getByRole('button', { name: 'Configure view' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Configure view', exact: true });
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

test('stages filter changes and keeps Apply visible and inactive until changed', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Configure view' }).click();
  const apply = page.getByRole('button', { name: 'Apply', exact: true });
  await expect(apply).toHaveCount(0);
  await page.getByRole('option', { name: 'Driving', exact: true }).click();
  await expect(apply).toBeEnabled();
  const actionGap = await page.locator('.filter-menu__action-separator').evaluate(separator => {
    const apply = separator.previousElementSibling!.getBoundingClientRect();
    const bullet = separator.getBoundingClientRect();
    const clear = separator.nextElementSibling!.getBoundingClientRect();
    return [bullet.left - apply.right, clear.left - bullet.right];
  });
  expect(actionGap).toEqual([8, 8]);
  await expect(page.locator('#preferences')).toHaveJSProperty('values', {});
  await page.getByRole('tab', { name: 'Sort', exact: true }).click();
  await page.getByRole('tab', { name: 'Filters', exact: true }).click();
  await expect(apply).toBeEnabled();
  await apply.click();
  await expect(page.locator('#preferences')).toHaveJSProperty('values', { status: ['driving'] });
  await expect(apply).toBeDisabled();
  await apply.hover();
  await expect(apply).toHaveCSS('text-decoration-line', 'none');
  const clear = page.getByRole('button', { name: 'Clear', exact: true });
  await clear.hover();
  const clearColors = await clear.evaluate(el => {
    const style = getComputedStyle(el);
    return [style.color, style.textDecorationColor];
  });
  expect(clearColors[0]).toBe(clearColors[1]);
  const before = await clear.boundingBox();
  await page.getByRole('option', { name: 'Stopped', exact: true }).click();
  expect((await clear.boundingBox())!.x).toBe(before!.x);
  await clear.click();
  await expect(page.locator('#preferences')).toHaveJSProperty('values', {});
  await expect(apply).toHaveCount(0);
});


test('keeps the menu inside its page boundary instead of covering shell navigation @cross-browser', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.locator('#preferences').evaluate(el => {
    const boundary = document.createElement('div');
    boundary.setAttribute('data-ds-overlay-boundary', '');
    boundary.style.cssText = 'position:fixed;left:240px;top:80px;right:0;bottom:0';
    el.before(boundary);
    boundary.append(el);
    (el as HTMLElement).style.cssText = 'position:absolute;left:320px;top:16px';
  });
  await page.getByRole('button', { name: 'Configure view' }).click();
  const dialog = page.getByRole('dialog', { name: 'Configure view', exact: true });
  await expect.poll(async () => (await dialog.boundingBox())!.x).toBeGreaterThanOrEqual(248);
  const bounds = (await dialog.boundingBox())!;
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(1192);
  expect(bounds.width).toBe(500);
});
