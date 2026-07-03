import { expect, test } from '@playwright/test';

test.describe('BarNav responsive overflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.__setShellWidth === 'function');
    await expect(page.locator('ds-bar-nav .bar-nav__tabs-probe')).toHaveCount(1);
    await expect(
      page.locator('.bar-nav__tabs-visible, .bar-nav__tab-trigger').first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test('narrow shell width on first paint keeps tabs collapsed (no stuck expanded row)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 480, height: 720 });
    await page.goto('/?shell=320');
    await page.waitForFunction(() => typeof window.__setShellWidth === 'function');
    await expect(page.locator('ds-bar-nav .bar-nav__tabs-probe')).toHaveCount(1);
    await expect(page.locator('.bar-nav__tab-trigger')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.bar-nav__tabs-visible')).toHaveCount(0);
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

    await expect(page.locator('.bar-nav__tab-trigger')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.bar-nav__tabs-visible')).toHaveCount(0);
  });

  test('wide viewport shows tab row; narrow collapses; widen restores', async ({ page }) => {
    await page.evaluate(() => window.__setShellWidth(900));
    await expect(page.locator('.bar-nav__tabs-visible')).toBeVisible();
    await expect(page.locator('.bar-nav__tab-trigger')).toHaveCount(0);

    await page.evaluate(() => window.__setShellWidth(320));
    await expect(page.locator('.bar-nav__tab-trigger')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.bar-nav__tabs-visible')).toHaveCount(0);

    await page.evaluate(() => window.__setShellWidth(900));
    await expect(page.locator('.bar-nav__tabs-visible')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.bar-nav__tab-trigger')).toHaveCount(0);
  });

  test('collapsed menu splits dividers into multiple sections', async ({ page }) => {
    await page.evaluate(() => window.__setShellWidth(320));
    await expect(page.locator('.bar-nav__tab-trigger')).toBeVisible({ timeout: 5000 });

    await page.locator('.bar-nav__tab-trigger').click();
    await expect(page.locator('.menu-popup')).toBeVisible();
    await expect(page.locator('.menu-section')).toHaveCount(2);

    const selected = page.locator('.menu-item[aria-current="true"]');
    await expect(selected).toHaveCount(1);
    await expect(selected).toContainText('Events');
  });

  test('collapsed tab label truncates with fade at narrow width', async ({ page }) => {
    await page.evaluate(
      ({ tabs }) => {
        const nav = document.getElementById('nav') as HTMLElement & {
          tabs: typeof tabs;
          value: string;
        };
        nav.tabs = tabs;
        nav.value = 'events';
      },
      {
        tabs: [
          { id: 'overview', label: 'Overview' },
          { id: 'events', label: 'Events and notifications', dot: true },
          { id: 'requests', label: 'Requests' },
        ],
      },
    );

    await page.evaluate(() => window.__setShellWidth(180));
    await expect(page.locator('.bar-nav__tab-trigger')).toBeVisible({ timeout: 5000 });

    const fade = await page.evaluate(() => {
      const labelWrap = document.querySelector('.bar-nav__tab-trigger-label') as HTMLElement;
      const label = document.querySelector('.bar-nav__tab-trigger-label-text') as HTMLElement;
      const overlay = getComputedStyle(labelWrap, '::after');
      const cs = getComputedStyle(label);
      const maskImage = cs.maskImage !== 'none' ? cs.maskImage : cs.webkitMaskImage;
      return {
        isOverflowing: label.scrollWidth > label.clientWidth + 1,
        hasTruncatedWrapClass: labelWrap.classList.contains(
          'bar-nav__tab-trigger-label--truncated',
        ),
        hasTruncatedClass: label.classList.contains('bar-nav__tab-trigger-label-text--truncated'),
        maskImage,
        overlayBackground: overlay.backgroundImage,
      };
    });

    expect(fade.isOverflowing).toBe(true);
    expect(fade.hasTruncatedWrapClass).toBe(true);
    expect(fade.hasTruncatedClass).toBe(true);
    expect(fade.maskImage).toContain('linear-gradient');
    expect(fade.overlayBackground).toContain('linear-gradient');
  });

  test('collapsed trigger does not fade short label while it fully fits', async ({ page }) => {
    // Tabs-only header is wider than with action icons — collapse at 320px, not 480px.
    await page.evaluate(() => window.__setShellWidth(320));
    await expect(page.locator('.bar-nav__tab-trigger')).toBeVisible({ timeout: 5000 });

    const layout = await page.evaluate(() => {
      const labelWrap = document.querySelector('.bar-nav__tab-trigger-label') as HTMLElement;
      const label = document.querySelector('.bar-nav__tab-trigger-label-text') as HTMLElement;
      const cs = getComputedStyle(label);
      const overlay = getComputedStyle(labelWrap, '::after');

      return {
        labelOverflowing: label.scrollWidth > label.clientWidth + 1,
        maskImage: cs.maskImage !== 'none' ? cs.maskImage : cs.webkitMaskImage,
        overlayContent: overlay.content,
        hasTruncatedClass: label.classList.contains('bar-nav__tab-trigger-label-text--truncated'),
      };
    });

    expect(layout.labelOverflowing).toBe(false);
    expect(layout.maskImage).toBe('none');
    expect(layout.overlayContent).toBe('none');
    expect(layout.hasTruncatedClass).toBe(false);
  });

  test('collapsed trigger interaction layer sits above tab dot', async ({ page }) => {
    await page.evaluate(() => window.__setShellWidth(320));
    await expect(page.locator('.bar-nav__tab-trigger-dot')).toBeVisible({ timeout: 5000 });

    const layers = await page.evaluate(() => {
      const trigger = document.querySelector('.bar-nav__tab-trigger') as HTMLElement;
      const label = document.querySelector('.bar-nav__tab-trigger-label') as HTMLElement;
      const dot = document.querySelector('.bar-nav__tab-trigger-dot') as HTMLElement;
      const chevron = document.querySelector('.bar-nav__tab-trigger-chevron') as HTMLElement;

      return {
        interactionLayer: Number(getComputedStyle(trigger, '::after').zIndex),
        labelLayer: Number(getComputedStyle(label).zIndex),
        dotLayer: Number(getComputedStyle(dot).zIndex),
        chevronLayer: Number(getComputedStyle(chevron).zIndex),
      };
    });

    expect(layers.interactionLayer).toBeGreaterThan(layers.dotLayer);
    expect(layers.interactionLayer).toBeGreaterThan(layers.labelLayer);
    expect(layers.interactionLayer).toBeGreaterThan(layers.chevronLayer);
  });

  test('escape closes menu and returns focus to trigger', async ({ page }) => {
    await page.evaluate(() => window.__setShellWidth(320));
    await expect(page.locator('.bar-nav__tab-trigger')).toBeVisible({ timeout: 5000 });

    const trigger = page.locator('.bar-nav__tab-trigger');
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
