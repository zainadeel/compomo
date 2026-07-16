import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/empty-state.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('renders the three supported content variants', async ({ page }) => {
  const complete = page.locator('#complete');
  await expect(complete.locator('ds-icon')).toHaveJSProperty('size', 'xl');
  await expect(complete.locator('ds-icon')).toHaveJSProperty('color', 'primary');
  await expect(complete.locator('ds-icon .icon')).toHaveClass(/icon--color-primary/);
  await expect(complete.locator('.empty-state__title')).toHaveText('No results found');
  await expect(complete.locator('.empty-state__body')).toHaveText('Try adjusting your search or filters.');

  const titleBody = page.locator('#title-body');
  await expect(titleBody.locator('ds-icon')).toHaveCount(0);
  await expect(titleBody.locator('.empty-state__title')).toHaveText('Nothing here yet');
  await expect(titleBody.locator('.empty-state__body')).toBeVisible();

  const bodyOnly = page.locator('#body-only');
  await expect(bodyOnly.locator('ds-icon')).toHaveCount(0);
  await expect(bodyOnly.locator('.empty-state__title')).toHaveCount(0);
  await expect(bodyOnly.locator('.empty-state__body')).toHaveText('No results found');
});

test('owns centered typography and exact composition spacing', async ({ page }) => {
  const complete = page.locator('#complete');
  await expect(complete.locator('.empty-state')).toHaveCSS('text-align', 'center');
  await expect(complete.locator('.empty-state')).toHaveCSS('gap', '8px');
  await expect(complete.locator('.empty-state__text')).toHaveCSS('gap', '4px');
  await expect(complete.locator('.empty-state__title')).toHaveClass(/ds-text--title-small/);
  await expect(complete.locator('.empty-state__title')).toHaveClass(/ds-text--color-primary/);
  await expect(complete.locator('.empty-state__body')).toHaveClass(/ds-text--body-medium/);
  await expect(complete.locator('.empty-state__body')).toHaveClass(/ds-text--color-secondary/);
});

test('has no detectable accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
