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

  test('uses a solid primary stage and scrolls the selected route section into view', async ({
    page,
  }) => {
    await expect(page.locator('.shell-app__chrome')).toHaveCSS('display', 'none');
    await expect(page.locator('.shell-app__main')).toHaveCSS(
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

declare global {
  interface Window {
    __persistentSearchInput?: HTMLInputElement;
  }
}
