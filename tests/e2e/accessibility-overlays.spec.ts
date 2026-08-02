import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { chromiumOnly } from './browser-tier';

const openPopupAxe = chromiumOnly(
  'accessibility',
  'Axe audits the integrated open popup in Chromium; popup focus and keyboard behavior remain cross-browser.',
);
const openModalAxe = chromiumOnly(
  'accessibility',
  'Axe audits the integrated open modal in Chromium; top-layer, focus, and dismissal behavior remain cross-browser elsewhere.',
);

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

test('single-selection menu uses selected row styling without a radio glyph', async ({ page }) => {
  await page.locator('#filter-anchor').click();
  const menu = page.getByRole('menu', { name: 'Conversation filter' });
  const selected = menu.getByRole('menuitemradio', { name: 'All chats', checked: true });
  const unselected = menu.getByRole('menuitemradio', { name: 'Unread', checked: false });

  await expect(selected).toBeVisible();
  await expect(selected).toHaveClass(/ds-interaction-fill--selected/);
  await expect(menu.locator('.menu-item__radio-box')).toHaveCount(0);
  const colors = await Promise.all([
    selected.locator('.menu-item__label').evaluate(element => getComputedStyle(element).color),
    unselected.locator('.menu-item__label').evaluate(element => getComputedStyle(element).color),
  ]);
  expect(colors[0]).not.toBe(colors[1]);
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

test('rich preference popup exposes dialog and radio-group semantics without stealing arrow keys', openPopupAxe, async ({ page }) => {
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

test('modal uses the top layer, reports dismissal reasons, and restores its trigger', openModalAxe, async ({ page }) => {
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
    copyPaddingInline: getComputedStyle(element.querySelector('.modal-copy')!).paddingInline,
    copyPaddingBlock: getComputedStyle(element.querySelector('.modal-copy')!).paddingBlock,
    footer: getComputedStyle(element.querySelector('.modal-footer')!).height,
    titleFontSize: getComputedStyle(element.querySelector('.modal-heading')!).fontSize,
    titleLineHeight: getComputedStyle(element.querySelector('.modal-heading')!).lineHeight,
    titlePaddingInline: getComputedStyle(element.querySelector('.modal-heading')!).paddingInline,
    titleCenter: (() => {
      const bounds = element.querySelector('.modal-heading')!.getBoundingClientRect();
      return bounds.top + bounds.height / 2;
    })(),
    closeCenter: (() => {
      const bounds = element.querySelector('.modal-close')!.getBoundingClientRect();
      return bounds.top + bounds.height / 2;
    })(),
  }));
  expect(chromeHeights).toMatchObject({
    header: '49px',
    headerPaddingInline: '8px',
    copyPaddingInline: '6px',
    copyPaddingBlock: '6px',
    footer: '64px',
    titleFontSize: '14px',
    titleLineHeight: '20px',
    titlePaddingInline: '2px',
  });
  expect(chromeHeights.titleCenter).toBeCloseTo(chromeHeights.closeCenter, 1);

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
  await expect(dialog.locator('.modal-description')).toHaveText(
    'Changes are already available to everyone.',
  );
  await expect(dialog.locator('.modal-heading')).toHaveClass(/ds-text--title-small/);
  await expect(dialog.locator('.modal-copy')).toHaveCSS('gap', '4px');
  await expect(dialog.locator('.modal-copy')).toHaveCSS('padding-inline', '6px');
  await expect(dialog.locator('.modal-copy')).toHaveCSS('padding-block', '6px');
  await expect(dialog.locator('.modal-heading')).toHaveCSS('padding-inline', '2px');
  await expect(dialog.locator('.modal-description')).toHaveCSS('padding-inline', '2px');
  const stackedHeader = await dialog.evaluate(element => {
    const header = element.querySelector('.modal-header')!.getBoundingClientRect();
    const heading = element.querySelector('.modal-heading')!.getBoundingClientRect();
    const description = element.querySelector('.modal-description')!.getBoundingClientRect();
    const close = element.querySelector('.modal-close')!.getBoundingClientRect();
    return {
      headerHeight: header.height,
      copyGap: description.top - heading.bottom,
      titleCenter: heading.top + heading.height / 2,
      closeCenter: close.top + close.height / 2,
    };
  });
  expect(stackedHeader.headerHeight).toBeGreaterThan(49);
  expect(stackedHeader.copyGap).toBeCloseTo(4, 0);
  expect(stackedHeader.titleCenter).toBeCloseTo(stackedHeader.closeCenter, 1);
  await expect(dialog).toHaveAttribute('aria-describedby', /ds-modal-title-\d+-description/);
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});
