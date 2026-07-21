import { expect, test } from '@playwright/test';

test('exposes a polite typing status outside message-bubble semantics', async ({ page }) => {
  await page.goto('/typing-indicator.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');

  const indicator = page.locator('#typing');
  const text = indicator.locator('ds-text');

  await expect(indicator).toHaveAttribute('role', 'status');
  await expect(indicator).toHaveAttribute('aria-live', 'polite');
  await expect(indicator).toHaveAttribute('aria-atomic', 'true');
  await expect(indicator).toContainText('Avery is typing…');
  await expect(indicator.locator('ds-message-bubble')).toHaveCount(0);
  await expect(text).toHaveJSProperty('variant', 'text-body-small');
  await expect(text).toHaveJSProperty('color', 'secondary');
  await expect(text).toHaveCSS('font-size', '12px');
  await expect(text).toHaveCSS('line-height', '16px');
});
