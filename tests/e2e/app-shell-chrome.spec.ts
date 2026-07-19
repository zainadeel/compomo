import { expect, test } from '@playwright/test';

test.describe('App shell chrome', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app-shell-chrome.html');
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  });

  test('panel nav collapse toggles collapsed state', async ({ page }) => {
    const collapse = page.getByRole('button', { name: 'Collapse navigation' });
    await expect(collapse).toBeVisible();
    await collapse.click();
    await expect(page.locator('.panel-nav--collapsed')).toBeVisible();

    await page.getByRole('button', { name: 'Expand navigation' }).click();
    await expect(page.locator('.panel-nav--collapsed')).toHaveCount(0);
  });

  test('contains page scrolling without moving the shell viewport', async ({ page }) => {
    const shell = page.locator('ds-app-shell');
    const shellRoot = page.locator('.app-shell');
    const content = page.locator('.app-shell__content');

    await shell.evaluate(element => {
      element.style.height = '720px';
    });
    await content.evaluate(element => {
      const probe = document.createElement('div');
      probe.style.height = '1440px';
      probe.setAttribute('aria-hidden', 'true');
      element.append(probe);
    });

    await expect(shell).toHaveCSS('overflow', 'hidden');
    await expect(shell).toHaveCSS('overscroll-behavior', 'none');
    await expect(shellRoot).toHaveCSS('overflow', 'hidden');
    await expect(shellRoot).toHaveCSS('overscroll-behavior', 'none');
    await expect(content).toHaveCSS('overflow', 'auto');
    await expect(content).toHaveCSS('overscroll-behavior', 'none');

    await content.evaluate(element => {
      element.scrollTop = 480;
    });
    await expect.poll(() => content.evaluate(element => element.scrollTop)).toBeGreaterThan(0);

    const beforeBoundaryWheel = await page.evaluate(() => ({
      shell: document.querySelector('ds-app-shell')!.getBoundingClientRect().toJSON(),
      windowX: window.scrollX,
      windowY: window.scrollY,
    }));

    await content.evaluate(element => {
      element.scrollTop = element.scrollHeight;
    });
    await content.hover();
    await page.mouse.wheel(240, 480);

    const afterBoundaryWheel = await page.evaluate(() => ({
      shell: document.querySelector('ds-app-shell')!.getBoundingClientRect().toJSON(),
      windowX: window.scrollX,
      windowY: window.scrollY,
    }));

    expect(afterBoundaryWheel).toEqual(beforeBoundaryWheel);
  });

  test('keeps a base-view tool header action exactly 8px from the drawer edge', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Agents', exact: true }).click();
    const header = page.locator('ds-panel-tool-header.panel-tools__header');
    const action = page.getByRole('button', { name: 'Agents options' });

    await expect(action).toBeVisible();
    await expect
      .poll(async () => {
        const headerBox = await header.boundingBox();
        const actionBox = await action.boundingBox();
        if (!headerBox || !actionBox) return null;
        return headerBox.x + headerBox.width - (actionBox.x + actionBox.width);
      })
      .toBe(8);
  });

  test('keeps 4px between header actions in drawer and fullscreen presentations', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Agents', exact: true }).click();
    const tools = page.locator('ds-panel-tools');
    const menu = page.getByRole('button', { name: 'Agents options' });
    const fullscreen = page.getByRole('button', { name: 'Enter fullscreen' });
    const actionGap = async () => {
      const menuBox = await menu.boundingBox();
      const fullscreenBox = await fullscreen.boundingBox();
      if (!menuBox || !fullscreenBox) return null;
      return menuBox.x - (fullscreenBox.x + fullscreenBox.width);
    };

    await expect.poll(actionGap).toBe(4);
    await tools.evaluate(element => {
      (element as HTMLElement & { presentation: 'fullscreen' }).presentation = 'fullscreen';
    });
    await expect(tools).toHaveAttribute('presentation', 'fullscreen');
    await expect.poll(actionGap).toBe(4);
  });

  test('keeps fixed 4px header gaps while only the title shrinks', async ({ page }) => {
    await page.getByRole('button', { name: 'Agents', exact: true }).click();
    const shell = page.locator('ds-app-shell');
    const tools = page.locator('ds-panel-tools');
    const drawer = page.locator('.panel-tools__drawer');
    const leading = page.locator('.panel-tool-header__leading');
    const title = page.locator('ds-text.panel-tool-header__heading');
    const trailing = page.locator('.panel-tool-header__trailing');
    const geometry = async () => {
      const leadingBox = await leading.boundingBox();
      const titleBox = await title.boundingBox();
      const trailingBox = await trailing.boundingBox();
      if (!leadingBox || !titleBox || !trailingBox) return null;
      return {
        leadingWidth: leadingBox.width,
        titleWidth: titleBox.width,
        trailingWidth: trailingBox.width,
        leadingGap: titleBox.x - (leadingBox.x + leadingBox.width),
        trailingGap: trailingBox.x - (titleBox.x + titleBox.width),
      };
    };

    await expect(tools).toHaveClass(/panel-tools--motion-opening/);
    await expect(tools).not.toHaveClass(/panel-tools--motion-opening/, { timeout: 5000 });
    const wide = await geometry();
    expect(wide).not.toBeNull();
    expect(wide).toMatchObject({
      leadingWidth: 32,
      trailingWidth: 68,
      leadingGap: 4,
      trailingGap: 4,
    });

    await shell.evaluate(element => {
      (element as HTMLElement).style.setProperty('--ds-shell-panel-tools-width', '220px');
    });
    await expect
      .poll(() => drawer.evaluate(element => element.getBoundingClientRect().width))
      .toBe(220);
    await expect.poll(geometry).toMatchObject({
      leadingWidth: 32,
      trailingWidth: 68,
      leadingGap: 4,
      trailingGap: 4,
    });
    const narrow = await geometry();
    expect(narrow).not.toBeNull();
    expect(narrow!.titleWidth).toBeLessThan(wide!.titleWidth);
  });

  test('does not allow tool header title selection', async ({ page }) => {
    await page.getByRole('button', { name: 'Agents', exact: true }).click();
    const tools = page.locator('ds-panel-tools');
    const title = page.getByRole('heading', { name: 'Agents', level: 2 });

    await expect(tools).toHaveClass(/panel-tools--motion-opening/);
    await expect(tools).not.toHaveClass(/panel-tools--motion-opening/, { timeout: 5000 });
    const userSelect = await title.evaluate(element => {
      const style = getComputedStyle(element) as CSSStyleDeclaration & {
        webkitUserSelect?: string;
      };
      return style.userSelect || style.webkitUserSelect || '';
    });
    expect(userSelect).toBe('none');

    const box = await title.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + Math.min(52, box!.width - 2), box!.y + box!.height / 2, {
      steps: 8,
    });
    await page.mouse.up();

    await expect.poll(() => page.evaluate(() => window.getSelection()?.toString() ?? '')).toBe('');
  });

  test('makes an overflowing destination body keyboard-scrollable and keeps footer roving focus working', async ({
    page,
  }) => {
    const panel = page.locator('#panel');
    await panel.evaluate(element => {
      const control = element as HTMLElement & { groups: unknown[] };
      control.groups = [
        {
          label: 'Fleet',
          items: Array.from({ length: 20 }, (_, index) => ({
            id: `item-${index}`,
            label: `Item ${index}`,
            icon: 'Map',
            href: `/item-${index}`,
          })),
        },
      ];
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

    const readDotGeometry = () =>
      page.evaluate(() => {
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

    await expect
      .poll(() =>
        panel.evaluate(element => (element as HTMLElement & { collapsed: boolean }).collapsed)
      )
      .toBe(false);
    await expect(panel).toHaveAttribute('data-toggle-count', '0');
    await expect
      .poll(() => page.evaluate(key => localStorage.getItem(key), storageKey))
      .toBe('false');

    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(nav).not.toHaveClass(/panel-nav--breakpoint-locked/);
    await expect(nav).not.toHaveClass(/panel-nav--collapsed/);
    const desktopToggle = page.getByRole('button', { name: 'Collapse navigation' });
    await expect(desktopToggle).toBeEnabled();

    await desktopToggle.hover();
    await expect(logo).toHaveCSS('opacity', '0');
    await expect(toggleIcon).toHaveCSS('opacity', '1');

    await page.keyboard.press('[');
    await expect
      .poll(() =>
        panel.evaluate(element => (element as HTMLElement & { collapsed: boolean }).collapsed)
      )
      .toBe(true);
    await expect(panel).toHaveAttribute('data-toggle-count', '1');
    await expect
      .poll(() => page.evaluate(key => localStorage.getItem(key), storageKey))
      .toBe('true');
  });

  test('cancelled breakpoint collapse still commits bar tabs', async ({ page }) => {
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
        '.panel-nav__footer-icon-collapsed ds-icon'
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
          rootStyle.getPropertyValue('--typography-lineheight-xs')
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

  test('keeps balanced panel insets, an 8px expanded footer gap, and the same animated user node', async ({
    page,
  }) => {
    const readGeometry = () =>
      page.evaluate(() => {
        const body = document.querySelector('.panel-nav__body') as HTMLElement;
        const item = body.querySelector('.panel-nav__item') as HTMLElement;
        const footer = document.querySelector('.panel-nav__footer') as HTMLElement;
        const settings = document.querySelector('.panel-nav__footer-btn') as HTMLElement;
        const user = document.querySelector('.panel-nav__footer-user') as HTMLElement;
        const bodyRect = body.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();
        const footerRect = footer.getBoundingClientRect();
        const settingsRect = settings.getBoundingClientRect();
        const userRect = user.getBoundingClientRect();

        return {
          bodyLeft: itemRect.left - bodyRect.left,
          bodyRight: bodyRect.right - itemRect.right,
          footerLeft: userRect.left - footerRect.left,
          footerRight: footerRect.right - userRect.right,
          horizontalGap: userRect.left - settingsRect.right,
          verticalGap: userRect.top - settingsRect.bottom,
          marker: user.dataset.animationNode,
        };
      });

    await page.locator('.panel-nav__footer-user').evaluate(element => {
      (element as HTMLElement).dataset.animationNode = 'stable';
    });

    await expect.poll(readGeometry).toEqual({
      bodyLeft: 8,
      bodyRight: 8,
      footerLeft: 48,
      footerRight: 8,
      horizontalGap: 8,
      verticalGap: -32,
      marker: 'stable',
    });

    await page.getByRole('button', { name: 'Collapse navigation' }).click();
    await expect.poll(readGeometry).toEqual({
      bodyLeft: 8,
      bodyRight: 8,
      footerLeft: 8,
      footerRight: 8,
      horizontalGap: -32,
      verticalGap: 4,
      marker: 'stable',
    });
  });

  test('rapid collapse reversal emits one balanced chrome transition', async ({ page }) => {
    const transitionCounts = await page.evaluate(async () => {
      const shell = document.querySelector('ds-app-shell')!;
      const panel = document.getElementById('panel') as HTMLElement & { collapsed: boolean };
      let starts = 0;
      let ends = 0;
      shell.addEventListener('dsChromeTransitionStart', () => starts++);
      shell.addEventListener('dsChromeTransitionEnd', () => ends++);
      const transitionEnded = new Promise<void>(resolve => {
        shell.addEventListener('dsChromeTransitionEnd', () => resolve(), { once: true });
      });

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
      await transitionEnded;

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

    await page.getByRole('button', { name: 'Agents', exact: true }).click();
    await expect(host).toHaveClass(/panel-tools--open/);
    await expect(drawer).not.toHaveAttribute('aria-hidden', 'true');
    await expect(drawer).not.toHaveAttribute('inert');

    await page.getByRole('button', { name: 'Agents', exact: true }).click();
    await expect(host).toHaveClass(/panel-tools--drawer-resting/, { timeout: 5000 });
    await expect(drawer).toHaveAttribute('aria-hidden', 'true');
    await expect(drawer).toHaveAttribute('inert', '');
  });

  test('tools drawer animates closed when reversed during opening', async ({ page }) => {
    const host = page.locator('ds-panel-tools');
    const drawer = page.locator('.panel-tools__drawer');
    const agents = page.getByRole('button', { name: 'Agents', exact: true });
    const drawerWidth = () => drawer.evaluate(element => element.getBoundingClientRect().width);

    await agents.click();
    await expect(host).toHaveClass(/panel-tools--motion-opening/);
    await drawer.evaluate(
      () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    );
    const openingWidth = await drawerWidth();
    expect(openingWidth).toBeGreaterThan(0);

    await agents.click();
    await expect(host).toHaveClass(/panel-tools--motion-closing/);
    const closingWidth = await drawerWidth();
    expect(closingWidth).toBeGreaterThan(0);
    await expect.poll(drawerWidth).toBeLessThan(closingWidth);

    await expect(host).toHaveClass(/panel-tools--drawer-resting/, { timeout: 5000 });
    await expect(drawer).toHaveCSS('max-width', '0px');
  });

  test('keeps the complete tool UI opaque until the drawer is fully clipped closed', async ({
    page,
  }) => {
    const host = page.locator('ds-panel-tools');
    const drawer = page.locator('.panel-tools__drawer');
    const header = page.locator('ds-panel-tool-header.panel-tools__header');
    const fullView = page
      .locator('.panel-tools__full-view')
      .filter({ has: page.locator('#agents-full-view') });
    const agents = page.getByRole('button', { name: 'Agents', exact: true });

    await agents.click();
    await expect(host).toHaveClass(/panel-tools--motion-opening/);
    await expect(header).toHaveCSS('opacity', '1');
    await expect(fullView).toBeVisible();
    await expect(host).toHaveClass(/panel-tools--open/);

    await agents.click();
    await expect(host).toHaveClass(/panel-tools--motion-closing/);
    await expect
      .poll(() => drawer.evaluate(element => element.getBoundingClientRect().width))
      .toBeLessThan(300);
    await expect(header).toHaveCSS('opacity', '1');
    await expect(fullView).toBeVisible();
    await expect(fullView).toHaveCSS('width', '300px');
    await expect(host).toHaveClass(/panel-tools--motion-closing/);

    await expect(host).toHaveClass(/panel-tools--drawer-resting/, { timeout: 5000 });
    await expect(fullView).toBeHidden();
  });

  test('uses the same fixed 300px drawer width on desktop and tablet', async ({ page }) => {
    const surface = page.locator('.panel-tools__drawer-surface');
    await page.getByRole('button', { name: 'Agents', exact: true }).click();
    await expect(surface).toHaveCSS('width', '300px');

    await page.setViewportSize({ width: 1000, height: 720 });
    await expect(surface).toHaveCSS('width', '300px');
  });

  test('question mark toggles Help outside editable controls', async ({ page }) => {
    await page.keyboard.press('?');
    await expect(page.locator('ds-panel-tools')).toHaveAttribute('active-tool', 'help');
    await expect(page.getByText('Help panel')).toBeVisible();
  });

  test('restores the last tool closed after reload', async ({ page }) => {
    await page.getByRole('button', { name: 'Agents', exact: true }).click();
    await expect(page.locator('ds-panel-tools')).toHaveClass(/panel-tools--open/);

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('ds-panel-tools')).toHaveClass(/panel-tools--drawer-resting/);
    await expect(page.locator('ds-panel-tools')).toHaveAttribute('active-tool', 'agents');
    await expect(page.locator('ds-panel-tools')).not.toHaveClass(/panel-tools--open/);
  });

  test('closes and clears an active tool removed from the item set', async ({ page }) => {
    await page.getByRole('button', { name: 'Agents', exact: true }).click();
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
    await expect
      .poll(() =>
        page
          .locator('ds-panel-tools')
          .evaluate(element => (element as HTMLElement & { activeTool: string }).activeTool)
      )
      .toBe('');
  });
});
