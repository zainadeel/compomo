import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/popover.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

const closeReasons = (page: Page) =>
  page.evaluate(() => (window as unknown as { popoverCloses: string[] }).popoverCloses);

const openWithKeyboard = async (page: Page, triggerId: string) => {
  const trigger = page.locator(`#${triggerId}`);
  await trigger.focus();
  await trigger.press('Enter');
};

test('shares the choice-popup surface and insets content to the Menu label edge @pr-critical', async ({
  page,
}) => {
  await openWithKeyboard(page, 'share-trigger');
  const surface = page.getByRole('dialog', { name: 'Share view' });
  await expect(surface).toBeVisible();
  await expect(surface).toBeFocused();
  await expect(surface).toHaveClass(/ds-choice-popup/);
  await expect(surface).toHaveCSS('padding-top', '4px');

  const [surfaceBox, triggerBox, copyBox] = await Promise.all([
    surface.boundingBox(),
    page.locator('#share-trigger').boundingBox(),
    page.locator('#share-copy').boundingBox(),
  ]);
  expect(Math.round(surfaceBox!.width)).toBe(300);
  expect(Math.round(surfaceBox!.x)).toBe(Math.round(triggerBox!.x));
  expect(Math.round(surfaceBox!.y - (triggerBox!.y + triggerBox!.height))).toBe(4);
  expect(Math.round(copyBox!.x - surfaceBox!.x)).toBe(12);
});

test('unsized content follows the choice-popup minimum width', async ({ page }) => {
  await openWithKeyboard(page, 'list-trigger');
  const surface = page.getByRole('dialog', { name: 'Columns' });
  await expect(surface).toBeVisible();
  // A short label keeps the choice-popup minimum, menu-width-xs.
  expect(Math.round((await surface.boundingBox())!.width)).toBe(200);
});

test('Escape returns focus to the trigger', async ({ page }) => {
  await openWithKeyboard(page, 'share-trigger');
  await expect(page.getByRole('dialog', { name: 'Share view' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#share-trigger')).toBeFocused();
  await expect(page.locator('#share')).toHaveJSProperty('open', false);
  expect(await closeReasons(page)).toEqual(['escape']);
});

test('Tab past the last control closes and continues after the trigger', async ({ page }) => {
  await openWithKeyboard(page, 'share-trigger');
  await expect(page.getByRole('dialog', { name: 'Share view' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#copy-link')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#next-control')).toBeFocused();
  await expect(page.locator('#share')).toHaveJSProperty('open', false);
  expect(await closeReasons(page)).toEqual(['tab']);
});

test('outside activation closes without moving focus back', async ({ page }) => {
  await openWithKeyboard(page, 'share-trigger');
  await expect(page.getByRole('dialog', { name: 'Share view' })).toBeVisible();
  await page.locator('#outside').focus();
  await page.locator('#outside').click();
  await expect(page.locator('#share')).toHaveJSProperty('open', false);
  await expect(page.locator('#share-trigger')).not.toBeFocused();
  expect(await closeReasons(page)).toEqual(['outside']);
});
