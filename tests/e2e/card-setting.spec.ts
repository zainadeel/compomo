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
    const headerStyle = getComputedStyle(header);
    const radiusProbe = document.createElement('div');
    radiusProbe.style.borderRadius = 'var(--ds-radius-card)';
    element.append(radiusProbe);
    const expectedBorderRadius = getComputedStyle(radiusProbe).borderRadius;
    radiusProbe.remove();
    return {
      width: element.getBoundingClientRect().width,
      expectedWidth: Number.parseFloat(style.getPropertyValue('--dimension-card-width-sm')),
      minHeight: Number.parseFloat(style.minHeight),
      expectedMinHeight: Number.parseFloat(style.getPropertyValue('--dimension-card-height-sm')),
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
  expect(geometry.minHeight).toBe(geometry.expectedMinHeight);
  expect(geometry.borderRadius).toBe(geometry.expectedBorderRadius);
  expect(geometry.boxShadow).not.toBe('none');
  expect(geometry.headerHeight).toBeGreaterThanOrEqual(geometry.headerMinHeight);
  expect(geometry.headerBackground).toBe('rgba(0, 0, 0, 0)');
  expect(geometry.headerPadding).toBe('8px');
  expect(geometry.headerGap).toBe('8px');
  expect(geometry.headerBoxSizing).toBe('border-box');
});

test('emits typed actions while the parent enforces one editing section', async ({ page }) => {
  const general = page.locator('#general-card');
  const drivers = page.locator('#drivers-card');

  await page.getByRole('button', { name: 'Edit General' }).click();
  await expect(general).toHaveClass(/card-setting--editing/);
  await expect(drivers).not.toHaveClass(/card-setting--editing/);

  const editGeometry = await general.evaluate(element => {
    const style = getComputedStyle(element);
    const body = element.querySelector<HTMLElement>('.card-setting__body');
    return {
      bodyTopRadius: body ? getComputedStyle(body).borderTopRightRadius : undefined,
      expectedBodyTopRadius: style.borderTopRightRadius,
      boxShadow: style.boxShadow,
    };
  });
  expect(editGeometry.bodyTopRadius).toBe(editGeometry.expectedBodyTopRadius);
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
