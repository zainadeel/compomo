import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/reduced-motion.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('stops infinite and spatial component motion while retaining final states', async ({ page }) => {
  const loaderAnimation = await page.locator('#loader').evaluate(element =>
    getComputedStyle(element.shadowRoot!.querySelector('.loader')!).animationName
  );
  expect(loaderAnimation).toBe('none');

  const switchMotion = await page.locator('#switch').evaluate(element => {
    const thumb = getComputedStyle(element.shadowRoot!.querySelector('.thumb')!);
    return { duration: thumb.transitionDuration, property: thumb.transitionProperty };
  });
  expect(switchMotion.duration).toBe('0s');
  expect(switchMotion.property).toBe('none');

  const buttonTransition = await page.locator('#button').evaluate(element =>
    getComputedStyle(element.querySelector('.button-filled')!).transitionProperty
  );
  expect(buttonTransition).not.toContain('transform');
});

test('renders overlays without entry or exit animation delays', async ({ page }) => {
  await expect(page.locator('#menu .menu-popup')).toBeVisible();
  await expect(page.locator('#modal .modal-dialog')).toBeVisible();
  await expect(page.locator('#toast .toast-surface')).toBeVisible();

  const animations = await page.evaluate(() => ({
    menu: getComputedStyle(document.querySelector('#menu .menu-popup')!).animationName,
    modal: getComputedStyle(document.querySelector('#modal .modal-dialog')!).animationName,
    toast: getComputedStyle(document.querySelector('#toast .toast-surface')!).animationName,
  }));
  expect(animations).toEqual({ menu: 'none', modal: 'none', toast: 'none' });

  await page.locator('#menu').evaluate((element: HTMLDsMenuElement) => { element.open = false; });
  await expect(page.locator('#menu .menu-popup')).toHaveCount(0);

  await page.locator('#modal').evaluate((element: HTMLDsModalElement) => { element.open = false; });
  await expect(page.locator('#modal .modal-dialog')).toBeHidden();

  await page.evaluate(() => {
    (
      window as typeof window & {
        __reducedMotionToastManager: { close: (id: string) => void };
      }
    ).__reducedMotionToastManager.close('reduced-motion-toast');
  });
  await expect.poll(() => page.evaluate(() =>
    (window as typeof window & { __toastRemoved: number }).__toastRemoved
  )).toBe(1);
});
