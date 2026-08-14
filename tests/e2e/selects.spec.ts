import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { chromiumOnly } from './browser-tier';

test.beforeEach(async ({ page }) => {
  await page.goto('/selects.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('defaults both select triggers to hug width and supports explicit fill',
  chromiumOnly('layout-geometry', 'Explicit width props map to deterministic trigger geometry.'),
  async ({ page }) => {
  for (const selector of ['#single', '#multi']) {
    const select = page.locator(selector);
    await expect
      .poll(() =>
        select.evaluate((element: HTMLDsSelectElement) => element.width)
      )
      .toBe('hug');
    await expect(select).toHaveClass(/ds-control-width--hug/);

    await select.evaluate((element: HTMLDsSelectElement) => {
      element.width = 'fill';
      element.style.width = '320px';
    });
    await expect(select).toHaveClass(/ds-control-width--fill/);
    const alignment = await select.getByRole('combobox').evaluate(trigger => {
      const label = trigger.querySelector<HTMLElement>('.trigger__label-box');
      const triggerRect = trigger.getBoundingClientRect();
      const labelRect = label?.getBoundingClientRect();
      return {
        justifyContent: getComputedStyle(trigger).justifyContent,
        labelTextAlign: label ? getComputedStyle(label).textAlign : undefined,
        labelWidth: labelRect?.width ?? 0,
        triggerWidth: triggerRect.width,
      };
    });
    expect(alignment.justifyContent).toBe('flex-start');
    expect(alignment.labelTextAlign).toBe('left');
    expect(alignment.labelWidth).toBeGreaterThan(alignment.triggerWidth / 2);
  }
});

test('keeps hasBorder=false borderless when selected, focused, and invalid',
  chromiumOnly('controlled-behavior', 'The borderless override is a deterministic visual-state contract.'),
  async ({ page }) => {
  const select = page.locator('#borderless-error');
  const trigger = select.getByRole('combobox');

  await select.evaluate((element: HTMLDsSelectElement) => {
    element.value = 'cherry';
  });
  await trigger.focus();

  const presentation = await trigger.evaluate(element => ({
    borderWidth: getComputedStyle(element)
      .getPropertyValue('--ds-interaction-border-width')
      .trim(),
    borderedClass: element.classList.contains('trigger--bordered'),
    errorClass: element.classList.contains('wrapper--error'),
  }));

  await expect(select).toHaveJSProperty('hasBorder', false);
  await expect(trigger).toHaveAttribute('aria-invalid', 'true');
  expect(presentation.borderWidth).toBe('0px');
  expect(presentation.borderedClass).toBe(false);
  expect(presentation.errorClass).toBe(false);
});

test('uses combobox and listbox semantics with disabled-option keyboard skipping', async ({
  page,
}) => {
  const select = page.locator('#single');
  const trigger = select.getByRole('combobox');

  await expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
  await trigger.press('ArrowDown');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');

  const listbox = select.getByRole('listbox');
  await expect(listbox).toBeVisible();
  await expect(listbox.getByRole('option')).toHaveCount(4);
  await expect(listbox.locator('.ds-choice-item__icon')).toHaveCount(4);
  const selectedIcon = listbox.locator(
    '[role="option"][aria-selected="true"] .ds-choice-item__icon'
  );
  const primaryColor = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-foreground-primary)';
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  await expect(selectedIcon).toHaveCSS('color', primaryColor);
  await expect(listbox.getByRole('option', { name: 'Banana' })).toHaveAttribute(
    'aria-disabled',
    'true'
  );
  await expect
    .poll(() =>
      listbox.evaluate(element =>
        [...element.querySelectorAll('ds-icon')].some(
          icon => (icon as HTMLDsIconElement).name === 'Check'
        )
      )
    )
    .toBe(false);

  await trigger.press('ArrowDown');
  await expect(trigger).toHaveAttribute('aria-activedescendant', /option-3$/);
  const activeId = await trigger.getAttribute('aria-activedescendant');
  expect(activeId).toBeTruthy();
  await expect(page.locator(`#${activeId}`)).toHaveClass(/ds-focus-ring--visible/);
  await trigger.press('Enter');
  await expect
    .poll(() => select.evaluate((element: HTMLDsSelectElement) => element.value))
    .toBe('date');
  await expect(trigger).toBeFocused();

  await trigger.press('ArrowDown');
  await trigger.press('Home');
  await trigger.press('Space');
  await expect
    .poll(() => select.evaluate((element: HTMLDsSelectElement) => element.value))
    .toBe('apple');
  await expect(trigger).toBeFocused();

  await trigger.press('ArrowDown');
  await trigger.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  await trigger.press('ArrowDown');
  const tabWasPrevented = await trigger.evaluate(element => {
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(tabWasPrevented).toBe(false);
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test(
  'keeps grouped select header geometry while nudging only its text down 4px',
  chromiumOnly(
    'layout-geometry',
    'The shared token-backed section-heading construction is engine-neutral.'
  ),
  async ({ page }) => {
    const select = page.locator('#multi');
    await select.getByRole('combobox').click();
    const heading = select.locator('.ds-choice-section__header').first();

    const geometry = await heading.evaluate(element => {
      const label = element.querySelector<HTMLElement>('.ds-choice-section__header-label')!;
      const style = getComputedStyle(element);
      const labelTransform = new DOMMatrix(getComputedStyle(label).transform);
      return {
        height: style.height,
        paddingInline: style.paddingInline,
        labelOffset: labelTransform.m42,
      };
    });

    expect(geometry).toEqual({
      height: '32px',
      paddingInline: '8px',
      labelOffset: 4,
    });
  }
);

test('keeps a scalar trigger label override while the popup shows the selected option label', async ({
  page,
}) => {
  const select = page.locator('#single');
  const trigger = select.getByRole('combobox');

  await select.evaluate((element: HTMLDsSelectElement) => {
    element.value = 'apple';
    element.triggerLabel = 'Fruit';
    element.triggerLabelPlaceholder = true;
    element.dot = true;
    element.footerActionLabel = 'Save view';
    (window as typeof window & { __selectFooterActions?: number }).__selectFooterActions = 0;
    element.addEventListener('dsFooterAction', () => {
      (window as typeof window & { __selectFooterActions: number }).__selectFooterActions += 1;
    });
  });
  await expect(trigger.locator('.trigger__label')).toHaveText('Fruit');
  await expect(trigger).toHaveClass(/trigger--label-placeholder/);
  const placeholderColor = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-foreground-secondary)';
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  const labelBox = trigger.locator('.trigger__label-box');
  const dottedLabel = trigger.locator('.trigger__label-content');
  const triggerDot = trigger.locator('.trigger__dot');
  await expect(labelBox).toHaveCSS('color', placeholderColor);
  await expect(dottedLabel).toHaveClass(/ds-control-label-dot/);
  await expect(triggerDot).toHaveClass(/ds-control-label-dot__badge/);
  await expect(triggerDot).toHaveCSS('top', '0px');
  await expect(triggerDot).toHaveCSS('right', '0px');
  const dotTextAlignment = await dottedLabel.evaluate(label => {
    const text = label.querySelector('ds-text')!.getBoundingClientRect();
    const dot = label.querySelector('ds-badge')!.getBoundingClientRect();
    return dot.top - text.top;
  });
  expect(dotTextAlignment).toBeCloseTo(0, 3);
  await expect(triggerDot).toBeVisible();

  await trigger.click();
  await expect(trigger.locator('.trigger__label')).toHaveText('Fruit');
  await expect(trigger.locator('.trigger__dot')).toBeVisible();
  await expect(select.getByRole('option', { name: 'Apple', selected: true })).toBeVisible();
  await select.getByRole('button', { name: 'Save view' }).click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect.poll(() => page.evaluate(() =>
    (window as typeof window & { __selectFooterActions: number }).__selectFooterActions
  )).toBe(1);
});

test('exposes contextual option actions without changing selection', async ({ page }) => {
  const select = page.locator('#single');
  const trigger = select.getByRole('combobox');
  await select.evaluate((element: HTMLDsSelectElement) => {
    element.options = [
      { label: 'Default', value: 'default' },
      {
        label: 'My view',
        value: 'my-view',
        action: {
          label: 'Options for My view',
          controls: 'my-view-menu',
        },
      },
    ];
    element.value = 'default';
    (window as typeof window & { __selectOptionAction?: unknown }).__selectOptionAction = null;
    element.addEventListener('dsOptionAction', event => {
      const detail = (event as CustomEvent<{
        value: string;
        anchorId: string;
        originalEvent: MouseEvent;
      }>).detail;
      (window as typeof window & { __selectOptionAction?: unknown }).__selectOptionAction = {
        value: detail.value,
        anchorId: detail.anchorId,
        keyboard: detail.originalEvent.detail === 0,
      };
    });
  });

  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-haspopup', 'grid');
  const grid = select.getByRole('grid');
  const defaultOption = grid.getByRole('gridcell', { name: 'Default', exact: true });
  const userOption = grid.getByRole('gridcell', { name: 'My view', exact: true });
  const action = select.getByRole('button', { name: 'Options for My view' });
  const actionSurface = select.locator('.select-option-row__action');

  await expect(defaultOption.locator('xpath=..').locator('.select-option-row__action')).toHaveCount(0);
  await expect(action).toHaveAttribute('aria-haspopup', 'menu');
  await expect(action).toHaveAttribute('aria-controls', 'my-view-menu');
  await expect(actionSurface).toHaveCSS('opacity', '0');

  await userOption.hover();
  await expect(actionSurface).toHaveCSS('opacity', '1');
  const actionInsets = await userOption.locator('xpath=..').evaluate(row => {
    const rowRect = row.getBoundingClientRect();
    const buttonRect = row.querySelector('ds-button-unfilled')?.getBoundingClientRect();
    return {
      top: (buttonRect?.top ?? 0) - rowRect.top,
      right: rowRect.right - (buttonRect?.right ?? 0),
      bottom: rowRect.bottom - (buttonRect?.bottom ?? 0),
    };
  });
  expect(actionInsets.right).toBeCloseTo(actionInsets.top, 3);
  expect(actionInsets.right).toBeCloseTo(actionInsets.bottom, 3);
  await action.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect
    .poll(() => select.evaluate((element: HTMLDsSelectElement) => element.value))
    .toBe('default');
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as typeof window & { __selectOptionAction?: unknown }).__selectOptionAction
      )
    )
    .toMatchObject({ value: 'my-view', keyboard: false });

  await trigger.focus();
  await trigger.press('End');
  await trigger.press('ArrowRight');
  await expect(action).toBeFocused();
  await action.press('Enter');
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as typeof window & { __selectOptionAction?: unknown }).__selectOptionAction
      )
    )
    .toMatchObject({ value: 'my-view', keyboard: true });
  await expect
    .poll(() => select.evaluate((element: HTMLDsSelectElement) => element.value))
    .toBe('default');
});

test('keeps single and multi popups visible and pointer-usable after repeated reopen cycles', async ({
  page,
}) => {
  const single = page.locator('#single');
  const singleTrigger = single.getByRole('combobox');

  for (const option of [
    { label: 'Apple', value: 'apple' },
    { label: /Cherry/, value: 'cherry' },
    { label: 'Date', value: 'date' },
  ]) {
    await singleTrigger.click();
    await expect(single.getByRole('listbox')).toBeVisible();
    await single.getByRole('option', { name: option.label }).click();
    await expect
      .poll(() => single.evaluate((element: HTMLDsSelectElement) => element.value))
      .toBe(option.value);
    await expect(singleTrigger).toHaveAttribute('aria-expanded', 'false');
  }

  const multi = page.locator('#multi');
  const multiTrigger = multi.getByRole('combobox');

  for (let cycle = 0; cycle < 3; cycle += 1) {
    await multiTrigger.click();
    await expect(multi.getByRole('listbox')).toBeVisible();
    await multi.getByRole('option', { name: 'Date' }).click();
    await expect
      .poll(() =>
        multi.evaluate((element: HTMLDsSelectElement) =>
          Array.isArray(element.value) && element.value.includes('date')
        )
      )
      .toBe(cycle % 2 === 0);
    await multiTrigger.press('Escape');
    await expect(multiTrigger).toHaveAttribute('aria-expanded', 'false');
  }
});

test('keeps single and multi popups viewport-anchored inside contained clipping layouts', async ({
  page,
}) => {
  for (const selector of ['#contained-single', '#contained-multi']) {
    const select = page.locator(selector);
    const trigger = select.getByRole('combobox');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const popup = select.locator('.select-popup');
    await expect(popup).toBeVisible();
    await expect(popup).toHaveJSProperty('popover', 'manual');
    expect(await popup.evaluate(element => element.matches(':popover-open'))).toBe(true);

    const [triggerBox, popupBox, containerBox] = await Promise.all([
      trigger.boundingBox(),
      popup.boundingBox(),
      page.locator('.contained-selects').boundingBox(),
    ]);
    expect(triggerBox).not.toBeNull();
    expect(popupBox).not.toBeNull();
    expect(containerBox).not.toBeNull();
    expect(containerBox!.x).toBeGreaterThan(0);
    expect(containerBox!.y).toBeGreaterThan(0);
    expect(popupBox!.x).toBeCloseTo(triggerBox!.x - 4, 0);
    expect(popupBox!.y).toBeCloseTo(triggerBox!.y + triggerBox!.height + 4, 0);
    expect(popupBox!.y + popupBox!.height).toBeGreaterThan(containerBox!.y + containerBox!.height);

    await trigger.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  }
});

test('aligns the popup choice edge to the trigger end when requested', async ({ page }) => {
  const select = page.locator('#single');
  const trigger = select.getByRole('combobox');
  await select.evaluate((element: HTMLDsSelectElement) => {
    element.popupAlign = 'end';
    element.style.marginInlineStart = '240px';
  });
  await trigger.click();
  const popup = select.locator('.select-popup');
  await expect(popup).toBeVisible();
  const geometry = await trigger.evaluate((element, popupSelector) => {
    const triggerRect = element.getBoundingClientRect();
    const popupRect = document.querySelector<HTMLElement>(popupSelector)!.getBoundingClientRect();
    return {
      triggerRight: triggerRect.right,
      popupRight: popupRect.right,
    };
  }, '#single > .select-popup');
  expect(geometry.popupRight).toBeCloseTo(geometry.triggerRight + 4, 0);
});

test('falls back to one text-only option layout when icon data is mixed',
  chromiumOnly('controlled-behavior', 'Mixed option data maps deterministically to one component-owned layout.'),
  async ({ page }) => {
  const select = page.locator('#single');
  await select.evaluate((element: HTMLDsSelectElement) => {
    element.options = [
      { label: 'With icon', value: 'with-icon', icon: 'Chart' },
      { label: 'Without icon', value: 'without-icon' },
    ];
  });

  await select.getByRole('combobox').click();
  await expect(select.getByRole('option')).toHaveCount(2);
  await expect(select.locator('.ds-choice-item__icon')).toHaveCount(0);
});

test('keeps the active descendant visible in long single and multi lists', async ({ page }) => {
  for (const selector of ['#single', '#multi']) {
    const select = page.locator(selector);
    await select.evaluate((element: HTMLDsSelectElement) => {
      element.options = Array.from({ length: 40 }, (_, index) => ({
        label: `Option ${String(index + 1).padStart(2, '0')}`,
        value: `option-${index + 1}`,
      }));
    });

    const trigger = select.getByRole('combobox');
    await trigger.press('ArrowDown');
    await trigger.press('End');

    await expect
      .poll(async () => {
        const activeId = await trigger.getAttribute('aria-activedescendant');
        if (!activeId) return false;
        return select.evaluate((element, id) => {
          const listbox = element.querySelector<HTMLElement>('[role="listbox"]');
          const option = element.querySelector<HTMLElement>(`#${id}`);
          if (!listbox || !option) return false;
          const listboxRect = listbox.getBoundingClientRect();
          const optionRect = option.getBoundingClientRect();
          return optionRect.top >= listboxRect.top && optionRect.bottom <= listboxRect.bottom;
        }, activeId);
      })
      .toBe(true);

    await trigger.press('Escape');
  }
});

test('supports buffered local typeahead and clear while preserving the open popup', async ({
  page,
}) => {
  const select = page.locator('#single');
  const trigger = select.getByRole('combobox');

  await select.evaluate((element: HTMLDsSelectElement) => {
    element.value = '';
  });
  await expect(trigger).not.toHaveClass(/ds-interaction-fill--selected/);
  await trigger.press('a');
  await trigger.press('Enter');
  await expect
    .poll(() => select.evaluate((element: HTMLDsSelectElement) => element.value))
    .toBe('apple');
  await expect(trigger).toHaveClass(/ds-interaction-fill--selected/);

  await trigger.click();
  await select.getByRole('button', { name: 'Clear' }).click();
  await expect
    .poll(() => select.evaluate((element: HTMLDsSelectElement) => element.value))
    .toBe('');
  await expect(trigger).not.toHaveClass(/ds-interaction-fill--selected/);
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(() => page.evaluate(() => window.__selectClears)).toContain('single');

  await select.getByRole('option', { name: /Cherry/ }).click();
  await expect
    .poll(() => select.evaluate((element: HTMLDsSelectElement) => element.value))
    .toBe('cherry');
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('filters locally by subtext and preserves group semantics', async ({ page }) => {
  const select = page.locator('#searchable');
  await select.getByRole('combobox').click();
  const search = select.getByRole('searchbox', { name: 'Search' });
  await expect(search).toHaveClass(/ds-text--body-medium/);

  const alignment = await select.evaluate(element => {
    const searchIcon = element.querySelector('.select-search ds-icon')?.getBoundingClientRect();
    const searchInput = element.querySelector('.select-search input')?.getBoundingClientRect();
    const optionIcon = element.querySelector('.ds-choice-item ds-icon')?.getBoundingClientRect();
    const optionLabel = element.querySelector('.ds-choice-item__label')?.getBoundingClientRect();
    return {
      searchIconWidth: searchIcon?.width,
      iconLeftDelta: Math.abs((searchIcon?.left ?? 0) - (optionIcon?.left ?? 0)),
      labelLeftDelta: Math.abs((searchInput?.left ?? 0) - (optionLabel?.left ?? 0)),
    };
  });
  expect(alignment.searchIconWidth).toBe(20);
  expect(alignment.iconLeftDelta).toBeLessThanOrEqual(0.5);
  expect(alignment.labelLeftDelta).toBeLessThanOrEqual(0.5);

  const searchRegion = select.locator('.select-search');
  const searchControl = select.locator('.select-search__control');
  await expect(searchControl).toHaveCSS('height', '32px');
  await expect(searchControl).toHaveCSS('border-top-width', '0px');
  for (const side of ['top', 'right', 'bottom', 'left'] as const) {
    await expect(searchRegion).toHaveCSS(`padding-${side}`, '4px');
  }
  await search.focus();
  await expect
    .poll(() =>
      searchRegion.evaluate(element => {
        const style = getComputedStyle(element, '::after');
        const probe = document.createElement('span');
        probe.style.color = 'var(--color-border-bold-brand)';
        document.body.append(probe);
        const expectedColor = getComputedStyle(probe).color;
        probe.remove();
        return {
          height: style.height,
          colorMatches: style.backgroundColor === expectedColor,
        };
      })
    )
    .toEqual({ height: '1.5px', colorMatches: true });

  await search.evaluate(element => element.blur());
  await expect
    .poll(() => searchRegion.evaluate(element => getComputedStyle(element, '::after').height))
    .toBe('1px');

  const rows = select.getByRole('option');
  await expect(rows.locator('.ds-choice-item__subtext')).toHaveCount(4);
  await expect(rows.first().locator('.ds-choice-item__subtext')).toHaveText('—');
  const textTreatment = await rows.first().evaluate(element => {
    const label = element.querySelector<HTMLElement>('.ds-choice-item__label');
    const subtext = element.querySelector<HTMLElement>('.ds-choice-item__subtext');
    return {
      labelWhiteSpace: label ? getComputedStyle(label).whiteSpace : undefined,
      subtextLineClamp: subtext ? getComputedStyle(subtext).webkitLineClamp : undefined,
      subtextWhiteSpace: subtext ? getComputedStyle(subtext).whiteSpace : undefined,
    };
  });
  expect(textTreatment.labelWhiteSpace).toBe('nowrap');
  expect(textTreatment.subtextLineClamp).toBe('2');
  expect(textTreatment.subtextWhiteSpace).toBe('normal');

  await search.fill('dark');

  const options = select.getByRole('option');
  await expect(options).toHaveCount(1);
  await expect(options.first()).toContainText('Cherry');
});

test('shares a rounded sm search clear button across single and multi selects',
  chromiumOnly('layout-geometry', 'The shared clear-button recipe is token-backed static geometry.'),
  async ({
  page,
}) => {
  for (const selector of ['#searchable', '#multi-search']) {
    const select = page.locator(selector);
    await select.getByRole('combobox').click();
    const search = select.getByRole('searchbox', { name: 'Search' });
    await search.click();
    await expect(search).toBeFocused();

    const focusedPlaceholder = await search.evaluate(element => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--color-foreground-quaternary)';
      element.parentElement?.append(probe);
      const expected = getComputedStyle(probe).color;
      probe.remove();
      return {
        actual: getComputedStyle(element, '::placeholder').color,
        expected,
      };
    });
    expect(focusedPlaceholder.actual).toBe(focusedPlaceholder.expected);

    await search.fill('app');

    const clearHost = select.locator('ds-button-unfilled.select-search__clear');
    const clear = clearHost.getByRole('button', { name: 'Clear', exact: true });
    await expect(clearHost).toHaveJSProperty('variant', 'icon');
    await expect(clearHost).toHaveJSProperty('size', 'sm');
    await expect(clearHost).toHaveJSProperty('icon', 'CrossCircle');
    await expect(clearHost).toHaveJSProperty('hasBorder', false);
    await expect(clearHost).toHaveJSProperty('rounded', true);
    await expect(clear).toHaveCSS('border-radius', '9999px');

    const spacing = await select.locator('.select-search__control').evaluate(element => {
      const control = element.getBoundingClientRect();
      const button = element.querySelector('ds-button-unfilled')?.getBoundingClientRect();
      return {
        top: (button?.top ?? 0) - control.top,
        right: control.right - (button?.right ?? 0),
        bottom: control.bottom - (button?.bottom ?? 0),
      };
    });
    expect(spacing.top).toBeCloseTo(4, 3);
    expect(spacing.right).toBeCloseTo(4, 3);
    expect(spacing.bottom).toBeCloseTo(4, 3);

    await clear.click();
    await expect(search).toHaveValue('');
    await expect(search).toBeFocused();
    await expect(clearHost).toHaveCount(0);
  }
});

test('uses body-only Empty State for empty single and multi search results',
  chromiumOnly('controlled-behavior', 'Empty-result composition and unavailable-option semantics are deterministic after filtering.'),
  async ({ page }) => {
  for (const selector of ['#searchable', '#multi-search']) {
    const select = page.locator(selector);
    await select.getByRole('combobox').click();
    await select.getByRole('searchbox', { name: 'Search' }).fill('no matching choices');

    const emptyState = select.locator('ds-empty-state');
    const emptyOption = select.getByRole('option', { name: 'No results found' });
    await expect(emptyOption).toHaveAttribute('aria-disabled', 'true');
    await expect(emptyOption).toHaveAttribute('aria-selected', 'false');
    await expect(emptyState).toHaveCount(1);
    await expect(emptyState.locator('ds-icon')).toHaveCount(0);
    await expect(emptyState.locator('.empty-state__title')).toHaveCount(0);
    await expect(emptyState.locator('.empty-state__body')).toHaveText('No results found');
    await expect(emptyState.locator('.empty-state__body')).toHaveClass(/ds-text--body-medium/);
    await expect(emptyState.locator('.empty-state__body')).toHaveClass(/ds-text--color-secondary/);
  }
});

test('shows busy state in the trigger and popup',
  chromiumOnly('controlled-behavior', 'Busy-state composition and ARIA semantics follow explicit controlled props.'),
  async ({ page }) => {
  const select = page.locator('#loading');
  const trigger = select.getByRole('combobox');

  await expect(trigger).toHaveAttribute('aria-busy', 'true');
  await expect(trigger.locator('ds-loader')).toHaveCount(1);
  await trigger.click();
  const loadingOption = select.getByRole('option', { name: 'Loading' });
  const popupLoader = loadingOption.locator('ds-loader');
  await expect(loadingOption).toHaveCount(1);
  await expect(loadingOption).toHaveAttribute('aria-disabled', 'true');
  await expect(loadingOption).toHaveAttribute('aria-selected', 'false');
  await expect(loadingOption).toHaveAttribute('aria-live', 'polite');

  const [loadingBox, loaderBox] = await Promise.all([
    loadingOption.boundingBox(),
    popupLoader.boundingBox(),
  ]);
  expect(loadingBox).not.toBeNull();
  expect(loaderBox).not.toBeNull();
  expect(loaderBox!.x + loaderBox!.width / 2).toBeCloseTo(
    loadingBox!.x + loadingBox!.width / 2,
    1
  );
  expect(loaderBox!.y + loaderBox!.height / 2).toBeCloseTo(
    loadingBox!.y + loadingBox!.height / 2,
    1
  );
});

test('uses a thicker inset stroke for error without changing control geometry',
  chromiumOnly('layout-geometry', 'Error stroke and unchanged bounds are local token-backed geometry.'),
  async ({
  page,
}) => {
  for (const selector of ['#single', '#multi']) {
    const select = page.locator(selector);
    const trigger = select.getByRole('combobox');
    const normalHeight = await trigger.evaluate(element => element.getBoundingClientRect().height);

    await expect
      .poll(() => trigger.evaluate(element => getComputedStyle(element, '::after').boxShadow))
      .toMatch(/0px 0px 0px 1px/);
    await select.evaluate((element: HTMLDsSelectElement) => {
      element.error = true;
      element.errorMessage = 'Make a selection.';
    });

    await expect
      .poll(() => trigger.evaluate(element => getComputedStyle(element, '::after').boxShadow))
      .toMatch(/0px 0px 0px 1.5px/);
    await expect
      .poll(() => trigger.evaluate(element => element.getBoundingClientRect().height))
      .toBe(normalHeight);
  }
});

test('keeps the multi trigger label and inline count, repeated selection, and clear-all behavior', async ({
  page,
}) => {
  const select = page.locator('#multi');
  const trigger = select.getByRole('combobox');
  const triggerLabel = trigger.locator('.trigger__label');

  await expect(triggerLabel).toHaveText('Entities · 2');
  await expect(trigger.locator('ds-badge')).toHaveCount(0);
  for (const [size, textClass] of [
    ['md', 'ds-text--body-medium'],
    ['sm', 'ds-text--body-small'],
    ['xs', 'ds-text--caption'],
  ] as const) {
    await select.evaluate((element: HTMLDsSelectElement, nextSize) => {
      element.size = nextSize;
    }, size);
    await expect(triggerLabel).toHaveClass(new RegExp(textClass));
    await expect(triggerLabel).toHaveText('Entities · 2');
  }
  await select.evaluate((element: HTMLDsSelectElement) => {
    element.size = 'md';
  });
  await trigger.click();

  const listbox = select.getByRole('listbox');
  await expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
  await expect(listbox.locator('ds-checkbox')).toHaveCount(4);
  await expect(listbox.locator('ds-checkbox').first()).toHaveJSProperty('size', 'md');
  await expect(listbox.locator('.ds-choice-item > .ds-choice-item__icon > ds-icon')).toHaveCount(0);
  const selectedCheckbox = listbox.getByRole('option', { name: /Apple/ }).locator('ds-checkbox');
  await expect(selectedCheckbox).toHaveAttribute('aria-hidden', 'true');
  await expect(selectedCheckbox).not.toHaveAttribute('role', 'checkbox');
  await expect
    .poll(() => selectedCheckbox.evaluate((element: HTMLDsCheckboxElement) => element.checked))
    .toBe(true);
  const dateOption = listbox.getByRole('option', { name: 'Date' });
  await dateOption.click();
  await expect(dateOption).not.toHaveClass(/ds-focus-ring--visible/);
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect
    .poll(() => select.evaluate((element: HTMLDsSelectElement) => element.value))
    .toEqual(['apple', 'cherry', 'date']);
  await expect(triggerLabel).toHaveText('Entities · 3');
  await expect
    .poll(() =>
      dateOption
        .locator('ds-checkbox')
        .evaluate((element: HTMLDsCheckboxElement) => element.checked)
    )
    .toBe(true);

  const footer = select.locator('.ds-choice-footer');
  const footerContent = footer.locator('.ds-choice-footer__content');
  const summary = footer.locator('.ds-choice-footer__summary');
  const clear = select.getByRole('button', { name: 'Clear' });
  await expect(footer).toHaveCSS('height', '40px');
  await expect(footerContent).toHaveCSS('height', '32px');
  await expect
    .poll(() => footer.evaluate(element => getComputedStyle(element, '::before').height))
    .toBe('1px');
  await expect(footer).toHaveCSS('padding-top', '4px');
  await expect(footer).toHaveCSS('padding-right', '0px');
  await expect(footer).toHaveCSS('padding-bottom', '4px');
  await expect(footer).toHaveCSS('padding-left', '0px');
  await expect(footerContent).toHaveCSS('padding-right', '0px');
  await expect(footerContent).toHaveCSS('padding-left', '0px');
  await expect(summary).toHaveClass(/ds-text--body-medium/);
  await expect(summary).toHaveCSS('white-space', 'nowrap');
  await expect(summary).toHaveText('3 selected');
  await expect(clear.locator('ds-text')).toHaveClass(/ds-text--body-medium/);
  await expect(clear).toHaveCSS('white-space', 'nowrap');
  const labelPadding = await footer.evaluate(element => {
    const summaryElement = element.querySelector('.ds-choice-footer__summary');
    const clearElement = element.querySelector('.ds-choice-footer__clear ds-text');
    return {
      summaryLeft: summaryElement ? getComputedStyle(summaryElement).paddingLeft : '',
      summaryRight: summaryElement ? getComputedStyle(summaryElement).paddingRight : '',
      clearLeft: clearElement ? getComputedStyle(clearElement).paddingLeft : '',
      clearRight: clearElement ? getComputedStyle(clearElement).paddingRight : '',
    };
  });
  expect(new Set(Object.values(labelPadding))).toEqual(new Set([labelPadding.summaryLeft]));
  expect(Number.parseFloat(labelPadding.summaryLeft)).toBeGreaterThan(0);
  const insets = await footer.evaluate(element => {
    const footerRect = element.getBoundingClientRect();
    const summaryRect = element
      .querySelector('.ds-choice-footer__summary')
      ?.getBoundingClientRect();
    const clearRect = element
      .querySelector('.ds-choice-footer__clear ds-text')
      ?.getBoundingClientRect();
    return {
      left: (summaryRect?.left ?? 0) - footerRect.left,
      right: footerRect.right - (clearRect?.right ?? 0),
    };
  });
  expect(insets.left).toBeCloseTo(insets.right, 3);

  const popup = select.locator('.select-popup');
  await popup.evaluate(element => {
    element.style.minWidth = '0px';
    element.style.width = '110px';
  });
  await expect(summary).toHaveText('3');
  const compactLayout = await footer.evaluate(element => {
    const summaryRect = element
      .querySelector('.ds-choice-footer__summary')
      ?.getBoundingClientRect();
    const clearRect = element
      .querySelector('.ds-choice-footer__clear')
      ?.getBoundingClientRect();
    return {
      summaryRight: summaryRect?.right ?? 0,
      clearLeft: clearRect?.left ?? 0,
      clearHeight: clearRect?.height ?? 0,
      footerHeight: element.getBoundingClientRect().height,
    };
  });
  expect(compactLayout.summaryRight).toBeLessThanOrEqual(compactLayout.clearLeft);
  expect(compactLayout.clearHeight).toBeLessThanOrEqual(compactLayout.footerHeight);

  await popup.evaluate(element => {
    element.style.width = '240px';
  });
  await expect(summary).toHaveText('3 selected');

  const readTextActionStyles = (
    foregroundToken: string,
    underlineToken: string,
  ) => clear.evaluate((element, tokens) => {
    const foregroundProbe = document.createElement('span');
    const underlineProbe = document.createElement('span');
    const geometryProbe = document.createElement('span');
    foregroundProbe.style.color = `var(${tokens.foregroundToken})`;
    underlineProbe.style.color = `var(${tokens.underlineToken})`;
    geometryProbe.style.textDecorationThickness = 'var(--dimension-stroke-width-012)';
    geometryProbe.style.textUnderlineOffset = 'var(--dimension-space-025)';
    document.body.append(foregroundProbe, underlineProbe, geometryProbe);
    const actual = getComputedStyle(element);
    const geometry = getComputedStyle(geometryProbe);
    const result = {
      color: actual.color,
      expectedColor: getComputedStyle(foregroundProbe).color,
      underlineColor: actual.textDecorationColor,
      expectedUnderlineColor: getComputedStyle(underlineProbe).color,
      thickness: actual.textDecorationThickness,
      expectedThickness: geometry.textDecorationThickness,
      offset: actual.textUnderlineOffset,
      expectedOffset: geometry.textUnderlineOffset,
    };
    foregroundProbe.remove();
    underlineProbe.remove();
    geometryProbe.remove();
    return result;
  }, { foregroundToken, underlineToken });

  const brandStyles = await readTextActionStyles(
    '--color-foreground-bold-brand',
    '--color-foreground-bold-brand',
  );
  expect(brandStyles.color).toBe(brandStyles.expectedColor);
  expect(brandStyles.underlineColor).toBe(brandStyles.expectedUnderlineColor);
  expect(brandStyles.thickness).toBe(brandStyles.expectedThickness);
  expect(brandStyles.offset).toBe(brandStyles.expectedOffset);
  await expect(clear).toHaveCSS('text-decoration-line', 'none');

  const surfaceContexts = ['medium', 'strong', 'bold'] as const;
  for (const context of surfaceContexts) {
    await clear.evaluate((element, nextContext) => {
      element.classList.remove(
        'ds-text-action--on-medium',
        'ds-text-action--on-strong',
        'ds-text-action--on-bold',
      );
      element.classList.add(`ds-text-action--on-${nextContext}`);
    }, context);
    const surfaceStyles = await readTextActionStyles(
      `--color-foreground-on-${context}-background-primary`,
      `--color-foreground-on-${context}-background-secondary`,
    );
    await expect(clear).toHaveCSS('text-decoration-line', 'underline');
    expect(surfaceStyles.color).toBe(surfaceStyles.expectedColor);
    expect(surfaceStyles.underlineColor).toBe(surfaceStyles.expectedUnderlineColor);
    expect(surfaceStyles.thickness).toBe(surfaceStyles.expectedThickness);
    expect(surfaceStyles.offset).toBe(surfaceStyles.expectedOffset);
  }

  await clear.evaluate(element => {
    element.classList.remove(
      'ds-text-action--on-medium',
      'ds-text-action--on-strong',
      'ds-text-action--on-bold',
    );
  });
  await expect(clear).toHaveCSS('text-decoration-line', 'none');
  await clear.hover();
  await expect(clear).toHaveCSS('text-decoration-line', 'underline');
  await clear.click();
  await expect
    .poll(() => select.evaluate((element: HTMLDsSelectElement) => element.value))
    .toEqual([]);
  await expect(triggerLabel).toHaveText('Entities');
  await expect(select.getByRole('listbox')).toBeVisible();
});

test('submits repeated multi values, validates required controls, and resets', async ({ page }) => {
  const form = page.locator('#selection-form');
  const single = page.locator('#required-single');
  const multi = page.locator('#required-multi');

  await expect
    .poll(() => form.evaluate(element => (element as HTMLFormElement).checkValidity()))
    .toBe(false);
  await single.evaluate((element: HTMLDsSelectElement) => {
    element.value = 'apple';
  });
  await multi.evaluate((element: HTMLDsSelectElement) => {
    element.value = ['apple', 'cherry'];
  });
  await expect
    .poll(() => form.evaluate(element => (element as HTMLFormElement).checkValidity()))
    .toBe(true);

  await page.locator('#submit').click();
  await expect
    .poll(() => page.evaluate(() => window.__formEntries))
    .toEqual({
      fruit: 'apple',
      groups: ['apple', 'cherry'],
    });

  await page.locator('#reset').click();
  await expect
    .poll(() => single.evaluate((element: HTMLDsSelectElement) => element.value))
    .toBe('');
  await expect
    .poll(() => multi.evaluate((element: HTMLDsSelectElement) => element.value))
    .toEqual([]);
});

test('keeps prefix icons and chevrons secondary across selected surface contexts',
  chromiumOnly('layout-geometry', 'Foreground token mapping is deterministic across explicit contexts.'),
  async ({
  page,
}) => {
  const cases = [
    [undefined, '--color-foreground-secondary', '--color-foreground-primary'],
    ['faint', '--color-foreground-secondary', '--color-foreground-primary'],
    [
      'medium',
      '--color-foreground-on-medium-background-secondary',
      '--color-foreground-on-medium-background-primary',
    ],
    [
      'bold',
      '--color-foreground-on-bold-background-secondary',
      '--color-foreground-on-bold-background-primary',
    ],
    [
      'strong',
      '--color-foreground-on-strong-background-secondary',
      '--color-foreground-on-strong-background-primary',
    ],
    [
      'translucent',
      '--color-translucent-foreground-secondary',
      '--color-translucent-foreground-primary',
    ],
    ['inverted', '--color-inverted-foreground-secondary', '--color-inverted-foreground-primary'],
    ['media', '--color-media-foreground-secondary', '--color-media-foreground-primary'],
    [
      'always-dark',
      '--color-always-dark-foreground-secondary',
      '--color-always-dark-foreground-primary',
    ],
  ] as const;

  for (const selector of ['#single', '#multi']) {
    const select = page.locator(selector);
    await select.evaluate((element: HTMLDsSelectElement) => {
      element.icon = 'Chart';
      element.value = element.multiple ? ['apple'] : 'apple';
    });

    for (const [background, secondaryToken, primaryToken] of cases) {
      await select.evaluate((element: HTMLDsSelectElement, value) => {
        element.background = value;
      }, background);

      await expect
        .poll(() =>
          select.evaluate(
            (element, [secondary, primary]) => {
              const prefix = element.querySelector<HTMLElement>('.trigger__prefix');
              const chevron = element.querySelector<HTMLElement>('.trigger__chevron');
              const label = element.querySelector<HTMLElement>('.trigger__label');
              const probe = document.createElement('span');
              probe.style.color = `var(${secondary})`;
              document.body.append(probe);
              const expectedSecondary = getComputedStyle(probe).color;
              probe.style.color = `var(${primary})`;
              const expectedPrimary = getComputedStyle(probe).color;
              probe.remove();
              if (!prefix || !chevron || !label) return false;
              return (
                getComputedStyle(prefix).color === expectedSecondary &&
                getComputedStyle(chevron).color === expectedSecondary &&
                getComputedStyle(label).color === expectedPrimary
              );
            },
            [secondaryToken, primaryToken] as const
          )
        )
        .toBe(true);
    }
  }
});

test('has no detectable accessibility violations',
  chromiumOnly('accessibility', 'Storybook owns documented select states; this fixture retains one integrated Chromium Axe check.'),
  async ({ page }) => {
  await page.locator('#multi-search').getByRole('combobox').click();
  await expect(page.locator('#multi-search').getByRole('listbox')).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

declare global {
  interface Window {
    __selectClears: string[];
    __formEntries: { fruit: FormDataEntryValue | null; groups: FormDataEntryValue[] } | null;
  }
}
