import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { chromiumOnly } from './browser-tier';

const tokenLengths = ['dimensions', 'typography'].flatMap(category =>
  [
    ...readFileSync(`node_modules/@ds-mo/tokens/dist/${category}.css`, 'utf8').matchAll(
      /(--[\w-]+):\s*(-?[\d.]+)px\s*;/g
    ),
  ]
    .filter(([, token]) => !['--dimension-base', '--dimension-radius-half'].includes(token))
    .map(([, token, value]) => ({ token, value: Number(value) }))
);

test.beforeEach(async ({ page }) => {
  await page.goto('/responsive-sizing.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('scales every independent length once and restores desktop at the breakpoint @cross-browser', async ({
  page,
}) => {
  for (const [width, scale] of [
    [1024, 1],
    [767, 1.25],
    [390, 1.25],
    [768, 1],
  ]) {
    await page.setViewportSize({ width, height: 900 });
    const resolved = await page.evaluate(tokens => {
      const resolve = (window as unknown as { resolveResponsiveLength: (token: string) => number })
        .resolveResponsiveLength;
      return tokens.map(({ token }) => ({ token, pixels: resolve(token) }));
    }, tokenLengths);
    for (let i = 0; i < tokenLengths.length; i++) {
      expect(resolved[i].pixels, `${width}px: ${resolved[i].token}`).toBeCloseTo(
        tokenLengths[i].value * scale,
        1
      );
    }
    for (const [size, height] of [
      ['xs', 16],
      ['sm', 24],
      ['md', 32],
      ['lg', 40],
    ] as const) {
      await expect(page.locator(`#button-${size} button`)).toHaveCSS(
        'height',
        `${height * scale}px`
      );
    }
    await expect(page.locator('#chart')).toHaveCSS('height', `${320 * scale}px`);
    await expect(page.locator('#input input')).toHaveCSS('font-size', `${14 * scale}px`);
  }
});

test('keeps native editing, form values and composer growth through responsive transitions @cross-browser', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const selector of [
    '#input input',
    '#notes textarea',
    '#date input',
    '#time input',
    '#composer textarea',
  ]) {
    await expect(page.locator(selector).first()).toHaveCSS('font-size', '17.5px');
  }
  await expect(page.locator('#small-input input')).toHaveCSS('font-size', '15px');
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    'content',
    'width=device-width, initial-scale=1'
  );
  const input = page.locator('#input input');
  await input.fill('Find driver');
  await expect(input).toBeFocused();
  await page.locator('#notes textarea').fill('Review notes');
  const composer = page.locator('#composer textarea');
  const before = await composer.evaluate(el => el.getBoundingClientRect().height);
  await composer.fill('Line one\nLine two\nLine three\nLine four\nLine five');
  await expect
    .poll(() => composer.evaluate(el => el.getBoundingClientRect().height))
    .toBeGreaterThan(before);
  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(input).toHaveValue('Find driver');
  await expect(input).toHaveCSS('font-size', '14px');
  expect(
    await page
      .locator('#form')
      .evaluate(el => Object.fromEntries(new FormData(el as HTMLFormElement)))
  ).toMatchObject({ query: 'Find driver', notes: 'Review notes' });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(composer).toHaveValue('Line one\nLine two\nLine three\nLine four\nLine five');
  await expect(composer).toHaveCSS('font-size', '17.5px');
});

test('keeps enlarged menus and dialogs within the viewport @cross-browser', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.getByRole('button', { name: 'Actions', exact: true }).click();
  const item = page.getByRole('menuitem', { name: 'Edit review' });
  await expect(item).toBeVisible();
  await expect(item).toHaveCSS('height', '40px');
  const bounds = await item.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  await page.keyboard.press('Escape');
  await expect(item).not.toBeVisible();
  await page.locator('#modal').evaluate(el => {
    (el as HTMLDsModalElement).open = true;
  });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});

for (const theme of ['light', 'dark']) {
  test(
    `responsive composition is accessible in ${theme}`,
    chromiumOnly(
      'accessibility',
      'Integrated responsive form, table, chart and open menu geometry are audited together; interaction contracts run across browsers.'
    ),
    async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page
        .locator('html')
        .evaluate((el, theme) => el.setAttribute('data-theme', theme), theme);
      await page.getByRole('button', { name: 'Actions', exact: true }).click();
      await expect(page.getByRole('menuitem', { name: 'Edit review' })).toBeVisible();
      const result = await new AxeBuilder({ page }).analyze();
      expect(
        result.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
      ).toEqual([]);
    }
  );
}
