import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/setting-row-toggle.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

const titleOf = (id: string) => `${id} .setting-row-toggle__copy ds-text`;

test('keeps emphasis and described non-emphasis titles on primary foreground', async ({ page }) => {
  await expect(page.locator(titleOf('#emphasis')).first()).toHaveJSProperty('color', 'primary');
  await expect(page.locator(titleOf('#emphasis')).first()).toHaveJSProperty('emphasis', true);
  await expect(page.locator(titleOf('#non-emphasis')).first()).toHaveJSProperty('color', 'primary');
  await expect(page.locator(titleOf('#non-emphasis')).first()).toHaveJSProperty('emphasis', false);
  await expect(page.locator(titleOf('#emphasis')).nth(1)).toHaveJSProperty(
    'variant',
    'text-body-small'
  );
  await expect(page.locator(titleOf('#non-emphasis')).nth(1)).toHaveJSProperty(
    'variant',
    'text-body-small'
  );
  await expect(page.locator(titleOf('#emphasis')).nth(1)).toHaveCSS('font-size', '12px');
  await expect(page.locator(titleOf('#non-emphasis')).nth(1)).toHaveCSS('font-size', '12px');
  await expect(page.locator(titleOf('#emphasis')).nth(1)).toHaveCSS('line-height', '16px');
  await expect(page.locator(titleOf('#non-emphasis')).nth(1)).toHaveCSS('line-height', '16px');
});

test('uses secondary foreground on a non-emphasis title with no subtext', async ({ page }) => {
  const title = page.locator(titleOf('#non-emphasis-no-subtext')).first();
  await expect(title).toHaveJSProperty('color', 'secondary');
  await expect(title).toHaveJSProperty('emphasis', false);
  await expect(page.locator('#non-emphasis-no-subtext ds-text')).toHaveCount(1);

  const colors = await page.evaluate(() => {
    const label = document.querySelector(
      '#non-emphasis-no-subtext .setting-row-toggle__copy ds-text'
    );
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-foreground-secondary)';
    document.body.append(probe);
    const expected = getComputedStyle(probe).color;
    probe.remove();
    return {
      title: label ? getComputedStyle(label).color : '',
      expected,
    };
  });
  expect(colors.title).toBe(colors.expected);
});
