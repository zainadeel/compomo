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
  await expect(complete.locator('.empty-state__body')).toHaveText(
    'Try adjusting your search or filters.'
  );

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
  const icon = await complete.locator('.empty-state__icon').boundingBox();
  const text = await complete.locator('.empty-state__text').boundingBox();
  expect(text!.y - icon!.y - icon!.height).toBeCloseTo(8, 1);
  await expect(complete.locator('.empty-state__text')).toHaveCSS('gap', '4px');
  await expect(complete.locator('.empty-state__title')).toHaveCSS('text-wrap', 'balance');
  await expect(complete.locator('.empty-state__body')).toHaveCSS('text-wrap', 'balance');
  await expect(complete.locator('.empty-state__title')).toHaveClass(/ds-text--title-small/);
  await expect(complete.locator('.empty-state__title')).toHaveClass(/ds-text--color-primary/);
  await expect(complete.locator('.empty-state__body')).toHaveClass(/ds-text--body-medium/);
  await expect(complete.locator('.empty-state__body')).toHaveClass(/ds-text--color-secondary/);
});

test('supports optional recovery actions without adding space to message-only states @cross-browser', async ({
  page,
}) => {
  await expect(page.locator('#complete .empty-state__actions')).toBeHidden();
  const empty = page.locator('#with-action');
  const content = empty.locator('.empty-state');
  const before = await content.boundingBox();
  await empty.evaluate(element => {
    element.addEventListener('dsClick', () => element.setAttribute('data-action', 'clicked'));
  });
  const button = empty.getByRole('button', { name: 'Try again' });
  await expect(button).toBeVisible();
  const body = await empty.locator('.empty-state__body').boundingBox();
  const bounds = await button.boundingBox();
  expect(bounds!.y - body!.y - body!.height).toBeCloseTo(16, 1);
  expect(Math.abs(bounds!.x + bounds!.width / 2 - (before!.x + before!.width / 2))).toBeLessThan(1);
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(empty).toHaveAttribute('data-action', 'clicked');
  await empty.locator('[slot="actions"]').evaluate(element => element.remove());
  await expect(empty.locator('.empty-state__actions')).toBeHidden();
  const after = await content.boundingBox();
  const text = await empty.locator('.empty-state__text').boundingBox();
  expect(after!.height).toBeCloseTo(text!.height, 1);
});
