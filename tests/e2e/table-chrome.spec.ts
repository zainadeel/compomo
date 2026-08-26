import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/table.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('owns a caption-bar column customizer menu for live show/hide and reorder', async ({
  page,
}) => {
  const table = page.locator('#column-customizer');
  const trigger = table.getByRole('button', { name: 'Customize table' });
  await expect(trigger).toBeVisible();
  await expect(table.getByRole('combobox', { name: 'Group by' })).toHaveCount(0);
  await expect(table.getByRole('checkbox', { name: /Select all loaded rows/ })).toBeVisible();
  await expect(table.getByRole('columnheader', { name: /Driver/ })).toBeVisible();
  await expect(table.getByRole('columnheader', { name: 'Action' })).toBeVisible();

  await trigger.click();
  const menu = page.getByRole('menu', { name: 'Customize table' });
  await expect(menu).toBeVisible();
  await expect(menu).toHaveCSS('animation-name', 'dsChoiceFadeIn');
  await expect(menu.getByRole('menuitemcheckbox', { name: 'Driver' })).toBeVisible();
  await expect(menu.getByRole('menuitemcheckbox', { name: 'Action' })).toHaveCount(0);
  await expect(menu.getByRole('menuitemcheckbox', { name: /Select/ })).toHaveCount(0);
  await expect(
    menu.getByRole('menuitemcheckbox', { name: 'Driver' }).locator('[data-menu-handle]')
  ).toBeVisible();

  await menu.getByRole('menuitemcheckbox', { name: 'Status' }).press('Alt+ArrowUp');
  await expect
    .poll(() =>
      table
        .locator('.ds-table__head .ds-table__header-cell[data-column-id]')
        .evaluateAll(cells => cells.map(cell => cell.getAttribute('data-column-id')))
    )
    .toEqual(['status', 'name', 'vehicle', 'score', 'action']);
  await expect(menu).toBeVisible();

  await menu.getByRole('menuitemcheckbox', { name: 'Status' }).click();
  await expect(table.getByRole('columnheader', { name: /Status/ })).toHaveCount(0);
  await expect(menu).toBeVisible();
  await expect(trigger).toHaveAccessibleName('Customize table');

  await menu.getByRole('menuitemcheckbox', { name: 'Driver' }).click();
  await menu.getByRole('menuitemcheckbox', { name: 'Vehicle' }).click();
  const lastVisible = menu.getByRole('menuitemcheckbox', { name: 'Safety score' });
  await expect(lastVisible).toHaveAttribute('aria-disabled', 'true');
  await expect(lastVisible).toHaveAttribute('aria-checked', 'true');
  await expect(table.getByRole('columnheader', { name: /Safety score/ })).toBeVisible();
  await lastVisible.focus();
  await expect(lastVisible).toBeFocused();
  await page.keyboard.press('Alt+ArrowUp');
  await expect(table.locator('ds-menu').getByRole('status')).toContainText(
    'Safety score moved to position'
  );

  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('keeps the Customize control neutral when columns are customized at typical width', async ({
  page,
}) => {
  const table = page.locator('#column-customizer');
  const trigger = table.getByRole('button', { name: 'Customize table' });
  await trigger.click();
  await page.getByRole('menu', { name: 'Customize table' }).getByRole('menuitemcheckbox', {
    name: 'Status',
  }).click();
  await expect(trigger).toHaveAccessibleName('Customize table');
  await expect(trigger.locator('.ds-button__label')).toHaveJSProperty('emphasis', false);
  await expect(trigger.locator('xpath=ancestor::ds-button-unfilled[1]')).toHaveJSProperty(
    'pressScale',
    false
  );
  await expect
    .poll(() =>
      trigger.evaluate(element => (element.closest('ds-button-unfilled') as HTMLDsButtonUnfilledElement).variant)
    )
    .toBe('icon-label');

  const colors = await trigger.evaluate(element => {
    const tokenColor = (token: string) => {
      const probe = document.createElement('span');
      probe.style.color = `var(${token})`;
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };
    const icon = element.querySelector('.ds-button__icon-wrap');
    const label = element.querySelector('.ds-button__label');
    const chevron = element.querySelector('.ds-button__chevron');
    return {
      button: getComputedStyle(element).color,
      icon: icon ? getComputedStyle(icon).color : null,
      label: label ? getComputedStyle(label).color : null,
      chevron: chevron ? getComputedStyle(chevron).color : null,
      secondary: tokenColor('--color-foreground-secondary'),
    };
  });
  expect(colors.button).toBe(colors.secondary);
  expect(colors.icon).toBe(colors.secondary);
  expect(colors.label).toBe(colors.secondary);
  expect(colors.chevron).toBe(colors.secondary);
});

test('uses an icon-only neutral Customize control below 900px when customized', async ({
  page,
}) => {
  const table = page.locator('#column-customizer');
  await table.evaluate(element => {
    (element as HTMLElement).style.inlineSize = '800px';
  });
  const trigger = table.getByRole('button', { name: 'Customize table' });
  await expect
    .poll(() =>
      trigger.evaluate(element => (element.closest('ds-button-unfilled') as HTMLDsButtonUnfilledElement).variant)
    )
    .toBe('icon');
  await expect(table.locator('.ds-table__caption-customizer .ds-button__label')).toHaveCount(0);
  await expect(table.locator('.ds-table__caption-customizer .ds-button__chevron')).toHaveCount(0);

  await trigger.click();
  await page.getByRole('menu', { name: 'Customize table' }).getByRole('menuitemcheckbox', {
    name: 'Status',
  }).click();
  await expect(trigger).toHaveAccessibleName('Customize table');

  const colors = await trigger.evaluate(element => {
    const tokenColor = (token: string) => {
      const probe = document.createElement('span');
      probe.style.color = `var(${token})`;
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };
    const icon = element.querySelector('.ds-button__icon-wrap');
    return {
      button: getComputedStyle(element).color,
      icon: icon ? getComputedStyle(icon).color : null,
      secondary: tokenColor('--color-foreground-secondary'),
    };
  });
  expect(colors.button).toBe(colors.secondary);
  expect(colors.icon).toBe(colors.secondary);
});

test('keeps labeled Filter, Group, and Sort chrome at typical width and promotes only the label when active', async ({
  page,
}) => {
  const table = page.locator('#column-customizer');
  const filter = table.getByRole('combobox', { name: 'Filter fleet' });
  const group = table.getByRole('combobox', { name: 'Group fleet' });
  const sort = page.locator('#column-customizer-sort').getByRole('button', { name: 'Sort table' });

  await expect(filter).toContainText('Filter');
  await expect(group).toContainText('Group');
  await expect(sort).toContainText('Sort');
  await expect(filter.locator('.trigger__label-box')).toBeVisible();
  await expect(filter.locator('.trigger__chevron')).toBeVisible();
  await expect(group.locator('.trigger__label-box')).toBeVisible();
  await expect(group.locator('.trigger__chevron')).toBeVisible();
  await expect(sort.locator('.ds-button__label')).toBeVisible();
  await expect(sort.locator('.ds-button__label')).toHaveJSProperty('emphasis', false);
  await expect(sort.locator('.ds-button__chevron')).toBeVisible();
  await expect(sort.locator('xpath=ancestor::ds-button-unfilled[1]')).toHaveJSProperty(
    'pressScale',
    false
  );

  await table.evaluate(() => {
    const filterMenu = document.getElementById('column-customizer-filter') as HTMLElement & {
      values: Record<string, string[]>;
    };
    const groupSelect = document.getElementById('column-customizer-group') as HTMLElement & {
      value: string;
    };
    filterMenu.values = { status: ['driving'] };
    groupSelect.value = 'status';
  });

  await expect(filter).toContainText('Filter · 1');
  await expect(group).toContainText('Status');

  const colors = await filter.evaluate(element => {
    const tokenColor = (token: string) => {
      const probe = document.createElement('span');
      probe.style.color = `var(${token})`;
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };
    const prefix = element.querySelector('.trigger__prefix');
    const label = element.querySelector('.trigger__label-box');
    const chevron = element.querySelector('.trigger__chevron');
    return {
      prefix: prefix ? getComputedStyle(prefix).color : null,
      label: label ? getComputedStyle(label).color : null,
      chevron: chevron ? getComputedStyle(chevron).color : null,
      primary: tokenColor('--color-foreground-primary'),
      secondary: tokenColor('--color-foreground-secondary'),
    };
  });
  expect(colors.prefix).toBe(colors.secondary);
  await expect
    .poll(() =>
      filter.evaluate(element => {
        const probe = document.createElement('span');
        probe.style.color = 'var(--color-foreground-primary)';
        document.body.append(probe);
        const primary = getComputedStyle(probe).color;
        probe.remove();
        const label = element.querySelector('.trigger__label-box');
        return label ? getComputedStyle(label).color === primary : false;
      })
    )
    .toBe(true);
  expect(colors.chevron).toBe(colors.secondary);

  const groupColors = await group.evaluate(element => {
    const tokenColor = (token: string) => {
      const probe = document.createElement('span');
      probe.style.color = `var(${token})`;
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };
    const prefix = element.querySelector('.trigger__prefix');
    const label = element.querySelector('.trigger__label-box');
    const chevron = element.querySelector('.trigger__chevron');
    return {
      prefix: prefix ? getComputedStyle(prefix).color : null,
      label: label ? getComputedStyle(label).color : null,
      chevron: chevron ? getComputedStyle(chevron).color : null,
      primary: tokenColor('--color-foreground-primary'),
      secondary: tokenColor('--color-foreground-secondary'),
    };
  });
  expect(groupColors.prefix).toBe(groupColors.secondary);
  await expect
    .poll(() =>
      group.evaluate(element => {
        const probe = document.createElement('span');
        probe.style.color = 'var(--color-foreground-primary)';
        document.body.append(probe);
        const primary = getComputedStyle(probe).color;
        probe.remove();
        const label = element.querySelector('.trigger__label-box');
        return label ? getComputedStyle(label).color === primary : false;
      })
    )
    .toBe(true);
  expect(groupColors.chevron).toBe(groupColors.secondary);

  const sortColors = await sort.evaluate(element => {
    const tokenColor = (token: string) => {
      const probe = document.createElement('span');
      probe.style.color = `var(${token})`;
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };
    const icon = element.querySelector('.ds-button__icon-wrap');
    const label = element.querySelector('.ds-button__label');
    const chevron = element.querySelector('.ds-button__chevron');
    return {
      icon: icon ? getComputedStyle(icon).color : null,
      label: label ? getComputedStyle(label).color : null,
      chevron: chevron ? getComputedStyle(chevron).color : null,
      primary: tokenColor('--color-foreground-primary'),
      secondary: tokenColor('--color-foreground-secondary'),
    };
  });
  expect(sortColors.icon).toBe(sortColors.secondary);
  expect(sortColors.label).toBe(sortColors.secondary);
  expect(sortColors.chevron).toBe(sortColors.secondary);
});

test('reports table filter intent from the dedicated host without mutating controlled values', async ({
  page,
}) => {
  const control = page.locator('#column-customizer-filter');
  const trigger = control.getByRole('combobox', { name: 'Filter fleet' });

  await control.evaluate(element => {
    (window as typeof window & { __tableFilterChange?: unknown }).__tableFilterChange = null;
    element.addEventListener('dsChange', event => {
      (window as typeof window & { __tableFilterChange?: unknown }).__tableFilterChange = {
        targetId: (event.target as HTMLElement).id,
        detail: (event as CustomEvent).detail,
      };
    });
  });

  await trigger.click();
  await expect(control).toHaveJSProperty('open', true);
  await control.getByRole('option', { name: 'Driving' }).click();

  await expect
    .poll(() =>
      page.evaluate(
        () => (window as typeof window & { __tableFilterChange?: unknown }).__tableFilterChange
      )
    )
    .toEqual({
      targetId: 'column-customizer-filter',
      detail: { filterId: 'status', value: ['driving'] },
    });
  await expect(control).toHaveJSProperty('values', {});
});

test('uses icon-only Filter, Group, and Sort below 900px and promotes the icon when active', async ({
  page,
}) => {
  const table = page.locator('#column-customizer');
  await table.evaluate(element => {
    (element as HTMLElement).style.inlineSize = '800px';
  });
  const filter = table.getByRole('combobox', { name: 'Filter fleet' });
  const group = table.getByRole('combobox', { name: 'Group fleet' });
  const sort = page.locator('#column-customizer-sort').getByRole('button', { name: 'Sort table' });

  await expect
    .poll(() =>
      filter.evaluate(element =>
        (element.closest('ds-filter-menu') as HTMLElement | null)?.classList.contains(
          'ds-table-caption-control--compact'
        )
      )
    )
    .toBe(true);
  await expect
    .poll(() =>
      group.evaluate(element =>
        (element.closest('ds-select') as HTMLElement | null)?.classList.contains(
          'ds-table-caption-control--compact'
        )
      )
    )
    .toBe(true);

  await expect
    .poll(() =>
      sort.evaluate(element =>
        (element.closest('ds-button-unfilled') as HTMLElement | null)?.classList.contains(
          'ds-table-caption-control--compact'
        )
      )
    )
    .toBe(true);

  await expect(filter.locator('.trigger__label-box')).toHaveCount(0);
  await expect(filter.locator('.trigger__chevron')).toHaveCount(0);
  await expect(group.locator('.trigger__label-box')).toHaveCount(0);
  await expect(group.locator('.trigger__chevron')).toHaveCount(0);
  await expect(sort.locator('.ds-button__label')).toHaveCount(0);
  await expect(sort.locator('.ds-button__chevron')).toHaveCount(0);
  await expect(filter.locator('.trigger__prefix')).toBeVisible();
  await expect(group.locator('.trigger__prefix')).toBeVisible();
  await expect(sort.locator('.ds-button__icon-wrap')).toBeVisible();

  await filter.hover();
  await expect(page.getByRole('tooltip', { name: 'Filter' })).toBeVisible();
  await group.hover();
  await expect(page.getByRole('tooltip', { name: 'Group fleet' })).toBeVisible();
  await sort.hover();
  await expect(page.getByRole('tooltip', { name: 'Sort' })).toBeVisible();

  await table.evaluate(() => {
    const filterMenu = document.getElementById('column-customizer-filter') as HTMLElement & {
      values: Record<string, string[]>;
    };
    const groupSelect = document.getElementById('column-customizer-group') as HTMLElement & {
      value: string;
    };
    filterMenu.values = { status: ['driving'] };
    groupSelect.value = 'status';
  });

  const filterColors = await filter.evaluate(element => {
    const tokenColor = (token: string) => {
      const probe = document.createElement('span');
      probe.style.color = `var(${token})`;
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };
    const prefix = element.querySelector('.trigger__prefix');
    return {
      prefix: prefix ? getComputedStyle(prefix).color : null,
      primary: tokenColor('--color-foreground-primary'),
    };
  });
  expect(filterColors.prefix).toBe(filterColors.primary);

  const groupColors = await group.evaluate(element => {
    const tokenColor = (token: string) => {
      const probe = document.createElement('span');
      probe.style.color = `var(${token})`;
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };
    const prefix = element.querySelector('.trigger__prefix');
    return {
      prefix: prefix ? getComputedStyle(prefix).color : null,
      primary: tokenColor('--color-foreground-primary'),
    };
  });
  expect(groupColors.prefix).toBe(groupColors.primary);

  const sortColors = await sort.evaluate(element => {
    const tokenColor = (token: string) => {
      const probe = document.createElement('span');
      probe.style.color = `var(${token})`;
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };
    const icon = element.querySelector('.ds-button__icon-wrap');
    return {
      icon: icon ? getComputedStyle(icon).color : null,
      primary: tokenColor('--color-foreground-primary'),
      secondary: tokenColor('--color-foreground-secondary'),
    };
  });
  expect(sortColors.icon).toBe(sortColors.secondary);
});

test('keeps the bounded table surface within its host while the complete caption row scrolls', async ({
  page,
}) => {
  const table = page.locator('#column-customizer');
  const caption = table.locator('.ds-table__caption-content');
  const toolbar = table.locator('ds-table-toolbar .table-toolbar');
  const search = table.locator('#column-customizer-search');
  const group = table.locator('#column-customizer-group');
  const customize = table.locator('.ds-table__caption-customizer');
  await table.evaluate(element => {
    (element as HTMLElement).style.inlineSize = '500px';
  });

  const compactGeometry = await table.evaluate(element => {
    const caption = element.querySelector<HTMLElement>('.ds-table__caption-content')!;
    const toolbar = element.querySelector<HTMLElement>('.table-toolbar')!;
    const search = element.querySelector<HTMLElement>('#column-customizer-search')!;
    return {
      captionGap: Number.parseFloat(getComputedStyle(caption).columnGap),
      searchWidth: search.getBoundingClientRect().width,
      toolbarGap: Number.parseFloat(getComputedStyle(toolbar).gap),
    };
  });

  expect(compactGeometry.searchWidth).toBeLessThanOrEqual(300);
  expect(compactGeometry.toolbarGap).toBe(8);
  expect(compactGeometry.captionGap).toBe(8);
  await expect(toolbar).toHaveCSS('display', 'contents');

  await table.evaluate(element => {
    (element as HTMLElement).style.inlineSize = '400px';
    element.setAttribute('height', '320px');
  });
  await expect(table).toHaveClass(/table-host--bounded/);
  for (const surface of [
    table.locator('.ds-table'),
    table.locator('.ds-table__caption-bar'),
    table.locator('.ds-table__frame'),
  ]) {
    await expect
      .poll(async () => (await surface.boundingBox())!.width)
      .toBeLessThanOrEqual(400);
  }
  const narrowGeometry = await Promise.all([
    search.boundingBox(),
    group.boundingBox(),
    customize.boundingBox(),
  ]);
  expect(narrowGeometry[0]!.width).toBeLessThan(300);
  expect(narrowGeometry[2]!.x - (narrowGeometry[1]!.x + narrowGeometry[1]!.width)).toBeCloseTo(8, 0);

  await table.evaluate(element => {
    (element as HTMLElement).style.inlineSize = '320px';
  });
  await expect
    .poll(() => caption.evaluate(element => element.scrollWidth > element.clientWidth))
    .toBe(true);
  const before = await Promise.all([group.boundingBox(), customize.boundingBox()]);
  await caption.evaluate(element => {
    element.scrollLeft = element.scrollWidth;
  });
  await expect.poll(() => caption.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  const after = await Promise.all([group.boundingBox(), customize.boundingBox()]);
  const groupShift = before[0]!.x - after[0]!.x;
  const customizeShift = before[1]!.x - after[1]!.x;
  expect(groupShift).toBeGreaterThan(0);
  expect(customizeShift).toBeCloseTo(groupShift, 0);
  expect(await search.boundingBox()).not.toBeNull();

  const footerTable = page.locator('#footer');
  await footerTable.evaluate(element => {
    (element as HTMLElement).style.inlineSize = '400px';
  });
  await expect
    .poll(async () => (await footerTable.locator('.ds-table__footer').boundingBox())!.width)
    .toBeLessThanOrEqual(400);
});

test('restores compact caption observation after controls are reinserted', async ({ page }) => {
  const table = page.locator('#column-customizer');
  const filterHost = table.locator('#column-customizer-filter ds-filter-menu');
  const groupHost = table.locator('#column-customizer-group');
  const sortButtonHost = table.locator('#column-customizer-sort ds-button-unfilled');

  await table.evaluate(element => {
    (element as HTMLElement).style.inlineSize = '800px';
  });
  await expect(filterHost).toHaveClass(/ds-table-caption-control--compact/);
  await expect(groupHost).toHaveClass(/ds-table-caption-control--compact/);
  await expect(sortButtonHost).toHaveClass(/ds-table-caption-control--compact/);

  await table.evaluate(element => {
    const toolbar = element.querySelector('ds-table-toolbar')!;
    const controls = [
      toolbar.querySelector('#column-customizer-filter')!,
      toolbar.querySelector('#column-customizer-group')!,
      toolbar.querySelector('#column-customizer-sort')!,
    ];
    controls.forEach(control => control.remove());
    controls.forEach(control => toolbar.append(control));
    (element as HTMLElement).style.inlineSize = '1000px';
  });

  await expect(filterHost).not.toHaveClass(/ds-table-caption-control--compact/);
  await expect(groupHost).not.toHaveClass(/ds-table-caption-control--compact/);
  await expect(sortButtonHost).not.toHaveClass(/ds-table-caption-control--compact/);
});

test('mirrors table sort through the toolbar Sort menu and column headers', async ({ page }) => {
  const table = page.locator('#column-customizer');
  const sortTrigger = page.locator('#column-customizer-sort').getByRole('button', { name: 'Sort table' });
  await expect(sortTrigger).toBeVisible();

  await sortTrigger.click();
  const menu = page.getByRole('menu', { name: 'Sort table' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Driver' })).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Status' })).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Ascending' })).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Descending' })).toBeVisible();

  await menu.getByRole('menuitem', { name: 'Status' }).click();
  await expect(menu).toBeVisible();
  await expect(table).toHaveJSProperty('sort', { columnId: 'status', direction: 'asc' });
  await expect(table.locator('th[data-column-id="status"]')).toHaveAttribute('aria-sort', 'ascending');

  await menu.getByRole('menuitem', { name: 'Descending' }).click();
  await expect(table).toHaveJSProperty('sort', { columnId: 'status', direction: 'desc' });
  await expect(table.locator('th[data-column-id="status"]')).toHaveAttribute('aria-sort', 'descending');

  await page.keyboard.press('Escape');
  await table.getByRole('button', { name: /Sort Driver/ }).click();
  await expect(table).toHaveJSProperty('sort', { columnId: 'name', direction: 'asc' });

  await sortTrigger.click();
  await expect(page.getByRole('menu', { name: 'Sort table' }).getByRole('menuitem', { name: 'Driver' })).toHaveClass(
    /menu-item--selected/
  );
});

test('gives Group and Sort popups the compact menu-width floor', async ({ page }) => {
  const table = page.locator('#column-customizer');
  const group = table.getByRole('combobox', { name: 'Group fleet' });
  const sort = page.locator('#column-customizer-sort').getByRole('button', { name: 'Sort table' });

  const menuWidthXs = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.width = 'var(--dimension-menu-width-xs)';
    document.body.append(probe);
    const width = Number.parseFloat(getComputedStyle(probe).width);
    probe.remove();
    return width;
  });

  await group.click();
  const groupPopup = table.locator('#column-customizer-group .select-popup');
  await expect(groupPopup).toBeVisible();
  await expect
    .poll(async () =>
      groupPopup.evaluate(element => Number.parseFloat(getComputedStyle(element).minWidth))
    )
    .toBeGreaterThanOrEqual(menuWidthXs - 0.5);
  await page.keyboard.press('Escape');

  await sort.click();
  const sortMenu = page.getByRole('menu', { name: 'Sort table' });
  await expect(sortMenu).toBeVisible();
  await expect
    .poll(async () =>
      sortMenu.evaluate(element => Number.parseFloat(getComputedStyle(element).minWidth))
    )
    .toBeGreaterThanOrEqual(menuWidthXs - 0.5);
});

test('owns a controlled caption-bar data mode switcher for supported modes', async ({ page }) => {
  const table = page.locator('#column-customizer');
  const trigger = table.getByRole('button', { name: 'Change table variation' });
  await expect(trigger).toBeVisible();
  await expect(trigger.locator('xpath=ancestor::ds-button-unfilled[1]')).toHaveJSProperty(
    'pressScale',
    false
  );

  const trailingControls = table.locator('.ds-table__caption-trailing > *');
  await expect(trailingControls).toHaveCount(3);
  await expect(trailingControls.nth(0).getByRole('button', { name: 'Customize table' })).toBeVisible();
  await expect(trailingControls.nth(1)).toHaveJSProperty('tagName', 'DS-DIVIDER');
  await expect(trailingControls.nth(1)).toHaveJSProperty('orientation', 'vertical');
  await expect(trailingControls.nth(1)).toHaveJSProperty('length', '32px');
  await expect(
    trailingControls.nth(2).getByRole('button', { name: 'Change table variation' })
  ).toBeVisible();

  await trigger.click();
  const menu = page.getByRole('menu', { name: 'Table variation' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Infinite scroll' })).toHaveAttribute(
    'aria-current',
    'true'
  );
  await expect(menu.getByRole('menuitem', { name: 'Pagination + Infinite groups' })).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Virtual scroll' })).toBeVisible();

  await menu.getByRole('menuitem', { name: 'Pagination + Infinite groups' }).click();
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(table).toHaveJSProperty('dataMode', 'pagination');

  await trigger.click();
  await expect(
    page.getByRole('menu', { name: 'Table variation' }).getByRole('menuitem', {
      name: 'Pagination + Infinite groups',
    })
  ).toHaveAttribute('aria-current', 'true');

  await page
    .getByRole('menu', { name: 'Table variation' })
    .getByRole('menuitem', { name: 'Virtual scroll' })
    .click();
  await expect(table).toHaveJSProperty('dataMode', 'virtual');

  await trigger.click();
  await expect(
    page.getByRole('menu', { name: 'Table variation' }).getByRole('menuitem', {
      name: 'Virtual scroll',
    })
  ).toHaveAttribute('aria-current', 'true');

  await table.getByRole('button', { name: 'Customize table' }).click();
  await expect(page.getByRole('menu', { name: 'Table variation' })).toHaveCount(0);
  await expect(page.getByRole('menu', { name: 'Customize table' })).toBeVisible();
});

test('defaults to adjacent-page controls and supports opting into first and last', async ({
  page,
}) => {
  const defaultTable = page.locator('#grouped-paginated');
  const defaultPagination = defaultTable.locator('ds-pagination');

  await expect(defaultPagination.getByRole('button', { name: 'Previous page' })).toBeVisible();
  await expect(defaultPagination.getByRole('button', { name: 'Next page' })).toBeVisible();
  await expect(defaultPagination.getByRole('button', { name: 'First page' })).toHaveCount(0);
  await expect(defaultPagination.getByRole('button', { name: 'Last page' })).toHaveCount(0);
  await expect(defaultPagination).toHaveJSProperty('showFirstLastButtons', false);

  await defaultTable.evaluate((element: HTMLDsTableElement) => {
    element.pagination = { ...element.pagination!, showFirstLastButtons: true };
  });

  await expect(defaultPagination.getByRole('button', { name: 'First page' })).toBeVisible();
  await expect(defaultPagination.getByRole('button', { name: 'Last page' })).toBeVisible();
  await expect(defaultPagination).toHaveJSProperty('showFirstLastButtons', true);

  const optedInPagination = page.locator('#paginated ds-pagination');
  await optedInPagination.getByRole('button', { name: 'Next page' }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as typeof window & {
              __tablePaginationEvents: Array<Record<string, unknown>>;
            }
          ).__tablePaginationEvents.at(-1)
      )
    )
    .toMatchObject({ pageIndex: 1, showFirstLastButtons: true, reason: 'page' });
});

test('preserves table-owned caption control geometry while its chrome is loading', async ({
  page,
}) => {
  const table = page.locator('#column-customizer');
  const trailing = table.locator('.ds-table__caption-trailing');
  const geometry = () =>
    trailing.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        children: [...element.children].map(child => {
          const childRect = child.getBoundingClientRect();
          return { width: childRect.width, height: childRect.height };
        }),
      };
    });

  await table.evaluate((element: HTMLElement & { chromeLoading: boolean }) => {
    element.chromeLoading = true;
  });
  await expect(trailing.locator('ds-skeleton')).toHaveCount(2);
  await expect(table.getByRole('button', { name: 'Customize table' })).toHaveCount(0);
  await expect(table.getByRole('button', { name: 'Change table variation' })).toHaveCount(0);
  const loadingGeometry = await geometry();

  await table.evaluate((element: HTMLElement & { chromeLoading: boolean }) => {
    element.chromeLoading = false;
  });
  await expect(table.getByRole('button', { name: 'Customize table' })).toBeVisible();
  await expect(table.getByRole('button', { name: 'Change table variation' })).toBeVisible();
  expect(await geometry()).toEqual(loadingGeometry);
});

test('lays out application-owned table controls in start and spanning middle groups', async ({
  page,
}) => {
  const toolbar = page.locator('#table-toolbar');
  await expect(toolbar.getByRole('toolbar', { name: 'Fleet table controls' })).toBeVisible();
  await expect(toolbar.getByRole('button')).toHaveCount(4);

  const layout = await toolbar.evaluate(element => {
    const surface = element.querySelector<HTMLElement>('.table-toolbar')!;
    const leading = element.querySelector<HTMLElement>('.table-toolbar__leading')!;
    const trailing = element.querySelector<HTMLElement>('.table-toolbar__trailing')!;
    const divider = element.querySelector('ds-divider');
    const leadingRect = leading.getBoundingClientRect();
    const trailingRect = trailing.getBoundingClientRect();
    const start = element.querySelector<HTMLElement>('.table-toolbar__start')!;
    const startRect = start.getBoundingClientRect();
    const startControl = element.querySelector<HTMLElement>('[slot="start"]')!;
    return {
      overflow: surface.scrollWidth > surface.clientWidth,
      leadingTop: leadingRect.top,
      trailingTop: trailingRect.top,
      ordered: leadingRect.right <= trailingRect.left,
      startBeforeLeading: startRect.right <= leadingRect.left,
      startControlInCluster: startControl.getBoundingClientRect().left >= startRect.left - 0.5,
      startClusterWidth: startRect.width,
      startControlWidth: startControl.getBoundingClientRect().width,
      dividerVisible: !!divider && getComputedStyle(divider).display !== 'none',
      dividerHeight: divider ? Math.round(divider.getBoundingClientRect().height) : 0,
    };
  });

  expect(layout.overflow).toBe(true);
  expect(Math.abs(layout.leadingTop - layout.trailingTop)).toBeLessThanOrEqual(0.5);
  expect(layout.ordered).toBe(true);
  expect(layout.startBeforeLeading).toBe(true);
  expect(layout.startControlInCluster).toBe(true);
  expect(layout.startClusterWidth).toBeCloseTo(layout.startControlWidth, 0);
  expect(layout.dividerVisible).toBe(true);
  expect(layout.dividerHeight).toBe(32);

  const probe = await toolbar.evaluate(element => {
    const control = document.createElement('ds-button-unfilled') as HTMLElement & {
      label: string;
      pressScale: boolean;
    };
    control.id = 'table-toolbar-press-probe';
    control.slot = 'trailing';
    control.label = 'Probe';
    element.append(control);
    return control.id;
  });
  const probeHost = page.locator(`#${probe}`);
  const probeButton = probeHost.locator('button');
  await expect(probeHost).toHaveJSProperty('pressScale', true);
  const probeBox = await probeButton.boundingBox();
  expect(probeBox).not.toBeNull();
  await page.mouse.move(
    probeBox!.x + probeBox!.width / 2,
    probeBox!.y + probeBox!.height / 2
  );
  await page.mouse.down();
  await expect(probeButton).toHaveCSS('scale', '1');
  await page.mouse.up();

  await expect(
    page.locator('#column-customizer').getByRole('toolbar', {
      name: 'Customizable driver controls',
    })
  ).toBeVisible();
});

test('owns controlled saved-view selection, naming validation, and mutation intents', async ({
  page,
}) => {
  const control = page.locator('#saved-views');
  const select = control.getByRole('combobox', { name: 'Saved views' });

  await expect(select).toContainText('Needs attention');
  await expect(select.locator('.trigger__dot')).toBeVisible();
  await select.click();
  await expect(page.locator('.select-popup')).toHaveCSS('animation-name', 'dsChoiceFadeIn');
  await expect(page.getByRole('button', { name: 'New view' })).toBeVisible();
  const dirtyRow = page.getByRole('row', { name: /Needs attention Save Discard/ });
  await expect(dirtyRow.getByRole('button', { name: 'Save', exact: true })).toBeVisible();
  await expect(dirtyRow.getByRole('button', { name: 'Discard', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Discard', exact: true })).toHaveCount(1);
  const actionTypography = await dirtyRow.evaluate(element => {
    const actionGroup = element.querySelector<HTMLElement>('.select-option__subtext-actions')!;
    const actions = element.querySelectorAll<HTMLElement>('.select-option__subtext-action');
    const separatorHost = element.querySelector<HTMLElement>(
      '.select-option__subtext-action-separator'
    )!;
    const save = element.querySelector<HTMLElement>(
      '.select-option__subtext-action .ds-text__element'
    )!;
    const separator = element.querySelector<HTMLElement>(
      '.select-option__subtext-action-separator .ds-text__element'
    )!;
    const discard = element.querySelectorAll<HTMLElement>(
      '.select-option__subtext-action .ds-text__element'
    )[1];
    const metrics = (target: HTMLElement) => {
      const styles = getComputedStyle(target);
      const rect = target.getBoundingClientRect();
      return {
        fontFamily: styles.fontFamily,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        lineHeight: styles.lineHeight,
        top: rect.top,
        height: rect.height,
      };
    };
    return {
      save: metrics(save),
      separator: metrics(separator),
      discard: metrics(discard),
      spacing: {
        before:
          separatorHost.getBoundingClientRect().left - actions[0].getBoundingClientRect().right,
        after:
          actions[1].getBoundingClientRect().left - separatorHost.getBoundingClientRect().right,
        token: Number.parseFloat(getComputedStyle(actionGroup).columnGap),
      },
    };
  });
  expect(actionTypography.separator).toEqual(actionTypography.save);
  expect(actionTypography.discard).toEqual(actionTypography.save);
  expect(actionTypography.spacing.token).toBe(4);
  expect(actionTypography.spacing.before).toBeCloseTo(actionTypography.spacing.token, 1);
  expect(actionTypography.spacing.after).toBeCloseTo(actionTypography.spacing.token, 1);
  await expect(
    page.locator('.ds-choice-footer').getByRole('button', { name: 'New view', exact: true })
  ).toBeVisible();
  const popupWidth = await page
    .locator('.select-popup')
    .evaluate(element => element.getBoundingClientRect().width);
  expect(popupWidth).toBeGreaterThanOrEqual(200);
  const dirtyOptionHeight = await dirtyRow
    .locator('.select-option')
    .evaluate(element => element.getBoundingClientRect().height);
  expect(dirtyOptionHeight).toBeGreaterThan(32);
  await expect(page.getByRole('row', { name: 'Default', exact: true })).toBeVisible();
  await expect(
    page.getByRole('row', { name: /West region Options for West region/ })
  ).toBeVisible();
  await expect(
    page.getByRole('row', { name: 'Default', exact: true }).locator('.ds-choice-item__subtext')
  ).toHaveCount(0);
  await expect(
    page
      .getByRole('row', { name: /West region Options for West region/ })
      .locator('.ds-choice-item__subtext')
  ).toHaveCount(0);
  await dirtyRow.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(control).toHaveJSProperty('dirty', false);

  await control.evaluate(element => {
    const savedViews = element as HTMLElement & { dirty: boolean; value: string };
    savedViews.value = '__default__';
    savedViews.dirty = true;
  });
  await expect(select.locator('.trigger__dot')).toHaveCount(0);
  await control.evaluate(element => {
    (element as HTMLElement & { value: string }).value = 'attention';
  });
  await expect(select.locator('.trigger__dot')).toBeVisible();

  await control.evaluate(element => {
    (element as HTMLElement & { dirty: boolean }).dirty = true;
  });
  await page
    .getByRole('row', { name: /Needs attention Save Discard/ })
    .getByRole('button', { name: 'Discard', exact: true })
    .click();
  await expect(control).toHaveJSProperty('dirty', false);

  await page.getByRole('gridcell', { name: 'West region', exact: true }).click();
  await expect(control).toHaveJSProperty('value', 'west');

  await select.click();
  await page.getByRole('button', { name: 'New view' }).click();
  const dialog = page.getByRole('dialog', { name: 'Save as new view' });
  const name = dialog.getByRole('textbox', { name: 'Name' });
  await expect(name).toBeFocused();
  await name.fill('Default');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog.getByText('A view with this name already exists.')).toBeVisible();

  await name.fill('Night shift');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(select).toBeFocused();

  await select.click();
  await page.getByRole('row', { name: /Needs attention/ }).hover();
  await page.getByRole('button', { name: 'Options for Needs attention' }).click();
  await page.getByRole('menuitem', { name: 'Rename', exact: true }).click();
  const renameDialog = page.getByRole('dialog', { name: 'Rename view' });
  const renameName = renameDialog.getByRole('textbox', { name: 'Name' });
  await expect(renameName).toBeFocused();
  await renameName.fill('Needs review');
  await renameDialog.getByRole('button', { name: 'Rename', exact: true }).click();
  await expect(renameDialog).toHaveCount(0);

  await select.click();
  await page.getByRole('row', { name: /West region/ }).hover();
  await page.getByRole('button', { name: 'Options for West region' }).click();
  await page.getByRole('menuitem', { name: 'Remove', exact: true }).click();
  await expect
    .poll(() =>
      control.evaluate(element => (element as HTMLElement & { eventLog: unknown[] }).eventLog)
    )
    .toEqual([
      { type: 'save', viewId: 'attention' },
      { type: 'discard', viewId: 'attention' },
      { type: 'change', viewId: 'west' },
      { type: 'create', name: 'Night shift' },
      { type: 'rename', viewId: 'attention', name: 'Needs review' },
      { type: 'remove', viewId: 'west' },
    ]);
});
