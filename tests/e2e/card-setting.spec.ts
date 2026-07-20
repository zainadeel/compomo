import AxeBuilder from '@axe-core/playwright';
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
    const header = element.querySelector<HTMLElement>('.card-setting__header');
    return {
      width: element.getBoundingClientRect().width,
      expectedWidth: Number.parseFloat(style.getPropertyValue('--dimension-card-width-sm')),
      minHeight: Number.parseFloat(style.minHeight),
      expectedMinHeight: Number.parseFloat(
        style.getPropertyValue('--dimension-card-height-sm')
      ),
      headerHeight: header?.getBoundingClientRect().height,
    };
  });

  expect(geometry.width).toBe(geometry.expectedWidth);
  expect(geometry.minHeight).toBe(geometry.expectedMinHeight);
  expect(geometry.headerHeight).toBe(48);
});

test('emits typed actions while the parent enforces one editing section', async ({ page }) => {
  const general = page.locator('#general-card');
  const drivers = page.locator('#drivers-card');

  await page.getByRole('button', { name: 'Edit General' }).click();
  await expect(general).toHaveClass(/card-setting--editing/);
  await expect(drivers).not.toHaveClass(/card-setting--editing/);

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

test('has no automatically detectable accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
