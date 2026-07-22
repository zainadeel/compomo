import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/accessibility-overlays.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('plain menu restores focus on Escape but lets Tab continue forward', async ({ page }) => {
  const anchor = page.locator('#menu-anchor');
  await anchor.click();
  const menu = page.getByRole('menu', { name: 'Actions' });
  await expect(menu).toBeVisible();
  await expect(menu).toHaveJSProperty('popover', 'manual');
  expect(await menu.evaluate(element => element.matches(':popover-open'))).toBe(true);
  await expect(menu).toHaveCSS('border-top-width', '0px');
  await expect(menu).toHaveCSS('padding-top', '0px');
  await expect(menu.getByRole('menuitem', { name: 'Edit' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(anchor).toBeFocused();
  await expect(anchor).toHaveAttribute('aria-expanded', 'false');

  await anchor.click();
  await expect(menu.getByRole('menuitem', { name: 'Edit' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#after-menu')).toBeFocused();
  await expect(anchor).toHaveAttribute('aria-expanded', 'false');
});

test('menu flips above a bottom-edge trigger instead of overlapping the viewport edge', async ({ page }) => {
  const anchor = page.locator('#collision-anchor');
  await anchor.click();
  const menu = page.getByRole('menu', { name: 'Collision actions' });
  await expect(menu).toBeVisible();

  const [anchorBox, menuBox] = await Promise.all([anchor.boundingBox(), menu.boundingBox()]);
  expect(anchorBox).not.toBeNull();
  expect(menuBox).not.toBeNull();
  expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(anchorBox!.y);
});

test('rich preference popup exposes dialog and radio-group semantics without stealing arrow keys', async ({ page }) => {
  await page.locator('#rich-anchor').click();
  const popup = page.getByRole('dialog', { name: 'Appearance' });
  await expect(popup).toBeVisible();
  await expect(popup.getByRole('menu')).toHaveCount(0);

  const selected = popup.getByRole('radio', { checked: true });
  await expect(selected).toBeFocused();
  const before = await selected.getAttribute('aria-label');
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => popup.getByRole('radio', { checked: true }).getAttribute('aria-label'))
    .not.toBe(before);

  await page.keyboard.press('Tab');
  await expect(popup.getByRole('button', { name: 'System' })).toBeFocused();
  await expect(page.locator('#rich-anchor')).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Tab');
  const dark = popup.getByRole('button', { name: 'Dark' });
  await expect(dark).toBeFocused();
  await expect(dark).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Tab');
  await expect(page.locator('#modal-trigger')).toBeFocused();
  await expect(page.locator('#rich-anchor')).toHaveAttribute('aria-expanded', 'false');

  await page.locator('#rich-anchor').click();
  const results = await new AxeBuilder({ page })
    .include('#rich-menu')
    .disableRules(['color-contrast'])
    .analyze();
  expect(results.violations).toEqual([]);
});

test('modal uses the top layer, reports dismissal reasons, and restores its trigger', async ({ page }) => {
  const trigger = page.locator('#modal-trigger');
  await trigger.focus();
  await trigger.press('Enter');

  const dialog = page.getByRole('dialog', { name: 'Confirm changes' });
  const close = dialog.getByRole('button', { name: 'Close' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-describedby', 'modal-description');
  await expect(close).toBeFocused();
  expect(await dialog.evaluate(element => element instanceof HTMLDialogElement && element.open)).toBe(true);
  expect((await dialog.boundingBox())!.width).toBeGreaterThan(1);

  await page.locator('#outside-action').evaluate((element: HTMLButtonElement) => element.focus());
  await expect(close).toBeFocused();

  const chromeHeights = await dialog.evaluate(element => ({
    header: getComputedStyle(element.querySelector('.modal-header')!).height,
    headerPaddingInline: getComputedStyle(element.querySelector('.modal-header')!).paddingInline,
    footer: getComputedStyle(element.querySelector('.modal-footer')!).height,
    titleFontSize: getComputedStyle(element.querySelector('.modal-heading')!).fontSize,
    titleLineHeight: getComputedStyle(element.querySelector('.modal-heading')!).lineHeight,
    titlePaddingInline: getComputedStyle(element.querySelector('.modal-heading')!).paddingInline,
  }));
  expect(chromeHeights).toEqual({
    header: '64px',
    headerPaddingInline: '16px',
    footer: '64px',
    titleFontSize: '18px',
    titleLineHeight: '24px',
    titlePaddingInline: '0px',
  });

  await dialog.getByRole('button', { name: 'Cancel' }).focus();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();

  const results = await new AxeBuilder({ page }).include('#modal').analyze();
  expect(results.violations).toEqual([]);

  await close.click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() =>
    (window as typeof window & { __modalCloseReasons: string[] }).__modalCloseReasons
  )).toEqual(['close-button']);
  expect(await page.evaluate(() =>
    (window as typeof window & { __modalAfterClose: number }).__modalAfterClose
  )).toBe(1);

  await trigger.press('Enter');
  await expect(close).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() =>
    (window as typeof window & { __modalCloseReasons: string[] }).__modalCloseReasons
  )).toEqual(['close-button', 'escape']);

  await trigger.press('Enter');
  await expect(close).toBeFocused();
  await page.mouse.click(0, 0);
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() =>
    (window as typeof window & { __modalCloseReasons: string[] }).__modalCloseReasons
  )).toEqual(['close-button', 'escape', 'backdrop']);
  expect(await page.evaluate(() =>
    (window as typeof window & { __modalAfterClose: number }).__modalAfterClose
  )).toBe(3);
});

test('modal omits the footer block when no footer actions are assigned', async ({ page }) => {
  const modal = page.locator('#modal-no-footer');
  await modal.evaluate((element: HTMLDsModalElement) => {
    element.open = true;
  });

  const dialog = page.getByRole('dialog', { name: 'Update complete' });
  const footer = dialog.locator('.modal-footer');
  await expect(dialog).toBeVisible();
  await expect(footer).toHaveClass(/modal-footer--empty/);
  await expect(footer).toBeHidden();
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});
