import { expect, test } from '@playwright/test';

test.describe('Responsive mobile shell foundation', () => {
  test.use({ viewport: { width: 390, height: 760 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/shell-mobile.html');
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('ds-shell-app')).toHaveAttribute('responsive-mode', 'mobile');
  });

  test('renders the fixed five-item bar without overflow and keeps status dots supplemental', async ({
    page,
  }) => {
    const primary = page.getByRole('navigation', { name: 'Primary' });
    await expect(primary.getByRole('button')).toHaveCount(5);
    await expect(primary.getByRole('button').allTextContents()).resolves.toEqual([
      'Menu',
      'Tracking',
      'Search',
      'Agents',
      'Inbox',
    ]);
    await expect(page.locator('.shell-mobile-bar__dot')).toHaveCount(2);

    const barBox = await page.locator('ds-shell-mobile-bar').boundingBox();
    expect(barBox).not.toBeNull();
    expect(barBox!.x).toBeGreaterThanOrEqual(0);
    expect(barBox!.x + barBox!.width).toBeLessThanOrEqual(390);
  });

  test('keeps the bar available over navigation and browsing contexts does not navigate', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
    await expect(page.locator('.shell-app__content')).toHaveAttribute('inert', '');

    await page.getByRole('tab', { name: 'Settings' }).click();
    await expect(page.locator('html')).not.toHaveAttribute('data-selected-area');
    await expect(page.getByRole('button', { name: 'User Settings' })).toBeVisible();

    await page.getByRole('button', { name: 'User Settings' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-selected-area', 'user-settings');
    await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    await expect(page.getByRole('button', { name: 'Menu' })).toBeFocused();

    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    await expect(page.getByRole('button', { name: 'Menu' })).toBeFocused();

    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    await expect(page.getByRole('button', { name: 'Search' })).toBeFocused();
  });

  test('preserves a slotted tool owner and form value across destination and breakpoint changes', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Search' }).click();
    const input = page.locator('#persistent-value');
    await expect(input).toBeVisible();
    await input.fill('brake inspection');
    await expect(page.locator('.shell-app__content')).toHaveAttribute('inert', '');

    await page.getByRole('button', { name: 'Agents' }).click();
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(input).toHaveValue('brake inspection');

    await page.setViewportSize({ width: 900, height: 760 });
    await expect(page.locator('ds-shell-app')).toHaveAttribute('responsive-mode', 'tablet');
    await expect(page.locator('ds-shell-tools')).toHaveCSS(
      'background-color',
      'rgba(0, 0, 0, 0)'
    );
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            window.__persistentSearchInput === document.getElementById('persistent-value')
        )
      )
      .toBe(true);
    await expect(input).toHaveValue('brake inspection');
  });

  test('stretches Search and Inbox across the stage and omits fullscreen actions', async ({
    page,
  }) => {
    const tools = page.locator('ds-shell-tools');

    await page.getByRole('button', { name: 'Search' }).click();
    await expect(tools).toHaveCSS('width', '390px');
    await expect(page.locator('#search-view')).toHaveCSS('width', '390px');

    await page.getByRole('button', { name: 'Agents' }).click();
    await expect(page.getByRole('button', { name: 'Enter fullscreen' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Inbox' }).click();
    await expect(page.locator('.shell-tools__view--active')).toHaveCSS('width', '390px');
    await expect(page.getByRole('button', { name: 'Enter fullscreen' })).toHaveCount(0);

    await page.setViewportSize({ width: 900, height: 760 });
    await expect(page.locator('ds-shell-app')).toHaveAttribute('responsive-mode', 'tablet');
    await expect(page.getByRole('button', { name: 'Enter fullscreen' })).toBeVisible();
  });

  test('uses a solid primary stage and scrolls the selected route section into view', async ({
    page,
  }) => {
    await expect(page.locator('.shell-app__chrome')).toHaveCSS('display', 'none');
    await expect(page.locator('.shell-app__main')).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)'
    );
    await expect(page.locator('ds-shell-tools')).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)'
    );
    await expect(
      page.getByRole('navigation', { name: 'Section navigation' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Live Map' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });
});

test.describe('Shell tablet and desktop compatibility', () => {
  test.use({ viewport: { width: 900, height: 760 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/shell-mobile.html');
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('ds-shell-app')).toHaveAttribute('responsive-mode', 'tablet');
  });

  test('preserves legacy gradient chrome, navigation, and PanelTools semantics', async ({
    page,
  }) => {
    const shell = page.locator('ds-shell-app');
    const tools = page.locator('ds-shell-tools');
    const innerTools = tools.locator('ds-panel-tools');

    await expect(shell).toHaveClass(/shell-app--gradient/);
    await expect(page.locator('.shell-app__chrome')).toHaveCSS('display', 'block');
    await expect(tools).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(page.getByRole('navigation', { name: 'Dashboard navigation' })).toBeVisible();
    await expect(page.locator('ds-bar-nav')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeHidden();
    await expect(page.getByRole('complementary', { name: 'Tools' })).toHaveCount(1);
    await expect(tools).not.toHaveAttribute('role');
    await expect(tools).not.toHaveAttribute('aria-label');
    await expect(innerTools).toBeVisible();

    const gradientImage = await page.locator('.shell-app__chrome').evaluate(element =>
      getComputedStyle(element, '::before').backgroundImage
    );
    expect(gradientImage).not.toBe('none');

    const closedGeometry = await tools.evaluate(element => {
      const inner = element.querySelector('ds-panel-tools');
      const outerRect = element.getBoundingClientRect();
      const innerRect = inner?.getBoundingClientRect();
      return {
        outer: [outerRect.x, outerRect.y, outerRect.width, outerRect.height],
        inner: innerRect
          ? [innerRect.x, innerRect.y, innerRect.width, innerRect.height]
          : null,
      };
    });
    expect(closedGeometry.inner).toEqual(closedGeometry.outer);

    await page.getByRole('button', { name: 'Search' }).click();
    await expect(tools).toHaveAttribute('open');
    await expect(innerTools).toHaveAttribute('open');
    await expect(page.locator('#persistent-value')).toBeVisible();
    await expect(page.locator('.shell-app__content')).not.toHaveAttribute('inert', '');

    const openGeometry = await tools.evaluate(element => {
      const inner = element.querySelector('ds-panel-tools');
      const outerRect = element.getBoundingClientRect();
      const innerRect = inner?.getBoundingClientRect();
      return {
        outer: [outerRect.x, outerRect.y, outerRect.width, outerRect.height],
        inner: innerRect
          ? [innerRect.x, innerRect.y, innerRect.width, innerRect.height]
          : null,
      };
    });
    expect(openGeometry.inner).toEqual(openGeometry.outer);

    await page.setViewportSize({ width: 1200, height: 760 });
    await expect(shell).toHaveAttribute('responsive-mode', 'desktop');
    await expect(shell).toHaveClass(/shell-app--gradient/);
    await expect(tools).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(page.getByRole('complementary', { name: 'Tools' })).toHaveCount(1);
    await expect(innerTools).toHaveAttribute('open');
    await expect(page.locator('#persistent-value')).toBeVisible();
  });
});

declare global {
  interface Window {
    __persistentSearchInput?: HTMLInputElement;
  }
}
