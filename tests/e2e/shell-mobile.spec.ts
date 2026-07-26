import { expect, test, type Locator, type Page } from '@playwright/test';

async function expectSelectedFillBelowContent(control: Locator) {
  const layers = await control.evaluate(element => ({
    selectedFill: getComputedStyle(element, '::before').backgroundColor,
    selectedFillZIndex: getComputedStyle(element, '::before').zIndex,
    contentZIndexes: Array.from(element.children).map(
      child => getComputedStyle(child).zIndex
    ),
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
    const tools = document.querySelector('ds-shell-tools')?.getBoundingClientRect();
    const body = document
      .querySelector('.shell-tools__mobile-body')
      ?.getBoundingClientRect();
    const view = document
      .querySelector('.shell-tools__view--active')
      ?.getBoundingClientRect();

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

  test('renders two fixed icon-only groups without overflow and keeps status dots supplemental', async ({
    page,
  }) => {
    const primary = page.getByRole('navigation', { name: 'Primary' });
    const buttons = primary.getByRole('button');
    await expect(buttons).toHaveCount(5);
    await expect(buttons.allTextContents()).resolves.toEqual(['', '', '', '', '']);
    await expect(buttons.evaluateAll(items => items.map(item => item.getAttribute('aria-label'))))
      .resolves.toEqual([
      'Menu',
      'Tracking',
      'Search',
      'Inbox',
      'Agents',
    ]);
    await expect(page.locator('.mobile-bar-nav__group')).toHaveCount(2);
    await expect(page.locator('.mobile-bar-nav__dot')).toHaveCount(2);

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
      colorProbe.style.backgroundColor = 'var(--color-background-secondary)';
      const secondaryBackground = getComputedStyle(colorProbe).backgroundColor;
      colorProbe.remove();
      const barRect = bar?.getBoundingClientRect();
      const groupRects = groups.map(group => group.getBoundingClientRect());

      return {
        barGap: bar ? getComputedStyle(bar).gap : '',
        barJustifyContent: bar ? getComputedStyle(bar).justifyContent : '',
        barPaddingInline: bar ? getComputedStyle(bar).paddingInline : '',
        barBackground: bar ? getComputedStyle(bar).backgroundColor : '',
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
        selectedFill: selected
          ? getComputedStyle(selected, '::before').backgroundColor
          : '',
        selectedForeground: selected ? getComputedStyle(selected).color : '',
        unselectedForeground: unselected ? getComputedStyle(unselected).color : '',
        primaryForeground,
        tertiaryForeground,
        secondaryBackground,
      };
    });

    expect(metrics.barGap).toBe('16px');
    expect(metrics.barJustifyContent).toBe('space-between');
    expect(metrics.barPaddingInline).toBe('8px');
    expect(metrics.barBackground).toBe(metrics.secondaryBackground);
    expect(metrics.groupEdgeInsets).toEqual([8, 8]);
    expect(metrics.groupGaps).toEqual(['8px', '8px']);
    expect(metrics.itemSizes).toEqual(Array.from({ length: 5 }, () => [40, 40]));
    expect(metrics.itemRadii).toEqual(Array.from({ length: 5 }, () => '2px'));
    expect(metrics.iconSizes).toEqual(Array.from({ length: 5 }, () => [24, 24]));
    expect(metrics.dividerHeight).toBe(24);
    expect(metrics.selectedFill).toBe('rgba(0, 0, 0, 0)');
    expect(metrics.selectedForeground).toBe(metrics.primaryForeground);
    expect(metrics.unselectedForeground).toBe(metrics.tertiaryForeground);

    const barBox = await page.locator('ds-mobile-bar-nav').boundingBox();
    expect(barBox).not.toBeNull();
    expect(barBox!.x).toBeGreaterThanOrEqual(0);
    expect(barBox!.x + barBox!.width).toBeLessThanOrEqual(390);

    const dividerInteraction = await page.locator('.mobile-bar-nav__divider').evaluate(
      element => ({
        pointerEvents: getComputedStyle(element).pointerEvents,
        webkitUserSelect: getComputedStyle(element).webkitUserSelect,
      })
    );
    expect(dividerInteraction).toEqual({
      pointerEvents: 'none',
      webkitUserSelect: 'none',
    });
  });

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
  });

  test('uses one icon-only sheet header lane and large-density destination rows', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Menu' }).click();

    const sheet = page.locator('ds-mobile-sheet-nav');
    const tabs = sheet.getByRole('tab');
    await expect(tabs).toHaveCount(2);
    await expect(tabs.allTextContents()).resolves.toEqual(['', '']);
    await expect(tabs.evaluateAll(items => items.map(item => item.getAttribute('aria-label'))))
      .resolves.toEqual(['Dashboard', 'Settings']);
    await expect(sheet.getByRole('button', { name: 'Help & Support' })).toHaveText('');
    await expect(sheet.getByRole('button', { name: 'Account' })).toHaveText('');
    await expect(sheet.getByText('Navigation', { exact: true })).toHaveCount(0);

    const headerMetrics = await sheet.evaluate(element => {
      const header = element.querySelector('.mobile-sheet-nav__header');
      const logo = element.querySelector('.mobile-sheet-nav__logo');
      const context = element.querySelector('.mobile-sheet-nav__context');
      const actions = element.querySelector('.mobile-sheet-nav__actions');
      const logoMark = element.querySelector('.mobile-sheet-nav__logo-mark');
      const actionButtons = Array.from(
        element.querySelectorAll('.mobile-sheet-nav__actions ds-button-unfilled')
      );
      const rects = [logo, context, actions].map(item => item?.getBoundingClientRect());
      return {
        height: header?.getBoundingClientRect().height,
        centers: rects.map(rect => rect ? rect.top + rect.height / 2 : 0),
        logoLeft: rects[0]?.left,
        logoMarkLeft: logoMark?.getBoundingClientRect().left,
        logoMarkSize: logoMark
          ? [logoMark.getBoundingClientRect().width, logoMark.getBoundingClientRect().height]
          : [],
        contextCenter: rects[1] ? rects[1].left + rects[1].width / 2 : 0,
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

    expect(headerMetrics.height).toBe(72);
    expect(headerMetrics.centers[0]).toBeCloseTo(headerMetrics.centers[1], 0);
    expect(headerMetrics.centers[1]).toBeCloseTo(headerMetrics.centers[2], 0);
    expect(headerMetrics.contextCenter).toBeCloseTo(headerMetrics.headerCenter, 0);
    expect(headerMetrics.logoLeft).toBe(16);
    expect(headerMetrics.logoMarkLeft).toBe(24);
    expect(headerMetrics.logoMarkSize).toEqual([24, 24]);
    expect(headerMetrics.actionsRight).toBeCloseTo(headerMetrics.headerRight! - 16, 0);
    expect(headerMetrics.actionSizes).toEqual([[40, 40], [40, 40]]);
    expect(headerMetrics.actionIconSizes).toEqual([[24, 24], [24, 24]]);

    const sheetMetrics = await sheet.evaluate(element => {
      const body = element.querySelector('.mobile-sheet-nav__body');
      const itemsContainer = element.querySelector('.mobile-sheet-nav__items');
      const items = Array.from(element.querySelectorAll('.mobile-sheet-nav__item'));
      return {
        bodyPadding: body ? getComputedStyle(body).padding : '',
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

    expect(sheetMetrics.bodyPadding).toBe('16px');
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
    ]);
  });

  test('uses the centered section chooser and emphasis-only sheet selection', async ({
    page,
  }) => {
    await expect(
      page.locator('ds-mobile-section-switcher button').getByText('Live Map')
    ).toBeVisible();

    await page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('button', { name: 'Menu' })
      .click();

    const selectedSheetItem = page.locator(
      'ds-mobile-sheet-nav button[aria-current="page"]'
    );
    await expect(selectedSheetItem.locator('ds-text')).toHaveClass(/ds-text--emphasis/);
    await expect(
      selectedSheetItem.evaluate(
        element => getComputedStyle(element, '::before').backgroundColor
      )
    ).resolves.toBe('rgba(0, 0, 0, 0)');
  });

  test('keeps local page tabs subordinate to the selected area section', async ({ page }) => {
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
  });

  test('keeps Help on the persistent tool owner across mobile and wider breakpoints', async ({
    page,
  }) => {
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

    await page.setViewportSize({ width: 1200, height: 760 });
    await expect(page.locator('ds-shell-app')).toHaveAttribute('responsive-mode', 'desktop');
    await expect(page.locator('ds-panel-tools')).toHaveAttribute('active-tool', 'help');
    await expect(page.locator('ds-panel-tools')).toHaveAttribute('open');
    await expect(page.getByText('Help view', { exact: true })).toBeVisible();
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
    await expectActiveToolToFillStage(page);

    await page.getByRole('button', { name: 'Agents' }).click();
    await expect(page.getByRole('button', { name: 'Enter fullscreen' })).toHaveCount(0);
    await expectActiveToolToFillStage(page);

    await page.getByRole('button', { name: 'Inbox' }).click();
    await expect(page.locator('.shell-tools__view--active')).toHaveCSS('width', '390px');
    await expect(page.getByRole('button', { name: 'Enter fullscreen' })).toHaveCount(0);
    await expectActiveToolToFillStage(page);

    await page.setViewportSize({ width: 900, height: 760 });
    await expect(page.locator('ds-shell-app')).toHaveAttribute('responsive-mode', 'tablet');
    await expect(page.getByRole('button', { name: 'Enter fullscreen' })).toBeVisible();
  });

  test('uses a solid primary stage with the selected route in the mobile header', async ({
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
    await expect(page.getByRole('button', { name: /Current section: Live Map/ })).toBeVisible();
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
      const panel = element.querySelector('ds-panel-tools');
      const drawerSurface = panel?.querySelector('.panel-tools__drawer-surface');
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
