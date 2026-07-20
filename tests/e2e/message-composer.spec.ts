import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/message-composer.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('uses ArrowUp to send and SquareFilled to stop streaming', async ({ page }) => {
  const composer = page.locator('#composer');
  const action = composer.locator('ds-button-filled.message-composer__action');

  await expect(action).toHaveJSProperty('icon', 'ArrowUp');
  await expect(action).toHaveAttribute('aria-label', 'Send message');

  await composer.evaluate((element: HTMLDsMessageComposerElement) => {
    element.status = 'streaming';
  });

  await expect(action).toHaveJSProperty('icon', 'SquareFilled');
  await expect(action).toHaveAttribute('aria-label', 'Stop response');
});
