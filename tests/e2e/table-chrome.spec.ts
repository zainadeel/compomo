import { expect, test } from '@playwright/test';
import { expectGeometryClose } from './rendered-geometry';

test.beforeEach(async ({ page }) => {
  await page.goto('/table.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('groups through two dependent panes and keeps order unavailable until data is selected', async ({
  page,
}) => {
  const control = page.locator('#table-group');
  const trigger = control.getByRole('button', { name: 'Group safety events' });
  await trigger.click();

  const dialog = page.getByRole('dialog', { name: 'Group safety events' });
  await expect(dialog.getByRole('listbox', { name: 'Group data' })).toBeVisible();
  await expect(dialog.getByText('Select a group to choose its order.')).toBeVisible();
  await expect(dialog.getByRole('listbox', { name: 'Group order' })).toHaveCount(0);

  await dialog.getByRole('option', { name: 'Severity' }).click();
  await expect(dialog.getByRole('option', { name: 'Severity' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  await expect(dialog.getByRole('option', { name: 'Ascending' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  await dialog.getByRole('option', { name: 'Descending' }).click();
  await expect(dialog.getByRole('option', { name: 'Descending' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  await expect(dialog).toBeVisible();

  await expect
    .poll(() =>
      control.evaluate(
        element =>
          (element as HTMLElement & { eventLog: unknown[] }).eventLog
      )
    )
    .toEqual([
      { type: 'change', columnId: 'severity', direction: 'asc' },
      { type: 'change', columnId: 'severity', direction: 'desc' },
    ]);

  await dialog.getByRole('button', { name: 'Clear' }).click();
  await expect(dialog.getByText('Select a group to choose its order.')).toBeVisible();
  await expect(dialog.getByRole('listbox', { name: 'Group order' })).toHaveCount(0);
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
  await page
    .getByRole('menu', { name: 'Customize table' })
    .getByRole('menuitemcheckbox', {
      name: 'Status',
    })
    .click();
  await expect(trigger).toHaveAccessibleName('Customize table');
  await expect(trigger.locator('.ds-button__label')).toHaveJSProperty('emphasis', false);
  await expect(trigger.locator('xpath=ancestor::ds-button-unfilled[1]')).toHaveJSProperty(
    'pressScale',
    false
  );
  await expect
    .poll(() =>
      trigger.evaluate(
        element => (element.closest('ds-button-unfilled') as HTMLDsButtonUnfilledElement).variant
      )
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
      trigger.evaluate(
        element => (element.closest('ds-button-unfilled') as HTMLDsButtonUnfilledElement).variant
      )
    )
    .toBe('icon');
  await expect(table.locator('.ds-table__caption-customizer .ds-button__label')).toHaveCount(0);
  await expect(table.locator('.ds-table__caption-customizer .ds-button__chevron')).toHaveCount(0);

  await trigger.click();
  await page
    .getByRole('menu', { name: 'Customize table' })
    .getByRole('menuitemcheckbox', {
      name: 'Status',
    })
    .click();
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

  await expect(filter.locator('.trigger__label-box')).toHaveText('Filter');
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

test('reserves a category-pane Clear footer for every table filter @pr-critical', async ({
  page,
}) => {
  const control = page.locator('#column-customizer-filter');
  const trigger = control.getByRole('combobox', { name: 'Filter fleet' });

  await control.evaluate(element => {
    (window as typeof window & { __tableFilterClears?: number }).__tableFilterClears = 0;
    element.addEventListener('dsClear', () => {
      (window as typeof window & { __tableFilterClears?: number }).__tableFilterClears! += 1;
    });
  });
  await trigger.click();

  const popup = control.getByRole('dialog', { name: 'Filter fleet' });
  const categoryPane = popup.locator('.filter-menu__category-pane');
  const footer = categoryPane.locator('.filter-menu__footer');
  const options = popup.locator('.filter-menu__options');
  await expect(footer).toBeVisible();
  await expect(footer).toHaveAttribute('aria-hidden', 'true');
  await expect(footer.locator('.ds-choice-footer__summary')).toHaveCount(0);
  await expect(control.getByRole('button', { name: 'Clear' })).toHaveCount(0);
  await expect
    .poll(() => footer.evaluate(element => getComputedStyle(element, '::before').visibility))
    .toBe('hidden');

  const idleGeometry = await Promise.all([
    popup.boundingBox(),
    categoryPane.boundingBox(),
    footer.boundingBox(),
    options.boundingBox(),
  ]);
  expect(idleGeometry.every(rect => rect !== null)).toBe(true);

  await control.evaluate((element: HTMLDsTableFilterElement) => {
    element.values = { status: ['driving'] };
  });

  const clear = control.getByRole('button', { name: 'Clear' });
  await expect(footer).not.toHaveAttribute('aria-hidden');
  await expect(clear).toBeVisible();
  await expect(footer.locator('.ds-choice-footer__summary')).toHaveCount(0);
  await expect
    .poll(() => footer.evaluate(element => getComputedStyle(element, '::before').visibility))
    .toBe('visible');
  await expect(footer.locator('.ds-choice-footer__content')).toHaveCSS(
    'justify-content',
    'flex-start'
  );

  const activeGeometry = await Promise.all([
    popup.boundingBox(),
    categoryPane.boundingBox(),
    footer.boundingBox(),
    clear.boundingBox(),
  ]);
  const categoryDividerWidth = await categoryPane.evaluate(element =>
    Number.parseFloat(getComputedStyle(element).borderInlineEndWidth)
  );
  expect(activeGeometry.every(rect => rect !== null)).toBe(true);
  expect(activeGeometry[0]!.height).toBeCloseTo(idleGeometry[0]!.height, 3);
  expect(activeGeometry[2]!.x).toBeCloseTo(activeGeometry[1]!.x, 3);
  expect(activeGeometry[2]!.x + activeGeometry[2]!.width).toBeCloseTo(
    activeGeometry[1]!.x + activeGeometry[1]!.width - categoryDividerWidth,
    3
  );
  expect(activeGeometry[3]!.x).toBeLessThan(activeGeometry[2]!.x + activeGeometry[2]!.width / 2);
  expect(idleGeometry[3]!.y + idleGeometry[3]!.height).toBeCloseTo(
    idleGeometry[0]!.y + idleGeometry[0]!.height,
    3
  );

  await clear.click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as typeof window & { __tableFilterClears?: number }).__tableFilterClears
      )
    )
    .toBe(1);
  await expect(control).toHaveJSProperty('values', { status: ['driving'] });
});

test('searches labels and descriptions within every non-date filter category @pr-critical', async ({
  page,
}) => {
  const control = page.locator('#column-customizer-filter');
  await control.evaluate((element: HTMLDsTableFilterElement) => {
    element.filters = [
      {
        id: 'group',
        label: 'Group',
        kind: 'multiple',
        options: [
          {
            label: 'Main operations',
            value: 'main',
            description: '50 vehicles · 50 drivers · 50 assets',
          },
          {
            label: 'West Coast',
            value: 'west',
            description: '25 vehicles · 25 drivers · 25 assets',
          },
          {
            label: 'Long Haul',
            value: 'long-haul',
            description: '25 vehicles · 25 drivers · 25 assets',
          },
        ],
      },
      {
        id: 'status',
        label: 'Status',
        kind: 'multiple',
        options: [
          { label: 'Driving', value: 'driving' },
          { label: 'Off duty', value: 'off-duty' },
        ],
      },
      {
        id: 'notes',
        label: 'Notes',
        fieldLabel: 'Has notes',
        description: 'Only show records with notes',
        kind: 'boolean',
      },
      { id: 'event-date', label: 'Date', kind: 'date' },
    ];
    element.activeFilterId = 'group';
    element.addEventListener('dsActiveFilterChange', event => {
      element.activeFilterId = (event as CustomEvent<string>).detail;
    });
  });

  await control.getByRole('combobox', { name: 'Filter fleet' }).click();
  const popup = control.getByRole('dialog', { name: 'Filter fleet' });
  const searchHeader = popup.locator('.filter-menu__option-search');
  const groupSearch = popup.getByRole('searchbox', { name: 'Search Group options' });

  await expect(searchHeader).toBeVisible();
  expect((await searchHeader.boundingBox())?.height).toBeCloseTo(40, 1);
  await expect(groupSearch).toHaveAttribute('placeholder', 'Search');
  await expect(groupSearch).toHaveAttribute('autocomplete', 'off');
  await expect(groupSearch).toHaveAttribute('autocapitalize', 'none');
  await expect(groupSearch).toHaveAttribute('autocorrect', 'off');
  await expect(groupSearch).toHaveAttribute('spellcheck', 'false');
  await expect(groupSearch).toHaveCSS('border-top-width', '0px');
  await expect(groupSearch).toHaveCSS('font-size', '14px');
  await expect(groupSearch).toHaveCSS('line-height', '20px');
  await expect(searchHeader).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(searchHeader.locator('.select-search')).toHaveClass(
    /select-search--without-focus-boundary/
  );
  await expect(searchHeader.locator('ds-input')).toHaveJSProperty('hasInteractionFill', false);
  await expect(searchHeader.locator('.input-control')).not.toHaveClass(/ds-interaction-fill/);
  const dividerBefore = await searchHeader.evaluate(element => {
    const style = getComputedStyle(element, '::after');
    return { height: style.height, color: style.backgroundColor };
  });
  await groupSearch.focus();
  const dividerAfter = await searchHeader.evaluate(element => {
    const style = getComputedStyle(element, '::after');
    return { height: style.height, color: style.backgroundColor };
  });
  expect(dividerAfter).toEqual(dividerBefore);
  expect(dividerAfter.height).toBe('1px');
  await groupSearch.fill('25 drivers');
  await expect(popup.getByRole('listbox', { name: 'Group' }).getByRole('option')).toHaveText([
    'West Coast25 vehicles · 25 drivers · 25 assets',
    'Long Haul25 vehicles · 25 drivers · 25 assets',
  ]);

  await groupSearch.press('ArrowLeft');
  await expect(groupSearch).toBeFocused();
  await groupSearch.press('ArrowDown');
  await expect(popup.getByRole('option', { name: /West Coast/ })).toBeFocused();

  await popup.getByRole('tab', { name: 'Status' }).click();
  const statusSearch = popup.getByRole('searchbox', { name: 'Search Status options' });
  await expect(statusSearch).toHaveValue('');
  await popup.getByRole('tab', { name: 'Group' }).click();
  await expect(popup.getByRole('searchbox', { name: 'Search Group options' })).toHaveValue(
    '25 drivers'
  );

  await popup.getByRole('tab', { name: 'Notes' }).click();
  await popup.getByRole('searchbox', { name: 'Search Notes options' }).fill('missing');
  await expect(popup.getByRole('option', { name: 'No results' })).toBeVisible();

  await popup.getByRole('tab', { name: 'Date' }).click();
  await expect(popup.getByRole('searchbox')).toHaveCount(0);
  await expect(popup.getByRole('tablist', { name: 'Date filter mode' })).toBeVisible();
});

test('requests a controlled any or all mode from the multiple-filter footer @pr-critical', async ({
  page,
}) => {
  const control = page.locator('#column-customizer-filter');
  await control.evaluate((element: HTMLDsTableFilterElement) => {
    element.values = { status: ['driving'] };
    element.matchModes = {};
    (window as typeof window & { __filterMatchModeChanges?: unknown[] }).__filterMatchModeChanges =
      [];
    element.addEventListener('dsMatchModeChange', event => {
      const detail = (event as CustomEvent<{ filterId: string; mode: 'any' | 'all' }>).detail;
      (
        window as typeof window & { __filterMatchModeChanges?: unknown[] }
      ).__filterMatchModeChanges!.push(detail);
      element.matchModes = { ...element.matchModes, [detail.filterId]: detail.mode };
    });
  });

  await control.getByRole('combobox', { name: 'Filter fleet' }).click();
  const popup = control.getByRole('dialog', { name: 'Filter fleet' });
  const footer = popup.locator('.filter-menu__match-mode-footer');
  const toggle = footer.getByRole('button', { name: 'Limit Status results to all selected' });

  await expect(footer).toBeVisible();
  await expect(footer.getByText('Limit results to', { exact: true })).toBeVisible();
  await expect(toggle).toHaveText('any');
  await expect(footer.getByText('selected', { exact: true })).toBeVisible();
  await toggle.hover();
  await expect(toggle).toHaveCSS('text-decoration-line', 'underline');
  const clear = popup.getByRole('button', { name: 'Clear' });
  const [toggleDecoration, clearDecoration] = await Promise.all(
    [toggle, clear].map(locator =>
      locator.evaluate(element => {
        const style = getComputedStyle(element);
        return {
          color: style.textDecorationColor,
          thickness: style.textDecorationThickness,
          offset: style.textUnderlineOffset,
        };
      })
    )
  );
  expect(toggleDecoration).toEqual(clearDecoration);
  await toggle.click();
  await expect(
    footer.getByRole('button', { name: 'Limit Status results to any selected' })
  ).toHaveText('all');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { __filterMatchModeChanges?: unknown[] })
            .__filterMatchModeChanges
      )
    )
    .toEqual([{ filterId: 'status', mode: 'all' }]);
  await expect(control).toHaveJSProperty('matchModes', { status: 'all' });
});

test('supports semantic relative dates and fixed calendar ranges @pr-critical', async ({
  page,
}) => {
  const control = page.locator('#column-customizer-filter');
  await control.evaluate((element: HTMLDsTableFilterElement) => {
    element.filters = [{ id: 'event-date', label: 'Date', kind: 'date' }];
    element.activeFilterId = 'event-date';
    element.values = {};
    (window as typeof window & { __dateFilterChanges?: unknown[] }).__dateFilterChanges = [];
    element.addEventListener('dsChange', event => {
      const detail = (
        event as CustomEvent<{
          filterId: string;
          value: string | string[] | boolean;
        }>
      ).detail;
      (window as typeof window & { __dateFilterChanges?: unknown[] }).__dateFilterChanges!.push(
        detail
      );
      element.values = { ...element.values, [detail.filterId]: detail.value };
    });
  });

  await control.getByRole('combobox', { name: 'Filter fleet' }).click();
  const popup = control.getByRole('dialog', { name: 'Filter fleet' });
  const dateHeader = popup.locator('.filter-menu__date-header');
  const dateTabs = dateHeader.locator('ds-tab-group');
  const rangeTab = popup.getByRole('tab', { name: 'Range' });
  const relativeTab = popup.getByRole('tab', { name: 'Relative' });

  await expect(dateHeader).toBeVisible();
  await expect(popup.getByRole('searchbox')).toHaveCount(0);
  expect((await dateHeader.boundingBox())?.height).toBeCloseTo(40, 1);
  await expect(dateHeader).toHaveCSS('padding', '4px');
  await expect(dateTabs).toHaveJSProperty('hasContainer', false);
  await expect(dateTabs.locator('.tab-list')).toHaveCSS('border-top-width', '0px');
  await expect(dateTabs.locator('.tab-list')).toHaveCSS(
    'background-color',
    'rgba(0, 0, 0, 0)'
  );
  expect((await popup.locator('.filter-menu__category-pane').boundingBox())?.width).toBeCloseTo(
    200,
    1
  );
  expect((await popup.locator('.filter-menu__options').boundingBox())?.width).toBeCloseTo(300, 1);
  await expect(dateHeader.getByRole('tab')).toHaveText(['Relative', 'Range']);
  await expect(relativeTab).toHaveAttribute('aria-selected', 'true');
  await expect(popup.getByRole('option')).toHaveText([
    'Today',
    'Yesterday',
    'Last 7 days',
    'Last 14 days',
    'Last 30 days',
    'Last 60 days',
    'Last 90 days',
  ]);

  await popup.getByRole('option', { name: 'Last 7 days' }).click();
  const dateCategory = popup.locator('[data-filter-category="event-date"]');
  await expect(dateCategory.locator('ds-badge')).toHaveJSProperty('variant', 'dot');
  await expect(dateCategory.locator('ds-tag')).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as typeof window & { __dateFilterChanges?: unknown[] }).__dateFilterChanges
      )
    )
    .toEqual([{ filterId: 'event-date', value: 'relative:last-7-days' }]);

  await rangeTab.click();
  await expect(rangeTab).toHaveAttribute('aria-selected', 'true');
  await expect(popup.getByRole('grid')).toBeVisible();
  const previousMonth = popup.getByRole('button', { name: 'Previous month' });
  const nextMonth = popup.getByRole('button', { name: 'Next month' });
  await expect(previousMonth).toHaveClass(/ds-control--md/);
  await expect(nextMonth).toHaveClass(/ds-control--md/);
  const calendarHeading = popup.locator('.filter-menu__calendar-heading');
  const weekdays = popup.locator('.filter-menu__calendar-weekdays');
  const [headingBounds, previousBounds, nextBounds] = await Promise.all([
    calendarHeading.boundingBox(),
    previousMonth.boundingBox(),
    nextMonth.boundingBox(),
  ]);
  expect(previousBounds?.x).toBeCloseTo(headingBounds?.x ?? 0, 1);
  expect((nextBounds?.x ?? 0) + (nextBounds?.width ?? 0)).toBeCloseTo(
    (headingBounds?.x ?? 0) + (headingBounds?.width ?? 0),
    1
  );
  expect(previousBounds?.width).toBeCloseTo(32, 1);
  expect(previousBounds?.height).toBeCloseTo(32, 1);
  expect(nextBounds?.width).toBeCloseTo(32, 1);
  expect(nextBounds?.height).toBeCloseTo(32, 1);
  await expect(weekdays).toHaveCSS('margin-top', '4px');
  const calendarDays = popup.locator('[data-date-option]');
  await expect(calendarDays).toHaveCount(42);
  const dateBounds = await calendarDays.nth(10).boundingBox();
  const calendarGrid = popup.getByRole('grid');
  const calendarGridBounds = await calendarGrid.boundingBox();
  const calendarGap = await calendarGrid.evaluate(element => ({
    column: Number.parseFloat(getComputedStyle(element).columnGap),
    row: Number.parseFloat(getComputedStyle(element).rowGap),
  }));
  expect(calendarGap.column).toBeCloseTo(4, 1);
  expect(calendarGap.row).toBeCloseTo(4, 1);
  expectGeometryClose(
    (dateBounds?.width ?? 0) * 7 + calendarGap.column * 6,
    calendarGridBounds?.width ?? 0,
    'Calendar columns and gaps fill the grid'
  );
  expect(dateBounds?.height).toBeCloseTo(32, 1);
  await expect(
    popup
      .locator(
        '.filter-menu__calendar-day:not(.filter-menu__calendar-day--outside):not(.filter-menu__calendar-day--today):not(.filter-menu__calendar-day--in-range) ds-text'
      )
      .first()
  ).toHaveJSProperty('color', 'secondary');
  await expect(
    popup.locator('.filter-menu__calendar-day--outside ds-text').first()
  ).toHaveJSProperty('color', 'tertiary');
  await expect(popup.locator('.filter-menu__calendar-day--today ds-text')).toHaveJSProperty(
    'color',
    'primary'
  );
  await expect(calendarDays.first().locator('ds-text')).toHaveJSProperty(
    'variant',
    'text-body-medium'
  );
  const firstDate = await calendarDays.nth(10).getAttribute('data-date-option');
  const secondDate = await calendarDays.nth(15).getAttribute('data-date-option');
  expect(firstDate).toBeTruthy();
  expect(secondDate).toBeTruthy();
  await calendarDays.nth(10).click();
  await calendarDays.nth(15).hover();
  await expect(popup.locator('.filter-menu__calendar-day--range-preview')).toHaveCount(6);
  await expect(popup.locator('.filter-menu__calendar-day--range-edge')).toHaveCount(1);
  await expect(calendarDays.nth(10).locator('ds-text')).toHaveJSProperty('color', 'on-bold');
  await expect(calendarDays.nth(15).locator('ds-text')).toHaveJSProperty('color', 'primary');
  await expect(calendarDays.nth(15)).toHaveAttribute('aria-selected', 'false');
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as typeof window & { __dateFilterChanges?: unknown[] }).__dateFilterChanges
      )
    )
    .toEqual([
      { filterId: 'event-date', value: 'relative:last-7-days' },
      { filterId: 'event-date', value: `range:${firstDate}/${firstDate}` },
    ]);
  await calendarDays.nth(15).click();
  await expect(popup.locator('.filter-menu__calendar-day--range-preview')).toHaveCount(0);
  await expect(
    popup.locator('.filter-menu__calendar-day--range-edge ds-text').first()
  ).toHaveJSProperty('color', 'on-bold');
  await expect(
    popup
      .locator(
        '.filter-menu__calendar-day--in-range:not(.filter-menu__calendar-day--range-edge) ds-text'
      )
      .first()
  ).toHaveJSProperty('color', 'primary');
  const start = firstDate! < secondDate! ? firstDate! : secondDate!;
  const end = firstDate! < secondDate! ? secondDate! : firstDate!;
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as typeof window & { __dateFilterChanges?: unknown[] }).__dateFilterChanges
      )
    )
    .toEqual([
      { filterId: 'event-date', value: 'relative:last-7-days' },
      { filterId: 'event-date', value: `range:${firstDate}/${firstDate}` },
      { filterId: 'event-date', value: `range:${start}/${end}` },
    ]);
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
    (element as HTMLElement).style.inlineSize = '1000px';
  });

  const expandedGeometry = await table.evaluate(element => {
    const caption = element.querySelector<HTMLElement>('.ds-table__caption-content')!;
    const toolbar = element.querySelector<HTMLElement>('.table-toolbar')!;
    const search = element.querySelector<HTMLElement>('#column-customizer-search')!;
    return {
      captionGap: Number.parseFloat(getComputedStyle(caption).columnGap),
      searchWidth: search.getBoundingClientRect().width,
      toolbarGap: Number.parseFloat(getComputedStyle(toolbar).gap),
    };
  });

  expect(expandedGeometry.searchWidth).toBeGreaterThan(300);
  expect(expandedGeometry.toolbarGap).toBe(8);
  expect(expandedGeometry.captionGap).toBe(8);
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
    await expect.poll(async () => (await surface.boundingBox())!.width).toBeLessThanOrEqual(400);
  }
  const narrowGeometry = await Promise.all([
    search.boundingBox(),
    group.boundingBox(),
    customize.boundingBox(),
  ]);
  expect(narrowGeometry[0]!.width).toBeLessThan(300);
  expect(narrowGeometry[2]!.x - (narrowGeometry[1]!.x + narrowGeometry[1]!.width)).toBeCloseTo(
    8,
    0
  );

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
  const sortTrigger = page
    .locator('#column-customizer-sort')
    .getByRole('button', { name: 'Sort table' });
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
  await expect(table.locator('th[data-column-id="status"]')).toHaveAttribute(
    'aria-sort',
    'ascending'
  );

  await menu.getByRole('menuitem', { name: 'Descending' }).click();
  await expect(table).toHaveJSProperty('sort', { columnId: 'status', direction: 'desc' });
  await expect(table.locator('th[data-column-id="status"]')).toHaveAttribute(
    'aria-sort',
    'descending'
  );

  await page.keyboard.press('Escape');
  await table.getByRole('button', { name: /Sort Driver/ }).click();
  await expect(table).toHaveJSProperty('sort', { columnId: 'name', direction: 'asc' });

  await sortTrigger.click();
  await expect(
    page.getByRole('menu', { name: 'Sort table' }).getByRole('menuitem', { name: 'Driver' })
  ).toHaveClass(/menu-item--selected/);
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
  await expect(
    trailingControls.nth(0).getByRole('button', { name: 'Customize table' })
  ).toBeVisible();
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
      page.evaluate(() =>
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
  await page.mouse.move(probeBox!.x + probeBox!.width / 2, probeBox!.y + probeBox!.height / 2);
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
