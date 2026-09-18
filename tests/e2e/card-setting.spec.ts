import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/card-setting.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('owns settings shell chrome without composing ds-card', async ({ page }) => {
  const card = page.locator('#general-card');

  await expect(card.locator('ds-card')).toHaveCount(0);
  await expect(card.locator('.card-setting__title')).toHaveText('General');
  await expect(card.locator('.card-setting__body')).toContainText('Organization settings.');

  const geometry = await card.evaluate(element => {
    const style = getComputedStyle(element);
    const header = element.querySelector<HTMLElement>('.card-setting__header')!;
    const body = element.querySelector<HTMLElement>('.card-setting__body')!;
    const headerStyle = getComputedStyle(header);
    const bodyStyle = getComputedStyle(body);
    const radiusProbe = document.createElement('div');
    radiusProbe.style.borderRadius = 'var(--ds-radius-card)';
    element.append(radiusProbe);
    const expectedBorderRadius = getComputedStyle(radiusProbe).borderRadius;
    radiusProbe.remove();
    return {
      width: element.getBoundingClientRect().width,
      expectedWidth: Number.parseFloat(style.getPropertyValue('--dimension-card-width-sm')),
      minHeight: Number.parseFloat(style.minHeight),
      height: element.getBoundingClientRect().height,
      bodyPaddingTop: Number.parseFloat(bodyStyle.paddingTop),
      bodyPaddingBottom: Number.parseFloat(bodyStyle.paddingBottom),
      expectedBodyPadding: Number.parseFloat(style.getPropertyValue('--dimension-space-100')),
      borderRadius: style.borderRadius,
      expectedBorderRadius,
      boxShadow: style.boxShadow,
      headerHeight: header.getBoundingClientRect().height,
      headerMinHeight: Number.parseFloat(headerStyle.minBlockSize),
      headerBackground: headerStyle.backgroundColor,
      headerPadding: headerStyle.padding,
      headerGap: headerStyle.gap,
      headerBoxSizing: headerStyle.boxSizing,
    };
  });

  expect(geometry.width).toBe(geometry.expectedWidth);
  expect(geometry.minHeight).toBe(0);
  expect(geometry.height).toBeGreaterThan(geometry.headerHeight);
  expect(geometry.bodyPaddingTop).toBe(geometry.expectedBodyPadding);
  expect(geometry.bodyPaddingBottom).toBe(geometry.expectedBodyPadding);
  expect(geometry.borderRadius).toBe(geometry.expectedBorderRadius);
  expect(geometry.boxShadow).not.toBe('none');
  expect(geometry.headerHeight).toBeGreaterThanOrEqual(geometry.headerMinHeight);
  expect(geometry.headerBackground).toBe('rgba(0, 0, 0, 0)');
  expect(geometry.headerPadding).toBe('8px');
  expect(geometry.headerGap).toBe('8px');
  expect(geometry.headerBoxSizing).toBe('border-box');
});

test('empty editable cards keep the height token while populated cards hug content', async ({
  page,
}) => {
  const empty = page.locator('#empty-card');
  const populated = page.locator('#general-card');
  const immediate = page.locator('#immediate-card');

  await expect(empty).toHaveClass(/card-setting--empty/);
  await expect(populated).not.toHaveClass(/card-setting--empty/);
  await expect(immediate).not.toHaveClass(/card-setting--empty/);

  const geometry = await page.evaluate(() => {
    const measure = (id: string) => {
      const element = document.querySelector<HTMLElement>(id)!;
      const style = getComputedStyle(element);
      const body = element.querySelector<HTMLElement>('.card-setting__body')!;
      const bodyStyle = getComputedStyle(body);
      return {
        minHeight: Number.parseFloat(style.minHeight),
        height: element.getBoundingClientRect().height,
        expectedMinHeight: Number.parseFloat(style.getPropertyValue('--dimension-card-height-sm')),
        bodyPaddingTop: Number.parseFloat(bodyStyle.paddingTop),
        bodyPaddingBottom: Number.parseFloat(bodyStyle.paddingBottom),
        expectedBodyPadding: Number.parseFloat(style.getPropertyValue('--dimension-space-100')),
      };
    };
    return {
      empty: measure('#empty-card'),
      populated: measure('#general-card'),
      immediate: measure('#immediate-card'),
    };
  });

  expect(geometry.empty.minHeight).toBe(geometry.empty.expectedMinHeight);
  expect(geometry.empty.height).toBe(geometry.empty.expectedMinHeight);
  expect(geometry.populated.minHeight).toBe(0);
  expect(geometry.populated.height).toBeLessThan(geometry.empty.height);
  expect(geometry.immediate.minHeight).toBe(0);
  expect(geometry.empty.bodyPaddingTop).toBe(geometry.empty.expectedBodyPadding);
  expect(geometry.empty.bodyPaddingBottom).toBe(geometry.empty.expectedBodyPadding);
  expect(geometry.populated.bodyPaddingTop).toBe(geometry.populated.expectedBodyPadding);
  expect(geometry.populated.bodyPaddingBottom).toBe(geometry.populated.expectedBodyPadding);
  expect(geometry.immediate.bodyPaddingTop).toBe(geometry.immediate.expectedBodyPadding);
  expect(geometry.immediate.bodyPaddingBottom).toBe(geometry.immediate.expectedBodyPadding);
});

test('keeps the banner above the padded content body without content-area top padding', async ({
  page,
}) => {
  const card = page.locator('#banner-card');
  const banner = card.locator('ds-inline-banner-settings');
  const bannerRegion = card.locator('.card-setting__banner');
  const body = card.locator('.card-setting__body');

  await expect(banner).toHaveCount(1);
  await expect(body.locator('ds-inline-banner-settings')).toHaveCount(0);
  await expect(bannerRegion.locator('ds-inline-banner-settings')).toHaveCount(1);
  await expect(bannerRegion).not.toHaveClass(/card-setting__banner--empty/);

  const geometry = await card.evaluate(element => {
    const style = getComputedStyle(element);
    const header = element.querySelector<HTMLElement>('.card-setting__header')!;
    const bannerWrap = element.querySelector<HTMLElement>('.card-setting__banner')!;
    const bannerEl = element.querySelector<HTMLElement>('ds-inline-banner-settings')!;
    const bodyEl = element.querySelector<HTMLElement>('.card-setting__body')!;
    const bannerWrapStyle = getComputedStyle(bannerWrap);
    const bodyStyle = getComputedStyle(bodyEl);
    return {
      bannerWrapPaddingTop: Number.parseFloat(bannerWrapStyle.paddingTop),
      bannerWrapPaddingBottom: Number.parseFloat(bannerWrapStyle.paddingBottom),
      bodyPaddingTop: Number.parseFloat(bodyStyle.paddingTop),
      bodyPaddingBottom: Number.parseFloat(bodyStyle.paddingBottom),
      expectedBodyPadding: Number.parseFloat(style.getPropertyValue('--dimension-space-100')),
      headerBottom: header.getBoundingClientRect().bottom,
      bannerTop: bannerEl.getBoundingClientRect().top,
      bannerBottom: bannerEl.getBoundingClientRect().bottom,
      bodyTop: bodyEl.getBoundingClientRect().top,
    };
  });

  expect(geometry.bannerWrapPaddingTop).toBe(0);
  expect(geometry.bannerWrapPaddingBottom).toBe(0);
  expect(geometry.bodyPaddingTop).toBe(geometry.expectedBodyPadding);
  expect(geometry.bodyPaddingBottom).toBe(geometry.expectedBodyPadding);
  expect(geometry.bannerTop).toBeCloseTo(geometry.headerBottom, 1);
  expect(geometry.bodyTop).toBeCloseTo(geometry.bannerBottom, 1);
});

test('emits typed actions while the parent enforces one editing section', async ({ page }) => {
  const general = page.locator('#general-card');
  const drivers = page.locator('#drivers-card');

  await page.getByRole('button', { name: 'Edit General' }).click();
  await expect(general).toHaveClass(/card-setting--editing/);
  await expect(drivers).not.toHaveClass(/card-setting--editing/);

  const editGeometry = await general.evaluate(element => {
    const style = getComputedStyle(element);
    const panel = element.querySelector<HTMLElement>('.card-setting__panel');
    return {
      panelTopRadius: panel ? getComputedStyle(panel).borderTopRightRadius : undefined,
      expectedPanelTopRadius: style.borderTopRightRadius,
      boxShadow: style.boxShadow,
    };
  });
  expect(editGeometry.panelTopRadius).toBe(editGeometry.expectedPanelTopRadius);
  expect(editGeometry.boxShadow).not.toBe('none');

  await page.getByRole('button', { name: 'Edit Driver identification' }).click();
  await expect(general).not.toHaveClass(/card-setting--editing/);
  await expect(drivers).toHaveClass(/card-setting--editing/);

  await page.getByRole('button', { name: 'Cancel Driver identification' }).click();
  await expect(drivers).not.toHaveClass(/card-setting--editing/);

  await page.getByRole('button', { name: 'Edit General' }).click();
  await page.getByRole('button', { name: 'Save General' }).click();
  await expect(general).not.toHaveClass(/card-setting--editing/);

  const actions = await page.evaluate(
    () =>
      (
        window as typeof window & {
          __cardSettingActions: Array<{ action: string; hasOriginalEvent: boolean }>;
        }
      ).__cardSettingActions
  );
  expect(actions).toEqual([
    { action: 'edit', hasOriginalEvent: true },
    { action: 'edit', hasOriginalEvent: true },
    { action: 'cancel', hasOriginalEvent: true },
    { action: 'edit', hasOriginalEvent: true },
    { action: 'save', hasOriginalEvent: true },
  ]);
});

test('immediate settings keep resting chrome and expose one accessible toggle per row @cross-browser', async ({
  page,
}) => {
  const card = page.locator('#immediate-card');
  await expect(card).not.toHaveClass(/card-setting--editing/);
  await expect(card.getByRole('button')).toHaveCount(0);
  await expect(card.getByRole('listitem')).toHaveCount(3);
  const toggle = card.getByRole('switch', { name: 'Panel navigation', exact: true });
  await expect(toggle).toHaveAccessibleDescription(
    'Show page sections in the side panel. Turn off to use top bar tabs.'
  );
  await expect(toggle).toBeChecked();
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).not.toBeChecked();
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(toggle).toBeChecked();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as typeof window & { __settingChanges: boolean[] }).__settingChanges
      )
    )
    .toEqual([false, true]);
  await page.keyboard.press('Tab');
  const controlled = card.getByRole('switch', {
    name: 'Configuration menus with a longer setting name',
  });
  await expect(controlled).toBeFocused();
  await page.keyboard.press('Space');
  await expect(controlled).toBeChecked();
  await expect(card.getByRole('switch', { name: 'Unavailable setting' })).toBeDisabled();
});

test('setting row toggle applies its emphasis typography variants', async ({ page }) => {
  const card = page.locator('#immediate-card');
  const emphasisRow = card.locator('#navigation-setting');
  const nonEmphasisRow = card.locator('#long-setting');

  await expect(emphasisRow.locator('ds-text').nth(0)).toHaveClass(
    /ds-text--body-medium.*ds-text--emphasis/
  );
  await expect(emphasisRow.locator('ds-text').nth(1)).toHaveClass(/ds-text--body-medium/);
  await expect(nonEmphasisRow.locator('ds-text').nth(0)).toHaveClass(
    /ds-text--body-medium.*ds-text--regular/
  );
  await expect(nonEmphasisRow.locator('ds-text').nth(1)).toHaveClass(/ds-text--body-small/);
});

test('immediate rows retain two columns with wrapped copy on narrow screens @cross-browser', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const card = page.locator('#immediate-card');
  await card.scrollIntoViewIfNeeded();
  const row = card.locator('#long-setting');
  const copy = await row.locator('.setting-row-toggle__copy').boundingBox();
  const toggle = await row.getByRole('switch').boundingBox();
  const bounds = await card.boundingBox();
  expect(copy).not.toBeNull();
  expect(toggle).not.toBeNull();
  expect(bounds).not.toBeNull();
  expect(copy!.width).toBeGreaterThan(0);
  expect(copy!.x + copy!.width).toBeLessThan(toggle!.x);
  expect(toggle!.x + toggle!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(360);
  await expect(row.getByRole('switch')).toHaveAccessibleDescription(
    /Open filters and view settings/
  );
});
