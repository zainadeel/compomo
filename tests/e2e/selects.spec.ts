import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/selects.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('defaults both select triggers to hug width and supports explicit fill', async ({ page }) => {
  for (const selector of ['#single', '#multi']) {
    const select = page.locator(selector);
    await expect.poll(() =>
      select.evaluate((element: HTMLDsSelectElement | HTMLDsSelectMultiElement) => element.width),
    ).toBe('hug');
    await expect(select).toHaveClass(/ds-control-width--hug/);

    await select.evaluate((element: HTMLDsSelectElement | HTMLDsSelectMultiElement) => {
      element.width = 'fill';
      element.style.width = '320px';
    });
    await expect(select).toHaveClass(/ds-control-width--fill/);
    const alignment = await select.getByRole('combobox').evaluate(trigger => {
      const label = trigger.querySelector<HTMLElement>('.trigger__label');
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

test('uses combobox and listbox semantics with disabled-option keyboard skipping', async ({ page }) => {
  const select = page.locator('#single');
  const trigger = select.getByRole('combobox');

  await expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
  await trigger.press('ArrowDown');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');

  const listbox = select.getByRole('listbox');
  await expect(listbox).toBeVisible();
  await expect(listbox.getByRole('option')).toHaveCount(4);
  await expect(listbox.locator('.ds-choice-item__icon')).toHaveCount(4);
  const selectedIcon = listbox.locator('[role="option"][aria-selected="true"] .ds-choice-item__icon');
  const primaryColor = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-foreground-primary)';
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  await expect(selectedIcon).toHaveCSS('color', primaryColor);
  await expect(listbox.getByRole('option', { name: 'Banana' })).toHaveAttribute('aria-disabled', 'true');
  await expect.poll(() =>
    listbox.evaluate(element =>
      [...element.querySelectorAll('ds-icon')].some(
        icon => (icon as HTMLDsIconElement).name === 'Check',
      ),
    ),
  ).toBe(false);

  await trigger.press('ArrowDown');
  await expect(trigger).toHaveAttribute('aria-activedescendant', /option-3$/);
  const activeId = await trigger.getAttribute('aria-activedescendant');
  expect(activeId).toBeTruthy();
  await expect(page.locator(`#${activeId}`)).toHaveClass(/ds-focus-ring--visible/);
  await trigger.press('Enter');
  await expect.poll(() => select.evaluate((element: HTMLDsSelectElement) => element.value)).toBe('date');
  await expect(trigger).toBeFocused();

  await trigger.press('ArrowDown');
  await trigger.press('Home');
  await trigger.press('Space');
  await expect.poll(() => select.evaluate((element: HTMLDsSelectElement) => element.value)).toBe('apple');
  await expect(trigger).toBeFocused();

  await trigger.press('ArrowDown');
  await trigger.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  await trigger.press('ArrowDown');
  await trigger.press('Tab');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).not.toBeFocused();
});

test('keeps loading and empty listboxes structurally valid and announced as unavailable options', async ({ page }) => {
  const loading = page.locator('#loading');
  await loading.getByRole('combobox').click();
  const loadingOption = loading.getByRole('option', { name: 'Loading' });
  await expect(loadingOption).toHaveAttribute('aria-disabled', 'true');
  await expect(loadingOption).toHaveAttribute('aria-selected', 'false');

  const searchable = page.locator('#searchable');
  await searchable.getByRole('combobox').click();
  await searchable.getByRole('searchbox').fill('does not exist');
  const emptyOption = searchable.getByRole('option', { name: 'No results found' });
  await expect(emptyOption).toHaveAttribute('aria-disabled', 'true');
  await expect(emptyOption).toHaveAttribute('aria-selected', 'false');
});

test('falls back to one text-only option layout when icon data is mixed', async ({ page }) => {
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
    await select.evaluate((element: HTMLDsSelectElement | HTMLDsSelectMultiElement) => {
      element.options = Array.from({ length: 40 }, (_, index) => ({
        label: `Option ${String(index + 1).padStart(2, '0')}`,
        value: `option-${index + 1}`,
      }));
    });

    const trigger = select.getByRole('combobox');
    await trigger.press('ArrowDown');
    await trigger.press('End');

    await expect.poll(async () => {
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
    }).toBe(true);

    await trigger.press('Escape');
  }
});

test('supports buffered local typeahead and clear while preserving the open popup', async ({ page }) => {
  const select = page.locator('#single');
  const trigger = select.getByRole('combobox');

  await trigger.press('a');
  await trigger.press('Enter');
  await expect.poll(() => select.evaluate((element: HTMLDsSelectElement) => element.value)).toBe('apple');

  await trigger.click();
  await select.getByRole('button', { name: 'Clear' }).click();
  await expect.poll(() => select.evaluate((element: HTMLDsSelectElement) => element.value)).toBe('');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(() => page.evaluate(() => window.__selectClears)).toContain('single');

  await select.getByRole('option', { name: /Cherry/ }).click();
  await expect.poll(() => select.evaluate((element: HTMLDsSelectElement) => element.value)).toBe('cherry');
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
  await expect.poll(() => searchRegion.evaluate(element => {
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
  })).toEqual({ height: '1.5px', colorMatches: true });

  await search.evaluate(element => element.blur());
  await expect.poll(() => searchRegion.evaluate(element =>
    getComputedStyle(element, '::after').height,
  )).toBe('1px');

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

test('shares a rounded sm search clear button across single and multi selects', async ({ page }) => {
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
    const clear = select.getByRole('button', { name: 'Clear Search' });
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

test('uses body-only Empty State for empty single and multi search results', async ({ page }) => {
  for (const selector of ['#searchable', '#multi-search']) {
    const select = page.locator(selector);
    await select.getByRole('combobox').click();
    await select.getByRole('searchbox', { name: 'Search' }).fill('no matching choices');

    const emptyState = select.locator('ds-empty-state');
    await expect(emptyState).toHaveCount(1);
    await expect(emptyState.locator('ds-icon')).toHaveCount(0);
    await expect(emptyState.locator('.empty-state__title')).toHaveCount(0);
    await expect(emptyState.locator('.empty-state__body')).toHaveText('No results found');
    await expect(emptyState.locator('.empty-state__body')).toHaveClass(/ds-text--body-medium/);
    await expect(emptyState.locator('.empty-state__body')).toHaveClass(/ds-text--color-secondary/);
  }
});

test('shows busy state in the trigger and popup', async ({ page }) => {
  const select = page.locator('#loading');
  const trigger = select.getByRole('combobox');

  await expect(trigger).toHaveAttribute('aria-busy', 'true');
  await expect(trigger.locator('ds-loader')).toHaveCount(1);
  await trigger.click();
  const loadingOption = select.getByRole('option', { name: 'Loading' });
  await expect(loadingOption).toHaveCount(1);
  await expect(loadingOption).toHaveAttribute('aria-live', 'polite');
});

test('uses a thicker inset stroke for error without changing control geometry', async ({ page }) => {
  for (const selector of ['#single', '#multi']) {
    const select = page.locator(selector);
    const trigger = select.getByRole('combobox');
    const normalHeight = await trigger.evaluate(element => element.getBoundingClientRect().height);

    await expect.poll(() => trigger.evaluate(element =>
      getComputedStyle(element, '::after').boxShadow,
    )).toMatch(/0px 0px 0px 1px/);
    await select.evaluate((element: HTMLDsSelectElement | HTMLDsSelectMultiElement) => {
      element.error = true;
      element.errorMessage = 'Make a selection.';
    });

    await expect.poll(() => trigger.evaluate(element =>
      getComputedStyle(element, '::after').boxShadow,
    )).toMatch(/0px 0px 0px 1.5px/);
    await expect.poll(() => trigger.evaluate(element => element.getBoundingClientRect().height)).toBe(normalHeight);
  }
});

test('keeps the multi trigger label and inline count, repeated selection, and clear-all behavior', async ({ page }) => {
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
    await select.evaluate((element: HTMLDsSelectMultiElement, nextSize) => {
      element.size = nextSize;
    }, size);
    await expect(triggerLabel).toHaveClass(new RegExp(textClass));
    await expect(triggerLabel).toHaveText('Entities · 2');
  }
  await select.evaluate((element: HTMLDsSelectMultiElement) => {
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
  await expect.poll(() =>
    selectedCheckbox.evaluate((element: HTMLDsCheckboxElement) => element.checked),
  ).toBe(true);
  const dateOption = listbox.getByRole('option', { name: 'Date' });
  await dateOption.click();
  await expect(dateOption).not.toHaveClass(/ds-focus-ring--visible/);
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(() =>
    select.evaluate((element: HTMLDsSelectMultiElement) => element.values),
  ).toEqual(['apple', 'cherry', 'date']);
  await expect(triggerLabel).toHaveText('Entities · 3');
  await expect.poll(() =>
    dateOption.locator('ds-checkbox').evaluate((element: HTMLDsCheckboxElement) => element.checked),
  ).toBe(true);

  const footer = select.locator('.ds-choice-footer');
  const footerContent = footer.locator('.ds-choice-footer__content');
  const summary = footer.locator('.ds-choice-footer__summary');
  const clear = select.getByRole('button', { name: 'Clear' });
  await expect(footer).toHaveCSS('height', '40px');
  await expect(footerContent).toHaveCSS('height', '32px');
  await expect.poll(() => footer.evaluate(element =>
    getComputedStyle(element, '::before').height,
  )).toBe('1px');
  for (const side of ['top', 'right', 'bottom', 'left'] as const) {
    await expect(footer).toHaveCSS(`padding-${side}`, '4px');
  }
  await expect(summary).toHaveClass(/ds-text--body-medium/);
  await expect(clear.locator('ds-text')).toHaveClass(/ds-text--body-medium/);
  const insets = await footer.evaluate(element => {
    const footerRect = element.getBoundingClientRect();
    const summaryRect = element.querySelector('.ds-choice-footer__summary')?.getBoundingClientRect();
    const clearRect = element.querySelector('.ds-choice-footer__clear ds-text')?.getBoundingClientRect();
    return {
      left: (summaryRect?.left ?? 0) - footerRect.left,
      right: footerRect.right - (clearRect?.right ?? 0),
    };
  });
  expect(insets.left).toBeCloseTo(insets.right, 3);
  await expect(clear).toHaveCSS('text-decoration-line', 'none');
  await clear.hover();
  await expect(clear).toHaveCSS('text-decoration-line', 'underline');
  await clear.click();
  await expect.poll(() =>
    select.evaluate((element: HTMLDsSelectMultiElement) => element.values),
  ).toEqual([]);
  await expect(triggerLabel).toHaveText('Entities');
  await expect(select.getByRole('listbox')).toBeVisible();
});

test('submits repeated multi values, validates required controls, and resets', async ({ page }) => {
  const form = page.locator('#selection-form');
  const single = page.locator('#required-single');
  const multi = page.locator('#required-multi');

  await expect.poll(() => form.evaluate(element => (element as HTMLFormElement).checkValidity())).toBe(false);
  await single.evaluate((element: HTMLDsSelectElement) => {
    element.value = 'apple';
  });
  await multi.evaluate((element: HTMLDsSelectMultiElement) => {
    element.values = ['apple', 'cherry'];
  });
  await expect.poll(() => form.evaluate(element => (element as HTMLFormElement).checkValidity())).toBe(true);

  await page.locator('#submit').click();
  await expect.poll(() => page.evaluate(() => window.__formEntries)).toEqual({
    fruit: 'apple',
    groups: ['apple', 'cherry'],
  });

  await page.locator('#reset').click();
  await expect.poll(() => single.evaluate((element: HTMLDsSelectElement) => element.value)).toBe('');
  await expect.poll(() =>
    multi.evaluate((element: HTMLDsSelectMultiElement) => element.values),
  ).toEqual([]);
});

test('keeps prefix icons and chevrons secondary across selected surface contexts', async ({ page }) => {
  const cases = [
    [undefined, '--color-foreground-secondary', '--color-foreground-primary'],
    ['faint', '--color-foreground-secondary', '--color-foreground-primary'],
    ['medium', '--color-foreground-on-medium-background-secondary', '--color-foreground-on-medium-background-primary'],
    ['bold', '--color-foreground-on-bold-background-secondary', '--color-foreground-on-bold-background-primary'],
    ['strong', '--color-foreground-on-strong-background-secondary', '--color-foreground-on-strong-background-primary'],
    ['translucent', '--color-translucent-foreground-secondary', '--color-translucent-foreground-primary'],
    ['inverted', '--color-inverted-foreground-secondary', '--color-inverted-foreground-primary'],
    ['media', '--color-media-foreground-secondary', '--color-media-foreground-primary'],
    ['always-dark', '--color-always-dark-foreground-secondary', '--color-always-dark-foreground-primary'],
  ] as const;

  for (const selector of ['#single', '#multi']) {
    const select = page.locator(selector);
    await select.evaluate((element: HTMLDsSelectElement | HTMLDsSelectMultiElement) => {
      element.icon = 'Chart';
      if (element.tagName === 'DS-SELECT') (element as HTMLDsSelectElement).value = 'apple';
      else (element as HTMLDsSelectMultiElement).values = ['apple'];
    });

    for (const [background, secondaryToken, primaryToken] of cases) {
      await select.evaluate((element: HTMLDsSelectElement | HTMLDsSelectMultiElement, value) => {
        element.background = value;
      }, background);

      await expect.poll(() => select.evaluate((element, [secondary, primary]) => {
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
        return getComputedStyle(prefix).color === expectedSecondary &&
          getComputedStyle(chevron).color === expectedSecondary &&
          getComputedStyle(label).color === expectedPrimary;
      }, [secondaryToken, primaryToken] as const)).toBe(true);
    }
  }
});

test('has no detectable accessibility violations', async ({ page }) => {
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
