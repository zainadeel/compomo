import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/scroll-overlay.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('keeps a 48px fade behind an inset md footer action at every scroll position', async ({
  page,
}) => {
  const frame = page.locator('#frame');
  const viewport = frame.locator('.scroll-overlay__viewport');
  const content = frame.locator('.scroll-overlay__content');

  await expect(frame.getByRole('region', { name: 'Scrollable results' })).toHaveCount(1);
  await expect(content).not.toHaveCSS('mask-image', 'none');

  const fadeWindow = async () =>
    frame.evaluate(element => {
      const contentElement = element.querySelector<HTMLElement>('.scroll-overlay__content')!;
      const style = getComputedStyle(contentElement);
      return {
        start: Number.parseFloat(
          style.getPropertyValue('--ds-scroll-edge-fade-window-start'),
        ),
        end: Number.parseFloat(style.getPropertyValue('--ds-scroll-edge-fade-window-end')),
        overlay: Number.parseFloat(
          getComputedStyle(element).getPropertyValue('--ds-scroll-overlay-block-size'),
        ),
      };
    });

  await expect.poll(fadeWindow).toEqual({ start: 192, end: 240, overlay: 48 });

  await viewport.evaluate(element => {
    element.scrollTop = element.scrollHeight;
    element.dispatchEvent(new Event('scroll'));
  });

  await expect.poll(async () => {
    const window = await fadeWindow();
    return window.end - window.start;
  }).toBe(48);
  await expect(content).not.toHaveCSS('mask-image', 'none');
});

test('tracks a growing footer and expands both clearance and fade depth', async ({ page }) => {
  const frame = page.locator('#frame');
  const action = page.locator('#action');

  await action.evaluate(element => {
    element.style.height = '80px';
  });

  await expect
    .poll(() =>
      frame.evaluate(element => ({
        overlay: Number.parseFloat(
          getComputedStyle(element).getPropertyValue('--ds-scroll-overlay-block-size'),
        ),
        visible: Number.parseFloat(
          getComputedStyle(element).getPropertyValue('--ds-scroll-overlay-content-block-size'),
        ),
        fade: (() => {
          const content = element.querySelector<HTMLElement>('.scroll-overlay__content')!;
          const style = getComputedStyle(content);
          const start = Number.parseFloat(
            style.getPropertyValue('--ds-scroll-edge-fade-window-start'),
          );
          const end = Number.parseFloat(
            style.getPropertyValue('--ds-scroll-edge-fade-window-end'),
          );
          return end - start;
        })(),
      })),
    )
    .toEqual({ overlay: 96, visible: 88, fade: 96 });
});
