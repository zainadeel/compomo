import { expect, test } from '@playwright/test';
import { chromiumOnly } from './browser-tier';
import { expectGeometryClose } from './rendered-geometry';

test.describe('App shell chrome', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shell-app-chrome.html');
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

  test('commits panel lane layout once while preserving coordinated collapse motion @cross-browser', async ({
    page,
  }) => {
    const shell = page.locator('ds-shell-app');
    const panel = page.locator('#panel');
    const content = page.locator('.shell-app__content');
    const result = await content.evaluate(async element => {
      const samples: number[] = [element.clientWidth];
      const observer = new ResizeObserver(() => samples.push(element.clientWidth));
      observer.observe(element);
      const nav = document.getElementById('panel') as HTMLElement & { collapsed: boolean };
      const ended = new Promise<void>(resolve => {
        document
          .querySelector('ds-shell-app')!
          .addEventListener('dsChromeTransitionEnd', () => resolve(), {
            once: true,
          });
      });
      nav.collapsed = true;
      const animationState = await new Promise<{
        count: number;
        transforms: string[];
      }>(resolve => {
        requestAnimationFrame(() => {
          const animations = element.getAnimations();
          resolve({
            count: animations.length,
            transforms: animations.flatMap(animation => {
              const effect = animation.effect as KeyframeEffect | null;
              return (effect?.getKeyframes() ?? []).map(frame => String(frame.transform ?? ''));
            }),
          });
        });
      });
      await ended;
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      observer.disconnect();
      return { animationState, samples };
    });

    expect(result.animationState.count).toBeGreaterThan(0);
    expect(result.animationState.transforms.join(' ')).not.toContain('scale');
    expect(new Set(result.samples).size).toBeLessThanOrEqual(2);
    await expect(shell).not.toHaveAttribute('data-shell-layout-transition');
    await expect(panel.locator('.panel-nav')).toHaveClass(/panel-nav--collapsed/);
  });

  test('commits the tools lane once while the drawer keeps its visible reveal @cross-browser', async ({
    page,
  }) => {
    const shell = page.locator('ds-shell-app');
    const bar = page.locator('.shell-app__bar');
    const content = page.locator('.shell-app__content');
    const toolsVisuals = page.locator('ds-shell-tools, ds-panel-tools');
    const agents = page.getByRole('button', { name: 'Agents', exact: true });
    await content.evaluate(element => {
      const samples: number[] = [element.clientWidth];
      const observer = new ResizeObserver(() => samples.push(element.clientWidth));
      observer.observe(element);
      (
        window as unknown as {
          shellResizeProbe: { observer: ResizeObserver; samples: number[] };
        }
      ).shellResizeProbe = { observer, samples };
    });

    await agents.click();
    await expect(shell).toHaveAttribute('data-shell-layout-transition', /panel-tools/);
    await expect.poll(() => content.evaluate(element => element.getAnimations().length)).toBe(0);
    await expect.poll(() => bar.evaluate(element => element.getAnimations().length)).toBe(0);
    await expect
      .poll(() =>
        toolsVisuals.evaluateAll(elements =>
          elements.some(element => getComputedStyle(element).backgroundColor !== 'rgba(0, 0, 0, 0)')
        )
      )
      .toBe(true);
    await expect(page.locator('ds-panel-tools')).not.toHaveClass(/panel-tools--motion-opening/, {
      timeout: 5000,
    });
    const widths = await page.evaluate(
      () =>
        new Promise<number[]>(resolve => {
          requestAnimationFrame(() => {
            const probe = (
              window as unknown as {
                shellResizeProbe: { observer: ResizeObserver; samples: number[] };
              }
            ).shellResizeProbe;
            probe.observer.disconnect();
            resolve(probe.samples);
          });
        })
    );

    expect(new Set(widths).size).toBeLessThanOrEqual(2);
    await expect(shell).not.toHaveAttribute('data-shell-layout-transition');
    await expect
      .poll(() =>
        toolsVisuals.evaluateAll(elements =>
          elements.every(element => !element.style.backgroundColor)
        )
      )
      .toBe(true);
    await expect(agents).toHaveAttribute('aria-pressed', 'true');

    await content.evaluate(element => {
      const samples: number[] = [element.clientWidth];
      const observer = new ResizeObserver(() => samples.push(element.clientWidth));
      observer.observe(element);
      (
        window as unknown as {
          shellResizeProbe: { observer: ResizeObserver; samples: number[] };
        }
      ).shellResizeProbe = { observer, samples };
    });
    await agents.click();
    await expect(shell).toHaveAttribute('data-shell-layout-transition', /panel-tools/);
    await expect.poll(() => content.evaluate(element => element.getAnimations().length)).toBe(0);
    await expect.poll(() => bar.evaluate(element => element.getAnimations().length)).toBe(0);
    await expect
      .poll(() =>
        toolsVisuals.evaluateAll(elements =>
          elements.some(element => getComputedStyle(element).backgroundColor !== 'rgba(0, 0, 0, 0)')
        )
      )
      .toBe(true);
    await expect(page.locator('ds-panel-tools')).not.toHaveClass(/panel-tools--motion-closing/, {
      timeout: 5000,
    });
    const closingWidths = await page.evaluate(
      () =>
        new Promise<number[]>(resolve => {
          requestAnimationFrame(() => {
            const probe = (
              window as unknown as {
                shellResizeProbe: { observer: ResizeObserver; samples: number[] };
              }
            ).shellResizeProbe;
            probe.observer.disconnect();
            resolve(probe.samples);
          });
        })
    );

    expect(new Set(closingWidths).size).toBeLessThanOrEqual(2);
    await expect(shell).not.toHaveAttribute('data-shell-layout-transition');
    await expect
      .poll(() =>
        toolsVisuals.evaluateAll(elements =>
          elements.every(element => !element.style.backgroundColor)
        )
      )
      .toBe(true);
    await expect(content).toBeVisible();
    await expect(agents).toHaveAttribute('aria-pressed', 'false');
  });

  test(
    'panel nav controls inherit the shared md control radius',
    chromiumOnly(
      'layout-geometry',
      'The shared control radius is a token-backed recipe with contract coverage.'
    ),
    async ({ page }) => {
      const nav = page.locator('.panel-nav');
      await expect(nav).toHaveClass(/ds-control--md/);
      await nav.evaluate(element => {
        (element as HTMLElement).style.setProperty('--ds-control-radius', '10px');
      });

      await expect(nav.locator('.panel-nav__header-btn')).toHaveCSS('border-radius', '10px');
      await expect(nav.locator('.panel-nav__item').first()).toHaveCSS('border-radius', '10px');
    }
  );

  test(
    'keeps one default cursor across desktop button hit areas',
    chromiumOnly(
      'layout-geometry',
      'Static cursor recipes do not depend on an engine-specific API.'
    ),
    async ({ page }) => {
      const targets = page.locator(
        '.panel-nav__item, .bar-nav__tab, .panel-tools__rail-action .button-unfilled'
      );

      const cursors = await targets.evaluateAll(elements =>
        elements.flatMap(element => [
          getComputedStyle(element).cursor,
          ...Array.from(element.querySelectorAll('*')).map(
            descendant => getComputedStyle(descendant).cursor
          ),
        ])
      );

      expect(new Set(cursors)).toEqual(new Set(['default']));
    }
  );

  test(
    'keeps tool-rail dot halos aligned below the interaction wash while pressed',
    chromiumOnly('layout-geometry', 'Layer ordering and dot geometry are static shared recipes.'),
    async ({ page }) => {
      const action = page.getByRole('button', { name: 'Activity' });
      const badge = action.locator('ds-badge');
      const mark = badge.locator('.badge__mark');

      await expect(action).not.toHaveClass(/ds-control-press-scale/);
      await expect(action).toHaveCSS('scale', 'none');
      await expect(mark).toHaveCSS('box-shadow', 'none');
      await expect
        .poll(() =>
          mark.evaluate(element => getComputedStyle(element, '::after').backgroundAttachment)
        )
        .toBe('fixed');

      const restingBadge = await badge.boundingBox();
      expect(restingBadge).not.toBeNull();
      const actionBox = await action.boundingBox();
      expect(actionBox).not.toBeNull();

      await page.mouse.move(
        actionBox!.x + actionBox!.width / 2,
        actionBox!.y + actionBox!.height / 2
      );
      await page.mouse.down();

      await expect(action).toHaveCSS('scale', 'none');
      expect(await badge.boundingBox()).toEqual(restingBadge);
      const pressedLayers = await action.evaluate(element => ({
        interaction: Number(getComputedStyle(element, '::after').zIndex),
        content: Number(
          getComputedStyle(element.querySelector<HTMLElement>('.button-unfilled__icon-wrap')!)
            .zIndex
        ),
        wash: getComputedStyle(element, '::after').backgroundColor,
      }));
      expect(pressedLayers.interaction).toBeGreaterThan(pressedLayers.content);
      expect(pressedLayers.wash).not.toBe('rgba(0, 0, 0, 0)');

      await page.mouse.up();
    }
  );

  test('keeps shell-owned rail tooltips inside the viewport', async ({ page }) => {
    const action = page.getByRole('button', { name: 'Agents', exact: true });
    await action.hover();

    const tooltip = page.getByRole('tooltip', { name: /Agents/ });
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveAttribute('data-side', 'left');

    const actionBox = await action.boundingBox();
    const tooltipBox = await tooltip.boundingBox();
    expect(actionBox).not.toBeNull();
    expect(tooltipBox).not.toBeNull();
    const tooltipRight = tooltipBox!.x + tooltipBox!.width;
    expect(tooltipRight).toBeLessThan(actionBox!.x);
    expect(tooltipBox!.x).toBeGreaterThanOrEqual(0);
    expect(tooltipRight).toBeLessThanOrEqual(page.viewportSize()!.width);
  });

  test('resolves badge gradient rings from CSS context and explicit overrides', async ({
    page,
  }) => {
    const shell = page.locator('ds-shell-app');
    const badge = page.getByRole('button', { name: 'Activity' }).locator('ds-badge');
    const mark = badge.locator('.badge__mark');

    await expect(mark).toHaveCSS('box-shadow', 'none');

    await badge.evaluate(element => {
      (element as HTMLElement & { gradientBackground?: boolean }).gradientBackground = false;
    });
    await expect
      .poll(() => mark.evaluate(element => getComputedStyle(element).boxShadow))
      .not.toBe('none');

    await badge.evaluate(element => {
      (element as HTMLElement & { gradientBackground?: boolean }).gradientBackground = undefined;
    });
    await expect(mark).toHaveCSS('box-shadow', 'none');

    await shell.evaluate(element => {
      (element as HTMLElement & { gradientPreset: string }).gradientPreset = 'none';
    });
    await expect
      .poll(() => mark.evaluate(element => getComputedStyle(element).boxShadow))
      .not.toBe('none');

    await badge.evaluate(element => {
      (element as HTMLElement & { gradientBackground?: boolean }).gradientBackground = true;
    });
    await expect(mark).toHaveCSS('box-shadow', 'none');
  });

  test('contains page scrolling without moving the shell viewport', async ({ page }) => {
    const shell = page.locator('ds-shell-app');
    const shellRoot = page.locator('.shell-app');
    const content = page.locator('.shell-app__content');

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
    await expect(content).toHaveAttribute('tabindex', '0');
    await content.focus();
    await expect(content).toBeFocused();
    await content.press('PageDown');
    await expect.poll(() => content.evaluate(element => element.scrollTop)).toBeGreaterThan(0);

    await content.evaluate(element => {
      element.scrollTop = 480;
    });
    await expect.poll(() => content.evaluate(element => element.scrollTop)).toBeGreaterThan(0);

    const beforeBoundaryWheel = await page.evaluate(() => ({
      shell: document.querySelector('ds-shell-app')!.getBoundingClientRect().toJSON(),
      windowX: window.scrollX,
      windowY: window.scrollY,
    }));

    await content.evaluate(element => {
      element.scrollTop = element.scrollHeight;
    });
    await content.hover();
    await page.mouse.wheel(240, 480);

    const afterBoundaryWheel = await page.evaluate(() => ({
      shell: document.querySelector('ds-shell-app')!.getBoundingClientRect().toJSON(),
      windowX: window.scrollX,
      windowY: window.scrollY,
    }));

    expect(afterBoundaryWheel).toEqual(beforeBoundaryWheel);
  });

  test(
    'keeps a base-view tool header action exactly 8px from the drawer edge',
    chromiumOnly(
      'layout-geometry',
      'Header action inset is a local token-backed geometry contract.'
    ),
    async ({ page }) => {
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
    }
  );

  test('provides the rendered header action as an external menu anchor @cross-browser', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Agents', exact: true }).click();
    const trigger = page.getByRole('button', { name: 'Agents options' });
    const menu = page.getByRole('menu', { name: 'Agents options' });

    await trigger.click();
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Settings' })).toBeFocused();
    await expect
      .poll(() =>
        page.locator('#agents-options-menu').evaluate(element => {
          const anchor = (element as HTMLElement & { anchor?: HTMLElement }).anchor;
          return anchor?.id;
        })
      )
      .toBe('agents-options-trigger');

    const menuBox = await menu.boundingBox();
    const toolsBox = await page.locator('.shell-app__tools').boundingBox();
    expect(menuBox).not.toBeNull();
    expect(toolsBox).not.toBeNull();
    expect(menuBox!.x).toBeGreaterThanOrEqual(toolsBox!.x + 3.5);
    expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(toolsBox!.x + toolsBox!.width - 3.5);

    await trigger.click();
    await expect(menu).toBeHidden();
  });

  test('completes controlled account-menu dismissal after outside activation @cross-browser', async ({
    page,
  }) => {
    const account = page.getByRole('button', { name: 'Account' });
    const menu = page.getByRole('dialog', { name: 'Account appearance' });

    await account.click();
    await expect(menu).toBeVisible();
    await page.locator('main').click();

    await expect(menu).toBeHidden();
    await expect(account).toHaveAttribute('aria-expanded', 'false');
  });

  test('keeps an open account menu attached while its anchor collapses @cross-browser', async ({
    page,
  }) => {
    const panel = page.locator('#panel');
    const account = page.getByRole('button', { name: 'Account' });
    const menu = page.getByRole('dialog', { name: 'Account appearance' });
    const anchorGap = async () => {
      const accountBox = await account.boundingBox();
      const menuBox = await menu.boundingBox();
      if (!accountBox || !menuBox) return null;
      return {
        inline: Math.round(menuBox.x - (accountBox.x + accountBox.width)),
        block: Math.round(menuBox.y - accountBox.y),
      };
    };

    await account.click();
    await expect(menu).toBeVisible();
    const expandedGap = await anchorGap();

    await panel.evaluate(element => {
      (element as HTMLElement & { collapsed: boolean }).collapsed = true;
    });

    await expect(menu).toBeVisible();
    await expect.poll(async () => Math.round((await account.boundingBox())?.width ?? 0)).toBe(32);
    await expect.poll(anchorGap).toEqual(expandedGap);
  });

  test('keeps a top-layer page menu inside the routed-content boundary @cross-browser', async ({
    page,
  }) => {
    const trigger = page.getByRole('button', { name: 'Page actions' });
    const menu = page.getByRole('menu', { name: 'Page actions' });
    const content = page.locator('.shell-app__content');
    const tools = page.locator('.shell-app__tools');

    await trigger.click();
    await expect(menu).toBeVisible();

    const geometry = await Promise.all([
      menu.boundingBox(),
      content.boundingBox(),
      tools.boundingBox(),
    ]);
    const [menuBox, contentBox, toolsBox] = geometry;
    expect(menuBox).not.toBeNull();
    expect(contentBox).not.toBeNull();
    expect(toolsBox).not.toBeNull();
    expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(
      contentBox!.x + contentBox!.width - 3.5
    );
    expect(menuBox!.x + menuBox!.width).toBeLessThan(toolsBox!.x);
  });

  test('continues Tab from a shadow-root menu anchor in composed document order @cross-browser', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Agents', exact: true }).click();
    const trigger = page.getByRole('button', { name: 'Agents options' });
    const menu = page.getByRole('menu', { name: 'Agents options' });

    await trigger.focus();
    await page.keyboard.press('Tab');
    const markedNativeTarget = await page.evaluate(() => {
      let active = document.activeElement;
      while (active instanceof HTMLElement && active.shadowRoot?.activeElement) {
        active = active.shadowRoot.activeElement;
      }
      if (!(active instanceof HTMLElement)) return false;
      active.dataset.nativeTabAfterMenuAnchor = '';
      return true;
    });
    expect(markedNativeTarget).toBe(true);
    const nativeTarget = page.locator('[data-native-tab-after-menu-anchor]');

    await trigger.click();
    await expect(menu.getByRole('menuitem', { name: 'Settings' })).toBeFocused();
    await page.keyboard.press('Tab');

    await expect(menu).toBeHidden();
    await expect(nativeTarget).toBeFocused();
  });

  test(
    'keeps 4px between header actions in drawer and fullscreen presentations',
    chromiumOnly('layout-geometry', 'Header action gaps are static token-backed geometry.'),
    async ({ page }) => {
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
      const reflectedPresentation = await tools.evaluate(element => {
        (element as HTMLElement & { presentation: 'fullscreen' }).presentation = 'fullscreen';
        return element.getAttribute('presentation');
      });
      expect(reflectedPresentation).toBe('fullscreen');
      await expect(tools).toHaveAttribute('presentation', 'fullscreen');
      await expect.poll(actionGap).toBe(4);
    }
  );

  test(
    'keeps shared 8px header gaps while only the title shrinks',
    chromiumOnly(
      'layout-geometry',
      'Shared header gaps and title flex behavior are local geometry contracts.'
    ),
    async ({ page }) => {
      await page.getByRole('button', { name: 'Agents', exact: true }).click();
      const shell = page.locator('ds-shell-app');
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
        leadingGap: 8,
        trailingGap: 8,
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
        leadingGap: 8,
        trailingGap: 8,
      });
      const narrow = await geometry();
      expect(narrow).not.toBeNull();
      expect(narrow!.titleWidth).toBeLessThan(wide!.titleWidth);
    }
  );

  test(
    'does not allow tool header title selection',
    chromiumOnly('layout-geometry', 'The user-select recipe is a static CSS contract.'),
    async ({ page }) => {
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

      await expect
        .poll(() => page.evaluate(() => window.getSelection()?.toString() ?? ''))
        .toBe('');
    }
  );

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

  test('makes an overflowing tool rail keyboard-scrollable', async ({ page }) => {
    const tools = page.locator('ds-panel-tools');
    await tools.evaluate(element => {
      element.shadowRoot!.querySelector<HTMLElement>('.panel-tools__rail-body')!.style.maxHeight =
        '96px';
    });

    const scrollRegion = page.getByRole('region', { name: 'Tool shortcuts' });
    await expect(scrollRegion).toHaveAttribute('tabindex', '0');
    await scrollRegion.focus();
    await expect(scrollRegion).toBeFocused();
    await scrollRegion.press('PageDown');
    await expect.poll(() => scrollRegion.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  });

  test('integrates rail accessories into keyboard order, overflow, focus, and reduced motion @pr-critical', async ({
    page,
  }) => {
    const tools = page.locator('ds-panel-tools');
    await page.getByRole('button', { name: 'Agents', exact: true }).click();
    await tools.evaluate(element => {
      const panelTools = element as HTMLDsPanelToolsElement;
      panelTools.accessories = [
        {
          type: 'divider',
          id: 'session-boundary',
          railPlacement: 'body',
          order: 1.5,
        },
        {
          type: 'transient',
          id: 'active-session',
          railPlacement: 'body',
          order: 1.6,
          ariaLabel: 'Active session',
          visual: { type: 'initial', initial: 'AS' },
          statusText: 'Active for 12 minutes',
          statusTone: 'active',
          primaryAction: { id: 'restore', ariaLabel: 'Restore active session' },
          secondaryAction: {
            id: 'cancel',
            icon: 'PhoneDisconnect',
            ariaLabel: 'Cancel call',
          },
        },
      ];
      element.shadowRoot!.querySelector<HTMLElement>('.panel-tools__rail-body')!.style.maxHeight =
        '96px';
      panelTools.addEventListener('dsRailAccessoryAction', event => {
        const detail = (event as CustomEvent).detail;
        document.documentElement.dataset.lastAccessoryAction = JSON.stringify({
          accessoryId: detail.accessoryId,
          actionId: detail.actionId,
          anchorTag: detail.anchor?.tagName,
        });
      });
    });

    const messages = page.getByRole('button', { name: 'Messages', exact: true });
    const restore = page.getByRole('button', {
      name: 'Restore active session. Active for 12 minutes',
    });
    const cancel = page.getByRole('button', { name: 'Cancel call' });
    const activity = page.getByRole('button', { name: 'Activity', exact: true });
    const divider = tools.locator('.panel-tools__accessory-divider');
    await expect(divider).toHaveAttribute('aria-hidden', 'true');
    const accessoryGeometry = await tools.evaluate(element => {
      const root = element.shadowRoot!;
      const rect = (selector: string) => {
        const bounds = root.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
        return { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height };
      };
      return {
        actions: rect('.panel-tools__rail-actions'),
        divider: rect('.panel-tools__accessory-divider'),
        dividerLine: rect('.panel-tools__accessory-divider ds-divider'),
        accessory: rect('.panel-tools__accessory'),
        primary: rect('.panel-tools__accessory-primary'),
        initial: rect('.panel-tools__accessory-initial'),
        secondary: rect('.panel-tools__accessory-secondary'),
      };
    });
    expectGeometryClose(
      accessoryGeometry.dividerLine.left,
      accessoryGeometry.divider.left,
      'rail accessory divider left edge'
    );
    expectGeometryClose(
      accessoryGeometry.dividerLine.width,
      accessoryGeometry.actions.width,
      'rail accessory divider width'
    );
    expectGeometryClose(accessoryGeometry.accessory.width, 32, 'rail accessory width');
    expectGeometryClose(accessoryGeometry.accessory.height, 64, 'rail accessory height');
    expectGeometryClose(accessoryGeometry.primary.width, 24, 'rail accessory primary action width');
    expectGeometryClose(
      accessoryGeometry.primary.height,
      24,
      'rail accessory primary action height'
    );
    expectGeometryClose(accessoryGeometry.initial.width, 24, 'rail accessory visual width');
    expectGeometryClose(accessoryGeometry.initial.height, 24, 'rail accessory visual height');
    expectGeometryClose(
      accessoryGeometry.secondary.width,
      24,
      'rail accessory secondary action width'
    );
    expectGeometryClose(
      accessoryGeometry.secondary.height,
      24,
      'rail accessory secondary action height'
    );
    expectGeometryClose(
      accessoryGeometry.primary.left - accessoryGeometry.accessory.left,
      4,
      'rail accessory primary inline inset'
    );
    expectGeometryClose(
      accessoryGeometry.primary.top - accessoryGeometry.accessory.top,
      4,
      'rail accessory primary block inset'
    );
    expectGeometryClose(
      accessoryGeometry.secondary.left - accessoryGeometry.accessory.left,
      4,
      'rail accessory secondary inline inset'
    );
    expectGeometryClose(
      accessoryGeometry.secondary.top - accessoryGeometry.primary.top,
      32,
      'rail accessory action rhythm'
    );
    await expect
      .poll(() =>
        cancel.locator('ds-icon').evaluate(element => (element as HTMLDsIconElement).name)
      )
      .toBe('PhoneDisconnect');
    await expect(cancel).not.toHaveClass(/button-unfilled--bordered/);
    await expect(tools.locator('.panel-tools__accessory--transient ds-badge')).toHaveCount(0);

    const transientPaint = await tools.evaluate(element => {
      const root = element.shadowRoot!;
      const accessory = root.querySelector<HTMLElement>('.panel-tools__accessory--transient')!;
      const primary = root.querySelector<HTMLElement>('.panel-tools__accessory-primary')!;
      const probe = document.createElement('span');
      root.append(probe);
      probe.style.backgroundColor = 'var(--color-background-bold-brand)';
      const active = getComputedStyle(probe).backgroundColor;
      probe.style.backgroundColor = 'var(--color-background-bold-positive)';
      const positive = getComputedStyle(probe).backgroundColor;
      probe.style.color = 'var(--color-foreground-on-bold-background-secondary)';
      const foreground = getComputedStyle(probe).color;
      probe.style.color = 'var(--color-border-on-bold-background-secondary)';
      const border = getComputedStyle(probe).color;
      probe.remove();
      return {
        actual: getComputedStyle(accessory).backgroundColor,
        active,
        positive,
        foreground,
        primaryForeground: getComputedStyle(primary).color,
        primaryBorder: getComputedStyle(primary, '::after').boxShadow,
        border,
      };
    });
    expect(transientPaint.actual).toBe(transientPaint.active);
    expect(transientPaint.primaryForeground).toBe(transientPaint.foreground);
    expect(transientPaint.primaryBorder).toContain(transientPaint.border);

    await tools.evaluate(element => {
      const panelTools = element as HTMLDsPanelToolsElement;
      panelTools.accessories = panelTools.accessories.map(accessory =>
        accessory.type === 'transient'
          ? { ...accessory, statusTone: 'positive' as const }
          : accessory
      );
    });
    await expect
      .poll(() =>
        tools
          .locator('.panel-tools__accessory--transient')
          .evaluate(element => getComputedStyle(element).backgroundColor)
      )
      .toBe(transientPaint.positive);

    await messages.focus();
    await messages.press('ArrowDown');
    await expect(restore).toBeFocused();
    expect(
      await restore.evaluate(element => getComputedStyle(element, '::after').outlineStyle)
    ).toBe('solid');
    await restore.press('ArrowDown');
    await expect(cancel).toBeFocused();
    await cancel.press('ArrowDown');
    await expect(activity).toBeFocused();

    await cancel.click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-last-accessory-action',
      JSON.stringify({
        accessoryId: 'active-session',
        actionId: 'cancel',
        anchorTag: 'DS-BUTTON-UNFILLED',
      })
    );

    const scrollRegion = page.getByRole('region', { name: 'Tool shortcuts' });
    await expect(scrollRegion).toHaveAttribute('tabindex', '0');
    await scrollRegion.focus();
    await scrollRegion.press('PageDown');
    await expect.poll(() => scrollRegion.evaluate(element => element.scrollTop)).toBeGreaterThan(0);

    await restore.click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-last-accessory-action',
      JSON.stringify({
        accessoryId: 'active-session',
        actionId: 'restore',
        anchorTag: 'BUTTON',
      })
    );
    await expect(tools).toHaveAttribute('active-tool', 'agents');
    await expect(tools).toHaveAttribute('open');

    await cancel.focus();
    await tools.evaluate(element => {
      (element as HTMLDsPanelToolsElement).accessories = [];
    });
    await expect(cancel).toHaveCount(0);
    await expect(activity).toBeFocused();
    await expect(tools).toHaveAttribute('active-tool', 'agents');
    await expect(tools).toHaveAttribute('open');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await tools.evaluate(element => {
      const panelTools = element as HTMLDsPanelToolsElement;
      panelTools.items = panelTools.items.map(item =>
        item.id === 'messages' ? { ...item, dot: true } : item
      );
      panelTools.accessories = [
        {
          type: 'shortcut',
          id: 'pinned-conversation',
          railPlacement: 'body',
          order: 1.6,
          ariaLabel: 'Pinned conversation',
          initials: 'PCX',
          dot: true,
          action: { id: 'open', ariaLabel: 'Open pinned conversation' },
        },
      ];
    });
    const pinned = page.getByRole('button', { name: 'Open pinned conversation' });
    await expect(pinned).toBeVisible();
    await expect(tools.locator('.panel-tools__shortcut-content ds-text')).toHaveText('PC');
    const shortcutOrb = tools.locator('.panel-tools__shortcut-orb');
    const shortcutDot = tools.locator('.panel-tools__shortcut-dot');
    const toolDot = messages.locator('ds-badge');
    await expect(shortcutOrb).toBeVisible();
    await expect(shortcutDot).toBeVisible();
    await expect(toolDot).toBeVisible();
    const shortcutBounds = await pinned.boundingBox();
    const orbBounds = await shortcutOrb.boundingBox();
    const dotBounds = await shortcutDot.boundingBox();
    const toolBounds = await messages.boundingBox();
    const toolDotBounds = await toolDot.boundingBox();
    expect(shortcutBounds).not.toBeNull();
    expect(orbBounds).not.toBeNull();
    expect(dotBounds).not.toBeNull();
    expect(toolBounds).not.toBeNull();
    expect(toolDotBounds).not.toBeNull();
    if (!shortcutBounds || !orbBounds || !dotBounds || !toolBounds || !toolDotBounds) {
      throw new Error('Shortcut geometry was not measurable');
    }
    expectGeometryClose(shortcutBounds.width, 32, 'rail shortcut width');
    expectGeometryClose(shortcutBounds.height, 32, 'rail shortcut height');
    expectGeometryClose(orbBounds.width, 24, 'rail shortcut orb width');
    expectGeometryClose(orbBounds.height, 24, 'rail shortcut orb height');
    expectGeometryClose(dotBounds.width, 6, 'rail shortcut dot width');
    expectGeometryClose(dotBounds.height, 6, 'rail shortcut dot height');
    expectGeometryClose(
      dotBounds.x - shortcutBounds.x,
      toolDotBounds.x - toolBounds.x,
      'rail shortcut dot inline position'
    );
    expectGeometryClose(
      dotBounds.y - shortcutBounds.y,
      toolDotBounds.y - toolBounds.y,
      'rail shortcut dot block position'
    );

    const shortcutStyle = await pinned.evaluate(element => {
      const style = getComputedStyle(element);
      const probe = document.createElement('span');
      element.append(probe);
      probe.style.color = 'var(--color-foreground-secondary)';
      const foregroundSecondary = getComputedStyle(probe).color;
      probe.remove();
      return {
        animationName: style.animationName,
        backgroundColor: style.backgroundColor,
        borderRadius: Number.parseFloat(style.borderRadius),
        color: style.color,
        foregroundSecondary,
        pressed: element.getAttribute('aria-pressed'),
        transitionDuration: style.transitionDuration,
      };
    });
    expect(shortcutStyle).toMatchObject({
      animationName: 'none',
      backgroundColor: 'rgba(0, 0, 0, 0)',
      color: shortcutStyle.foregroundSecondary,
      pressed: null,
      transitionDuration: '0s',
    });
    expect(shortcutStyle.borderRadius).toBeGreaterThanOrEqual(16);
    const orbStyle = await shortcutOrb.evaluate(element => {
      const style = getComputedStyle(element);
      const probe = document.createElement('span');
      element.append(probe);
      probe.style.color = 'var(--color-border-secondary)';
      const borderSecondary = getComputedStyle(probe).color;
      probe.remove();
      return {
        backgroundColor: style.backgroundColor,
        borderColor: style.borderTopColor,
        borderSecondary,
        borderWidth: style.borderTopWidth,
      };
    });
    expect(orbStyle).toEqual({
      backgroundColor: 'rgba(0, 0, 0, 0)',
      borderColor: orbStyle.borderSecondary,
      borderSecondary: orbStyle.borderSecondary,
      borderWidth: '1px',
    });

    await pinned.hover();
    const interactionPaint = () =>
      pinned.evaluate(element => {
        const probe = document.createElement('span');
        element.append(probe);
        probe.style.color = 'var(--ds-interaction-hover)';
        const hover = getComputedStyle(probe).color;
        probe.style.color = 'var(--ds-interaction-pressed)';
        const pressed = getComputedStyle(probe).color;
        probe.remove();
        return {
          actual: getComputedStyle(element, '::after').backgroundColor,
          hover,
          pressed,
        };
      });
    expect((await interactionPaint()).actual).toBe((await interactionPaint()).hover);
    await page.mouse.down();
    expect((await interactionPaint()).actual).toBe((await interactionPaint()).pressed);
    await page.mouse.up();

    await pinned.click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-last-accessory-action',
      JSON.stringify({
        accessoryId: 'pinned-conversation',
        actionId: 'open',
        anchorTag: 'BUTTON',
      })
    );
    await expect(tools).toHaveAttribute('active-tool', 'agents');
    await expect(tools).toHaveAttribute('open');
    await expect(pinned).not.toHaveAttribute('aria-pressed');
    await expect(pinned).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(pinned).toHaveCSS('color', shortcutStyle.foregroundSecondary);
  });

  test(
    'panel nav dot uses a 20px suffix zone in expanded and collapsed layouts',
    chromiumOnly('layout-geometry', 'The suffix zone is static token-backed navigation geometry.'),
    async ({ page }) => {
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
    }
  );

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

  test(
    'collapsed user initial keeps caption metrics and optical centering',
    chromiumOnly(
      'layout-geometry',
      'Caption metrics and centering are a static compact-navigation recipe.'
    ),
    async ({ page }) => {
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
    }
  );

  test(
    'account menu expansion keeps its resting foreground and pressed overlay in both panel modes',
    chromiumOnly(
      'controlled-behavior',
      'Controlled popup state and token-backed paint are deterministic without browser APIs.'
    ),
    async ({ page }) => {
      const panel = page.locator('#panel');
      const account = page.getByRole('button', { name: 'Account' });

      for (const theme of ['light', 'dark']) {
        await page.locator('html').evaluate((element, nextTheme) => {
          element.dataset['theme'] = nextTheme;
        }, theme);

        for (const collapsed of [false, true]) {
          await panel.evaluate((element, nextCollapsed) => {
            const control = element as HTMLElement & {
              accountMenuExpanded: boolean;
              collapsed: boolean;
            };
            control.accountMenuExpanded = false;
            control.collapsed = nextCollapsed;
          }, collapsed);
          await expect(account).toHaveAttribute('aria-expanded', 'false');

          const resting = await account.evaluate(element => {
            const selected = document.querySelector<HTMLElement>(
              '.panel-nav__body .panel-nav__item--active'
            )!;
            return {
              foreground: getComputedStyle(element).color,
              label: getComputedStyle(
                element.querySelector<HTMLElement>('.panel-nav__footer-user-label')!
              ).color,
              expandedIcon: getComputedStyle(
                element.querySelector<HTMLElement>('.panel-nav__footer-icon-expanded')!
              ).color,
              collapsedIcon: getComputedStyle(
                element.querySelector<HTMLElement>('.panel-nav__footer-icon-collapsed')!
              ).color,
              selectedForeground: getComputedStyle(selected).color,
            };
          });

          await panel.evaluate(element => {
            (element as HTMLElement & { accountMenuExpanded: boolean }).accountMenuExpanded = true;
          });
          await expect(account).toHaveAttribute('aria-expanded', 'true');
          await expect(account).toHaveClass(/panel-nav__footer-user--menu-expanded/);
          await expect(account).not.toHaveClass(/panel-nav__item--active/);

          const expanded = await account.evaluate(element => {
            const probe = document.createElement('span');
            probe.style.backgroundColor = 'var(--color-interaction-pressed)';
            document.body.append(probe);
            const pressed = getComputedStyle(probe).backgroundColor;
            probe.remove();
            return {
              foreground: getComputedStyle(element).color,
              label: getComputedStyle(
                element.querySelector<HTMLElement>('.panel-nav__footer-user-label')!
              ).color,
              expandedIcon: getComputedStyle(
                element.querySelector<HTMLElement>('.panel-nav__footer-icon-expanded')!
              ).color,
              collapsedIcon: getComputedStyle(
                element.querySelector<HTMLElement>('.panel-nav__footer-icon-collapsed')!
              ).color,
              wash: getComputedStyle(element, '::after').backgroundColor,
              pressed,
            };
          });

          expect(expanded).toMatchObject({
            foreground: resting.foreground,
            label: resting.label,
            expandedIcon: resting.expandedIcon,
            collapsedIcon: resting.collapsedIcon,
          });
          expect(expanded.foreground).not.toBe(resting.selectedForeground);
          expect(expanded.wash).toBe(expanded.pressed);
        }
      }
    }
  );

  test('keeps balanced panel geometry, an 8px expanded footer gap, and the same animated user node', async ({
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
    await expect.poll(readGeometry).toMatchObject({
      bodyLeft: 8,
      // The collapsed content box returns 1px to compensate for the rail border,
      // keeping its rendered controls exactly 32px wide.
      bodyRight: 7,
      footerLeft: 8,
      horizontalGap: -32,
      verticalGap: 4,
      marker: 'stable',
    });

    const compactControls = await page.evaluate(() => {
      const settings = document.querySelector('.panel-nav__footer-btn') as HTMLElement;
      const user = document.querySelector('.panel-nav__footer-user') as HTMLElement;
      const settingsRect = settings.getBoundingClientRect();
      const userRect = user.getBoundingClientRect();

      return {
        settingsWidth: settingsRect.width,
        settingsHeight: settingsRect.height,
        userWidth: userRect.width,
        userHeight: userRect.height,
      };
    });

    expect(compactControls.userWidth).toBeCloseTo(compactControls.userHeight, 5);
    expect(compactControls.userWidth).toBeCloseTo(compactControls.settingsWidth, 5);
    expect(compactControls.userHeight).toBeCloseTo(compactControls.settingsHeight, 5);
  });

  test('rapid collapse reversal emits one balanced chrome transition', async ({ page }) => {
    const transitionCounts = await page.evaluate(async () => {
      const shell = document.querySelector('ds-shell-app')!;
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

  test(
    'none preset keeps the solid secondary chrome layer mounted',
    chromiumOnly(
      'layout-geometry',
      'The explicit none preset maps to a deterministic chrome surface recipe.'
    ),
    async ({ page }) => {
      const shell = page.locator('ds-shell-app');
      const chrome = page.locator('.shell-app__chrome');
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
    }
  );

  test(
    'optional paper texture follows the shell chrome viewport layer',
    chromiumOnly(
      'layout-geometry',
      'Paper texture uses the Chromium WebGL2 path when available and has a no-op fallback otherwise.'
    ),
    async ({ page }) => {
      const shell = page.locator('ds-shell-app');
      const paper = page.locator('.shell-app__chrome > ds-paper-texture');

      await shell.evaluate(element => {
        (element as HTMLElement & { paperTexture: Record<string, unknown> }).paperTexture = {
          colorFront: '#b8b8b8',
          colorBack: '#ffffff',
          contrast: 0.3,
          roughness: 0.4,
          fiber: 0.3,
          fiberSize: 0.2,
          crumples: 0.3,
          crumpleSize: 0.35,
          folds: 0.65,
          foldCount: 5,
          fade: 0,
          drops: 0.2,
          seed: 5.8,
          fit: 'cover',
          scale: 0.6,
          speed: 0,
          opacity: 0.2,
        };
      });

      await expect(shell).toHaveClass(/shell-app--paper-texture/);
      await expect(paper).toHaveCount(1);
      await expect(paper).toHaveAttribute('aria-hidden', 'true');
      await expect
        .poll(() =>
          paper.evaluate(element => {
            const canvas = element.querySelector('canvas') as HTMLCanvasElement | null;
            return (
              Boolean(canvas && canvas.width > 0 && canvas.height > 0) ||
              element.hasAttribute('data-paper-texture-error')
            );
          })
        )
        .toBe(true);

      const paperBox = await paper.boundingBox();
      expect(paperBox).toMatchObject({ width: 1280, height: 720 });

      await shell.evaluate(element => {
        (element as HTMLElement & { paperTexture?: Record<string, unknown> }).paperTexture =
          undefined;
      });
      await expect(paper).toHaveCount(0);
      await expect(shell).not.toHaveClass(/shell-app--paper-texture/);
    }
  );

  test(
    'paper texture remounts its shader after reconnecting',
    chromiumOnly(
      'layout-geometry',
      'Reconnect behavior exercises the Chromium WebGL2 shader lifecycle.'
    ),
    async ({ page }) => {
      const shell = page.locator('ds-shell-app');
      const paper = page.locator('.shell-app__chrome > ds-paper-texture');

      await shell.evaluate(element => {
        (element as HTMLElement & { paperTexture: Record<string, unknown> }).paperTexture = {
          speed: 0,
        };
      });

      await expect(paper.locator('canvas')).toHaveCount(1);
      await paper.evaluate(element => {
        const parent = element.parentElement;
        element.remove();
        parent?.append(element);
      });

      await expect(paper.locator('canvas')).toHaveCount(1);
    }
  );

  test(
    'paper texture falls back when an image failed before assignment',
    chromiumOnly(
      'layout-geometry',
      'The fallback is rendered through the Chromium WebGL2 shader path.'
    ),
    async ({ page }) => {
      const precondition = await page.evaluate(async () => {
        const image = new Image();
        image.src = 'data:image/png;base64,broken';
        await new Promise(resolve => {
          image.onload = resolve;
          image.onerror = resolve;
        });

        const paper = document.createElement('ds-paper-texture') as HTMLElement & {
          config: Record<string, unknown>;
        };
        paper.setAttribute('data-e2e-broken-image', '');
        paper.config = { image, speed: 0 };
        document.body.append(paper);

        return { complete: image.complete, naturalWidth: image.naturalWidth };
      });

      expect(precondition).toEqual({ complete: true, naturalWidth: 0 });
      const paper = page.locator('ds-paper-texture[data-e2e-broken-image]');
      await expect(paper.locator('canvas')).toHaveCount(1);
      await expect(paper).not.toHaveAttribute('data-paper-texture-error', 'unavailable');
    }
  );

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

  test('conceals tool content until the requested presentation is committed', async ({ page }) => {
    const tools = page.locator('ds-panel-tools');
    const surface = page.locator('.panel-tools__drawer-surface');

    await page.getByRole('button', { name: 'Agents', exact: true }).click();
    await expect(surface).toBeVisible();

    const entering = await tools.evaluate(element => {
      element.setAttribute('presentation', 'fullscreen');
      const drawerSurface = element.shadowRoot?.querySelector('.panel-tools__drawer-surface');
      return {
        committed: element.classList.contains('panel-tools--fullscreen'),
        visibility: drawerSurface ? getComputedStyle(drawerSurface).visibility : null,
      };
    });

    expect(entering).toEqual({ committed: false, visibility: 'hidden' });
    await expect(tools).toHaveClass(/panel-tools--fullscreen/);
    await expect(surface).toHaveCSS('visibility', 'visible');

    const exiting = await tools.evaluate(element => {
      element.setAttribute('presentation', 'drawer');
      const drawerSurface = element.shadowRoot?.querySelector('.panel-tools__drawer-surface');
      return {
        committed: !element.classList.contains('panel-tools--fullscreen'),
        visibility: drawerSurface ? getComputedStyle(drawerSurface).visibility : null,
      };
    });

    expect(exiting).toEqual({ committed: false, visibility: 'hidden' });
    await expect(tools).not.toHaveClass(/panel-tools--fullscreen/);
    await expect(surface).toHaveCSS('visibility', 'visible');
  });

  test('keeps the complete tool UI opaque until the drawer is fully clipped closed', async ({
    page,
  }) => {
    const host = page.locator('ds-panel-tools');
    const drawer = page.locator('.panel-tools__drawer');
    const header = page.locator('ds-panel-tool-header.panel-tools__header');
    const fullView = page.locator('.panel-tools__full-view:has(slot[name="agents-view"])');
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

  test(
    'uses the same fixed 300px drawer width on desktop and tablet',
    chromiumOnly(
      'layout-geometry',
      'Fixed drawer width is a token-backed local geometry contract.'
    ),
    async ({ page }) => {
      const surface = page.locator('.panel-tools__drawer-surface');
      await page.getByRole('button', { name: 'Agents', exact: true }).click();
      await expect(surface).toHaveCSS('width', '300px');

      await page.setViewportSize({ width: 1000, height: 720 });
      await expect(surface).toHaveCSS('width', '300px');
    }
  );

  test('slash toggles Help outside editable controls', async ({ page }) => {
    await page.keyboard.press('/');
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
