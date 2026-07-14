import { expect, test, type Locator } from '@playwright/test';

async function focusByKeyboard(anchor: Locator) {
  await anchor.evaluate(element => {
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    (element as HTMLElement).focus();
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/tooltip.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('links aria-describedby only while the popup exists and preserves consumer ids', async ({ page }) => {
  const anchor = page.locator('#aria-anchor');
  await expect(anchor).toHaveAttribute('aria-describedby', 'existing-description');

  await focusByKeyboard(anchor);
  const popup = page.getByRole('tooltip', { name: 'Supplementary label' });
  await expect(popup).toBeVisible();
  const popupId = await popup.getAttribute('id');
  await expect(anchor).toHaveAttribute('aria-describedby', `existing-description ${popupId}`);

  await page.keyboard.press('Escape');
  await expect(popup).toHaveCount(0);
  await expect(anchor).toHaveAttribute('aria-describedby', 'existing-description');
  await expect(anchor).toBeFocused();
});

test('tracks its trigger through nested scrolling and viewport resize', async ({ page }) => {
  const scroller = page.locator('#scroll-container');
  await scroller.evaluate(element => { element.scrollTop = 300; });
  const scrollAnchor = page.locator('#scroll-anchor');
  await focusByKeyboard(scrollAnchor);
  const popup = page.getByRole('tooltip', { name: 'Scrolling label' });
  await expect(popup).toBeVisible();

  const before = await popup.boundingBox();
  await scroller.evaluate(element => { element.scrollTop += 40; });
  await expect.poll(async () => (await popup.boundingBox())?.y).toBeCloseTo((before?.y ?? 0) - 40, 0);

  await page.keyboard.press('Escape');
  const resizeAnchor = page.locator('#resize-anchor');
  await focusByKeyboard(resizeAnchor);
  const resizePopup = page.getByRole('tooltip', { name: 'Resize label' });
  await expect(resizePopup).toBeVisible();
  const wide = await resizePopup.boundingBox();
  await page.setViewportSize({ width: 640, height: 600 });
  await expect.poll(async () => (await resizePopup.boundingBox())?.x).toBeLessThan(wide?.x ?? Infinity);
});

test('flips to the opposite side before clamping', async ({ page }) => {
  await page.locator('#top-edge-anchor').hover();
  const topPopup = page.getByRole('tooltip', { name: 'Top collision' });
  await expect(topPopup).toHaveAttribute('data-side', 'bottom');

  await page.locator('#right-edge-anchor').hover();
  const rightPopup = page.getByRole('tooltip', { name: 'Right collision' });
  await expect(rightPopup).toHaveAttribute('data-side', 'left');
});

test('rebinds when the slotted trigger is replaced', async ({ page }) => {
  await page.locator('#swap-trigger').click();
  const replacement = page.locator('#dynamic-anchor-b');
  await expect(replacement).toBeVisible();
  await replacement.hover();
  const popup = page.getByRole('tooltip', { name: 'Dynamic label' });
  await expect(popup).toBeVisible();

  const anchorBox = await replacement.boundingBox();
  const popupBox = await popup.boundingBox();
  expect(popupBox?.x).toBeGreaterThan(anchorBox?.right ?? 0);
});

test('uses instant warm handoff between adjacent triggers', async ({ page }) => {
  await page.locator('#warm-one').hover();
  await expect(page.getByRole('tooltip', { name: 'Warm one' })).toBeVisible();

  await page.locator('#warm-two').hover();
  const nextPopup = page.getByRole('tooltip', { name: 'Warm two' });
  await expect(nextPopup).toBeVisible();
  await expect(nextPopup).toHaveClass(/tooltip-popup--instant/);
  await expect(page.getByRole('tooltip', { name: 'Warm one' })).toHaveCount(0);
});

test('removes tooltip motion when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#aria-anchor').hover();
  const popup = page.getByRole('tooltip', { name: 'Supplementary label' });
  await expect(popup).toBeVisible();
  await expect.poll(() => popup.evaluate(element => getComputedStyle(element).animationName)).toBe('none');

  await page.mouse.move(600, 500);
  await expect(popup).toHaveCount(0);
});

test.describe('touch input', () => {
  test.use({ hasTouch: true });

  test('does not open a visual-only tooltip after tapping', async ({ page }) => {
    await page.locator('#touch-anchor').tap();
    await expect(page.getByRole('tooltip', { name: 'Touch should not open' })).toHaveCount(0);
  });
});
