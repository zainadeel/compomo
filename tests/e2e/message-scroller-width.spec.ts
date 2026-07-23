import { expect, test } from '@playwright/test';

test('keeps the scrollbar at the viewport edge while aligning a 600px conversation lane', async ({
  page,
}) => {
  await page.goto('/message-scroller-width.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');

  const geometry = await page.locator('#scroller').evaluate(scroller => {
    const viewport = scroller.querySelector<HTMLElement>('.message-scroller__viewport');
    const content = scroller.querySelector<HTMLElement>('.message-scroller__content');
    const message = scroller.querySelector<HTMLElement>('.message');
    const composer = scroller.querySelector<HTMLElement>('.composer');
    const composerSurface = scroller.querySelector<HTMLElement>('.composer__surface');

    if (!viewport || !content || !message || !composer || !composerSurface) {
      throw new Error('Message scroller fixture did not render.');
    }

    const rect = (element: Element) => {
      const bounds = element.getBoundingClientRect();
      return {
        left: bounds.left,
        right: bounds.right,
        width: bounds.width,
        center: bounds.left + bounds.width / 2,
      };
    };

    return {
      host: rect(scroller),
      viewport: rect(viewport),
      content: rect(content),
      message: rect(message),
      composer: rect(composer),
      composerSurface: rect(composerSurface),
      scrollHeight: viewport.scrollHeight,
      clientHeight: viewport.clientHeight,
    };
  });

  expect(geometry.host.width).toBe(1000);
  expect(geometry.viewport.width).toBe(1000);
  expect(geometry.viewport.right).toBe(geometry.host.right);
  expect(geometry.scrollHeight).toBeGreaterThan(geometry.clientHeight);

  expect(geometry.content.width).toBe(632);
  expect(geometry.message.width).toBe(600);
  expect(geometry.composer.width).toBe(616);
  expect(geometry.composerSurface.width).toBe(600);
  expect(geometry.message.left).toBe(geometry.composerSurface.left);
  expect(geometry.message.right).toBe(geometry.composerSurface.right);
  expect(geometry.message.center).toBe(geometry.viewport.center);
});
