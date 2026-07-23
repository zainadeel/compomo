import { expect, test } from '@playwright/test';

test('starts incoming message content without an avatar prefix column', async ({ page }) => {
  await page.goto('/message-row.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');

  const message = page.locator('ds-message').first();
  await expect(message.locator('.message__avatar')).toHaveCount(0);
  const author = message.locator('.message__header ds-text').filter({ hasText: 'Avery' });
  await expect(author).toHaveJSProperty('variant', 'text-body-small');
  await expect(author).toHaveJSProperty('emphasis', true);
  await expect(author).toHaveJSProperty('color', 'primary');

  const [rowBox, bodyBox] = await Promise.all([
    message.locator('.message').boundingBox(),
    message.locator('.message__body').boundingBox(),
  ]);
  if (!rowBox || !bodyBox) throw new Error('Message row geometry did not render');
  expect(bodyBox.x).toBeCloseTo(rowBox.x, 0);

  const [headerBox, contentBox, footerBox] = await Promise.all([
    message.locator('.message__header').boundingBox(),
    message.locator('.message__content').boundingBox(),
    message.locator('.message__footer').boundingBox(),
  ]);
  if (!headerBox || !contentBox || !footerBox) {
    throw new Error('Message metadata geometry did not render');
  }
  expect(contentBox.y - (headerBox.y + headerBox.height)).toBeCloseTo(4, 0);
  expect(footerBox.y - (contentBox.y + contentBox.height)).toBeCloseTo(4, 0);
});

test('reports failed delivery in footer metadata without changing the bubble', async ({ page }) => {
  await page.goto('/message-row.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');

  const message = page.locator('#failed-message');
  const bubble = message.locator('ds-message-bubble');
  const failure = message.locator('.message__footer ds-text').filter({
    hasText: 'Failed to send',
  });
  const separator = message.locator('.message__footer ds-text').filter({ hasText: '·' });

  await expect(bubble).toHaveClass(/message-bubble--user/);
  await expect(bubble).not.toHaveClass(/message-bubble--error/);
  await expect(failure).toHaveJSProperty('color', 'negative');
  await expect(separator).toHaveJSProperty('color', 'tertiary');
  await expect(separator).toHaveAttribute('aria-hidden', 'true');

  const [contentBox, failureBox] = await Promise.all([
    message.locator('.message__content').boundingBox(),
    failure.boundingBox(),
  ]);
  if (!contentBox || !failureBox) throw new Error('Failed delivery metadata did not render');
  expect(failureBox.y - (contentBox.y + contentBox.height)).toBeCloseTo(4, 0);
});
