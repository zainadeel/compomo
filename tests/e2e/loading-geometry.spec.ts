import { expect, test, type Locator } from '@playwright/test';

const geometry = (target: Locator) =>
  target.evaluate(element => {
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      width: box.width,
      height: box.height,
      radius: style.borderRadius,
      shadow: style.boxShadow,
    };
  });

test('settings loading retains card and wrapped row geometry @cross-browser', async ({ page }) => {
  await page.goto('/card-setting.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const cards = page.locator('#empty-card, #general-card, #immediate-card');
    const row = page.locator('#long-setting');
    const before = await Promise.all([cards.nth(0), cards.nth(1), cards.nth(2), row].map(geometry));
    await cards.evaluateAll(elements =>
      elements.forEach(element => ((element as HTMLDsCardSettingElement).isLoading = true))
    );
    await page
      .locator('ds-setting-row-toggle')
      .evaluateAll(elements =>
        elements.forEach(element => ((element as HTMLDsSettingRowToggleElement).isLoading = true))
      );
    await expect(row.locator('ds-skeleton')).toHaveCount(3);
    const after = await Promise.all([cards.nth(0), cards.nth(1), cards.nth(2), row].map(geometry));
    expect(after).toEqual(before);
    await expect(row.getByRole('switch')).toHaveCount(0);
    await cards.evaluateAll(elements =>
      elements.forEach(element => ((element as HTMLDsCardSettingElement).isLoading = false))
    );
    await page
      .locator('ds-setting-row-toggle')
      .evaluateAll(elements =>
        elements.forEach(element => ((element as HTMLDsSettingRowToggleElement).isLoading = false))
      );
    await expect(row.getByRole('switch')).toBeVisible();
  }
});

test('navigation card loading preserves wrapped copy and surface @cross-browser', async ({
  page,
}) => {
  await page.goto('/card-navigation.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const card = page.locator('#navigation-only-card');
  for (const width of [1280, 300]) {
    await page.setViewportSize({ width, height: 900 });
    const before = await geometry(card);
    await card.evaluate(element => ((element as HTMLDsCardNavigationElement).isLoading = true));
    await expect(card.locator('ds-skeleton')).toHaveCount(3);
    expect(await geometry(card)).toEqual(before);
    await expect(card.getByRole('link')).toHaveCount(0);
    await card.evaluate(element => ((element as HTMLDsCardNavigationElement).isLoading = false));
    await expect(card.getByRole('link')).toBeVisible();
  }
});

test('table chrome skeletons retain column names and individual footer controls @cross-browser', async ({
  page,
}) => {
  await page.goto('/table.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const table = page.locator('#column-customizer');
  await table.evaluate(element => {
    const target = element as HTMLDsTableElement;
    target.dataMode = 'pagination';
    target.pagination = { pageIndex: 0, pageSize: 25, totalItems: 100, showFirstLastButtons: true };
  });
  const pagination = table.locator('ds-pagination');
  await expect(pagination).toBeVisible();
  for (const width of [1280, 650]) {
    await page.setViewportSize({ width, height: 900 });
    if (width < 900)
      await expect(pagination.locator('.pagination')).toHaveClass(/pagination--table-compact/);
    else
      await expect(pagination.locator('.pagination')).not.toHaveClass(/pagination--table-compact/);
    const before = await geometry(pagination);
    const headers = table.locator('.ds-table__viewport th[data-column-id]');
    const headerWidths = await headers.evaluateAll(elements =>
      elements.map(element => element.getBoundingClientRect().width)
    );
    await table.evaluate(element => ((element as HTMLDsTableElement).chromeLoading = true));
    await expect(pagination).toHaveJSProperty('chromeLoading', true);
    await expect(headers.first().locator('ds-skeleton')).toHaveCount(1);
    await expect(headers.first()).not.toHaveAttribute('aria-label', '');
    await expect(table.getByRole('button', { name: 'Next page', exact: true })).toHaveCount(0);
    expect(await geometry(pagination)).toEqual(before);
    expect(
      await headers.evaluateAll(elements =>
        elements.map(element => element.getBoundingClientRect().width)
      )
    ).toEqual(headerWidths);
    await table.evaluate(element => ((element as HTMLDsTableElement).chromeLoading = false));
    await expect(table.getByRole('button', { name: 'Next page', exact: true })).toBeVisible();
  }
});

test('shell supplies remaining content height through banner and responsive transitions @cross-browser', async ({
  page,
}) => {
  await page.goto('/shell-managed.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const shell = page.locator('#managed-shell');
  await shell.evaluate(element => {
    const target = element as HTMLDsShellAppElement;
    target.pageChrome = { ...target.pageChrome, contentInset: 'none', scrollCompaction: false };
    const content = target.querySelector<HTMLElement>('#managed-page-content')!;
    content.style.cssText =
      'height:calc(var(--ds-shell-content-block-size) - var(--ds-shell-page-sticky-header-block-size));min-height:0;padding:0;overflow:hidden';
  });
  for (const width of [1280, 900, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const height of [0, 64, 112, 0]) {
      await page
        .locator('#fullscreen-banner')
        .evaluate((element, size) => ((element as HTMLElement).style.height = `${size}px`), height);
      await expect
        .poll(() =>
          shell
            .locator('.shell-app__content')
            .evaluate(element => element.scrollHeight - element.clientHeight)
        )
        .toBeLessThanOrEqual(1);
      await expect
        .poll(() =>
          shell.evaluate(element => {
            const content = element.querySelector('#managed-page-content')!.getBoundingClientRect();
            const lane = element.querySelector('.shell-app__content')!.getBoundingClientRect();
            return Math.abs(content.bottom - lane.bottom);
          })
        )
        .toBeLessThanOrEqual(1);
    }
  }
});

test('settings scope loading retains the surface and individual wrapped controls @cross-browser', async ({
  page,
}) => {
  await page.goto('/card-navigation.html');
  const scope = page.locator('ds-card-settings-scope').first();
  await expect(scope).toHaveClass(/hydrated/);
  for (const width of [600, 260]) {
    await scope.evaluate((element, size) => {
      element.style.width = `${size}px`;
    }, width);
    const before = await geometry(scope.locator('.card-settings-scope'));
    const buttons = scope.locator('button');
    const buttonSizes = await Promise.all([buttons.nth(0), buttons.nth(1)].map(geometry));
    await scope.evaluate(element => {
      (element as HTMLDsCardSettingsScopeElement).isLoading = true;
    });
    await expect(scope).toHaveAttribute('aria-busy', 'true');
    await expect(scope.getByRole('button')).toHaveCount(0);
    expect(await geometry(scope.locator('.card-settings-scope'))).toEqual(before);
    const controls = scope.locator('ds-skeleton').filter({ has: page.locator('button') });
    await expect(controls).toHaveCount(2);
    const placeholders = await Promise.all([controls.nth(0), controls.nth(1)].map(geometry));
    for (let index = 0; index < placeholders.length; index++) {
      expect(placeholders[index].width).toBe(buttonSizes[index].width);
      expect(placeholders[index].height).toBe(buttonSizes[index].height);
    }
    await scope.evaluate(element => {
      (element as HTMLDsCardSettingsScopeElement).isLoading = false;
    });
    await expect(scope.getByRole('button')).toHaveCount(2);
  }
});

test('projected skeleton keeps wrapped content size and mounted control state @cross-browser', async ({
  page,
}) => {
  await page.goto('/skeleton.html');
  await page.evaluate(() => {
    const container = document.createElement('div');
    container.id = 'preserved';
    container.style.cssText = 'display:grid;gap:16px;width:280px';
    container.innerHTML =
      '<ds-skeleton id="wrapped" preserve-layout is-loading="false"><ds-text>Text wraps across several lines without changing its container height while loading.</ds-text></ds-skeleton><ds-skeleton id="control-source" preserve-layout variant="control" is-loading="false" style="justify-self:start"><button type="button" style="height:32px">An actual control</button></ds-skeleton>';
    document.body.append(container);
  });
  const text = page.locator('#wrapped');
  const button = page.locator('#control-source button');
  const owner = await button.elementHandle();
  await expect(button).toBeVisible();
  const beforeText = await geometry(text.locator('ds-text'));
  const beforeControl = await geometry(button);
  await page
    .locator('#preserved ds-skeleton')
    .evaluateAll(elements =>
      elements.forEach(element => ((element as HTMLDsSkeletonElement).isLoading = true))
    );
  await expect(button).toBeHidden();
  expect(await geometry(text)).toEqual(beforeText);
  const control = await geometry(page.locator('#control-source'));
  expect(control.width).toBe(beforeControl.width);
  expect(control.height).toBe(beforeControl.height);
  await page
    .locator('#preserved ds-skeleton')
    .evaluateAll(elements =>
      elements.forEach(element => ((element as HTMLDsSkeletonElement).isLoading = false))
    );
  await expect(button).toBeVisible();
  expect(await button.evaluate((element, original) => element === original, owner)).toBe(true);
  await page
    .locator('#preserved')
    .evaluate(element => ((element as HTMLElement).style.visibility = 'hidden'));
  await expect(button).toBeHidden();
  await expect(text.locator('ds-text')).toBeHidden();
  await owner?.dispose();
});

test('control skeletons follow filled, outlined, and borderless anatomy @cross-browser', async ({
  page,
}) => {
  await page.goto('/skeleton.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const control = page.locator('#control');
  const before = await geometry(control);
  for (const appearance of ['filled', 'outlined', 'borderless'] as const) {
    await control.evaluate((element, value) => {
      const skeleton = element as HTMLDsSkeletonElement;
      skeleton.controlAppearance = value;
      skeleton.controlContent = 'icon-label';
    }, appearance);
    await expect(control).toHaveClass(new RegExp(`skeleton--control-${appearance}`));
    expect(await geometry(control)).toEqual(before);
    if (appearance === 'filled') {
      await expect(control.locator(':scope > .skeleton__shape')).toHaveCount(1);
    } else {
      const frame = control.locator('.skeleton__control');
      await expect(frame).toBeVisible();
      await expect(frame.locator('ds-skeleton.skeleton--icon')).toHaveCount(1);
      const icon = frame.locator('ds-skeleton.skeleton--icon .skeleton__shape');
      await expect(icon).toHaveCSS('width', '15px');
      await expect(icon).toHaveCSS('height', '15px');
      await expect(frame).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      if (appearance === 'outlined') await expect(frame).not.toHaveCSS('box-shadow', 'none');
      else await expect(frame).toHaveCSS('box-shadow', 'none');
    }
  }
});

test('chart loading hides its heading and plot without changing the card @cross-browser', async ({
  page,
}) => {
  await page.goto('/card-chart.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const card = page.locator('#chart-card');
  const before = await geometry(card);
  const chart = card.locator('ds-chart');
  const legend = card.locator('ds-chart-legend');
  await expect(legend).toBeVisible();
  const owner = await chart.elementHandle();
  await card.evaluate(element => ((element as HTMLDsCardChartElement).isLoading = true));
  await expect(card.locator('.card-chart__heading-skeleton')).toBeVisible();
  await expect(card.locator('.card-chart__plot-skeleton')).toBeVisible();
  await expect(card.getByRole('heading')).toHaveCount(0);
  await expect(chart).toBeHidden();
  await expect(legend).toBeHidden();
  expect(await geometry(card)).toEqual(before);
  await card.evaluate(element => ((element as HTMLDsCardChartElement).isLoading = false));
  await expect(chart).toBeVisible();
  await expect(legend).toBeVisible();
  expect(await chart.evaluate((element, original) => element === original, owner)).toBe(true);
  await owner?.dispose();
});

test('action center skeletonizes every label and value in the original rows @cross-browser', async ({
  page,
}) => {
  await page.goto('/card-action-center.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const card = page.locator('#action-center');
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const before = await geometry(card);
    const rowHeights = await card
      .locator('.card-action-center__item')
      .evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height));
    await card.evaluate(element => ((element as HTMLDsCardActionCenterElement).isLoading = true));
    await expect(card).toHaveAttribute('aria-busy', 'true');
    await expect(card.getByRole('heading')).toHaveCount(0);
    await expect(card.getByRole('link')).toHaveCount(0);
    await expect(card.getByRole('button')).toHaveCount(0);
    for (const copy of await card.locator('.card-action-center__copy, ds-tag').all())
      await expect(copy).toBeHidden();
    expect(await geometry(card)).toEqual(before);
    expect(
      await card
        .locator('.card-action-center__item')
        .evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height))
    ).toEqual(rowHeights);
    await card.evaluate(element => ((element as HTMLDsCardActionCenterElement).isLoading = false));
    await expect(card.getByRole('heading')).toHaveCount(3);
  }
});

test('settings information and radio loading preserve wrapping and selection @cross-browser', async ({
  page,
}) => {
  await page.goto('/inline-banner-settings.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const banner = page.locator('#info-banner');
  const bannerSize = await geometry(banner);
  await banner.evaluate(
    element => ((element as HTMLDsInlineBannerSettingsElement).isLoading = true)
  );
  await expect(banner.locator('ds-text')).toBeHidden();
  expect(await geometry(banner)).toEqual(bannerSize);
  await page.goto('/setting-row-radio.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const edit = page.locator('#setting-row');
    const view = page.locator('#setting-row-view');
    const sizes = await Promise.all([edit, view].map(geometry));
    await page
      .locator('ds-setting-row-radio, ds-radio')
      .evaluateAll(elements =>
        elements.forEach(
          element =>
            ((element as HTMLDsSettingRowRadioElement | HTMLDsRadioElement).isLoading = true)
        )
      );
    await expect(edit.getByRole('radio')).toHaveCount(0);
    for (const copy of await page.locator('ds-setting-row-radio ds-text').all())
      await expect(copy).toBeHidden();
    expect(await Promise.all([edit, view].map(geometry))).toEqual(sizes);
    await expect(page.locator('#validation-mode')).toHaveJSProperty('value', 'enabled');
    await page
      .locator('ds-setting-row-radio, ds-radio')
      .evaluateAll(elements =>
        elements.forEach(
          element =>
            ((element as HTMLDsSettingRowRadioElement | HTMLDsRadioElement).isLoading = false)
        )
      );
    await expect(edit.getByRole('radio')).toHaveCount(3);
  }
});
