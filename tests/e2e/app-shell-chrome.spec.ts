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
