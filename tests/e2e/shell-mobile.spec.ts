import { expect, test, type Locator, type Page } from '@playwright/test';
import { chromiumOnly } from './browser-tier';

async function expectSelectedFillBelowContent(control: Locator) {
  const layers = await control.evaluate(element => ({
    selectedFill: getComputedStyle(element, '::before').backgroundColor,
    selectedFillZIndex: getComputedStyle(element, '::before').zIndex,
    contentZIndexes: Array.from(element.children).map(child => getComputedStyle(child).zIndex),
  }));

  expect(layers.selectedFill).not.toBe('rgba(0, 0, 0, 0)');
  expect(layers.selectedFillZIndex).toBe('1');
  expect(layers.contentZIndexes.length).toBeGreaterThan(0);
  expect(layers.contentZIndexes).toEqual(
    Array.from({ length: layers.contentZIndexes.length }, () => '2')
  );
}

async function expectActiveToolToFillStage(page: Page) {
  const geometry = await page.evaluate(() => {
    const host = document.querySelector('ds-shell-tools');
    const root = host?.shadowRoot;
    const tools = host?.getBoundingClientRect();
    const body = root?.querySelector('.shell-tools__mobile-body')?.getBoundingClientRect();
    const view = root?.querySelector('.shell-tools__view--active')?.getBoundingClientRect();

    return {
      toolsBottom: tools?.bottom,
      bodyBottom: body?.bottom,
      bodyHeight: body?.height,
      viewBottom: view?.bottom,
      viewHeight: view?.height,
    };
  });

  expect(geometry.bodyHeight).toBeGreaterThan(0);
  expect(geometry.bodyBottom).toBeCloseTo(geometry.toolsBottom!, 0);
  expect(geometry.viewBottom).toBeCloseTo(geometry.toolsBottom!, 0);
  expect(geometry.viewHeight).toBeCloseTo(geometry.bodyHeight!, 0);
}

test.describe('Responsive mobile shell foundation', () => {
  test.use({ viewport: { width: 390, height: 760 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/shell-mobile.html');
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('ds-shell-app')).toHaveAttribute('responsive-mode', 'mobile');
  });

  test('fills the dynamic host stage without body scroll and keeps routed scrolling local', async ({
    page,
  }) => {
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
      'content',
      'width=device-width, initial-scale=1, viewport-fit=cover'
    );
    await expect(page.locator('meta[name="theme-color"]')).toHaveCount(2);

    for (const height of [640, 820]) {
      await page.setViewportSize({ width: 390, height });
      await expect(page.locator('#shell')).toHaveAttribute('responsive-mode', 'mobile');
      await expect
        .poll(() =>
          page.evaluate(() => {
            const root = document.querySelector<HTMLElement>('#app-root')!;
            const shell = document.querySelector<HTMLElement>('#shell')!;
            return {
              viewportHeight: window.innerHeight,
              rootHeight: root.getBoundingClientRect().height,
              shellHeight: shell.getBoundingClientRect().height,
              documentClientHeight: document.documentElement.clientHeight,
              documentScrollHeight: document.documentElement.scrollHeight,
              bodyClientHeight: document.body.clientHeight,
              bodyScrollHeight: document.body.scrollHeight,
            };
          })
        )
        .toEqual({
          viewportHeight: height,
          rootHeight: height,
          shellHeight: height,
          documentClientHeight: height,
          documentScrollHeight: height,
          bodyClientHeight: height,
          bodyScrollHeight: height,
        });
    }

    await expect(page.locator('html')).toHaveCSS('overscroll-behavior', 'none');
    await expect(page.locator('body')).toHaveCSS('overscroll-behavior', 'none');
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');

    const content = page.locator('.shell-app__content');
    await content.evaluate(element => {
      element.scrollTop = 160;
    });
    await expect.poll(() => content.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    await expect(content).toHaveCSS('overscroll-behavior', 'none');
  });

  test('repaints the mobile stage after foreground restore without remounting tool state', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Search' }).click();
    const input = page.getByLabel('Persistent search value');
    await input.fill('preserved across resume');

    await page.locator('#shell').evaluate(element => {
      const history: boolean[] = [];
      (
        window as typeof window & { __foregroundRefreshHistory?: boolean[] }
      ).__foregroundRefreshHistory = history;
      new MutationObserver(() => {
        history.push(element.classList.contains('shell-app--foreground-refresh'));
      }).observe(element, { attributes: true, attributeFilter: ['class'] });
    });

    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));

    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as typeof window & { __foregroundRefreshHistory?: boolean[] })
              .__foregroundRefreshHistory
        )
      )
      .toEqual(expect.arrayContaining([true, false]));
    await expect(page.locator('#shell')).not.toHaveClass(/shell-app--foreground-refresh/);
    await expect(input).toHaveValue('preserved across resume');
    await expect(input).toBeVisible();
    await expect(
      input.evaluate(
        element =>
          element ===
          (window as typeof window & { __persistentSearchInput?: HTMLInputElement })
            .__persistentSearchInput
      )
    ).resolves.toBe(true);
  });

  test(
    'renders two fixed icon-only groups without overflow and keeps status dots supplemental',
    chromiumOnly(
      'layout-geometry',
      'Fixed mobile-bar groups, icon sizing, and supplemental dots are static chrome recipes.'
    ),
    async ({ page }) => {
      const primary = page.getByRole('navigation', { name: 'Primary' });
      const buttons = primary.getByRole('button');
      await expect(buttons).toHaveCount(6);
      await expect(buttons.allTextContents()).resolves.toEqual(['', '', '', '', '', '']);
      await expect(
        buttons.evaluateAll(items => items.map(item => item.getAttribute('aria-label')))
      ).resolves.toEqual(['Menu', 'Tracking', 'Search', 'Activity', 'Messages', 'Agents']);
      await expect(page.locator('.mobile-bar-nav__group')).toHaveCount(2);
      await expect(page.locator('.mobile-bar-nav__dot')).toHaveCount(3);

      const metrics = await page.locator('ds-mobile-bar-nav').evaluate(element => {
        const bar = element.querySelector('.mobile-bar-nav');
        const groups = Array.from(element.querySelectorAll('.mobile-bar-nav__group'));
        const items = Array.from(element.querySelectorAll('.mobile-bar-nav__item'));
        const icons = Array.from(element.querySelectorAll('.mobile-bar-nav__icon'));
        const divider = element.querySelector('.mobile-bar-nav__divider');
        const selected = element.querySelector('.mobile-bar-nav__item--selected');
        const unselected = element.querySelector(
          '.mobile-bar-nav__item:not(.mobile-bar-nav__item--selected)'
        );
        const colorProbe = document.createElement('span');
        element.append(colorProbe);
        colorProbe.style.color = 'var(--color-foreground-primary)';
        const primaryForeground = getComputedStyle(colorProbe).color;
        colorProbe.style.color = 'var(--color-foreground-tertiary)';
        const tertiaryForeground = getComputedStyle(colorProbe).color;
        colorProbe.style.backgroundColor = 'var(--color-background-primary)';
        const primaryBackground = getComputedStyle(colorProbe).backgroundColor;
        colorProbe.remove();
        const barRect = bar?.getBoundingClientRect();
        const groupRects = groups.map(group => group.getBoundingClientRect());

        return {
          barGap: bar ? getComputedStyle(bar).gap : '',
          barJustifyContent: bar ? getComputedStyle(bar).justifyContent : '',
          barPaddingInline: bar ? getComputedStyle(bar).paddingInline : '',
          barBackground: bar ? getComputedStyle(bar).backgroundColor : '',
          hostBackground: getComputedStyle(element).backgroundColor,
          groupEdgeInsets:
            barRect && groupRects.length === 2
              ? [
                  Math.round(groupRects[0].left - barRect.left),
                  Math.round(barRect.right - groupRects[1].right),
                ]
              : [],
          groupGaps: groups.map(group => getComputedStyle(group).gap),
          itemSizes: items.map(item => {
            const rect = item.getBoundingClientRect();
            return [rect.width, rect.height];
          }),
          itemRadii: items.map(item => getComputedStyle(item).borderRadius),
          iconSizes: icons.map(icon => {
            const rect = icon.getBoundingClientRect();
            return [rect.width, rect.height];
          }),
          dividerHeight: divider?.getBoundingClientRect().height,
          selectedFill: selected ? getComputedStyle(selected, '::before').backgroundColor : '',
          selectedForeground: selected ? getComputedStyle(selected).color : '',
          unselectedForeground: unselected ? getComputedStyle(unselected).color : '',
          primaryForeground,
          tertiaryForeground,
          primaryBackground,
        };
      });

      expect(metrics.barGap).toBe('8px');
      expect(metrics.barJustifyContent).toBe('space-between');
      expect(metrics.barPaddingInline).toBe('8px');
      expect(metrics.barBackground).toBe(metrics.primaryBackground);
      expect(metrics.hostBackground).toBe(metrics.primaryBackground);
      expect(metrics.groupEdgeInsets).toEqual([8, 8]);
      expect(metrics.groupGaps).toEqual(['8px', '8px']);
      expect(metrics.itemSizes).toEqual(Array.from({ length: 6 }, () => [40, 40]));
      expect(metrics.itemRadii).toEqual(Array.from({ length: 6 }, () => '2px'));
      expect(metrics.iconSizes).toEqual(Array.from({ length: 6 }, () => [24, 24]));
      expect(metrics.dividerHeight).toBe(24);
      expect(metrics.selectedFill).toBe('rgba(0, 0, 0, 0)');
      expect(metrics.selectedForeground).toBe(metrics.primaryForeground);
      expect(metrics.unselectedForeground).toBe(metrics.tertiaryForeground);

      const barBox = await page.locator('ds-mobile-bar-nav').boundingBox();
      expect(barBox).not.toBeNull();
      expect(barBox!.x).toBeGreaterThanOrEqual(0);
      expect(barBox!.x + barBox!.width).toBeLessThanOrEqual(390);

      const dividerInteraction = await page
        .locator('.mobile-bar-nav__divider')
        .evaluate(element => ({
          pointerEvents: getComputedStyle(element).pointerEvents,
          webkitUserSelect: getComputedStyle(element).webkitUserSelect,
        }));
      expect(dividerInteraction).toEqual({
        pointerEvents: 'none',
        webkitUserSelect: 'none',
      });
    }
  );

  test('owns direct-touch press feedback and clears it after a quick tap', async ({ page }) => {
    const menu = page.getByRole('button', { name: 'Menu' });

    await menu.dispatchEvent('pointerdown', {
      pointerId: 41,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
    });
    await expect(menu).toHaveClass(/mobile-bar-nav__item--pressed/);

    await menu.dispatchEvent('pointerup', {
      pointerId: 41,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
    });
    await expect(menu).toHaveClass(/mobile-bar-nav__item--pressed/);
    await expect(menu).not.toHaveClass(/mobile-bar-nav__item--pressed/, {
      timeout: 500,
    });
  });

  test('keeps the bar available over navigation and browsing contexts does not navigate', async ({
    page,
  }) => {
    const menuIcon = page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('button', { name: 'Menu' })
      .locator('ds-icon');
    await expect(menuIcon).toHaveJSProperty('name', 'Hamburger');

    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(menuIcon).toHaveJSProperty('name', 'Cross');
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
    await expect(page.locator('ds-shell-tools')).toHaveAttribute('active-tool', 'search');

    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    await expect(page.locator('ds-shell-tools')).toHaveAttribute('active-tool', 'search');
    await expect(page.getByRole('button', { name: 'Search' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    await expect(page.getByLabel('Persistent search value')).toBeVisible();

    await page.getByRole('button', { name: 'Messages' }).click();
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.locator('ds-shell-tools')).toHaveAttribute('active-tool', 'messages');
    await expect(page.getByRole('button', { name: 'Messages' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    await expect(page.getByText('Messages view', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('button', { name: 'Help & Support' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-selected-area', 'help');
    await expect(page.locator('ds-shell-tools')).toHaveAttribute('active-tool', 'help');
    await expect(page.locator('ds-shell-tools')).toHaveAttribute('open');
    await expect(page.getByRole('button', { name: 'Help & Support' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    await expect(page.getByText('Help view', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  test(
    'uses one icon-only sheet header lane and large-density destination rows',
    chromiumOnly(
      'layout-geometry',
      'Sheet header and destination density are token-backed static geometry.'
    ),
    async ({ page }) => {
      await page.locator('ds-mobile-sheet-nav').evaluate(element => {
        (
          element as HTMLElement & {
            dashboardGroups: Array<{
              id: string;
              items: Array<{ id: string; icon: string; label: string; href: string }>;
            }>;
          }
        ).dashboardGroups = [
          {
            id: 'primary',
            items: [
              {
                id: 'tracking',
                icon: 'MapPage',
                label: 'Tracking',
                href: '/dashboard/tracking',
              },
              {
                id: 'workforce',
                icon: 'Person',
                label: 'Workforce',
                href: '/dashboard/workforce',
              },
            ],
          },
          {
            id: 'administration',
            items: [
              {
                id: 'devices',
                icon: 'Devices',
                label: 'Devices',
                href: '/dashboard/devices',
              },
            ],
          },
        ];
      });

      await page.getByRole('button', { name: 'Menu' }).click();

      const sheet = page.locator('ds-mobile-sheet-nav');
      const tabs = sheet.getByRole('tab');
      await expect(tabs).toHaveCount(2);
      await expect(tabs.allTextContents()).resolves.toEqual(['', '']);
      await expect(
        tabs.evaluateAll(items => items.map(item => item.getAttribute('aria-label')))
      ).resolves.toEqual(['Dashboard', 'Settings']);
      await expect(sheet.getByRole('button', { name: 'Help & Support' })).toHaveText('');
      await expect(sheet.getByRole('button', { name: 'Account' })).toHaveText('');
      await expect(sheet.getByText('Navigation', { exact: true })).toHaveCount(0);

      const headerMetrics = await sheet.evaluate(element => {
        const header = element.querySelector('.mobile-sheet-nav__header');
        const logo = element.querySelector('.mobile-sheet-nav__logo');
        const context = element.querySelector('.mobile-sheet-nav__context');
        const contextTrack = context?.querySelector('.tab-list');
        const contextTabs = Array.from(context?.querySelectorAll('.tab') ?? []);
        const contextIcons = Array.from(context?.querySelectorAll('.tab__icon') ?? []);
        const actions = element.querySelector('.mobile-sheet-nav__actions');
        const logoMark = element.querySelector('.mobile-sheet-nav__logo-mark');
        const actionButtons = Array.from(
          element.querySelectorAll('.mobile-sheet-nav__actions ds-button-unfilled')
        );
        const rects = [logo, context, actions].map(item => item?.getBoundingClientRect());
        return {
          height: header?.getBoundingClientRect().height,
          padding: header ? getComputedStyle(header).padding : '',
          gap: header ? getComputedStyle(header).gap : '',
          centers: rects.map(rect => (rect ? rect.top + rect.height / 2 : 0)),
          logoLeft: rects[0]?.left,
          logoMarkLeft: logoMark?.getBoundingClientRect().left,
          logoMarkSize: logoMark
            ? [logoMark.getBoundingClientRect().width, logoMark.getBoundingClientRect().height]
            : [],
          contextCenter: rects[1] ? rects[1].left + rects[1].width / 2 : 0,
          contextSize: (context as (HTMLElement & { size?: string }) | null)?.size,
          contextTrackHeight: contextTrack?.getBoundingClientRect().height,
          contextTabSizes: contextTabs.map(item => {
            const rect = item.getBoundingClientRect();
            return [rect.width, rect.height];
          }),
          contextIconSizes: contextIcons.map(item => {
            const rect = item.getBoundingClientRect();
            return [rect.width, rect.height];
          }),
          actionsRight: rects[2]?.right,
          actionSizes: actionButtons.map(item => {
            const rect = item.getBoundingClientRect();
            return [rect.width, rect.height];
          }),
          actionIconSizes: actionButtons.map(item => {
            const icon = item.querySelector('ds-icon')?.getBoundingClientRect();
            return icon ? [icon.width, icon.height] : [];
          }),
          headerCenter: header
            ? header.getBoundingClientRect().left + header.getBoundingClientRect().width / 2
            : 0,
          headerRight: header?.getBoundingClientRect().right,
        };
      });

      expect(headerMetrics.height).toBe(56);
      expect(headerMetrics.padding).toBe('8px');
      expect(headerMetrics.gap).toBe('8px');
      expect(headerMetrics.centers[0]).toBeCloseTo(headerMetrics.centers[1], 0);
      expect(headerMetrics.centers[1]).toBeCloseTo(headerMetrics.centers[2], 0);
      expect(headerMetrics.contextCenter).toBeCloseTo(headerMetrics.headerCenter, 0);
      expect(headerMetrics.contextSize).toBe('lg');
      expect(headerMetrics.contextTrackHeight).toBe(40);
      expect(headerMetrics.contextTabSizes.map(size => size[1])).toEqual([36, 36]);
      expect(headerMetrics.contextIconSizes).toEqual([
        [24, 24],
        [24, 24],
      ]);
      expect(headerMetrics.logoLeft).toBe(8);
      expect(headerMetrics.logoMarkLeft).toBe(16);
      expect(headerMetrics.logoMarkSize).toEqual([24, 24]);
      expect(headerMetrics.actionsRight).toBeCloseTo(headerMetrics.headerRight! - 8, 0);
      expect(headerMetrics.actionSizes).toEqual([
        [40, 40],
        [40, 40],
      ]);
      expect(headerMetrics.actionIconSizes).toEqual([
        [24, 24],
        [24, 24],
      ]);

      const sheetMetrics = await sheet.evaluate(element => {
        const body = element.querySelector('.mobile-sheet-nav__body');
        const sectionsContainer = element.querySelector('.mobile-sheet-nav__sections');
        const itemsContainer = element.querySelector('.mobile-sheet-nav__items');
        const sections = Array.from(element.querySelectorAll('.mobile-sheet-nav__items'));
        const items = Array.from(element.querySelectorAll('.mobile-sheet-nav__item'));
        return {
          bodyPadding: body ? getComputedStyle(body).padding : '',
          sectionGap: sectionsContainer ? getComputedStyle(sectionsContainer).gap : '',
          sectionCount: sections.length,
          itemGap: itemsContainer ? getComputedStyle(itemsContainer).gap : '',
          items: items.map(item => {
            const icon = item.querySelector('ds-icon');
            const label = item.querySelector('.mobile-sheet-nav__item-label');
            const itemStyle = getComputedStyle(item);
            const labelStyle = label ? getComputedStyle(label) : null;
            const iconRect = icon?.getBoundingClientRect();
            return {
              height: item.getBoundingClientRect().height,
              paddingInline: itemStyle.paddingInline,
              gap: itemStyle.gap,
              iconSize: iconRect ? [iconRect.width, iconRect.height] : [],
              labelPaddingInline: labelStyle?.paddingInline,
            };
          }),
        };
      });

      expect(sheetMetrics.bodyPadding).toBe('8px');
      expect(sheetMetrics.sectionGap).toBe('32px');
      expect(sheetMetrics.sectionCount).toBe(2);
      expect(sheetMetrics.itemGap).toBe('8px');
      expect(sheetMetrics.items).toEqual([
        {
          height: 40,
          paddingInline: '8px',
          gap: '4px',
          iconSize: [24, 24],
          labelPaddingInline: '4px',
        },
        {
          height: 40,
          paddingInline: '8px',
          gap: '4px',
          iconSize: [24, 24],
          labelPaddingInline: '4px',
        },
        {
          height: 40,
          paddingInline: '8px',
          gap: '4px',
          iconSize: [24, 24],
          labelPaddingInline: '4px',
        },
      ]);
    }
  );

  test(
    'uses the centered section chooser and emphasis-only sheet selection',
    chromiumOnly(
      'layout-geometry',
      'Chooser alignment and selection emphasis are static component recipes.'
    ),
    async ({ page }) => {
      await expect(page.getByRole('button', { name: /Current section: Live Map/ })).toBeVisible();

      await page
        .getByRole('navigation', { name: 'Primary' })
        .getByRole('button', { name: 'Menu' })
        .click();

      const selectedSheetItem = page.locator('ds-mobile-sheet-nav button[aria-current="page"]');
      await expect(selectedSheetItem.locator('ds-text')).toHaveClass(/ds-text--emphasis/);
      await expect(
        selectedSheetItem.evaluate(element => getComputedStyle(element, '::before').backgroundColor)
      ).resolves.toBe('rgba(0, 0, 0, 0)');
    }
  );

  test(
    'keeps local page tabs subordinate to the selected area section',
    chromiumOnly(
      'controlled-behavior',
      'Explicit area and page state map deterministically to the visible section control.'
    ),
    async ({ page }) => {
      await page.locator('#mobile-header').evaluate(header => {
        const mobileHeader = header as HTMLElement & {
          sections: Array<{ id: string; label: string }>;
          value: string;
          subsections: Array<{ id: string; label: string }>;
          subvalue: string;
          sectionsAriaLabel: string;
          subsectionsAriaLabel: string;
        };
        mobileHeader.sections = [
          { id: 'overview', label: 'Overview' },
          { id: 'people', label: 'People' },
          { id: 'timecards', label: 'Timecards' },
        ];
        mobileHeader.value = 'people';
        mobileHeader.sectionsAriaLabel = 'Change Workforce page';
        mobileHeader.subsections = [
          { id: 'drivers', label: 'Drivers' },
          { id: 'managers', label: 'Managers' },
        ];
        mobileHeader.subvalue = 'drivers';
        mobileHeader.subsectionsAriaLabel = 'Change People view';
        mobileHeader.addEventListener('dsSubsectionChange', event => {
          mobileHeader.subvalue = (event as CustomEvent<string>).detail;
        });
      });

      await expect(page.getByRole('heading', { name: 'People', level: 1 })).toBeVisible();
      await expect(
        page.getByRole('button', {
          name: 'Change Workforce page. Current section: People',
        })
      ).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Change People view' })).toBeVisible();
      await page
        .getByRole('button', { name: 'Change People view. Current section: Drivers' })
        .click();
      await expect(page.getByRole('menuitemradio')).toHaveCount(0);
      await expect(page.getByRole('menuitem', { name: 'Drivers' })).toHaveAttribute(
        'aria-current',
        'true'
      );
      await page.getByRole('menuitem', { name: 'Managers' }).click();
      await expect(
        page.getByRole('button', { name: 'Change People view. Current section: Managers' })
      ).toBeVisible();
      await expect(
        page.getByRole('button', {
          name: 'Change Workforce page. Current section: People',
        })
      ).toBeVisible();
    }
  );

  test('opens primary sections in a modal top sheet and preserves local menus @cross-browser', async ({
    page,
  }) => {
    const header = page.locator('#mobile-header');
    await header.evaluate(element => {
      const header = element as HTMLDsMobileHeaderElement;
      header.sections = [
        { id: 'overview', label: 'Overview' },
        { id: 'inactive', label: 'Unavailable', isInactive: true },
        { id: 'events', label: 'Events' },
        { type: 'divider' },
        { id: 'settings', label: 'Settings' },
      ];
      header.value = 'events';
    });
    const trigger = header.getByRole('button', { name: /Current section: Events/ });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(trigger.locator('.mobile-section-switcher__position')).toHaveCount(0);
    await expect(trigger).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(trigger).toHaveCSS('height', '40px');
    await expect(trigger.locator('ds-text')).toHaveJSProperty('variant', 'text-body-large');
    await trigger.click();
    const sheet = header.getByRole('dialog');
    const current = sheet.getByRole('menuitem', { name: 'Events', exact: true });
    await expect(current).toBeFocused();
    await expect(current).toHaveAttribute('aria-current', 'page');
    await expect(sheet.getByRole('menuitem', { name: 'Unavailable' })).toBeDisabled();
    await expect(sheet.locator('ds-icon')).toHaveCount(0);
    await expect(sheet).toHaveCSS('border-radius', '0px');
    await expect(sheet.locator('[role="menu"]')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
    const bounds = await sheet.boundingBox();
    expect(bounds!.x).toBe(0);
    expect(bounds!.y).toBe(0);
    expect(bounds!.width).toBe(390);
    expect(bounds!.height).toBeLessThan(760);
    await expect(current).toHaveCSS('height', '40px');
    await expect(sheet.locator('[role="menu"]')).toHaveCSS('gap', '8px');
    const backdrop = await sheet.evaluate(
      element => getComputedStyle(element, '::backdrop').backgroundColor
    );
    expect(backdrop).not.toBe('rgba(0, 0, 0, 0)');
    await current.press('ArrowUp');
    await expect(sheet.getByRole('menuitem', { name: 'Overview' })).toBeFocused();
    await page.keyboard.press('End');
    await expect(sheet.getByRole('menuitem', { name: 'Settings' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(sheet.getByRole('menuitem', { name: 'Settings' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(sheet).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await expect(header).toHaveJSProperty('value', 'events');
    await trigger.click();
    await expect(current).toBeFocused();
    await page.evaluate(() =>
      document.documentElement.style.setProperty('--effect-motion-short-2', '1s linear')
    );
    const selection = await sheet.getByRole('menuitem', { name: 'Settings' }).evaluate(element => {
      (element as HTMLButtonElement).click();
      return {
        value: (document.querySelector('#mobile-header') as HTMLDsMobileHeaderElement).value,
        open: element.closest('dialog')!.open,
      };
    });
    expect(selection).toEqual({ value: 'settings', open: true });
    const settingsTrigger = header.getByRole('button', { name: /Current section: Settings/ });
    await expect(settingsTrigger).toBeVisible();
    await expect(sheet).toHaveClass(/mobile-section-sheet--closing/);
    await expect(sheet).toBeVisible();
    await expect(sheet).not.toBeVisible();
    await page.evaluate(() =>
      document.documentElement.style.removeProperty('--effect-motion-short-2')
    );
    await expect(settingsTrigger).toBeFocused();
    await expect(header).toHaveJSProperty('value', 'settings');
    await settingsTrigger.click();
    await expect(sheet).toBeVisible();
    await page.mouse.click(195, 650);
    await expect(sheet).not.toBeVisible();
    await expect(settingsTrigger).toBeFocused();
    await settingsTrigger.click();
    await expect(sheet).toBeVisible();
    await page.setViewportSize({ width: 1024, height: 760 });
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 760 });
    await header.evaluate(element => {
      const header = element as HTMLDsMobileHeaderElement;
      header.subsections = [
        { id: 'one', label: 'One' },
        { id: 'two', label: 'Two' },
      ];
      header.subvalue = 'one';
    });
    await expect(settingsTrigger).toHaveAttribute('aria-haspopup', 'menu');
    await settingsTrigger.click();
    await expect(page.getByRole('menuitem', { name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('bounds long section sheets and respects reduced motion and owner removal @cross-browser', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const header = page.locator('#mobile-header');
    await header.evaluate(element => {
      const header = element as HTMLDsMobileHeaderElement;
      header.sections = Array.from({ length: 30 }, (_, index) => ({
        id: String(index),
        label: `Section ${index}`,
      }));
      header.value = '29';
    });
    const trigger = header.getByRole('button', { name: /Current section: Section 29/ });
    await trigger.click();
    const sheet = header.getByRole('dialog');
    await expect(sheet.getByRole('menuitem', { name: 'Section 29', exact: true })).toBeFocused();
    await expect(sheet.locator('[role="menu"]')).toHaveCSS('animation-name', 'none');
    const bounds = await sheet.boundingBox();
    expect(bounds!.height).toBeLessThan(760);
    const list = sheet.locator('[role="menu"]');
    expect(await list.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
    await page.keyboard.press('Home');
    await expect(sheet.getByRole('menuitem', { name: 'Section 0', exact: true })).toBeInViewport();
    await page.keyboard.press('Escape');
    await expect(sheet).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(sheet).toBeVisible();
    await header.evaluate(element => element.remove());
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('button', { name: 'Menu', exact: true })
      .click();
    await expect(page.locator('ds-mobile-sheet-nav')).toBeVisible();
  });

  test('preserves a slotted tool owner and form value across destination and breakpoint changes @pr-critical', async ({
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
    await expect(page.locator('ds-shell-tools')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect
      .poll(() =>
        page.evaluate(
          () => window.__persistentSearchInput === document.getElementById('persistent-value')
        )
      )
      .toBe(true);
    await expect(input).toHaveValue('brake inspection');
  });

  test('stretches Search, Activity, and Messages across the stage and omits fullscreen actions', async ({
    page,
  }) => {
    const tools = page.locator('ds-shell-tools');

    await page.getByRole('button', { name: 'Search' }).click();
    await expect(tools).toHaveCSS('width', '390px');
    await expect(page.locator('#search-view')).toHaveCSS('width', '390px');
    await expectActiveToolToFillStage(page);

    await page.getByRole('button', { name: 'Agents' }).click();
    await expect(page.getByRole('button', { name: 'Enter fullscreen' })).toHaveCount(0);
    await expectActiveToolToFillStage(page);

    await page.getByRole('button', { name: 'Activity' }).click();
    await expect(tools).toHaveAttribute('active-tool', 'activity');
    await expect(page.locator('.shell-tools__view--active')).toHaveCSS('width', '390px');
    await expect(page.getByRole('button', { name: 'Enter fullscreen' })).toHaveCount(0);
    await expectActiveToolToFillStage(page);

    await expect(tools.getByRole('heading', { name: 'Activity' })).toBeVisible();
    await expect(tools.getByRole('tablist', { name: 'Inbox sections' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Messages' }).click();
    await expect(tools).toHaveAttribute('active-tool', 'messages');
    await expect(page.locator('#messages-view')).toHaveCSS('width', '390px');
    await expect(page.getByRole('button', { name: 'Enter fullscreen' })).toHaveCount(0);
    await expectActiveToolToFillStage(page);

    await page.setViewportSize({ width: 900, height: 760 });
    await expect(page.locator('ds-shell-app')).toHaveAttribute('responsive-mode', 'tablet');
    await expect(page.getByRole('button', { name: 'Enter fullscreen' })).toBeVisible();
  });

  test(
    'uses a solid primary stage with the selected route in the mobile header',
    chromiumOnly(
      'layout-geometry',
      'Mobile stage surface and selected-route styling are deterministic chrome recipes.'
    ),
    async ({ page }) => {
      await expect(page.locator('.shell-app__chrome')).toHaveCSS('display', 'none');
      await expect(page.locator('.shell-app__main')).toHaveCSS(
        'background-color',
        'rgb(255, 255, 255)'
      );
      await expect(page.locator('ds-shell-tools')).toHaveCSS(
        'background-color',
        'rgb(255, 255, 255)'
      );
      await expect(page.getByRole('button', { name: /Current section: Live Map/ })).toBeVisible();
      await expect(page.locator('.shell-app__content .mobile-header__primary')).toHaveCSS(
        'height',
        '56px'
      );
      const bottomBarMetrics = await page.locator('.mobile-bar-nav').evaluate(element => {
        const styles = getComputedStyle(element);
        return {
          height: element.getBoundingClientRect().height,
          borderBlockStart: parseFloat(styles.borderBlockStartWidth),
        };
      });
      expect(bottomBarMetrics.height - bottomBarMetrics.borderBlockStart).toBe(56);

      await page.getByRole('button', { name: 'Search' }).click();
      await expect(page.locator('ds-shell-tools .mobile-header__primary')).toHaveCSS(
        'height',
        '56px'
      );

      await page.getByRole('button', { name: 'Menu' }).click();
      await expect(page.locator('.mobile-sheet-nav__header')).toHaveCSS('height', '56px');
    }
  );
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

    const gradientImage = await page
      .locator('.shell-app__chrome')
      .evaluate(element => getComputedStyle(element, '::before').backgroundImage);
    expect(gradientImage).not.toBe('none');

    const closedGeometry = await tools.evaluate(element => {
      const inner = element.shadowRoot?.querySelector('ds-panel-tools');
      const outerRect = element.getBoundingClientRect();
      const innerRect = inner?.getBoundingClientRect();
      return {
        outer: [outerRect.x, outerRect.y, outerRect.width, outerRect.height],
        inner: innerRect ? [innerRect.x, innerRect.y, innerRect.width, innerRect.height] : null,
      };
    });
    expect(closedGeometry.inner).toEqual(closedGeometry.outer);

    await page.getByRole('button', { name: 'Search' }).click();
    await expect(tools).toHaveAttribute('open');
    await expect(innerTools).toHaveAttribute('open');
    await expect(page.locator('#persistent-value')).toBeVisible();
    await expect(page.locator('.shell-app__content')).not.toHaveAttribute('inert', '');

    const openGeometry = await tools.evaluate(element => {
      const inner = element.shadowRoot?.querySelector('ds-panel-tools');
      const outerRect = element.getBoundingClientRect();
      const innerRect = inner?.getBoundingClientRect();
      return {
        outer: [outerRect.x, outerRect.y, outerRect.width, outerRect.height],
        inner: innerRect ? [innerRect.x, innerRect.y, innerRect.width, innerRect.height] : null,
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

  test('forwards presentation before paint and conceals the nested handoff frame', async ({
    page,
  }) => {
    const tools = page.locator('ds-shell-tools');
    const innerTools = tools.locator('ds-panel-tools');
    const surface = innerTools.locator('.panel-tools__drawer-surface');

    await page.getByRole('button', { name: 'Agents' }).click();
    await expect(surface).toBeVisible();

    const entering = await tools.evaluate(element => {
      element.setAttribute('presentation', 'fullscreen');
      const panel = element.shadowRoot?.querySelector('ds-panel-tools');
      const drawerSurface = panel?.shadowRoot?.querySelector('.panel-tools__drawer-surface');
      return {
        forwarded: panel?.getAttribute('presentation'),
        committed: panel?.classList.contains('panel-tools--fullscreen'),
        visibility: drawerSurface ? getComputedStyle(drawerSurface).visibility : null,
      };
    });

    expect(entering).toEqual({
      forwarded: 'fullscreen',
      committed: false,
      visibility: 'hidden',
    });
    await expect(innerTools).toHaveClass(/panel-tools--fullscreen/);
    await expect(surface).toHaveCSS('visibility', 'visible');
  });
});

declare global {
  interface Window {
    __persistentSearchInput?: HTMLInputElement;
  }
}

test.describe('Mobile section input modality', () => {
  test.use({ viewport: { width: 390, height: 760 }, hasTouch: true });

  test('keeps touch focus unpainted through sheet entry and return, then restores keyboard rings @cross-browser', async ({
    page,
  }) => {
    await page.goto('/shell-mobile.html');
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
    const header = page.locator('#mobile-header');
    const trigger = header.getByRole('button', { name: /Current section:/ }).first();
    const outline = (control: Locator) =>
      control.evaluate(element => getComputedStyle(element, '::after').outlineStyle);
    // Begin in keyboard modality to reproduce WebKit's inherited focus-visible state.
    await trigger.focus();
    await trigger.press('Enter');
    const sheet = header.getByRole('dialog');
    await expect(sheet).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).not.toBeVisible();
    await trigger.tap();
    const current = sheet.locator('[aria-current="page"]');
    await expect(current).toBeFocused();
    await expect.poll(() => outline(current)).toBe('none');
    await current.tap();
    await expect(sheet).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await expect.poll(() => outline(trigger)).toBe('none');
    await trigger.press('Enter');
    await expect(current).toBeFocused();
    await expect.poll(() => outline(current)).toBe('solid');
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => outline(sheet.locator('button:focus'))).toBe('solid');
  });

  test('paints the mobile safe area with the supplied banner surface @cross-browser', async ({
    page,
  }) => {
    await page.goto('/shell-mobile.html');
    const shell = page.locator('#shell');
    await expect(shell).toHaveAttribute('responsive-mode', 'mobile');
    const primary = await shell.evaluate(element => getComputedStyle(element).backgroundColor);
    const brand = await shell.evaluate(element => {
      (element as HTMLElement).style.setProperty(
        '--ds-shell-safe-area-background',
        'var(--color-background-faint-brand)'
      );
      return getComputedStyle(element).getPropertyValue('--color-background-faint-brand').trim();
    });
    await expect(shell).not.toHaveCSS('background-color', primary);
    expect(brand).not.toBe('');
    await shell.evaluate(element =>
      (element as HTMLElement).style.removeProperty('--ds-shell-safe-area-background')
    );
    await expect(shell).toHaveCSS('background-color', primary);
  });
});

test.describe('Mobile section browser-edge tint', () => {
  test.use({ viewport: { width: 390, height: 760 }, hasTouch: true });

  test('composites the bottom color independently of the sheet and cleans up through exit @cross-browser', async ({
    page,
  }) => {
    await page.goto('/shell-mobile.html');
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
    const header = page.locator('#mobile-header');
    const trigger = header.getByRole('button', { name: /Current section:/ }).first();
    await page.evaluate(() => {
      document.documentElement.style.setProperty(
        '--color-background-primary',
        'rgb(200, 220, 240)'
      );
      document.documentElement.style.setProperty(
        '--color-background-shade',
        'rgba(20, 40, 60, 0.5)'
      );
    });
    await trigger.tap();
    const sheet = header.getByRole('dialog');
    const edge = sheet.locator('.mobile-section-sheet__browser-edge');
    await expect(edge).toHaveCSS('background-color', 'rgb(110, 130, 150)');
    await expect(sheet.locator('[role="menu"]')).toHaveCSS(
      'background-color',
      'rgb(200, 220, 240)'
    );
    await expect(edge).toHaveCSS('pointer-events', 'none');
    await expect(edge).toHaveAttribute('aria-hidden', 'true');
    await expect
      .poll(async () => {
        const bounds = await edge.boundingBox();
        return bounds && [bounds.x, bounds.width, bounds.y + bounds.height];
      })
      .toEqual([0, 390, 760]);
    // A containing theme can change while the modal remains open.
    await page.evaluate(() =>
      document.documentElement.style.setProperty('--color-background-primary', 'rgb(40, 60, 80)')
    );
    await expect(edge).toHaveCSS('background-color', 'rgb(30, 50, 70)');
    await page.setViewportSize({ width: 390, height: 640 });
    await expect
      .poll(async () => {
        const bounds = await edge.boundingBox();
        return bounds && bounds.y + bounds.height;
      })
      .toBe(640);
    await page.evaluate(() =>
      document.documentElement.style.setProperty('--effect-motion-short-2', '1s linear')
    );
    await sheet.locator('[aria-current="page"]').tap();
    await expect(sheet).toHaveClass(/closing/);
    await expect(edge).toBeVisible();
    await expect(sheet).not.toBeVisible();
    await expect(edge).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await trigger.tap();
    await expect(edge).toHaveCSS('animation-name', 'none');
    await expect(edge).toHaveCSS('background-color', 'rgb(30, 50, 70)');
    // The strip must not intercept backdrop dismissal at the bottom edge.
    await page.touchscreen.tap(195, 638);
    await expect(sheet).not.toBeVisible();
    await trigger.tap();
    await header.evaluate(element => element.remove());
    await expect(page.locator('dialog:modal')).toHaveCount(0);
    await expect(page.locator('.mobile-section-sheet__browser-edge')).toHaveCount(0);
  });
});
