import { expect, test, type Locator, type Page } from '@playwright/test';
import { resolve } from 'node:path';

test.beforeEach(async ({ page }) => {
  await page.goto('/scroll-region-focus.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

async function expectKeyboardScroll(page: Page, viewport: Locator, before: Locator) {
  await expect
    .poll(() => viewport.evaluate(element => element.scrollWidth - element.clientWidth))
    .toBeGreaterThan(1);
  await expect(viewport).toHaveAttribute('tabindex', '0');
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(viewport).toBeFocused();
  await expect(viewport).toHaveCSS('outline-style', 'solid');
  await viewport.evaluate(element => {
    element.scrollLeft = 0;
  });
  // WebKit advances native keyboard scrolling while the key is held.
  await page.keyboard.down('ArrowRight');
  try {
    await expect.poll(() => viewport.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  } finally {
    await page.keyboard.up('ArrowRight');
  }
}

test(
  'code overflow is named, keyboard reachable, and follows content and resize',
  { tag: '@cross-browser' },
  async ({ page, browserName }) => {
    const tab = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
    const code = page.locator('#code');
    const viewport = code.locator('pre');
    const copy = code.getByRole('button', { name: 'Copy code' });
    await expect(viewport).toHaveAccessibleName('records.ts');
    await expectKeyboardScroll(page, viewport, copy);
    await page.keyboard.press(tab);
    await expect(page.locator('#after-code')).toBeFocused();

    await page.locator('#code-frame').evaluate(element => {
      element.style.width = '1100px';
    });
    await expect(viewport).not.toHaveAttribute('tabindex', '0');
    await copy.focus();
    await page.keyboard.press(tab);
    await expect(page.locator('#after-code')).toBeFocused();
    await page.locator('#code-frame').evaluate(element => {
      element.style.width = '320px';
    });
    await expectKeyboardScroll(page, viewport, copy);
    await code.evaluate((element: HTMLDsCodeBlockElement) => {
      element.code = 'short';
    });
    await expect(viewport).not.toHaveAttribute('tabindex', '0');
    await code.evaluate((element: HTMLDsCodeBlockElement) => {
      element.code = 'long code '.repeat(30);
    });
    await expectKeyboardScroll(page, viewport, copy);
  }
);

test(
  'code updates keyboard access when a late font changes only the text width',
  { tag: '@cross-browser' },
  async ({ page }) => {
    const code = page.locator('#code');
    const viewport = code.locator('pre');
    await code.evaluate((element: HTMLDsCodeBlockElement) => {
      element.code = 'i'.repeat(70);
      element.style.setProperty('--typography-font-family-code', 'LateCode, sans-serif');
    });
    await expect(viewport).not.toHaveAttribute('tabindex', '0');
    const box = await viewport.boundingBox();
    await page.route('**/late-code-font.woff2', route =>
      route.fulfill({
        path: resolve('node_modules/@fontsource/fira-code/files/fira-code-latin-400-normal.woff2'),
        contentType: 'font/woff2',
      })
    );
    await page.evaluate(async () => {
      const face = new FontFace('LateCode', 'url(/late-code-font.woff2)');
      document.fonts.add(face);
      await document.fonts.load('14px LateCode');
      await document.fonts.ready;
    });
    expect(await viewport.boundingBox()).toEqual(box);
    await expectKeyboardScroll(page, viewport, code.getByRole('button', { name: 'Copy code' }));
  }
);

test(
  'code restores overflow observation after repeated reconnects and detached updates',
  { tag: '@cross-browser' },
  async ({ page }) => {
    const code = page.locator('#code');
    const viewport = code.locator('pre');
    for (const content of ['short', 'long code '.repeat(30), 'short']) {
      await code.evaluate((element: HTMLDsCodeBlockElement, value) => {
        const owner = element.parentElement!;
        element.remove();
        element.code = value;
        owner.append(element);
      }, content);
      await expect(viewport).toHaveText(content);
      if (content === 'short') await expect(viewport).not.toHaveAttribute('tabindex', '0');
      else
        await expectKeyboardScroll(page, viewport, code.getByRole('button', { name: 'Copy code' }));
    }
    // Resizing after reconnection must still be observed without another prop update.
    await page.locator('#code-frame').evaluate(element => {
      element.style.width = '32px';
    });
    await expectKeyboardScroll(page, viewport, code.getByRole('button', { name: 'Copy code' }));
    await page.locator('#code-frame').evaluate(element => {
      element.style.width = '399px';
    });
    await expect(viewport).not.toHaveAttribute('tabindex', '0');
  }
);

for (const state of ['loaded', 'loading', 'empty', 'error'] as const) {
  test(
    `table ${state} overflow remains keyboard reachable through resize`,
    { tag: '@cross-browser' },
    async ({ page }) => {
      const table = page.locator('#table');
      const viewport = table.locator('.ds-table__viewport');
      await table.evaluate((element: HTMLDsTableElement, state) => {
        element.loading = state === 'loading';
        element.error = state === 'error';
        if (state === 'empty' || state === 'error') element.rows = [];
      }, state);
      await expect(viewport).toHaveAccessibleName(/Records/);
      await expectKeyboardScroll(page, viewport, page.locator('#before-table'));
      await page.locator('#table-frame').evaluate(element => {
        element.style.width = '1100px';
      });
      await expect(viewport).not.toHaveAttribute('tabindex', '0');
      await page.locator('#table-frame').evaluate(element => {
        element.style.width = '320px';
      });
      await expectKeyboardScroll(page, viewport, page.locator('#before-table'));
    }
  );
}
