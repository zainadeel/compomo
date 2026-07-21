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

test('uses a 10px surface radius and a non-rounded send control', async ({ page }) => {
  const composer = page.locator('#composer');
  const field = composer.locator('.message-composer__field');
  const action = composer.locator('ds-button-filled.message-composer__action');

  await expect(field).toHaveCSS('border-radius', '10px');
  await expect(action).toHaveJSProperty('rounded', false);
  await expect(action.locator('button')).toHaveCSS('border-radius', '2px');
});

test('keeps 8px between dictation and send controls', async ({ page }) => {
  const composer = page.locator('#composer');
  const dictation = composer.locator('#dictation');
  const send = composer.locator('ds-button-filled.message-composer__action');
  const [dictationBox, sendBox] = await Promise.all([dictation.boundingBox(), send.boundingBox()]);

  expect(dictationBox).not.toBeNull();
  expect(sendBox).not.toBeNull();
  expect(Math.round(sendBox!.x - (dictationBox!.x + dictationBox!.width))).toBe(8);
});

test('uses the input-field active border for mouse and keyboard focus', async ({ page }) => {
  const composer = page.locator('#composer');
  const field = composer.locator('.message-composer__field');
  const textarea = composer.locator('textarea');

  await textarea.click();
  await expect(textarea).toHaveCSS('outline-style', 'none');
  const pointerShadow = await field.evaluate(element => getComputedStyle(element).boxShadow);
  expect(pointerShadow).toContain('1.5px');
  expect(pointerShadow).toContain('inset');

  await page.locator('h1').click();
  await page.keyboard.press('Tab');
  await expect(textarea).toBeFocused();
  await expect(textarea).toHaveCSS('outline-style', 'none');
  const keyboardShadow = await field.evaluate(element => getComputedStyle(element).boxShadow);
  expect(keyboardShadow).toBe(pointerShadow);
});
