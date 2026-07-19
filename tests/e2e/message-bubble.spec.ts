import { expect, test } from '@playwright/test';

test('plain message copy owns the body-medium regular recipe', async ({ page }) => {
  await page.goto('/message-bubble.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');

  const content = page.locator('#outgoing .message-bubble');
  await expect(content).toHaveCSS('font-size', '14px');
  await expect(content).toHaveCSS('line-height', '20px');
  await expect(content).toHaveCSS('font-weight', '400');
});
