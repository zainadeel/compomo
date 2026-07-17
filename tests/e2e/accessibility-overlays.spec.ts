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

test('modal makes outside branches inert, traps focus, and restores its trigger', async ({ page }) => {
  const trigger = page.locator('#modal-trigger');
  await trigger.focus();
  await trigger.press('Enter');

  const dialog = page.getByRole('dialog', { name: 'Confirm changes' });
  await expect(dialog).toBeVisible();
  await expect(page.locator('#page-content')).toHaveJSProperty('inert', true);
  await expect(page.locator('#after-modal')).toHaveJSProperty('inert', true);
  await expect(page.locator('#inside-first')).toBeFocused();

  await page.locator('#inside-last').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#inside-first')).toBeFocused();

  const results = await new AxeBuilder({ page }).include('#modal').analyze();
  expect(results.violations).toEqual([]);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.locator('#page-content')).toHaveJSProperty('inert', false);
  await expect(trigger).toBeFocused();
});
