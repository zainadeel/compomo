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
    radiusProbe.style.borderRadius = 'var(--dimension-radius-125)';
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
