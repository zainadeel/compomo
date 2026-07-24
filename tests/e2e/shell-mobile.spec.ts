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
    await expect(page.locator('.shell-mobile-bar__group')).toHaveCount(2);
    await expect(page.locator('.shell-mobile-bar__dot')).toHaveCount(2);

    const metrics = await page.locator('ds-shell-mobile-bar').evaluate(element => {
      const bar = element.querySelector('.shell-mobile-bar');
      const groups = Array.from(element.querySelectorAll('.shell-mobile-bar__group'));
      const items = Array.from(element.querySelectorAll('.shell-mobile-bar__item'));
      const icons = Array.from(element.querySelectorAll('.shell-mobile-bar__icon'));
      const divider = element.querySelector('.shell-mobile-bar__divider');
      const selected = element.querySelector('.shell-mobile-bar__item--selected');
      const unselected = element.querySelector(
        '.shell-mobile-bar__item:not(.shell-mobile-bar__item--selected)'
      );
      const colorProbe = document.createElement('span');
      element.append(colorProbe);
      colorProbe.style.color = 'var(--color-foreground-primary)';
      const primaryForeground = getComputedStyle(colorProbe).color;
      colorProbe.style.color = 'var(--color-foreground-tertiary)';
      const tertiaryForeground = getComputedStyle(colorProbe).color;
      colorProbe.remove();

      return {
        barGap: bar ? getComputedStyle(bar).gap : '',
        barPaddingInline: bar ? getComputedStyle(bar).paddingInline : '',
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
      };
    });

    expect(metrics.barGap).toBe('16px');
    expect(metrics.barPaddingInline).toBe('16px');
    expect(metrics.groupGaps).toEqual(['8px', '8px']);
    expect(metrics.itemSizes).toEqual(Array.from({ length: 5 }, () => [40, 40]));
    expect(metrics.itemRadii).toEqual(Array.from({ length: 5 }, () => '2px'));
    expect(metrics.iconSizes).toEqual(Array.from({ length: 5 }, () => [24, 24]));
    expect(metrics.dividerHeight).toBe(24);
    expect(metrics.selectedFill).toBe('rgba(0, 0, 0, 0)');
    expect(metrics.selectedForeground).toBe(metrics.primaryForeground);
    expect(metrics.unselectedForeground).toBe(metrics.tertiaryForeground);

    const barBox = await page.locator('ds-shell-mobile-bar').boundingBox();
    expect(barBox).not.toBeNull();
    expect(barBox!.x).toBeGreaterThanOrEqual(0);
    expect(barBox!.x + barBox!.width).toBeLessThanOrEqual(390);
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

  test('layers selected fills below mobile icons, labels, and badges', async ({ page }) => {
    await expectSelectedFillBelowContent(
      page.locator('ds-shell-mobile-section-nav button[aria-current="page"]')
    );

    await page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('button', { name: 'Menu' })
      .click();

    await expectSelectedFillBelowContent(
      page.locator('ds-shell-mobile-nav button[aria-current="page"]')
    );
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

  test('uses a solid primary stage and scrolls the selected route section into view', async ({
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
    await expect(
      page.getByRole('navigation', { name: 'Section navigation' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Live Map' })).toHaveAttribute(
      'aria-current',
      'page'
    );
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
});

declare global {
  interface Window {
    __persistentSearchInput?: HTMLInputElement;
  }
}
