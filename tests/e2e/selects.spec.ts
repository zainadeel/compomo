import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/selects.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
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
  await trigger.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  await trigger.press('ArrowDown');
  await trigger.press('Tab');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).not.toBeFocused();
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

  await search.fill('dark');

  const options = select.getByRole('option');
  await expect(options).toHaveCount(1);
  await expect(options.first()).toContainText('Cherry');
});

test('shows busy state in the trigger and popup', async ({ page }) => {
  const select = page.locator('#loading');
  const trigger = select.getByRole('combobox');

  await expect(trigger).toHaveAttribute('aria-busy', 'true');
  await expect(trigger.locator('ds-loader')).toHaveCount(1);
  await trigger.click();
  await expect(select.getByRole('status')).toContainText('Loading');
  await expect(select.getByRole('option')).toHaveCount(0);
});

test('keeps the multi trigger label, count, repeated selection, and clear-all behavior', async ({ page }) => {
  const select = page.locator('#multi');
  const trigger = select.getByRole('combobox');

  await expect(trigger).toContainText('Entities');
  await expect.poll(() =>
    trigger.locator('ds-badge').evaluate((element: HTMLDsBadgeElement) => element.count),
  ).toBe(2);
  await expect(trigger.locator('ds-badge')).toHaveClass(/badge--no-ring/);
  const countBox = trigger.locator('.trigger__count-box');
  for (const [size, dimension] of [['md', '20px'], ['sm', '16px'], ['xs', '12px']] as const) {
    await select.evaluate((element: HTMLDsSelectMultiElement, nextSize) => {
      element.size = nextSize;
    }, size);
    await expect(countBox).toHaveCSS('width', dimension);
    await expect(countBox).toHaveCSS('height', dimension);
  }
  await select.evaluate((element: HTMLDsSelectMultiElement) => {
    element.size = 'md';
  });
  await trigger.click();

  const listbox = select.getByRole('listbox');
  await expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
  await expect(listbox.locator('ds-checkbox')).toHaveCount(4);
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
  await expect.poll(() =>
    dateOption.locator('ds-checkbox').evaluate((element: HTMLDsCheckboxElement) => element.checked),
  ).toBe(true);

  const footer = select.locator('.ds-choice-footer');
  const summary = footer.locator('.ds-choice-footer__summary');
  const clear = select.getByRole('button', { name: 'Clear' });
  await expect(footer).toHaveCSS('height', '32px');
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

test('maps explicit background context to trigger interaction and foreground tokens', async ({ page }) => {
  const select = page.locator('#surface');
  const trigger = select.getByRole('combobox');
  await expect(trigger).toHaveClass(/ds-interaction-fill--on-bold/);
  await expect.poll(() =>
    select.evaluate(element => {
      const actual = getComputedStyle(element).getPropertyValue('--ds-select-fg').trim();
      const expected = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-foreground-on-bold-background-secondary')
        .trim();
      return actual === expected;
    }),
  ).toBe(true);
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
