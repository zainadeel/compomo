import { expect, test } from '@playwright/test';

test.describe('App shell chrome', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app-shell-chrome.html');
    await page.waitForSelector('ds-panel-nav .panel-nav');
  });

  test('panel nav collapse toggles collapsed state', async ({ page }) => {
    const collapse = page.getByRole('button', { name: 'Collapse navigation' });
    await expect(collapse).toBeVisible();
    await collapse.click();
    await expect(page.locator('.panel-nav--collapsed')).toBeVisible();

    await page.getByRole('button', { name: 'Expand navigation' }).click();
    await expect(page.locator('.panel-nav--collapsed')).toHaveCount(0);
  });

  test('makes an overflowing destination body keyboard-scrollable and keeps footer roving focus working', async ({ page }) => {
    const panel = page.locator('#panel');
    await panel.evaluate(element => {
      const control = element as HTMLElement & { groups: unknown[] };
      control.groups = [{
        label: 'Fleet',
        items: Array.from({ length: 20 }, (_, index) => ({
          id: `item-${index}`,
          label: `Item ${index}`,
          icon: 'Map',
          href: `/item-${index}`,
        })),
      }];
      element.querySelector<HTMLElement>('.panel-nav__body')!.style.maxHeight = '96px';
    });

    const scrollRegion = page.getByRole('region', { name: 'Navigation items' });
    await expect(scrollRegion).toHaveAttribute('tabindex', '0');
    await scrollRegion.focus();
    await expect(scrollRegion).toBeFocused();
    await expect(page.getByRole('button', { name: 'Item 0' })).toHaveClass(/ds-focus-ring-inset/);

    const user = page.locator('.panel-nav__footer-user');
    await user.focus();
    await user.press('ArrowLeft');
    await expect(page.locator('.panel-nav__footer-btn .button-unfilled')).toBeFocused();
  });

  test('panel nav dot uses a 20px suffix zone in expanded and collapsed layouts', async ({
    page,
  }) => {
    await expect(page.locator('.panel-nav__item-dot')).toHaveCount(1);
    await expect(page.locator('.panel-nav__item-dot-box')).toHaveCount(1);

    const readDotGeometry = () => page.evaluate(() => {
      const dot = document.querySelector('.panel-nav__item-dot') as HTMLElement;
      const box = document.querySelector('.panel-nav__item-dot-box') as HTMLElement;
      const row = dot.closest('.panel-nav__item') as HTMLElement;
      const dotRect = dot.getBoundingClientRect();
      const boxRect = box.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      return {
        boxWidth: boxRect.width,
        boxHeight: boxRect.height,
        rightInset: rowRect.right - dotRect.right,
        topInset: dotRect.top - rowRect.top,
      };
    });

    await expect.poll(readDotGeometry).toEqual({
      boxWidth: 20,
      boxHeight: 20,
      rightInset: 13,
      topInset: 13,
    });

    await page.getByRole('button', { name: 'Collapse navigation' }).click();
    await expect.poll(readDotGeometry).toEqual({
      boxWidth: 20,
      boxHeight: 20,
      rightInset: 6,
      topInset: 6,
    });
  });

  test('breakpoint lock suppresses toggle affordance and preserves desktop preference', async ({
    page,
  }) => {
    const storageKey = 'e2e.panel-nav.desktop-collapsed';
    await page.setViewportSize({ width: 1000, height: 720 });
    await page.evaluate(key => {
      localStorage.setItem(key, 'false');
      const panel = document.getElementById('panel') as HTMLElement & {
        breakpoint: number;
        collapsed: boolean;
        storageKey: string;
      };
      panel.storageKey = key;
      panel.collapsed = false;
      panel.breakpoint = 1200;
      panel.dataset.toggleCount = '0';
      panel.addEventListener('dsNavToggle', () => {
        panel.dataset.toggleCount = String(Number(panel.dataset.toggleCount) + 1);
      });
    }, storageKey);

    const panel = page.locator('#panel');
    const nav = page.locator('.panel-nav');
    const toggle = page.getByRole('button', { name: 'Expand navigation' });
    const logo = page.locator('.panel-nav__header-logo');
    const toggleIcon = page.locator('.panel-nav__header-toggle');

    await expect(nav).toHaveClass(/panel-nav--breakpoint-locked/);
    await expect(nav).toHaveClass(/panel-nav--collapsed/);
    await expect(toggle).toBeDisabled();
    await expect(toggle).toHaveAttribute('tabindex', '-1');
    await expect(page.getByRole('button', { name: 'Fleet View' })).toHaveAttribute('tabindex', '0');

    await toggle.hover({ force: true });
    await expect(logo).toHaveCSS('opacity', '1');
    await expect(toggleIcon).toHaveCSS('opacity', '0');

    await toggle.evaluate(button => {
      button.focus();
      button.click();
      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    await page.evaluate(async () => {
      const panel = document.getElementById('panel') as HTMLElement & {
        toggleCollapsed: () => Promise<void>;
      };
      await panel.toggleCollapsed();
    });
    await page.keyboard.press('[');

    await expect.poll(() => panel.evaluate(element => (
      element as HTMLElement & { collapsed: boolean }
    ).collapsed)).toBe(false);
    await expect(panel).toHaveAttribute('data-toggle-count', '0');
    await expect.poll(() => page.evaluate(key => localStorage.getItem(key), storageKey)).toBe('false');

    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(nav).not.toHaveClass(/panel-nav--breakpoint-locked/);
    await expect(nav).not.toHaveClass(/panel-nav--collapsed/);
    const desktopToggle = page.getByRole('button', { name: 'Collapse navigation' });
    await expect(desktopToggle).toBeEnabled();

    await desktopToggle.hover();
    await expect(logo).toHaveCSS('opacity', '0');
    await expect(toggleIcon).toHaveCSS('opacity', '1');

    await page.keyboard.press('[');
    await expect.poll(() => panel.evaluate(element => (
      element as HTMLElement & { collapsed: boolean }
    ).collapsed)).toBe(true);
    await expect(panel).toHaveAttribute('data-toggle-count', '1');
    await expect.poll(() => page.evaluate(key => localStorage.getItem(key), storageKey)).toBe('true');
  });

  test('cancelled breakpoint collapse still commits bar tabs', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const nav = page.locator('.panel-nav');
    const cancelledAnimations = await page.evaluate(async () => {
      const panel = document.getElementById('panel') as HTMLElement & { breakpoint: number };
      const nav = panel.querySelector('.panel-nav') as HTMLElement;
      panel.breakpoint = 2000;

      for (let frame = 0; frame < 10; frame++) {
        await new Promise(resolve => requestAnimationFrame(resolve));
        const animations = nav.getAnimations();
        if (nav.classList.contains('panel-nav--animating') && animations.length > 0) {
          animations.forEach(animation => animation.cancel());
          return animations.length;
        }
      }
      return 0;
    });

    expect(cancelledAnimations).toBeGreaterThan(0);
    await expect(nav).toHaveClass(/panel-nav--breakpoint-locked/);
    await expect(nav).toHaveClass(/panel-nav--collapsed/);
    await expect(nav).not.toHaveClass(/panel-nav--animating/, { timeout: 2000 });
    await expect(page.getByRole('tab', { name: 'Live Map' })).toBeVisible();
  });

  test('collapsed user initial keeps caption metrics and optical centering', async ({ page }) => {
    await page.getByRole('button', { name: 'Collapse navigation' }).click();

    const geometry = await page.locator('.panel-nav__user-initial').evaluate(element => {
      const text = element as HTMLElement;
      const circle = document.querySelector(
        '.panel-nav__footer-icon-collapsed ds-icon',
      ) as HTMLElement;
      const inner = text.querySelector('.ds-text__element') as HTMLElement;
      const textRect = text.getBoundingClientRect();
      const circleRect = circle.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(inner);
      const inkRect = range.getBoundingClientRect();
      const rootStyle = getComputedStyle(document.documentElement);

      return {
        textHeight: textRect.height,
        tokenLineHeight: Number.parseFloat(
          rootStyle.getPropertyValue('--typography-lineheight-xs'),
        ),
        boxCenterDeltaX:
          textRect.left + textRect.width / 2 - (circleRect.left + circleRect.width / 2),
        boxCenterDeltaY:
          textRect.top + textRect.height / 2 - (circleRect.top + circleRect.height / 2),
        inkCenterDeltaX:
          inkRect.left + inkRect.width / 2 - (circleRect.left + circleRect.width / 2),
        inkCenterDeltaY:
          inkRect.top + inkRect.height / 2 - (circleRect.top + circleRect.height / 2),
      };
    });

    expect(geometry.textHeight).toBeCloseTo(geometry.tokenLineHeight, 5);
    expect(Math.abs(geometry.boxCenterDeltaX)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(geometry.boxCenterDeltaY)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(geometry.inkCenterDeltaX)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(geometry.inkCenterDeltaY)).toBeLessThanOrEqual(0.5);
  });

  test('rapid collapse reversal emits one balanced chrome transition', async ({ page }) => {
    const transitionCounts = await page.evaluate(async () => {
      const shell = document.querySelector('ds-app-shell')!;
      const panel = document.getElementById('panel') as HTMLElement & { collapsed: boolean };
      let starts = 0;
      let ends = 0;
      shell.addEventListener('dsChromeTransitionStart', () => starts++);
      shell.addEventListener('dsChromeTransitionEnd', () => ends++);

      panel.collapsed = true;
      panel.collapsed = false;
      const bar = document.getElementById('bar') as HTMLElement & {
        basePath: string;
        currentUrl: string;
        tabs: Array<{ id: string; label: string }>;
      };
      bar.basePath = '/dashboard/maintenance';
      bar.currentUrl = '/dashboard/maintenance/health';
      bar.tabs = [
        { id: 'health', label: 'Health' },
        { id: 'inspections', label: 'Inspections' },
      ];
      await new Promise(resolve => setTimeout(resolve, 500));

      return { starts, ends };
    });

    expect(transitionCounts).toEqual({ starts: 1, ends: 1 });
    await expect(page.getByRole('tab', { name: 'Health' })).toBeVisible();
  });

  test('none preset keeps the solid secondary chrome layer mounted', async ({ page }) => {
    const shell = page.locator('ds-app-shell');
    const chrome = page.locator('.app-shell__chrome');
    await chrome.evaluate(element => {
      element.setAttribute('data-e2e-persistent', '');
    });

    await shell.evaluate(element => {
      (element as HTMLElement & { gradientPreset: string }).gradientPreset = 'none';
    });

    await expect(shell).toHaveAttribute('gradient-preset', 'none');
    await expect(chrome).toHaveCount(1);
    await expect(chrome).toHaveAttribute('data-e2e-persistent', '');
    const colors = await chrome.evaluate(element => {
      const probe = document.createElement('div');
      probe.style.backgroundColor = 'var(--color-background-secondary)';
      document.body.append(probe);
      const secondary = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return {
        chrome: getComputedStyle(element).backgroundColor,
        secondary,
      };
    });
    expect(colors.chrome).toBe(colors.secondary);
  });

  test('tools drawer sets inert and aria-hidden when resting closed', async ({ page }) => {
    const drawer = page.locator('.panel-tools__drawer');
    const host = page.locator('ds-panel-tools');

    await expect(host).toHaveClass(/panel-tools--drawer-resting/);
    await expect(drawer).toHaveAttribute('aria-hidden', 'true');
    await expect(drawer).toHaveAttribute('inert', '');

    await page.getByRole('button', { name: 'Agents' }).click();
    await expect(host).toHaveClass(/panel-tools--open/);
    await expect(drawer).not.toHaveAttribute('aria-hidden', 'true');
    await expect(drawer).not.toHaveAttribute('inert');

    await page.getByRole('button', { name: 'Agents' }).click();
    await expect(host).toHaveClass(/panel-tools--drawer-resting/, { timeout: 5000 });
    await expect(drawer).toHaveAttribute('aria-hidden', 'true');
    await expect(drawer).toHaveAttribute('inert', '');
  });

  test('tools drawer animates closed when reversed during opening', async ({ page }) => {
    const host = page.locator('ds-panel-tools');
    const drawer = page.locator('.panel-tools__drawer');
    const agents = page.getByRole('button', { name: 'Agents' });
    await agents.click();
    await page.waitForTimeout(100);
    const openingWidth = await drawer.evaluate(element => element.getBoundingClientRect().width);
    expect(openingWidth).toBeGreaterThan(0);

    await agents.click();
    await expect(host).toHaveClass(/panel-tools--motion-closing/);
    await page.waitForTimeout(30);
    const closingWidth = await drawer.evaluate(element => element.getBoundingClientRect().width);
    expect(closingWidth).toBeGreaterThan(0);
    await page.waitForTimeout(100);
    const laterClosingWidth = await drawer.evaluate(element => element.getBoundingClientRect().width);
    expect(laterClosingWidth).toBeLessThan(closingWidth);

    await expect(host).toHaveClass(/panel-tools--drawer-resting/, { timeout: 5000 });
    await expect(drawer).toHaveCSS('max-width', '0px');
  });

  test('uses fixed desktop and tablet drawer width tokens', async ({ page }) => {
    const surface = page.locator('.panel-tools__drawer-surface');
    await page.getByRole('button', { name: 'Agents' }).click();
    await expect(surface).toHaveCSS('width', '400px');

    await page.setViewportSize({ width: 1000, height: 720 });
    await expect(surface).toHaveCSS('width', '300px');
  });

  test('question mark toggles Help outside editable controls', async ({ page }) => {
    await page.keyboard.press('?');
    await expect(page.locator('ds-panel-tools')).toHaveAttribute('active-tool', 'help');
    await expect(page.getByText('Help panel')).toBeVisible();
  });

  test('restores the last tool closed after reload', async ({ page }) => {
    await page.getByRole('button', { name: 'Agents' }).click();
    await expect(page.locator('ds-panel-tools')).toHaveClass(/panel-tools--open/);

    await page.reload();
    await page.waitForSelector('ds-panel-tools.panel-tools--drawer-resting');
    await expect(page.locator('ds-panel-tools')).toHaveAttribute('active-tool', 'agents');
    await expect(page.locator('ds-panel-tools')).not.toHaveClass(/panel-tools--open/);
  });

  test('closes and clears an active tool removed from the item set', async ({ page }) => {
    await page.getByRole('button', { name: 'Agents' }).click();
    await page.evaluate(() => {
      const tools = document.getElementById('tools') as HTMLElement & {
        items: Array<{ id: string; icon: string; ariaLabel: string }>;
      };
      tools.items = [
        { id: 'search', icon: 'MagnifyingGlass', ariaLabel: 'Search' },
        { id: 'help', icon: 'CircleQuestion', ariaLabel: 'Help & Support' },
      ];
    });

    await expect(page.locator('ds-panel-tools')).not.toHaveClass(/panel-tools--open/);
    await expect.poll(() => page.locator('ds-panel-tools').evaluate(
      element => (element as HTMLElement & { activeTool: string }).activeTool,
    )).toBe('');
  });
});
