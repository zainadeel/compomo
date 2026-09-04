import { expect, test, type Locator, type Page } from '@playwright/test';

async function ready(page: Page, fixture: string) {
  await page.goto(`/${fixture}.html`);
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
}

async function wash(target: Locator) {
  return target.evaluate(element => {
    const probe = document.createElement('span');
    probe.style.background = 'var(--ds-interaction-pressed)';
    element.append(probe);
    const pressed = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return {
      held: getComputedStyle(element, '::after').backgroundColor === pressed,
      selected: getComputedStyle(element, '::before').backgroundColor,
      foreground: getComputedStyle(element).color,
      scale: getComputedStyle(element).scale,
    };
  });
}

for (const family of ['filled', 'unfilled']) {
  test(`${family} surface ownership is independent of disclosure, toggle, hover, and physical scale`, async ({
    page,
  }) => {
    await ready(page, 'buttons');
    const host = page.locator(`#${family}-icon`);
    const button = host.locator('button');
    await page.mouse.move(0, 0);
    const resting = await wash(button);
    await host.evaluate(element => Object.assign(element, { surfaceOpen: true }));
    await expect.poll(async () => (await wash(button)).held).toBe(true);
    await expect(button).not.toHaveAttribute('aria-expanded');
    await expect(button).not.toHaveAttribute('aria-pressed');
    await button.hover();
    expect(await wash(button)).toMatchObject({
      held: true,
      selected: resting.selected,
      foreground: resting.foreground,
      scale: resting.scale,
    });
    // Explicit false suppresses the legacy expanded-derived wash.
    await host.evaluate(element =>
      Object.assign(element, { surfaceOpen: false, expanded: true, hasMenu: true })
    );
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await page.mouse.move(0, 0);
    await expect.poll(async () => (await wash(button)).held).toBe(false);
    // Omission remains backward compatible.
    await host.evaluate(element => Object.assign(element, { surfaceOpen: undefined }));
    await expect.poll(async () => (await wash(button)).held).toBe(true);
    await host.evaluate(element => Object.assign(element, { surfaceOpen: true, isInactive: true }));
    await expect(button).toBeDisabled();
    await expect.poll(async () => (await wash(button)).held).toBe(false);
  });

  test(`${family} split mode assigns surface ownership only to the menu segment`, async ({
    page,
  }) => {
    await ready(page, 'buttons');
    const host = page.locator(`#${family}-split-label`);
    await host.evaluate(element => Object.assign(element, { surfaceOpen: true, expanded: false }));
    const primary = host.locator('.ds-button-split__primary');
    const menu = host.locator('.ds-button-split__menu');
    await expect.poll(async () => (await wash(menu)).held).toBe(true);
    expect((await wash(primary)).held).toBe(false);
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await menu.hover();
    expect((await wash(menu)).held).toBe(true);
  });
}

test('row surface ownership spans cells, survives selection, and follows identity through recycling @pr-critical', async ({
  page,
}) => {
  await ready(page, 'table');
  const table = page.locator('#virtual');
  await table.evaluate(element => {
    const control = element as HTMLElement & {
      rows: Array<{ id: string; interactive?: boolean }>;
      surfaceOpenRowId: string;
      selectedRowIds: string[];
    };
    control.rows = control.rows.map(row => ({ ...row, interactive: true }));
    control.surfaceOpenRowId = 'virtual-0';
    control.selectedRowIds = ['virtual-1'];
  });
  const first = table.locator('[data-row-id="virtual-0"]');
  await expect(first).toHaveAttribute('data-surface-open', 'true');
  await expect(first).not.toHaveAttribute('data-selected');
  const cells = first.locator('.ds-table__cell');
  for (const cell of await cells.all()) expect((await wash(cell)).held).toBe(true);
  await first.hover();
  for (const cell of await cells.all()) expect((await wash(cell)).held).toBe(true);
  await expect(table.locator('[data-row-id="virtual-1"]')).toHaveAttribute('data-selected', 'true');
  const viewport = table.locator('.ds-table__viewport');
  await viewport.evaluate(element => {
    element.scrollTop = 1800;
  });
  await expect(first).toHaveCount(0);
  await expect(table.locator('[data-surface-open]')).toHaveCount(0);
  await viewport.evaluate(element => {
    element.scrollTop = 0;
  });
  await expect(first).toHaveAttribute('data-surface-open', 'true');
  await table.evaluate(element => Object.assign(element, { surfaceOpenRowId: 'virtual-1' }));
  await expect(first).not.toHaveAttribute('data-surface-open');
  const next = table.locator('[data-row-id="virtual-1"]');
  await expect(next).toHaveAttribute('data-surface-open', 'true');
  await expect(next).toHaveAttribute('data-selected', 'true');
  await table.evaluate(element => Object.assign(element, { surfaceOpenRowId: undefined }));
  await expect(table.locator('[data-surface-open]')).toHaveCount(0);
  await expect(next).toHaveAttribute('data-selected', 'true');
});

test('surface ownership stays visible in forced colors without replacing selection', async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await ready(page, 'buttons');
  test.skip(
    !(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)),
    'Engine does not emulate forced colors'
  );
  const host = page.locator('#unfilled-icon');
  const button = host.locator('button');
  await host.evaluate(element => Object.assign(element, { surfaceOpen: true, pressed: true }));
  await page.mouse.move(0, 0);
  const outlines = await button.evaluate(element => ({
    surface: getComputedStyle(element, '::after').outlineStyle,
    selection: getComputedStyle(element, '::before').outlineStyle,
  }));
  expect(outlines).toEqual({ surface: 'dashed', selection: 'solid' });
});

test('interactive tags use the same wash and let explicit false override expanded', async ({
  page,
}) => {
  await ready(page, 'tag');
  const host = page.locator('ds-tag[interactive]').first();
  const button = host.locator('button');
  await host.evaluate(element => Object.assign(element, { surfaceOpen: true, expanded: false }));
  await expect.poll(async () => (await wash(button)).held).toBe(true);
  await button.hover();
  expect((await wash(button)).held).toBe(true);
  await host.evaluate(element => Object.assign(element, { surfaceOpen: false, expanded: true }));
  await page.mouse.move(0, 0);
  await expect.poll(async () => (await wash(button)).held).toBe(false);
});

test('owned sort menu retains the wash during exit and releases it only after closing @cross-browser', async ({
  page,
}) => {
  await ready(page, 'table');
  const sort = page.locator('#column-customizer-sort');
  await sort.scrollIntoViewIfNeeded();
  // Widen the observation window without relying on a wall-clock sleep.
  await page.evaluate(() =>
    document.documentElement.style.setProperty('--effect-motion-short-2', '1000ms linear')
  );
  const trigger = sort.locator('ds-button-unfilled button');
  const menu = sort.locator('ds-menu');
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(menu.locator('.menu-popup')).toBeVisible();
  await expect.poll(async () => (await wash(trigger)).held).toBe(true);
  await menu.dispatchEvent('dsClose');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  expect((await wash(trigger)).held).toBe(true);
  // Reopen before the old exit completes; its completion must not clear ownership.
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await menu.dispatchEvent('dsAfterClose');
  expect((await wash(trigger)).held).toBe(true);
  await menu.dispatchEvent('dsClose');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect.poll(async () => (await wash(trigger)).held).toBe(false);
});

test('removing table chrome releases surface ownership before controls return', async ({
  page,
}) => {
  await ready(page, 'table');
  const table = page.locator('#column-customizer');
  const trigger = table.getByRole('button', { name: 'Customize table', exact: true });
  await trigger.click();
  await expect.poll(async () => (await wash(trigger)).held).toBe(true);
  await table.evaluate(element => Object.assign(element, { chromeLoading: true }));
  await expect(trigger).toBeHidden();
  await table.evaluate(element => Object.assign(element, { chromeLoading: false }));
  await expect(trigger).toBeVisible();
  await page.mouse.move(0, 0);
  await expect.poll(async () => (await wash(trigger)).held).toBe(false);
});
