import { expect, test } from '@playwright/test';

test('outgoing message owns its text recipe and inset border', async ({ page }) => {
  await page.goto('/message-bubble.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');

  const content = page.locator('#outgoing .message-bubble');
  await expect(content).toHaveCSS('font-size', '14px');
  await expect(content).toHaveCSS('line-height', '20px');
  await expect(content).toHaveCSS('font-weight', '400');
  await expect(content).toHaveCSS('box-shadow', /inset/);
});
