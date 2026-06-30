import { expect, test } from '@playwright/test';

test.describe('BarNav responsive overflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.__setShellWidth === 'function');
    await expect(page.locator('ds-bar-nav .bar-nav__tabs-probe')).toHaveCount(1);
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

  test('collapsed trigger hugs content with 8px gap to actions when tight', async ({ page }) => {
    await page.evaluate(() => window.__setShellWidth(200));
    await expect(page.locator('.bar-nav__tab-trigger')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.bar-nav__left')).toHaveCount(0);

    const layout = await page.evaluate(() => {
      const trigger = document.querySelector('.bar-nav__tab-trigger') as HTMLElement | null;
      const actions = document.querySelector('.bar-nav__actions') as HTMLElement | null;
      const header = document.querySelector('.bar-nav') as HTMLElement | null;
      if (!trigger || !actions || !header) return null;
      const tr = trigger.getBoundingClientRect();
      const ar = actions.getBoundingClientRect();
      const gapPx =
        parseFloat(getComputedStyle(header).getPropertyValue('--dimension-space-100').trim()) || 8;
      return {
        tabToActionsPx: Math.round(ar.left - tr.right),
        gapPx,
        triggerW: Math.round(tr.width),
        headerW: header.offsetWidth,
      };
    });

    expect(layout).not.toBeNull();
    expect(layout!.tabToActionsPx).toBe(layout!.gapPx);
    expect(layout!.triggerW).toBeLessThan(layout!.headerW * 0.5);
  });

  test('collapsed tab-to-actions gap at 300px matches token (8px)', async ({ page }) => {
    await page.evaluate(
      ({ tabs, navActions }) => {
        const nav = document.getElementById('nav') as HTMLElement & {
          tabs: typeof tabs;
          actions: typeof navActions;
          value: string;
        };
        nav.tabs = tabs;
        nav.actions = navActions;
        nav.value = 'events';
      },
      {
        tabs: [
          { id: 'overview', label: 'Overview' },
          { id: 'events', label: 'Events and notifications', dot: true },
          { id: 'requests', label: 'Requests' },
        ],
        navActions: [
          { id: 'search', icon: 'MagnifyingGlass', ariaLabel: 'Search' },
          { id: 'inbox', icon: 'Inbox', ariaLabel: 'Inbox', dot: true },
          { id: 'agents', icon: 'AI', ariaLabel: 'Agents', dot: true },
        ],
      },
    );

    await page.evaluate(() => window.__setShellWidth(300));
    await expect(page.locator('.bar-nav__tab-trigger')).toBeVisible({ timeout: 5000 });

    const layout = await page.evaluate(() => {
      const header = document.querySelector('.bar-nav') as HTMLElement;
      const trigger = document.querySelector('.bar-nav__tab-trigger') as HTMLElement;
      const actions = document.querySelector('.bar-nav__actions') as HTMLElement;
      const tr = trigger.getBoundingClientRect();
      const ar = actions.getBoundingClientRect();
      const gapPx =
        parseFloat(getComputedStyle(header).getPropertyValue('--dimension-space-100').trim()) || 8;

      return {
        collapsed: header.classList.contains('bar-nav--tabs-collapsed'),
        display: getComputedStyle(header).display,
        tabToActionsPx: Math.round(ar.left - tr.right),
        gapPx,
      };
    });

    expect(layout.collapsed).toBe(true);
    expect(layout.display).toBe('flex');
    expect(layout.tabToActionsPx).toBe(layout.gapPx);

    const fade = await page.evaluate(() => {
      const labelWrap = document.querySelector('.bar-nav__tab-trigger-label') as HTMLElement;
      const label = document.querySelector('.bar-nav__tab-trigger-label-text') as HTMLElement;
      const overlay = getComputedStyle(labelWrap, '::after');
      return {
        scrollWidth: label.scrollWidth,
        clientWidth: label.clientWidth,
        isOverflowing: label.scrollWidth > label.clientWidth + 1,
        overlayContent: overlay.content,
        overlayWidth: parseFloat(overlay.width),
        overlayBackground: overlay.backgroundImage,
        hasTruncatedClass: label.classList.contains('bar-nav__tab-trigger-label-text--truncated'),
        hasTruncatedWrapClass: labelWrap.classList.contains('bar-nav__tab-trigger-label--truncated'),
      };
    });

    expect(fade.isOverflowing).toBe(true);
    // Empty `content: ''` serializes as `""` or `none` depending on engine / pseudo-element path.
    expect(['""', 'none']).toContain(fade.overlayContent);
    expect(fade.overlayWidth).toBeGreaterThan(0);
    expect(fade.overlayBackground).toContain('linear-gradient');
    expect(fade.hasTruncatedClass).toBe(true);
    expect(fade.hasTruncatedWrapClass).toBe(true);
  });

  test('responsive collapsed trigger truncates short active label before actions overflow', async ({
    page,
  }) => {
    await page.evaluate(() => window.__setShellWidth(200));
    await expect(page.locator('.bar-nav__tab-trigger')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.bar-nav__tab-trigger-label-text--truncated')).toBeVisible({
      timeout: 5000,
    });

    const layout = await page.evaluate(() => {
      const header = document.querySelector('.bar-nav') as HTMLElement;
      const trigger = document.querySelector('.bar-nav__tab-trigger') as HTMLElement;
      const between = document.querySelector('.bar-nav__between') as HTMLElement;
      const actions = document.querySelector('.bar-nav__actions') as HTMLElement;
      const label = document.querySelector('.bar-nav__tab-trigger-label-text') as HTMLElement;
      const hr = header.getBoundingClientRect();
      const tr = trigger.getBoundingClientRect();
      const br = between.getBoundingClientRect();
      const ar = actions.getBoundingClientRect();
      const gapPx =
        parseFloat(getComputedStyle(header).getPropertyValue('--dimension-space-100').trim()) || 8;

      return {
        display: getComputedStyle(header).display,
        tabToActionsPx: Math.round(ar.left - tr.right),
        spacerWidthPx: Math.round(br.width),
        gapPx,
        actionsInsideHeader: ar.right <= hr.right - gapPx + 1,
        labelOverflowing: label.scrollWidth > label.clientWidth + 1,
        hasTruncatedClass: label.classList.contains('bar-nav__tab-trigger-label-text--truncated'),
      };
    });

    expect(layout.display).toBe('flex');
    expect(layout.tabToActionsPx).toBe(layout.gapPx);
    expect(layout.spacerWidthPx).toBe(layout.gapPx);
    expect(layout.actionsInsideHeader).toBe(true);
    expect(layout.labelOverflowing).toBe(true);
    expect(layout.hasTruncatedClass).toBe(true);
  });

  test('responsive collapsed trigger does not fade short label while it fully fits', async ({
    page,
  }) => {
    await page.evaluate(() => window.__setShellWidth(220));
    await expect(page.locator('.bar-nav__tab-trigger')).toBeVisible({ timeout: 5000 });

    const layout = await page.evaluate(() => {
      const header = document.querySelector('.bar-nav') as HTMLElement;
      const trigger = document.querySelector('.bar-nav__tab-trigger') as HTMLElement;
      const actions = document.querySelector('.bar-nav__actions') as HTMLElement;
      const labelWrap = document.querySelector('.bar-nav__tab-trigger-label') as HTMLElement;
      const label = document.querySelector('.bar-nav__tab-trigger-label-text') as HTMLElement;
      const tr = trigger.getBoundingClientRect();
      const ar = actions.getBoundingClientRect();
      const cs = getComputedStyle(label);
      const overlay = getComputedStyle(labelWrap, '::after');
      const gapPx =
        parseFloat(getComputedStyle(header).getPropertyValue('--dimension-space-100').trim()) || 8;

      return {
        collapsed: header.classList.contains('bar-nav--tabs-collapsed'),
        tabToActionsPx: Math.round(ar.left - tr.right),
        gapPx,
        labelOverflowing: label.scrollWidth > label.clientWidth + 1,
        maskImage: cs.maskImage !== 'none' ? cs.maskImage : cs.webkitMaskImage,
        overlayContent: overlay.content,
        hasTruncatedClass: label.classList.contains('bar-nav__tab-trigger-label-text--truncated'),
        hasTruncatedWrapClass: labelWrap.classList.contains('bar-nav__tab-trigger-label--truncated'),
      };
    });

    expect(layout.collapsed).toBe(true);
    expect(layout.tabToActionsPx).toBeGreaterThanOrEqual(layout.gapPx);
    expect(layout.labelOverflowing).toBe(false);
    expect(layout.maskImage).toBe('none');
    expect(layout.overlayContent).toBe('none');
    expect(layout.hasTruncatedClass).toBe(false);
    expect(layout.hasTruncatedWrapClass).toBe(false);
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
