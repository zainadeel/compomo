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

test('grows the textarea with content through its six-line limit', async ({ page }) => {
  const composer = page.locator('#composer');
  const textarea = composer.locator('textarea');

  await expect(textarea).toHaveCSS('field-sizing', 'content');
  const twoLineHeight = await textarea.evaluate(element => element.getBoundingClientRect().height);

  await composer.evaluate((element: HTMLDsMessageComposerElement) => {
    element.value = 'Line 1\nLine 2\nLine 3\nLine 4';
  });
  await expect(textarea).toHaveValue('Line 1\nLine 2\nLine 3\nLine 4');
  const fourLineHeight = await textarea.evaluate(element => element.getBoundingClientRect().height);

  await composer.evaluate((element: HTMLDsMessageComposerElement) => {
    element.value = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7';
  });
  await expect(textarea).toHaveValue('Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7');
  const overflow = await textarea.evaluate(element => ({
    clientHeight: element.clientHeight,
    height: element.getBoundingClientRect().height,
    maxHeight: Number.parseFloat(getComputedStyle(element).maxHeight),
    scrollHeight: element.scrollHeight,
  }));

  expect(fourLineHeight).toBeGreaterThan(twoLineHeight);
  expect(overflow.height).toBeGreaterThan(fourLineHeight);
  expect(overflow.height).toBeCloseTo(overflow.maxHeight, 1);
  expect(overflow.scrollHeight).toBeGreaterThan(overflow.clientHeight);
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

test.describe('direct-touch composer', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 760 } });

  test('preserves body-medium text metrics', async ({ page }) => {
    await page.goto('/message-composer.html');
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');

    const textarea = page.locator('#composer textarea');
    await expect(textarea).toHaveCSS('font-size', '14px');
    await expect(textarea).toHaveCSS('line-height', '20px');
  });
});
