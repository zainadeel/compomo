import { expect, test } from '@playwright/test';

const DESCRIPTION =
  "Motive's Event Validation Engine uses cloud-based AI models and the Safety Team (human review) to validate safety events and remove false positives.";

test.beforeEach(async ({ page }) => {
  await page.goto('/inline-banner-settings.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('renders authored body-small copy with intrinsic height and a tertiary bottom boundary', async ({
  page,
}) => {
  const banner = page.locator('#info-banner');
  const description = banner.locator('ds-text');

  await expect(description).toHaveText(DESCRIPTION);
  await expect(description).toHaveJSProperty('variant', 'text-body-small');
  await expect(description).toHaveClass(/ds-text--body-small/);
  await expect(banner.getByRole('button')).toHaveCount(0);

  const geometry = await banner.evaluate(element => {
    const style = getComputedStyle(element);
    const content = element.querySelector('.inline-banner-settings__content')!;
    const contentStyle = getComputedStyle(content);
    const text = element.querySelector('ds-text')!;
    const textStyle = getComputedStyle(text);
    return {
      height: element.getBoundingClientRect().height,
      textLineHeight: Number.parseFloat(textStyle.lineHeight),
      fontSize: Number.parseFloat(textStyle.fontSize),
      expectedFontSize: Number.parseFloat(style.getPropertyValue('--typography-fontsize-sm')),
      contentHeight: content.getBoundingClientRect().height,
      paddingBlockStart: Number.parseFloat(style.paddingBlockStart),
      paddingBlockEnd: Number.parseFloat(style.paddingBlockEnd),
      paddingInlineStart: Number.parseFloat(style.paddingInlineStart),
      paddingInlineEnd: Number.parseFloat(style.paddingInlineEnd),
      contentPaddingBlockStart: Number.parseFloat(contentStyle.paddingBlockStart),
      contentPaddingBlockEnd: Number.parseFloat(contentStyle.paddingBlockEnd),
      contentPaddingInlineStart: Number.parseFloat(contentStyle.paddingInlineStart),
      contentPaddingInlineEnd: Number.parseFloat(contentStyle.paddingInlineEnd),
      textPaddingInlineStart: Number.parseFloat(textStyle.paddingInlineStart),
      textPaddingInlineEnd: Number.parseFloat(textStyle.paddingInlineEnd),
      borderBlockEndWidth: Number.parseFloat(style.borderBlockEndWidth),
      inlineHeight: element.getAttribute('style'),
    };
  });

  expect(geometry.fontSize).toBe(geometry.expectedFontSize);

  expect(geometry.paddingBlockStart).toBe(8);
  expect(geometry.paddingBlockEnd).toBe(8);
  expect(geometry.paddingInlineStart).toBe(8);
  expect(geometry.paddingInlineEnd).toBe(8);
  expect(geometry.contentPaddingBlockStart).toBe(4);
  expect(geometry.contentPaddingBlockEnd).toBe(4);
  expect(geometry.contentPaddingInlineStart).toBe(6);
  expect(geometry.contentPaddingInlineEnd).toBe(6);
  expect(geometry.textPaddingInlineStart).toBe(2);
  expect(geometry.textPaddingInlineEnd).toBe(2);
  expect(
    geometry.paddingInlineStart +
      geometry.contentPaddingInlineStart +
      geometry.textPaddingInlineStart
  ).toBe(16);
  expect(geometry.borderBlockEndWidth).toBeGreaterThan(0);
  expect(geometry.height).toBeCloseTo(
    geometry.textLineHeight +
      geometry.paddingBlockStart +
      geometry.paddingBlockEnd +
      geometry.contentPaddingBlockStart +
      geometry.contentPaddingBlockEnd +
      geometry.borderBlockEndWidth
  );
  expect(geometry.inlineHeight).toBeNull();
});

test('keeps a single body-small line 24px tall inside the inner container', async ({ page }) => {
  const banner = page.locator('#single-line-banner');
  const description = banner.locator('ds-text');

  await expect(description).toHaveJSProperty('variant', 'text-body-small');

  const geometry = await banner.evaluate(element => {
    const content = element.querySelector('.inline-banner-settings__content')!;
    const contentStyle = getComputedStyle(content);
    const text = element.querySelector('ds-text')!;
    const textStyle = getComputedStyle(text);
    return {
      contentHeight: content.getBoundingClientRect().height,
      textLineHeight: Number.parseFloat(textStyle.lineHeight),
      contentPaddingBlockStart: Number.parseFloat(contentStyle.paddingBlockStart),
      contentPaddingBlockEnd: Number.parseFloat(contentStyle.paddingBlockEnd),
    };
  });

  expect(geometry.textLineHeight).toBe(16);
  expect(geometry.contentPaddingBlockStart).toBe(4);
  expect(geometry.contentPaddingBlockEnd).toBe(4);
  expect(geometry.contentHeight).toBe(24);
  expect(geometry.contentHeight).toBe(
    geometry.contentPaddingBlockStart + geometry.textLineHeight + geometry.contentPaddingBlockEnd
  );
});
