import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/chip.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('is always removable with the fixed Cross icon', async ({ page }) => {
  const chip = page.locator('#chip');
  const remove = chip.getByRole('button');

  await expect(chip).toHaveAttribute('removable', 'false');
  await expect(remove).toHaveAccessibleName('Remove Vehicle: 452');
  await expect.poll(() => remove.locator('ds-icon').evaluate(
    element => (element as HTMLElement & { name: string }).name,
  )).toBe('Cross');

  await remove.click();

  await expect.poll(() => page.evaluate(() => (
    (window as unknown as {
      __chipRemovals: Array<{ id: string; hasNoDetail: boolean }>;
    }).__chipRemovals
  ))).toEqual([{ id: 'chip', hasNoDetail: true }]);
});

test('keeps inactive metadata visible without an interactive dismiss action', async ({ page }) => {
  const inactive = page.locator('#inactive-chip');
  const remove = inactive.getByRole('button');

  await expect(inactive).toBeVisible();
  await expect(remove).toBeDisabled();
  await remove.evaluate((button: HTMLButtonElement) => button.click());
  await expect.poll(() => page.evaluate(() => (
    (window as unknown as { __chipRemovals: unknown[] }).__chipRemovals
  ))).toEqual([]);
});

test('truncates one line only when constrained by maxWidth', async ({ page }) => {
  const host = page.locator('#long-chip');
  const label = host.locator('ds-text');

  await expect.poll(() => host.evaluate(element => getComputedStyle(element).maxWidth)).toBe('120px');
  await expect(label).toHaveCSS('white-space', 'nowrap');
  await expect(label).toHaveCSS('overflow', 'hidden');
  await expect(label).toHaveCSS('text-overflow', 'ellipsis');
  expect(await label.locator('span').evaluate(
    element => element.scrollWidth > element.clientWidth,
  )).toBe(true);
});

test('has no detectable accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
