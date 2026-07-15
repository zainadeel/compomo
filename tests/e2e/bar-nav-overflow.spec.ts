import { expect, test } from '@playwright/test';

test.describe('BarNav responsive overflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.__setShellWidth === 'function');
    await expect(page.locator('ds-bar-nav .bar-nav__tabs-probe')).toHaveCount(1);
    await expect(
      page.locator('.bar-nav__tabs-visible, .bar-nav__overflow-trigger').first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test('narrow shell width on first paint commits overflow (no stuck expanded row)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 480, height: 720 });
    await page.goto('/?shell=320');
    await page.waitForFunction(() => typeof window.__setShellWidth === 'function');
    await expect(page.locator('ds-bar-nav .bar-nav__tabs-probe')).toHaveCount(1);
    await expect(page.locator('.bar-nav__overflow-trigger')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.bar-nav__tabs-pending')).toHaveCount(0);
  });

  test('section tab swap commits overflow before showing expanded row', async ({ page }) => {
    const fewTabs = [
      { id: 'live-map', label: 'Live Map' },
      { id: 'trips', label: 'Trips' },
    ];
    const manyTabs = [
      { id: 'live-map', label: 'Live Map' },
      { id: 'location-history', label: 'Location History' },
      { id: 'trips', label: 'Trips' },
      { type: 'divider' },
      { id: 'overview', label: 'Overview' },
      { id: 'events', label: 'Events', dot: true },
      { id: 'requests', label: 'Requests' },
    ];

    await page.evaluate(() => window.__setShellWidth(720));
    await page.evaluate(
      ({ fewTabs, basePath }) => {
        const nav = document.getElementById('nav') as HTMLElement & {
          basePath: string;
          currentUrl: string;
          tabs: typeof fewTabs;
          value: string;
        };
        nav.basePath = basePath;
        nav.currentUrl = `${basePath}/live-map`;
        nav.tabs = fewTabs;
        nav.value = 'live-map';
      },
      { fewTabs, basePath: '/e2e/fleet-view' },
    );
    await expect(page.locator('.bar-nav__tabs-visible')).toBeVisible({ timeout: 5000 });

    await page.evaluate(() => window.__setShellWidth(360));
    await page.evaluate(
      ({ manyTabs, basePath }) => {
        const nav = document.getElementById('nav') as HTMLElement & {
          basePath: string;
          currentUrl: string;
          tabs: typeof manyTabs;
        };
        nav.basePath = `${basePath}-safety`;
        nav.currentUrl = `${basePath}-safety/events`;
        nav.tabs = manyTabs;
      },
      { manyTabs, basePath: '/e2e/fleet-view' },
    );

    await expect(page.locator('.bar-nav__overflow-trigger')).toBeVisible({ timeout: 5000 });
  });

  test('wide viewport shows full tab row; narrow shows overflow; widen restores', async ({ page }) => {
    await page.evaluate(() => window.__setShellWidth(900));
    await expect(page.locator('.bar-nav__tabs-visible')).toBeVisible();
    await expect(page.locator('.bar-nav__overflow-trigger')).toHaveCount(0);

    await page.evaluate(() => window.__setShellWidth(320));
    await expect(page.locator('.bar-nav__overflow-trigger')).toBeVisible({ timeout: 5000 });

    await page.evaluate(() => window.__setShellWidth(900));
    await expect(page.locator('.bar-nav__tabs-visible')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.bar-nav__overflow-trigger')).toHaveCount(0);
  });

  test('internal tab row uses manual horizontal roving focus', async ({ page }) => {
    await page.evaluate(() => window.__setShellWidth(900));
    await page.evaluate(() => {
      const nav = document.getElementById('nav') as HTMLElement & {
        basePath: string;
        currentUrl: string;
        tabs: Array<
          | { id: string; label: string; isInactive?: boolean }
          | { type: 'divider' }
        >;
        value: string;
      };
      nav.basePath = '';
      nav.currentUrl = '';
      nav.tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'inactive', label: 'Inactive', isInactive: true },
        { type: 'divider' },
        { id: 'settings', label: 'Settings' },
      ];
      nav.value = 'overview';
      nav.addEventListener('dsTabChange', event => {
        (window as typeof window & { __barNavChange?: string }).__barNavChange =
          (event as CustomEvent<string>).detail;
      });
    });

    const visible = page.locator('.bar-nav__tabs-visible');
    await expect(visible).toBeVisible({ timeout: 5000 });
    await expect(visible.locator('.bar-nav__tab-divider')).toHaveCount(1);
    const overview = visible.getByRole('tab', { name: 'Overview' });
    const settings = visible.getByRole('tab', { name: 'Settings' });

    await overview.focus();
    await overview.press('ArrowRight');
    await expect(settings).toBeFocused();
    await expect(overview).toHaveAttribute('aria-selected', 'true');
    await expect(settings).toHaveAttribute('aria-selected', 'false');

    await settings.press('Enter');
    await expect.poll(() => page.evaluate(() => (
      window as typeof window & { __barNavChange?: string }
    ).__barNavChange)).toBe('settings');
    await expect.poll(() => page.locator('#nav').evaluate(element => (
      element as HTMLElement & { value: string }
    ).value)).toBe('settings');
    await expect(settings).toHaveAttribute('aria-selected', 'true');
  });

  test('overflow trigger shows inset focus ring on keyboard focus', async ({ page }) => {
    await page.evaluate(() => window.__setShellWidth(320));
    await expect(page.locator('.bar-nav__overflow-trigger')).toBeVisible({ timeout: 5000 });

    // Bar nav uses roving focus: Tab enters the tab row; ArrowRight reaches overflow.
    await page.keyboard.press('Tab');
    for (let i = 0; i < 20; i++) {
      const triggerFocused = await page.evaluate(() => {
        const host = document.querySelector('.bar-nav__overflow-trigger');
        const button = host?.querySelector('.button-unfilled');
        return !!button && document.activeElement === button;
      });
      if (triggerFocused) break;
      await page.keyboard.press('ArrowRight');
    }

    const triggerFocused = await page.evaluate(() => {
      const host = document.querySelector('.bar-nav__overflow-trigger');
      const button = host?.querySelector('.button-unfilled');
      return !!button && document.activeElement === button;
    });
    expect(triggerFocused).toBe(true);

    const focusRing = await page.evaluate(() => {
      const host = document.querySelector('.bar-nav__overflow-trigger') as HTMLElement | null;
      const button = host?.querySelector('.button-unfilled') as HTMLElement | null;
      if (!button) return null;

      const buttonStyle = getComputedStyle(button);
      const afterStyle = getComputedStyle(button, '::after');

      return {
        buttonOutlineStyle: buttonStyle.outlineStyle,
        afterOutlineStyle: afterStyle.outlineStyle,
        afterOutlineWidth: afterStyle.outlineWidth,
        afterOutlineOffset: afterStyle.outlineOffset,
      };
    });

    expect(focusRing).not.toBeNull();
    expect(focusRing!.buttonOutlineStyle).toBe('none');
    expect(focusRing!.afterOutlineStyle).toBe('solid');
    expect(focusRing!.afterOutlineWidth).toBe('2px');
    expect(focusRing!.afterOutlineOffset).toBe('-2px');
  });

  test('overflow menu opens from the ellipses trigger', async ({ page }) => {
    await page.evaluate(() => window.__setShellWidth(320));
    await expect(page.locator('.bar-nav__overflow-trigger')).toBeVisible({ timeout: 5000 });

    await page.locator('.bar-nav__overflow-trigger').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.menu-popup')).toBeVisible();

    const dottedItem = page.locator('.menu-item').filter({ hasText: 'Events' });
    const dottedBadge = dottedItem.locator('ds-badge');
    await expect(dottedBadge).toBeVisible();
    await expect.poll(() => dottedBadge.evaluate(element => (
      element as HTMLElement & { variant?: string }
    ).variant)).toBe('dot');
    const dotGeometry = await dottedItem.evaluate(row => {
      const box = row.querySelector('.menu-item__dot-box') as HTMLElement;
      const dot = row.querySelector('.menu-item__dot') as HTMLElement;
      const rowRect = row.getBoundingClientRect();
      const boxRect = box.getBoundingClientRect();
      const dotRect = dot.getBoundingClientRect();
      return {
        boxWidth: boxRect.width,
        boxHeight: boxRect.height,
        rightInset: rowRect.right - dotRect.right,
        centerY: dotRect.y + dotRect.height / 2 - rowRect.y,
      };
    });
    expect(dotGeometry).toEqual({
      boxWidth: 20,
      boxHeight: 20,
      rightInset: 13,
      centerY: 16,
    });

    const iconName = await page.evaluate(() => {
      const icon = document.querySelector('.bar-nav__overflow-trigger ds-icon') as
        | (HTMLElement & { name?: string })
        | null;
      return icon?.name ?? null;
    });
    expect(iconName).toBe('Ellipses');
  });

  test('pointer-opened overflow menu does not show focus ring or hover paint', async ({
    page,
  }) => {
    await page.evaluate(() => {
      const nav = document.getElementById('nav') as HTMLElement & {
        currentUrl: string;
        value: string;
      };
      nav.currentUrl = '/e2e/safety/live-map';
      nav.value = 'live-map';
    });
    await page.evaluate(() => window.__setShellWidth(320));
    await expect(page.locator('.bar-nav__overflow-trigger')).toBeVisible({ timeout: 5000 });

    await page.locator('.bar-nav__overflow-trigger').click();
    await expect(page.locator('.menu-popup')).toBeVisible();

    const layout = await page.evaluate(() => {
      const header = document.querySelector('.bar-nav') as HTMLElement;
      const trigger = document.querySelector('.bar-nav__overflow-trigger') as HTMLElement;
      const popup = document.querySelector('.menu-popup') as HTMLElement;
      const focused = document.querySelector('.menu-item--focused') as HTMLElement;
      const headerRect = header.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();
      const popupRect = popup.getBoundingClientRect();
      const focusedAfter = getComputedStyle(focused, '::after');
      const focusedStyle = getComputedStyle(focused);

      return {
        popupGapFromBar: Math.round(popupRect.top - headerRect.bottom),
        popupRightOffset: Math.round(popupRect.right - triggerRect.right),
        focusedFill: focusedAfter.backgroundColor,
        focusedOutlineStyle: focusedStyle.outlineStyle,
        focusedAfterOutlineStyle: focusedAfter.outlineStyle,
      };
    });

    expect(layout.popupGapFromBar).toBe(4);
    expect(layout.popupRightOffset).toBe(4);
    expect(layout.focusedFill).toBe('rgba(0, 0, 0, 0)');
    expect(layout.focusedOutlineStyle).toBe('none');
    expect(layout.focusedAfterOutlineStyle).toBe('none');
  });

  test('keyboard-opened overflow menu shows focus ring without hover paint', async ({
    page,
  }) => {
    await page.evaluate(() => {
      const nav = document.getElementById('nav') as HTMLElement & {
        currentUrl: string;
        value: string;
      };
      nav.currentUrl = '/e2e/safety/live-map';
      nav.value = 'live-map';
    });
    await page.evaluate(() => window.__setShellWidth(320));
    await expect(page.locator('.bar-nav__overflow-trigger')).toBeVisible({ timeout: 5000 });

    await page.locator('.bar-nav__overflow-trigger').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.menu-popup')).toBeVisible();

    const layout = await page.evaluate(() => {
      const focused = document.querySelector('.menu-item--focused') as HTMLElement;
      const focusedAfter = getComputedStyle(focused, '::after');
      const focusedStyle = getComputedStyle(focused);

      return {
        focusedFill: focusedAfter.backgroundColor,
        focusedOutlineStyle: focusedStyle.outlineStyle,
        focusedAfterOutlineStyle: focusedAfter.outlineStyle,
        focusedAfterOutlineWidth: focusedAfter.outlineWidth,
        focusedAfterOutlineOffset: focusedAfter.outlineOffset,
      };
    });

    expect(layout.focusedFill).toBe('rgba(0, 0, 0, 0)');
    expect(layout.focusedOutlineStyle).toBe('none');
    expect(layout.focusedAfterOutlineStyle).toBe('solid');
    expect(layout.focusedAfterOutlineWidth).toBe('2px');
    expect(layout.focusedAfterOutlineOffset).toBe('-2px');
  });

  test('overflow trigger is compact and pinned to the right edge', async ({ page }) => {
    await page.evaluate(() => window.__setShellWidth(320));
    await expect(page.locator('.bar-nav__overflow-trigger')).toBeVisible({ timeout: 5000 });

    const layout = await page.evaluate(() => {
      const header = document.querySelector('.bar-nav') as HTMLElement;
      const trigger = document.querySelector('.bar-nav__overflow-trigger') as HTMLElement;
      const headerRect = header.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();
      const paddingRight = parseFloat(getComputedStyle(header).paddingRight) || 0;

      return {
        triggerWidth: triggerRect.width,
        rightGap: Math.round(headerRect.right - triggerRect.right - paddingRight),
      };
    });

    expect(layout.triggerWidth).toBeLessThanOrEqual(40);
    expect(Math.abs(layout.rightGap)).toBeLessThanOrEqual(1);
  });

  test('escape closes menu and returns focus to trigger', async ({ page }) => {
    await page.evaluate(() => window.__setShellWidth(320));
    await expect(page.locator('.bar-nav__overflow-trigger')).toBeVisible({ timeout: 5000 });

    const trigger = page.locator('.bar-nav__overflow-trigger');
    await trigger.click();
    await expect(page.locator('.menu-popup')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('.menu-popup')).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
});

declare global {
  interface Window {
    __setShellWidth: (px: number) => void;
  }
}
