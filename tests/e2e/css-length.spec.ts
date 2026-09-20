import { expect, test, type Page } from '@playwright/test';

function resolve(page: Page, value: string, id?: string) {
  return page.evaluate(
    ({ value, id }) => {
      const resolver = (
        window as unknown as {
          resolveLength: (value: string, id?: string) => number;
        }
      ).resolveLength;
      return resolver(value, id);
    },
    { value, id }
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto('/css-length.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('theme and scoped custom lengths stay live without clearing a cache @cross-browser', async ({
  page,
}) => {
  expect(await resolve(page, '--test-length')).toBe(12);
  expect(await resolve(page, 'calc(var(--test-length) + 4px)')).toBe(16);
  expect(await resolve(page, '--test-length', 'scope')).toBe(24);
  expect(await resolve(page, 'var(--test-length)', 'other')).toBe(40);
  expect(await resolve(page, 'calc(var(--test-nested) + 1em)', 'scope')).toBe(46);
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--test-length', '32px');
    document.getElementById('scope')!.style.setProperty('--test-length', '48px');
  });
  expect(await resolve(page, '--test-length')).toBe(32);
  expect(await resolve(page, 'calc(var(--test-length) + 4px)')).toBe(36);
  expect(await resolve(page, '--test-length', 'scope')).toBe(48);
  expect(await resolve(page, 'calc(var(--test-nested) + 1em)', 'scope')).toBe(70);
  expect(await resolve(page, 'var(--test-length)', 'other')).toBe(40);
});

test('relative lengths follow viewport and font changes @cross-browser', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 600 });
  expect(await resolve(page, '10vw')).toBe(80);
  expect(await resolve(page, '10vh')).toBe(60);
  expect(await resolve(page, '10%')).toBe(80);
  expect(await resolve(page, '2rem')).toBe(32);
  expect(await resolve(page, '2em', 'scope')).toBe(40);
  expect(await resolve(page, '1lh', 'scope')).toBe(30);
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '24px';
    document.getElementById('scope')!.style.fontSize = '28px';
  });
  expect(await resolve(page, '10vw')).toBe(100);
  expect(await resolve(page, '10vh')).toBe(80);
  expect(await resolve(page, '10%')).toBe(100);
  expect(await resolve(page, '2rem')).toBe(48);
  expect(await resolve(page, '2em', 'scope')).toBe(56);
  expect(await resolve(page, 'calc(1rem - 30px)')).toBe(-6);
});

test('native var fallbacks respect scope and late token availability @cross-browser', async ({
  page,
}) => {
  await page.locator('#scope').evaluate(element => {
    element.style.setProperty('--test-length', 'initial');
  });
  expect(await resolve(page, 'var(--test-length, 7px)', 'scope')).toBe(7);
  expect(await resolve(page, 'var(--missing, var(--test-length))')).toBe(12);
  expect(await resolve(page, 'var(--late)')).toBe(9);
  await page.evaluate(() => document.documentElement.style.setProperty('--late', '18px'));
  expect(await resolve(page, 'var(--late)')).toBe(18);
  // Context variables must not contaminate the shared probe on its next use.
  expect(await resolve(page, 'calc(var(--test-length) + 3px)', 'other')).toBe(43);
  expect(await resolve(page, 'calc(var(--test-length) + 3px)')).toBe(15);
  expect(await resolve(page, 'not-a-length')).toBe(9);
});
