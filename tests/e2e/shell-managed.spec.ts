import { expect, test } from '@playwright/test';
import { chromiumOnly } from './browser-tier';

test.describe('Managed application shell', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shell-managed.html');
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  });

  test('wires managed chrome and header capacity at each breakpoint', async ({ page }) => {
    const shell = page.locator('#managed-shell');
    await expect(shell).toHaveJSProperty('composition', 'managed');
    await expect(shell).toHaveAttribute('responsive-mode', 'desktop');
    await expect(shell.locator('ds-panel-nav')).toBeVisible();
    await expect(shell.locator('ds-bar-nav')).toBeVisible();
    await expect(shell.locator('ds-shell-page')).toHaveJSProperty('headerCapacity', 'roomy');
    await expect(shell.getByRole('heading', { level: 1, name: 'Fleet overview' })).toBeVisible();
    await expect(shell.locator('ds-mobile-header')).not.toBeVisible();
    await expect(shell.locator('ds-mobile-bar-nav')).not.toBeVisible();
    await expect(shell.getByRole('main')).toHaveCount(1);

    await shell.getByRole('button', { name: 'Search' }).click();
    await expect(shell.locator('ds-shell-page')).toHaveJSProperty('headerCapacity', 'roomy');
    await expect(shell.locator('ds-panel-tools')).not.toHaveClass(/panel-tools--motion-opening/, {
      timeout: 5000,
    });
    await shell.getByRole('button', { name: 'Search' }).click();
    await expect(shell.locator('ds-panel-tools')).toHaveClass(/panel-tools--motion-closing/);
    await expect(shell.locator('ds-shell-page')).toHaveJSProperty('headerCapacity', 'roomy');
    await expect(shell.locator('ds-panel-tools')).not.toHaveClass(/panel-tools--motion-closing/, {
      timeout: 5000,
    });
    await expect(shell.locator('ds-shell-page')).toHaveJSProperty('headerCapacity', 'roomy');

    await page.setViewportSize({ width: 1024, height: 760 });
    await expect(shell).toHaveAttribute('responsive-mode', 'tablet');
    await expect(shell.locator('ds-panel-nav')).toBeVisible();
    await expect(shell.locator('ds-panel-nav')).toHaveJSProperty('breakpoint', 1200);
    await expect(shell.locator('ds-bar-nav')).toBeVisible();
    await expect(shell.locator('ds-shell-page')).toHaveJSProperty('headerCapacity', 'compact');
    await expect(shell.locator('ds-mobile-header')).not.toBeVisible();

    await shell.getByRole('button', { name: 'Search' }).click();
    await expect(shell.locator('ds-shell-page')).toHaveJSProperty('headerCapacity', 'compact');
    await shell.getByRole('button', { name: 'Search' }).click();
    await expect(shell.locator('ds-shell-page')).toHaveJSProperty('headerCapacity', 'compact');

    await page.setViewportSize({ width: 390, height: 760 });
    await expect(shell).toHaveAttribute('responsive-mode', 'mobile');
    await expect(shell.locator('ds-panel-nav')).not.toBeVisible();
    await expect(shell.locator('ds-bar-nav')).not.toBeVisible();
    await expect(shell.locator('ds-mobile-header[slot="mobile-header"]')).toBeVisible();
    await expect(shell.locator('ds-mobile-bar-nav')).toBeVisible();
  });

  test('switches desktop section navigation without remounting routed or tool content', async ({
    page,
  }) => {
    const shell = page.locator('#managed-shell');
    const pageContent = shell.locator('#managed-page-content');
    await pageContent.evaluate(element => {
      element.dataset.identity = 'preserved';
    });
    await shell.getByRole('button', { name: 'Agents' }).click();
    await shell.locator('#agent-draft').fill('Keep this draft');

    await shell.evaluate(element => {
      (element as HTMLDsShellAppElement).sectionNavigation = 'panel';
    });

    const panel = shell.locator('ds-panel-nav');
    const shellBarTitle = shell.locator('.shell-app__bar > ds-bar-title');
    await expect(panel).toHaveJSProperty('presentation', 'nested');
    await expect(shell.locator('.shell-app__bar > ds-bar-nav')).toHaveCount(0);
    await expect(shellBarTitle).toBeVisible();
    await expect(shellBarTitle).toHaveJSProperty('placement', 'shell-bar');
    await expect(shellBarTitle).toHaveJSProperty('variant', 'compact');
    await expect(shell.locator('ds-shell-page ds-bar-title')).toHaveCount(0);
    await expect(shell.getByText('Current fleet status.', { exact: true })).toHaveCount(0);

    const parent = panel.getByRole('button', { name: 'Tracking' });
    const child = panel.getByRole('button', { name: 'Overview' });
    const otherParent = panel.getByRole('button', { name: 'Safety' });
    await expect(parent).toHaveClass(/panel-nav__item--active/);
    await expect(parent).toHaveAttribute('aria-expanded', 'true');
    await expect(parent.locator('ds-icon')).toHaveCount(1);
    await expect(child).toHaveClass(/panel-nav__item--active/);
    await expect(child).toHaveAttribute('aria-current', 'page');
    await expect(otherParent).toHaveClass(/panel-nav__parent--muted/);
    const secondaryForeground = await otherParent.evaluate(element => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--color-foreground-secondary)';
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });
    await expect(otherParent).toHaveCSS('color', secondaryForeground);

    const maintenanceParent = panel.getByRole('button', { name: 'Maintenance' });
    const trackingAccordion = panel
      .locator('.panel-nav__branch')
      .filter({ hasText: 'Tracking' })
      .locator('.panel-nav__children-accordion');
    const maintenanceAccordion = panel
      .locator('.panel-nav__branch')
      .filter({ hasText: 'Maintenance' })
      .locator('.panel-nav__children-accordion');
    await expect(maintenanceAccordion).toHaveAttribute('aria-hidden', 'true');
    await expect(maintenanceAccordion).toHaveCSS('grid-template-rows', '0px');

    await maintenanceParent.click();
    await expect(maintenanceAccordion).toHaveClass(/panel-nav__children-accordion--open/);
    await expect(maintenanceAccordion).toHaveCSS('transition-property', 'grid-template-rows');
    await expect
      .poll(() => maintenanceAccordion.evaluate(element => element.getBoundingClientRect().height))
      .toBeGreaterThan(0);
    await expect(trackingAccordion).toHaveCSS('grid-template-rows', '0px');
    const childFadeDelays = await maintenanceAccordion
      .locator('.panel-nav__child')
      .evaluateAll(elements =>
        elements.map(element => Number.parseFloat(getComputedStyle(element).transitionDelay))
      );
    expect(childFadeDelays[1]).toBeGreaterThan(childFadeDelays[0]);
    const accordionDuration = await maintenanceAccordion.evaluate(element =>
      Number.parseFloat(getComputedStyle(element).transitionDuration)
    );
    const childFadeDuration = await maintenanceAccordion
      .locator('.panel-nav__child')
      .first()
      .evaluate(element => Number.parseFloat(getComputedStyle(element).transitionDuration));
    expect(childFadeDelays[0]).toBeCloseTo(accordionDuration / 2);
    expect(childFadeDelays.at(-1)).toBeGreaterThan(childFadeDelays[0]);
    expect(childFadeDuration).toBeCloseTo(accordionDuration);
    expect(childFadeDelays[1] - childFadeDelays[0]).toBeCloseTo(childFadeDuration / 10);
    const childHeights = await maintenanceAccordion
      .locator('.panel-nav__child')
      .evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height));
    expect(childHeights).toEqual([32, 32]);
    await expect(maintenanceAccordion.locator('.panel-nav__child').first()).toHaveCSS(
      'flex-shrink',
      '0'
    );
    await expect(maintenanceAccordion.locator('.panel-nav__child').first()).toHaveCSS(
      'transform',
      'none'
    );
    const childFadeOutDelays = await trackingAccordion
      .locator('.panel-nav__child')
      .evaluateAll(elements =>
        elements.map(element => Number.parseFloat(getComputedStyle(element).transitionDelay))
      );
    expect(childFadeOutDelays[0]).toBeGreaterThan(childFadeOutDelays[1]);
    const [accordionCollapseDelay, closingChildFadeDuration] = await Promise.all([
      trackingAccordion.evaluate(element =>
        Number.parseFloat(getComputedStyle(element).transitionDelay)
      ),
      trackingAccordion
        .locator('.panel-nav__child')
        .first()
        .evaluate(element => Number.parseFloat(getComputedStyle(element).transitionDuration)),
    ]);
    expect(accordionCollapseDelay).toBeCloseTo(accordionDuration / 2);
    expect(closingChildFadeDuration).toBeCloseTo(childFadeDuration);
    const [closingChildColor, mutedParentColor] = await Promise.all([
      trackingAccordion
        .locator('.panel-nav__child')
        .first()
        .evaluate(element => getComputedStyle(element).color),
      panel
        .getByRole('button', { name: 'Tracking' })
        .evaluate(element => getComputedStyle(element).color),
    ]);
    expect(closingChildColor).toBe(mutedParentColor);

    const followingParent = panel.getByRole('button', { name: 'Reports' });
    const [expandedAccordionHeight, followingTopBeforeCollapse] = await Promise.all([
      maintenanceAccordion.evaluate(element => element.getBoundingClientRect().height),
      followingParent.evaluate(element => element.getBoundingClientRect().top),
    ]);
    await panel.evaluate(element => (element as HTMLDsPanelNavElement).toggleCollapsed());
    const panelFrame = panel.locator('.panel-nav');
    await expect(panelFrame).toHaveClass(/panel-nav--collapsed/);
    await expect(panelFrame).toHaveClass(/panel-nav--animating/);
    await expect(maintenanceAccordion).toHaveCount(1);
    const [accordionCollapseDuration, panelCollapseDuration] = await Promise.all([
      maintenanceAccordion.evaluate(element =>
        Number.parseFloat(getComputedStyle(element).transitionDuration)
      ),
      panelFrame.evaluate(element =>
        Number.parseFloat(getComputedStyle(element).transitionDuration)
      ),
    ]);
    expect(accordionCollapseDuration).toBeCloseTo(panelCollapseDuration);
    await page.waitForTimeout(100);
    const [midCollapseHeight, followingTopMidCollapse] = await Promise.all([
      maintenanceAccordion.evaluate(element => element.getBoundingClientRect().height),
      followingParent.evaluate(element => element.getBoundingClientRect().top),
    ]);
    expect(midCollapseHeight).toBeGreaterThan(0);
    expect(midCollapseHeight).toBeLessThan(expandedAccordionHeight);
    expect(followingTopMidCollapse).toBeLessThan(followingTopBeforeCollapse);
    await expect(panelFrame).not.toHaveClass(/panel-nav--animating/, { timeout: 5000 });
    await expect(maintenanceAccordion).toHaveCount(0);

    await shell.evaluate(element => {
      (element as HTMLDsShellAppElement).sectionNavigation = 'bar';
    });
    await expect(shell.locator('.shell-app__bar > ds-bar-nav')).toBeVisible();
    await expect(shell.locator('ds-shell-page ds-bar-title')).toBeVisible();
    await expect(otherParent).not.toHaveClass(/panel-nav__parent--muted/);
    await expect(pageContent).toHaveAttribute('data-identity', 'preserved');
    await expect(shell.locator('#agent-draft')).toHaveValue('Keep this draft');
    await expect(shell.locator('ds-shell-tools')).toHaveAttribute('active-tool', 'agents');
    await expect(shell.locator('ds-shell-tools')).toHaveAttribute('open');
  });

  test(
    'animates positional nested dividers without changing collapsed presentation',
    chromiumOnly(
      'component-composition',
      'Nested branch divider placement is deterministic markup and token-backed CSS.'
    ),
    async ({ page }) => {
      const shell = page.locator('#managed-shell');
      await shell.evaluate(element => {
        (element as HTMLDsShellAppElement).sectionNavigation = 'panel';
      });
      const panel = shell.locator('ds-panel-nav');
      const trackingBranch = panel.locator('.panel-nav__branch').filter({ hasText: 'Tracking' });
      const maintenanceBranch = panel
        .locator('.panel-nav__branch')
        .filter({ hasText: 'Maintenance' });
      const reportsBranch = panel.locator('.panel-nav__branch').filter({ hasText: 'Reports' });
      const trackingAccordion = trackingBranch.locator('.panel-nav__children-accordion');
      const trackingAfterDivider = trackingBranch.locator('.panel-nav__branch-divider--after');
      const maintenanceBeforeDivider = maintenanceBranch.locator(
        '.panel-nav__branch-divider--before'
      );
      const maintenanceAfterDivider = maintenanceBranch.locator(
        '.panel-nav__branch-divider--after'
      );
      const reportsBeforeDivider = reportsBranch.locator('.panel-nav__branch-divider--before');

      await expect(trackingBranch.locator('.panel-nav__branch-divider--before')).toHaveCount(0);
      await expect(trackingAfterDivider).toHaveClass(/panel-nav__branch-divider--open/);
      await expect(trackingAfterDivider).toHaveCSS('opacity', '1');
      const trackingChildren = trackingAccordion.locator('.panel-nav__children');
      const trackingFirstChild = trackingAccordion.locator('.panel-nav__child').first();
      await expect(trackingChildren).toHaveCSS('row-gap', '4px');
      await expect(trackingFirstChild).toHaveCSS('margin-block-start', '4px');
      const [trackingParentBox, trackingFirstChildBox, trackingSecondChildBox] = await Promise.all([
        trackingBranch.getByRole('button', { name: 'Tracking', exact: true }).boundingBox(),
        trackingFirstChild.boundingBox(),
        trackingAccordion.locator('.panel-nav__child').nth(1).boundingBox(),
      ]);
      expect(trackingParentBox).not.toBeNull();
      expect(trackingFirstChildBox).not.toBeNull();
      expect(trackingSecondChildBox).not.toBeNull();
      expect(
        trackingFirstChildBox!.y - (trackingParentBox!.y + trackingParentBox!.height)
      ).toBeCloseTo(4);
      expect(
        trackingSecondChildBox!.y - (trackingFirstChildBox!.y + trackingFirstChildBox!.height)
      ).toBeCloseTo(4);
      const [trackingAccordionBox, trackingDividerLineBox, safetyParentBox] = await Promise.all([
        trackingBranch.locator('.panel-nav__children-accordion').boundingBox(),
        trackingAfterDivider.locator('.panel-nav__branch-divider-line').boundingBox(),
        panel.getByRole('button', { name: 'Safety', exact: true }).boundingBox(),
      ]);
      expect(trackingAccordionBox).not.toBeNull();
      expect(trackingDividerLineBox).not.toBeNull();
      expect(safetyParentBox).not.toBeNull();
      const trackingDividerSpacing = {
        before:
          trackingDividerLineBox!.y - (trackingAccordionBox!.y + trackingAccordionBox!.height),
        after: safetyParentBox!.y - (trackingDividerLineBox!.y + trackingDividerLineBox!.height),
      };
      expect(trackingDividerSpacing.before).toBeCloseTo(trackingDividerSpacing.after);
      expect(trackingDividerSpacing.before).toBeCloseTo(8);

      await expect(maintenanceBeforeDivider).toHaveCSS('grid-template-rows', '0px');
      await expect(maintenanceAfterDivider).toHaveCSS('grid-template-rows', '0px');

      await panel.getByRole('button', { name: 'Maintenance', exact: true }).click();
      await expect(maintenanceBeforeDivider).toHaveClass(/panel-nav__branch-divider--open/);
      await expect(maintenanceAfterDivider).toHaveClass(/panel-nav__branch-divider--open/);
      await expect(maintenanceBeforeDivider).toHaveCSS(
        'transition-property',
        'grid-template-rows, opacity'
      );
      await expect(maintenanceBeforeDivider).toHaveCSS('opacity', '1');
      await expect(maintenanceAfterDivider).toHaveCSS('opacity', '1');

      await panel.getByRole('button', { name: 'Reports', exact: true }).click();
      await expect(reportsBeforeDivider).toHaveClass(/panel-nav__branch-divider--open/);
      await expect(reportsBeforeDivider).toHaveCSS('opacity', '1');
      await expect(reportsBranch.locator('.panel-nav__branch-divider--after')).toHaveCount(0);
      await panel.getByRole('button', { name: 'Tracking', exact: true }).click();
      await expect(trackingAfterDivider).toHaveClass(/panel-nav__branch-divider--open/);
      await expect(trackingAfterDivider).toHaveCSS('opacity', '1');
      const expandedDividerHeight = await trackingAfterDivider.evaluate(
        element => element.getBoundingClientRect().height
      );
      expect(expandedDividerHeight).toBeGreaterThan(0);
      await trackingAfterDivider.evaluate(element => {
        (element as HTMLElement).dataset.motionIdentity = 'stable';
      });

      await panel.evaluate(element => (element as HTMLDsPanelNavElement).toggleCollapsed());
      const panelFrame = panel.locator('.panel-nav');
      await expect(panelFrame).toHaveClass(/panel-nav--collapsed/);
      await expect(panelFrame).toHaveClass(/panel-nav--animating/);
      const [dividerCollapseDuration, panelCollapseDuration] = await Promise.all([
        trackingAfterDivider.evaluate(element =>
          Number.parseFloat(getComputedStyle(element).transitionDuration)
        ),
        panelFrame.evaluate(element =>
          Number.parseFloat(getComputedStyle(element).transitionDuration)
        ),
      ]);
      expect(dividerCollapseDuration).toBeGreaterThan(0);
      expect(dividerCollapseDuration).toBeCloseTo(panelCollapseDuration);
      await expect(panelFrame).not.toHaveClass(/panel-nav--animating/, { timeout: 5000 });
      await expect(panel.locator('.panel-nav__branch-divider--open')).toHaveCount(0);
      await expect(trackingAfterDivider).toHaveAttribute('data-motion-identity', 'stable');
      await expect(trackingAfterDivider).toHaveCSS('grid-template-rows', '0px');
      await expect(trackingAfterDivider).toHaveCSS('opacity', '0');

      await panel.evaluate(element => (element as HTMLDsPanelNavElement).toggleCollapsed());
      await expect(panelFrame).not.toHaveClass(/panel-nav--collapsed/);
      await expect(panelFrame).toHaveClass(/panel-nav--animating/);
      await expect(trackingAfterDivider).toHaveAttribute('data-motion-identity', 'stable');
      await expect(trackingAccordion).toHaveCount(1);
      await page.waitForTimeout(100);
      const midExpandHeight = await trackingAccordion.evaluate(
        element => element.getBoundingClientRect().height
      );
      expect(midExpandHeight).toBeGreaterThan(0);
      expect(midExpandHeight).toBeLessThan(trackingAccordionBox!.height);
      const dividerExpandDuration = await trackingAfterDivider.evaluate(element =>
        Number.parseFloat(getComputedStyle(element).transitionDuration)
      );
      expect(dividerExpandDuration).toBeGreaterThan(0);
      expect(dividerExpandDuration).toBeCloseTo(panelCollapseDuration);
      await expect(panelFrame).not.toHaveClass(/panel-nav--animating/, { timeout: 5000 });
      await expect(trackingAfterDivider).toHaveAttribute('data-motion-identity', 'stable');
      await expect(trackingAfterDivider).toHaveClass(/panel-nav__branch-divider--open/);
      await expect(trackingAfterDivider).toHaveCSS('opacity', '1');
      await expect
        .poll(() =>
          trackingAfterDivider.evaluate(element => element.getBoundingClientRect().height)
        )
        .toBeCloseTo(expandedDividerHeight);
    }
  );

  test('resolves page content geometry from desktop title placement @cross-browser', async ({
    page,
  }) => {
    const shell = page.locator('#managed-shell');
    const shellPage = shell.locator('ds-shell-page');
    const content = shellPage.locator('.shell-page__content');
    const resolvedContentOffset = () =>
      shellPage.evaluate(element => {
        const probe = document.createElement('div');
        probe.style.position = 'absolute';
        probe.style.height = 'var(--ds-shell-page-content-block-start-offset)';
        element.append(probe);
        const height = probe.getBoundingClientRect().height;
        probe.remove();
        return height;
      });
    const reportedHeaderHeight = () =>
      shellPage.evaluate(element =>
        Number.parseFloat(
          getComputedStyle(element).getPropertyValue('--ds-shell-page-sticky-header-block-size')
        )
      );

    await shell.evaluate(element => {
      const managed = element as HTMLDsShellAppElement;
      managed.pageChrome = {
        ...managed.pageChrome,
        contentInsetBlockStart: 'default',
        contentInsetBlockStartSize: 'var(--dimension-space-025)',
        scrollCompaction: false,
      };
    });
    await expect(content).toHaveCSS('padding-top', '2px');
    await expect.poll(reportedHeaderHeight).toBeGreaterThan(48);

    await shell.evaluate(element => {
      (element as HTMLDsShellAppElement).sectionNavigation = 'panel';
    });
    await expect(shellPage).toHaveJSProperty('desktopHeaderPlacement', 'shell-bar');
    await expect(shellPage).toHaveClass(/shell-page-host--header-compact/);
    await expect(content).toHaveCSS('padding-top', '32px');
    await expect.poll(reportedHeaderHeight).toBe(0);
    await expect.poll(resolvedContentOffset).toBe(32);

    await page.setViewportSize({ width: 1024, height: 760 });
    await expect(shell).toHaveAttribute('responsive-mode', 'tablet');
    await expect(content).toHaveCSS('padding-top', '16px');
    await expect.poll(reportedHeaderHeight).toBe(0);
    await expect.poll(resolvedContentOffset).toBe(16);

    await page.setViewportSize({ width: 390, height: 760 });
    await expect(shell).toHaveAttribute('responsive-mode', 'mobile');
    await expect(content).toHaveCSS('padding-top', '16px');
    await expect.poll(reportedHeaderHeight).toBeGreaterThan(0);
    await expect.poll(resolvedContentOffset).toBeGreaterThan(16);

    await page.setViewportSize({ width: 1440, height: 760 });
    await shell.evaluate(element => {
      (element as HTMLDsShellAppElement).sectionNavigation = 'bar';
    });
    await expect(shellPage).toHaveJSProperty('desktopHeaderPlacement', 'page');
    await expect(content).toHaveCSS('padding-top', '2px');
    await expect.poll(reportedHeaderHeight).toBeGreaterThan(48);
  });

  test('waits for a flyout child selection before collapsed parent navigation', async ({
    page,
  }) => {
    const shell = page.locator('#managed-shell');
    await shell.evaluate(element => {
      const managed = element as HTMLDsShellAppElement;
      managed.sectionNavigation = 'panel';
      managed.navigation = {
        ...managed.navigation,
        currentUrl: '/dashboard/tracking/history',
      };
      managed.pageChrome = {
        ...managed.pageChrome,
        value: 'history',
        currentUrl: '/dashboard/tracking/history',
      };
      document.documentElement.removeAttribute('data-last-event');
    });
    const panel = shell.locator('ds-panel-nav');
    await expect(panel).toHaveJSProperty('currentUrl', '/dashboard/tracking/history');
    await panel.evaluate(element => {
      (element as HTMLDsPanelNavElement).collapsed = true;
    });

    const tracking = panel.getByRole('button', { name: 'Tracking' });
    await expect
      .poll(() =>
        tracking.evaluate(element => {
          const rect = element.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        })
      )
      .toEqual({ width: 32, height: 32 });
    await expect
      .poll(async () => {
        const [itemBox, dotBox] = await Promise.all([
          tracking.boundingBox(),
          tracking.locator('ds-badge').boundingBox(),
        ]);
        return {
          x: dotBox!.x - itemBox!.x,
          y: dotBox!.y - itemBox!.y,
        };
      })
      .toEqual({ x: 20, y: 6 });
    await tracking.focus();
    await tracking.press('Enter');

    const flyout = panel.getByRole('menu', { name: 'Tracking sections' });
    await expect(flyout).toBeVisible();
    await expect(tracking).toHaveAttribute('aria-expanded', 'true');
    await expect(tracking).toHaveClass(/panel-nav__parent--flyout-active/);
    const openFill = await tracking.evaluate(element => {
      const probe = document.createElement('span');
      probe.style.backgroundColor = 'var(--color-interaction-pressed)';
      document.body.append(probe);
      const pressed = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return {
        fill: getComputedStyle(element, '::after').backgroundColor,
        pressed,
      };
    });
    expect(openFill.fill).toBe(openFill.pressed);
    await expect
      .poll(async () => {
        const [panelBox, flyoutBox] = await Promise.all([
          panel.boundingBox(),
          flyout.boundingBox(),
        ]);
        return flyoutBox!.x - (panelBox!.x + panelBox!.width);
      })
      .toBeCloseTo(4, 0);
    await expect
      .poll(async () => {
        const [parentBox, firstChildBox] = await Promise.all([
          tracking.boundingBox(),
          flyout.getByRole('menuitemradio', { name: 'Overview' }).boundingBox(),
        ]);
        return firstChildBox!.y - parentBox!.y;
      })
      .toBeCloseTo(0, 0);
    await expect(page.locator('html')).not.toHaveAttribute('data-last-event');
    await expect(panel).toHaveJSProperty('currentUrl', '/dashboard/tracking/history');
    await expect(flyout.getByRole('menuitemradio', { name: 'History' })).toBeFocused();

    await tracking.click();
    await expect(flyout).toBeHidden();
    await expect(tracking).toHaveAttribute('aria-expanded', 'false');
    await expect(tracking).not.toHaveClass(/panel-nav__parent--flyout-active/);
    await expect(page.locator('html')).not.toHaveAttribute('data-last-event');

    await tracking.click();
    await expect(flyout).toBeVisible();
    await flyout.getByRole('menuitemradio', { name: 'Overview' }).click();
    await expect(flyout).toBeHidden();
    await expect(page.locator('html')).toHaveAttribute(
      'data-last-event',
      JSON.stringify({
        type: 'dsNavChildSelect',
        detail: {
          parentId: 'tracking',
          childId: 'overview',
          href: '/dashboard/tracking/overview',
        },
      })
    );
    await expect(panel).toHaveJSProperty('currentUrl', '/dashboard/tracking/overview');
  });

  test('reports the active mobile header height to viewport-fitted page content', async ({
    page,
  }) => {
    const shell = page.locator('#managed-shell');
    const shellPage = shell.locator('ds-shell-page');

    await page.setViewportSize({ width: 390, height: 760 });
    await expect(shell).toHaveAttribute('responsive-mode', 'mobile');
    await expect(shellPage.locator('ds-mobile-header')).toBeVisible();

    await expect
      .poll(() =>
        shellPage.evaluate(element => {
          const mobileHeader = element.querySelector<HTMLElement>('.shell-page__mobile-header');
          const reportedHeight = Number.parseFloat(
            getComputedStyle(element).getPropertyValue('--ds-shell-page-sticky-header-block-size')
          );
          return Math.abs(reportedHeight - (mobileHeader?.getBoundingClientRect().height ?? 0));
        })
      )
      .toBeLessThan(0.5);
  });

  test('keeps raised routed content beneath the sticky mobile header @pr-critical', async ({
    page,
  }) => {
    const shell = page.locator('#managed-shell');
    const shellPage = shell.locator('ds-shell-page');
    const scroller = shell.locator('.shell-app__content');
    const stickyHeader = shellPage.locator('.shell-page__sticky-header');

    await page.setViewportSize({ width: 390, height: 760 });
    await expect(shell).toHaveAttribute('responsive-mode', 'mobile');
    await shell.locator('#managed-page-content').evaluate(element => {
      element.style.position = 'relative';
      element.style.zIndex = 'var(--dimension-z-index-raised)';
    });
    await scroller.evaluate(element => {
      element.scrollTop = 300;
    });

    await expect
      .poll(() =>
        stickyHeader.evaluate(element => {
          const bounds = element.getBoundingClientRect();
          const stack = document.elementsFromPoint(
            bounds.left + bounds.width / 2,
            bounds.top + bounds.height / 2
          );
          const routedContent = document.querySelector('#managed-page-content');
          const headerIndex = stack.indexOf(element);
          const contentIndex = routedContent ? stack.indexOf(routedContent) : -1;
          return headerIndex >= 0 && contentIndex > headerIndex;
        })
      )
      .toBe(true);
  });

  test('expands mobile child routes without navigating in nested mode @pr-critical', async ({
    page,
  }) => {
    const shell = page.locator('#managed-shell');
    await page.setViewportSize({ width: 390, height: 760 });
    await shell.evaluate(element => {
      (element as HTMLDsShellAppElement).sectionNavigation = 'panel';
    });
    const header = shell.locator('ds-mobile-header[slot="mobile-header"]');
    await expect(
      header.getByRole('heading', { name: 'Fleet overview', exact: true })
    ).toBeVisible();
    await expect(header.getByRole('button', { name: /Current section: Overview/ })).toHaveCount(0);
    await shell.getByRole('button', { name: 'Menu', exact: true }).click();
    const sheet = shell.locator('ds-mobile-sheet-nav');
    const tracking = sheet.getByRole('button', { name: 'Tracking', exact: true });
    const maintenance = sheet.getByRole('button', { name: 'Maintenance', exact: true });
    await expect(sheet.locator('ds-icon[name="ChevronDown"]')).toHaveCount(0);
    const trackingBranch = sheet.locator('.mobile-sheet-nav__branch').filter({
      has: page.getByRole('button', { name: 'Tracking', exact: true }),
    });
    const maintenanceBranch = sheet
      .locator('.mobile-sheet-nav__branch')
      .filter({ has: page.getByRole('button', { name: 'Maintenance', exact: true }) });
    await expect(trackingBranch.locator('.mobile-sheet-nav__divider--before')).toHaveCount(0);
    await expect(trackingBranch.locator('.mobile-sheet-nav__divider--after')).toHaveCSS(
      'opacity',
      '1'
    );
    await expect(tracking).toHaveAttribute('aria-expanded', 'true');
    await expect(sheet.getByRole('button', { name: 'Overview', exact: true })).toHaveAttribute(
      'aria-current',
      'page'
    );
    const before = await page.locator('html').getAttribute('data-last-event');
    await maintenance.click();
    await expect(maintenance).toHaveAttribute('aria-expanded', 'true');
    await expect(tracking).toHaveAttribute('aria-expanded', 'false');
    for (const position of ['before', 'after']) {
      const divider = maintenanceBranch.locator(`.mobile-sheet-nav__divider--${position}`);
      await expect(divider).toHaveCSS('opacity', '1');
      await expect(divider).toHaveCSS('transition-property', 'grid-template-rows, opacity');
      await expect(divider).toHaveCSS('transition-duration', '0.5s, 0.5s');
    }
    await expect(trackingBranch.locator('.mobile-sheet-nav__divider--after')).toHaveCSS(
      'grid-template-rows',
      '0px'
    );
    expect(await page.locator('html').getAttribute('data-last-event')).toBe(before);
    const group = sheet.getByRole('group', { name: 'Maintenance', exact: true });
    const child = group.getByRole('button', { name: 'Schedules', exact: true });
    await expect(child).toHaveCSS('height', '40px');
    const animation = await child.evaluate(element => ({
      duration: getComputedStyle(element).transitionDuration,
      delay: getComputedStyle(element).transitionDelay,
    }));
    expect(animation.duration).toContain('0.5s');
    expect(animation.delay).toContain('0.3s');
    await child.focus();
    await child.press('ArrowLeft');
    await expect(maintenance).toBeFocused();
    await expect(maintenance).toHaveAttribute('aria-expanded', 'false');
    await expect(maintenanceBranch.locator('.mobile-sheet-nav__divider--before')).toHaveCSS(
      'opacity',
      '0'
    );
    await expect(maintenanceBranch.locator('.mobile-sheet-nav__divider--after')).toHaveCSS(
      'grid-template-rows',
      '0px'
    );
    await maintenance.press('Enter');
    await child.click();
    await expect(shell.getByRole('button', { name: 'Menu', exact: true })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    await expect
      .poll(() =>
        shell.evaluate(element => (element as HTMLDsShellAppElement).navigation.currentUrl)
      )
      .toBe('/dashboard/maintenance/schedules');
    await shell.getByRole('button', { name: 'Menu', exact: true }).click();
    await expect(maintenance).toHaveAttribute('aria-expanded', 'true');
    await expect(child).toHaveAttribute('aria-current', 'page');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(child).toHaveCSS('transition-duration', '0s');
    await shell.evaluate(element => {
      (element as HTMLDsShellAppElement).sectionNavigation = 'bar';
    });
    await expect(maintenance).not.toHaveAttribute('aria-expanded');
    await expect(sheet.locator('.mobile-sheet-nav__child')).toHaveCount(0);
    await sheet.getByRole('button', { name: 'Safety', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-last-event',
      JSON.stringify({ type: 'dsNavSelect', detail: 'safety' })
    );
  });

  test('combines detail identity and local tabs in one sheet trigger in both navigation modes @cross-browser', async ({
    page,
  }) => {
    const shell = page.locator('#managed-shell');
    await shell.evaluate(element => {
      const managed = element as HTMLDsShellAppElement;
      managed.sectionNavigation = 'panel';
      managed.pageChrome = {
        ...managed.pageChrome,
        heading: 'John Smith',
        showBack: true,
        backAriaLabel: 'Back to People',
        subsections: [
          { id: 'summary', label: 'Summary' },
          { id: 'history', label: 'History' },
        ],
        subvalue: 'summary',
        primaryAction: { id: 'call-driver', label: 'Call driver' },
        actions: [{ id: 'message-driver', label: 'Message driver' }],
      };
    });
    const header = shell.locator('ds-mobile-header[slot="mobile-header"]');
    for (const mode of ['bar', 'panel'] as const) {
      await shell.evaluate((element, mode) => {
        (element as HTMLDsShellAppElement).sectionNavigation = mode;
      }, mode);
      for (const width of [320, 390, 430]) {
        await page.setViewportSize({ width, height: 760 });
        await expect(header).toHaveJSProperty('subsectionsPlacement', 'combined');
        await expect(header.locator('.mobile-header__subsections')).toHaveCount(0);
        const title = header.getByRole('heading', { name: 'John Smith', exact: true });
        const picker = header.getByRole('button', { name: /Current section: Summary/ });
        await expect(title).toHaveCount(1);
        await expect(picker).toHaveAttribute('aria-haspopup', 'dialog');
        await expect(picker).toHaveText('John Smith·Summary');
        await expect(picker).toHaveCSS('height', '40px');
        const pickerBox = await picker.boundingBox();
        const backBox = await header.getByRole('button', { name: 'Back to People' }).boundingBox();
        const actionsBox = await header
          .getByRole('button', { name: 'More page actions' })
          .boundingBox();
        expect([backBox!.width, backBox!.height]).toEqual([40, 40]);
        expect([actionsBox!.width, actionsBox!.height]).toEqual([40, 40]);
        await expect(header.locator('.mobile-header__primary')).toHaveCSS('height', '56px');
        for (const label of ['Back to People', 'More page actions']) {
          const icon = header.getByRole('button', { name: label }).locator('ds-icon');
          await expect(icon).toHaveCSS('width', '24px');
          await expect(icon).toHaveCSS('height', '24px');
        }
        expect(pickerBox!.x).toBeGreaterThanOrEqual(backBox!.x + backBox!.width);
        expect(pickerBox!.x + pickerBox!.width).toBeLessThanOrEqual(actionsBox!.x);
        await expect(header.getByRole('button', { name: 'Back to People' })).toBeVisible();
        await expect(header.getByRole('button', { name: 'More page actions' })).toHaveCount(1);
        const bounds = await header.evaluate(element => ({
          width: element.clientWidth,
          scrollWidth: element.scrollWidth,
        }));
        expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.width);
        const label = picker.locator('.mobile-section-switcher__label .ds-text__element');
        expect(await label.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(
          true
        );
      }
    }
    // The identity portion and active tab are the same tap target.
    await header.locator('.mobile-section-switcher__page-label').click();
    const sheet = header.getByRole('dialog');
    await expect(sheet.getByRole('menuitem', { name: 'Summary', exact: true })).toBeFocused();
    await expect(sheet.getByRole('menuitem')).toHaveCount(2);
    await page.getByRole('menuitem', { name: 'History', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-last-event',
      JSON.stringify({ type: 'dsSubsectionChange', detail: 'history' })
    );
    await expect(sheet).not.toBeVisible();
    await shell.evaluate(element => {
      const shell = element as HTMLDsShellAppElement;
      shell.pageChrome = { ...shell.pageChrome, subvalue: 'history' };
    });
    await expect(
      header.getByRole('button', { name: /John Smith.*Current section: History/ })
    ).toHaveText('John Smith·History');
    await shell.evaluate(element => {
      const shell = element as HTMLDsShellAppElement;
      shell.pageChrome = {
        ...shell.pageChrome,
        heading: 'John Alexander Smith with a very long name',
      };
    });
    await page.setViewportSize({ width: 320, height: 760 });
    const longPicker = header.getByRole('button', {
      name: /John Alexander Smith.*Current section: History/,
    });
    const localLabel = longPicker.locator('.mobile-section-switcher__label .ds-text__element');
    expect(await localLabel.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(
      true
    );
    expect(await longPicker.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(
      true
    );
    await header.getByRole('button', { name: 'More page actions' }).click();
    await expect(page.getByRole('menuitem', { name: 'Call driver', exact: true })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Call driver', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(header.getByRole('button', { name: 'More page actions' })).toBeFocused();
  });

  test('centers mobile page titles with asymmetric actions @cross-browser', async ({ page }) => {
    const shell = page.locator('#managed-shell');
    await shell.evaluate(element => {
      const managed = element as HTMLDsShellAppElement;
      managed.sectionNavigation = 'panel';
      managed.pageChrome = {
        heading: 'People',
        showBack: false,
        subsections: [
          { id: 'drivers', label: 'Drivers' },
          { id: 'managers', label: 'Managers' },
        ],
        subvalue: 'drivers',
        actions: [{ id: 'export', label: 'Export' }],
      };
    });
    const header = shell.locator('ds-mobile-header[slot="mobile-header"]');
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 760 });
      const picker = header.getByRole('button', { name: /Current section: Drivers/ });
      await expect(picker).toBeVisible();
      const bounds = (await header.boundingBox())!;
      const title = (await picker.boundingBox())!;
      expect(Math.abs(title.x + title.width / 2 - bounds.x - bounds.width / 2)).toBeLessThan(0.5);
      await expect(header.getByRole('button', { name: 'Back', exact: true })).toHaveCount(0);
      await expect(header.getByRole('button', { name: 'More page actions' })).toHaveCSS(
        'width',
        '40px'
      );
    }
    await shell.evaluate(element => {
      const managed = element as HTMLDsShellAppElement;
      managed.pageChrome = { ...managed.pageChrome, heading: 'Overview', subsections: [] };
    });
    await expect(header.locator('ds-text.mobile-header__heading')).toHaveJSProperty(
      'variant',
      'text-body-large'
    );
    await expect(header.locator('.mobile-header__primary')).toHaveCSS('height', '56px');
  });

  test('preserves Help as the primary mobile destination across tools @pr-critical', async ({
    page,
  }) => {
    const shell = page.locator('#managed-shell');
    await page.setViewportSize({ width: 390, height: 760 });
    await expect(shell).toHaveAttribute('responsive-mode', 'mobile');

    await shell.getByRole('button', { name: 'Menu' }).click();
    await expect(shell.getByRole('button', { name: 'Account' })).toHaveCount(0);
    const sheetHeader = shell.locator('.mobile-sheet-nav__header');
    const contextTabs = sheetHeader.locator('ds-tab-group');
    await expect(contextTabs).toHaveJSProperty('width', 'fill');
    const contextMetrics = await sheetHeader.evaluate(element => {
      const styles = getComputedStyle(element);
      const context = element.querySelector('ds-tab-group');
      const tabs = Array.from(element.querySelectorAll('.tab'));
      const usableWidth =
        element.getBoundingClientRect().width -
        parseFloat(styles.paddingLeft) -
        parseFloat(styles.paddingRight) -
        parseFloat(styles.columnGap) * 2;
      return {
        ratio: (context?.getBoundingClientRect().width ?? 0) / usableWidth,
        tabWidths: tabs.map(tab => tab.getBoundingClientRect().width),
      };
    });
    expect(contextMetrics.ratio).toBeCloseTo(2 / 3, 2);
    expect(
      Math.max(...contextMetrics.tabWidths) - Math.min(...contextMetrics.tabWidths)
    ).toBeLessThanOrEqual(0.5);
    await shell.getByRole('button', { name: 'Help & Support' }).click();

    await expect(shell.locator('ds-shell-tools')).toHaveAttribute('active-tool', 'help');
    await expect(shell.locator('ds-shell-tools')).toHaveAttribute('open');
    await expect(shell.getByText('Help view', { exact: true })).toBeVisible();
    await expect(shell.getByRole('button', { name: 'Help & Support' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    await expect(shell.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    await expect(page.locator('html')).toHaveAttribute(
      'data-last-event',
      JSON.stringify({ type: 'dsToolChange', detail: { id: 'help', selected: true } })
    );

    const bar = shell.locator('ds-mobile-bar-nav');
    const help = bar.getByRole('button', { name: 'Help & Support' });
    const helpView = shell.getByText('Help view', { exact: true });
    await helpView.evaluate(element => {
      element.dataset.identity = 'preserved';
    });
    for (const tool of ['Search', 'Activity', 'Messages', 'Agents']) {
      await bar.getByRole('button', { name: tool, exact: true }).click();
      await expect(help).toBeVisible();
      await expect(help).not.toHaveAttribute('aria-current', 'page');
      await expect(bar.getByRole('button', { name: tool, exact: true })).toHaveAttribute(
        'aria-current',
        'page'
      );
      await bar.getByRole('button', { name: 'Menu' }).click();
      await bar.getByRole('button', { name: 'Menu' }).click();
      await expect(bar.getByRole('button', { name: tool, exact: true })).toHaveAttribute(
        'aria-current',
        'page'
      );
      await help.click();
      await expect(helpView).toBeVisible();
      await expect(helpView).toHaveAttribute('data-identity', 'preserved');
      await expect(help).toHaveAttribute('aria-current', 'page');
      await expect(help).toBeFocused();
    }

    await shell.getByRole('button', { name: 'Menu' }).click();
    const trackingDestination = shell
      .locator('ds-mobile-sheet-nav')
      .getByRole('button', { name: 'Tracking' });
    await expect(trackingDestination).not.toHaveAttribute('aria-current', 'page');
    await trackingDestination.click();
    await expect(shell.getByText('Help view', { exact: true })).toBeHidden();
    await expect(shell.getByRole('button', { name: 'Tracking' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    await expect(help).toHaveCount(0);
  });

  test('supports a pinned roomy table-page header with flush content and optional divider', async ({
    page,
  }) => {
    const shell = page.locator('#managed-shell');
    const shellPage = shell.locator('ds-shell-page');
    const barTitle = shellPage.locator('ds-bar-title');
    const content = shellPage.locator('.shell-page__content');
    const scroller = shell.locator('.shell-app__content');

    await shell.evaluate(element => {
      const managed = element as HTMLDsShellAppElement;
      managed.pageChrome = {
        ...managed.pageChrome,
        scrollCompaction: false,
        contentInsetBlockStart: 'default',
        contentInsetBlockStartSize: 'var(--dimension-space-025)',
        showHeaderDivider: false,
        showCompactHeaderDivider: true,
      };
    });

    await expect(shellPage).toHaveJSProperty('scrollCompaction', false);
    await expect(shellPage).toHaveJSProperty('contentInsetBlockStart', 'default');
    await expect(shellPage).toHaveJSProperty(
      'contentInsetBlockStartSize',
      'var(--dimension-space-025)'
    );
    await expect(barTitle).toHaveJSProperty('showDivider', false);
    await expect(barTitle).toHaveJSProperty('showCompactDivider', true);
    await expect(content).toHaveCSS('padding-top', '2px');
    await expect(content).toHaveCSS('padding-right', '32px');
    await expect(content).toHaveCSS('padding-bottom', '32px');
    await expect(content).toHaveCSS('padding-left', '32px');
    await expect(barTitle).toHaveClass(/bar-title-host--expanded/);
    expect(
      await barTitle
        .locator('.bar-title')
        .evaluate(element => getComputedStyle(element, '::after').display)
    ).toBe('none');

    await expect
      .poll(() =>
        shellPage.evaluate(element =>
          Number.parseFloat(
            getComputedStyle(element).getPropertyValue('--ds-shell-page-sticky-header-block-size')
          )
        )
      )
      .toBeGreaterThan(48);
    await scroller.evaluate((element: HTMLElement) => {
      element.scrollTop = 300;
    });
    await expect(barTitle).toHaveClass(/bar-title-host--expanded/);
    await expect(shellPage.locator('.shell-page__flow-spacer')).toHaveCSS('height', '0px');

    await shell.getByRole('button', { name: 'Search' }).click();
    await expect(barTitle).toHaveClass(/bar-title-host--expanded/);
    await expect(content).toHaveCSS('padding-top', '2px');
    expect(
      await barTitle
        .locator('.bar-title')
        .evaluate(element => getComputedStyle(element, '::after').display)
    ).toBe('none');
    await expect
      .poll(() =>
        shellPage.evaluate(element =>
          Number.parseFloat(
            getComputedStyle(element).getPropertyValue('--ds-shell-page-sticky-header-block-size')
          )
        )
      )
      .toBeGreaterThan(48);

    await shell.getByRole('button', { name: 'Search' }).click();
    await page.setViewportSize({ width: 1024, height: 760 });
    await expect(shell).toHaveAttribute('responsive-mode', 'tablet');
    await expect(barTitle).toHaveClass(/bar-title-host--compact/);
    await expect(content).toHaveCSS('padding-top', '16px');
    await expect(content).toHaveCSS('padding-right', '16px');
    await expect(content).toHaveCSS('padding-bottom', '16px');
    await expect(content).toHaveCSS('padding-left', '16px');
  });

  test('forwards the page canvas surface independently from responsive content inset', async ({
    page,
  }) => {
    const shell = page.locator('#managed-shell');
    const shellPage = shell.locator('ds-shell-page');
    const content = shellPage.locator('.shell-page__content');
    const stickyHeader = shellPage.locator('.shell-page__sticky-header');
    const barTitle = shellPage.locator('ds-bar-title');
    const titleSurface = barTitle.locator('.bar-title');
    const mobileHeader = shellPage.locator('ds-mobile-header');
    const mobileHeaderSurface = mobileHeader.locator('.mobile-header');
    const surfaces = await page.evaluate(() => {
      const probe = document.createElement('div');
      document.body.append(probe);
      probe.style.backgroundColor = 'var(--color-background-primary)';
      const primary = getComputedStyle(probe).backgroundColor;
      probe.style.backgroundColor = 'var(--color-background-secondary)';
      const secondary = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return { primary, secondary };
    });

    await shell.evaluate(element => {
      const managed = element as HTMLDsShellAppElement;
      managed.pageChrome = {
        ...managed.pageChrome,
        contentInset: 'default',
        contentSurface: 'secondary',
      };
    });

    await expect(shellPage).toHaveJSProperty('contentSurface', 'secondary');
    await expect(shellPage).toHaveCSS('background-color', surfaces.secondary);
    await expect(content).toHaveCSS('background-color', surfaces.secondary);
    await expect(content).toHaveCSS('padding-top', '32px');
    await expect(barTitle).toHaveClass(/bar-title-host--expanded/);
    await expect(stickyHeader).toHaveCSS('background-color', surfaces.secondary);
    await expect(barTitle).toHaveCSS('background-color', surfaces.secondary);
    await expect(titleSurface).toHaveCSS('background-color', surfaces.secondary);

    await shell.getByRole('button', { name: 'Search' }).click();
    await expect(barTitle).toHaveClass(/bar-title-host--expanded/);
    await expect(stickyHeader).toHaveCSS('background-color', surfaces.secondary);
    await expect(barTitle).toHaveCSS('background-color', surfaces.secondary);
    await expect(titleSurface).toHaveCSS('background-color', surfaces.secondary);
    await shell.getByRole('button', { name: 'Search' }).click();
    await expect(barTitle).toHaveClass(/bar-title-host--expanded/);
    await expect(titleSurface).toHaveCSS('background-color', surfaces.secondary);

    await page.setViewportSize({ width: 1024, height: 760 });
    await expect(shell).toHaveAttribute('responsive-mode', 'tablet');
    await expect(content).toHaveCSS('background-color', surfaces.secondary);
    await expect(content).toHaveCSS('padding-top', '16px');
    await expect(barTitle).toHaveClass(/bar-title-host--compact/);
    await expect(stickyHeader).toHaveCSS('background-color', surfaces.secondary);
    await expect(titleSurface).toHaveCSS('background-color', surfaces.secondary);

    await page.setViewportSize({ width: 390, height: 760 });
    await expect(shell).toHaveAttribute('responsive-mode', 'mobile');
    await expect(content).toHaveCSS('background-color', surfaces.secondary);
    await expect(content).toHaveCSS('padding-top', '16px');
    await expect(mobileHeader).toBeVisible();
    await expect(stickyHeader).toHaveCSS('background-color', surfaces.primary);
    await expect(mobileHeader).toHaveCSS('background-color', surfaces.primary);
    await expect(mobileHeaderSurface).toHaveCSS('background-color', surfaces.primary);

    await shell.evaluate(element => {
      const managed = element as HTMLDsShellAppElement;
      managed.pageChrome = { ...managed.pageChrome, contentInset: 'none' };
    });
    await expect(content).toHaveCSS('background-color', surfaces.secondary);
    await expect(content).toHaveCSS('padding', '0px');
  });

  test('keeps a secondary canvas continuous through scroll compaction', async ({ page }) => {
    const shell = page.locator('#managed-shell');
    const shellPage = shell.locator('ds-shell-page');
    const scroller = shell.locator('.shell-app__content');
    const barTitle = shellPage.locator('ds-bar-title');
    const stickyHeader = shellPage.locator('.shell-page__sticky-header');
    const titleSurface = barTitle.locator('.bar-title');
    const flowSpacer = shellPage.locator('.shell-page__flow-spacer');
    const content = shellPage.locator('.shell-page__content');
    const secondary = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.backgroundColor = 'var(--color-background-secondary)';
      document.body.append(probe);
      const color = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return color;
    });

    await shell.evaluate(element => {
      const managed = element as HTMLDsShellAppElement;
      managed.pageChrome = { ...managed.pageChrome, contentSurface: 'secondary' };
    });
    await expect(barTitle).toHaveClass(/bar-title-host--expanded/);
    await expect
      .poll(() =>
        shellPage.evaluate(element =>
          Number.parseFloat(
            getComputedStyle(element).getPropertyValue('--ds-shell-page-header-travel')
          )
        )
      )
      .toBeGreaterThan(0);

    const snapScrollTop = await shellPage.evaluate(element => {
      const root = element
        .closest('ds-shell-app')
        ?.querySelector<HTMLElement>('.shell-app__content');
      const sentinel = element.querySelector<HTMLElement>('.shell-page__scroll-sentinel');
      return root && sentinel
        ? root.scrollTop + sentinel.getBoundingClientRect().top - root.getBoundingClientRect().top
        : 0;
    });
    await scroller.evaluate((element: HTMLElement, distance) => {
      element.scrollTop = distance + 1;
    }, snapScrollTop);

    await expect(barTitle).toHaveClass(/bar-title-host--compact/);
    await expect(stickyHeader).toHaveCSS('background-color', secondary);
    await expect(titleSurface).toHaveCSS('background-color', secondary);
    await expect(flowSpacer).not.toHaveCSS('height', '0px');
    await expect(flowSpacer).toHaveCSS('background-color', secondary);
    await expect(content).toHaveCSS('background-color', secondary);
    const boundary = await shellPage.evaluate(element => {
      const spacer = element.querySelector<HTMLElement>('.shell-page__flow-spacer');
      const pageContent = element.querySelector<HTMLElement>('.shell-page__content');
      return {
        spacerBottom: spacer?.getBoundingClientRect().bottom ?? 0,
        contentTop: pageContent?.getBoundingClientRect().top ?? 0,
      };
    });
    expect(boundary.spacerBottom).toBeCloseTo(boundary.contentTop, 3);
  });

  test(
    'emits navigation intent without changing the application URL',
    chromiumOnly(
      'controlled-behavior',
      'Managed navigation event forwarding is deterministic and does not use an engine-specific API.'
    ),
    async ({ page }) => {
      const originalUrl = page.url();
      await page.getByRole('button', { name: 'Safety' }).click();

      await expect(page.locator('html')).toHaveAttribute(
        'data-last-event',
        JSON.stringify({ type: 'dsNavSelect', detail: 'safety' })
      );
      expect(page.url()).toBe(originalUrl);
    }
  );

  test('keeps detail identity in mobile chrome instead of promoting a peer route tab', async ({
    page,
  }) => {
    const shell = page.locator('#managed-shell');
    await shell.evaluate(element => {
      const managed = element as HTMLDsShellAppElement;
      managed.pageChrome = {
        ...managed.pageChrome,
        heading: 'John Smith',
        showBack: true,
        backAriaLabel: 'Back to People',
      };
    });

    await page.setViewportSize({ width: 390, height: 760 });
    await expect(shell).toHaveAttribute('responsive-mode', 'mobile');
    await expect(shell.getByRole('heading', { level: 1, name: 'John Smith' })).toBeVisible();
    await expect(shell.getByRole('button', { name: 'Back to People' })).toBeVisible();
    await expect(shell.getByRole('button', { name: /Current section: Overview/ })).toHaveCount(0);
  });

  test('derives mobile icon and overflow actions from one page model @cross-browser', async ({
    page,
  }) => {
    const shell = page.locator('#managed-shell');
    await shell.evaluate(element => {
      const managed = element as HTMLDsShellAppElement;
      managed.pageChrome = {
        ...managed.pageChrome,
        actionsAriaLabel: 'Fleet page actions',
        actionItems: [
          {
            type: 'button',
            id: 'create',
            label: 'Create driver',
            appearance: 'filled',
          },
          {
            type: 'icon',
            id: 'refresh',
            label: 'Refresh',
            icon: 'Refresh',
            ariaLabel: 'Refresh fleet',
          },
          {
            type: 'menu',
            id: 'export',
            label: 'Export',
            choices: [
              { id: 'export-csv', label: 'Export CSV' },
              { id: 'export-pdf', label: 'Export PDF' },
            ],
          },
          {
            type: 'split',
            id: 'add',
            label: 'Add driver',
            menuAriaLabel: 'More add driver options',
            choices: [{ id: 'import', label: 'Import drivers' }],
          },
          { type: 'divider' },
          { type: 'overflow', id: 'archive', label: 'Archive drivers' },
        ],
      };
    });

    await page.setViewportSize({ width: 390, height: 760 });
    await expect(shell).toHaveAttribute('responsive-mode', 'mobile');
    await shell.getByRole('button', { name: 'Refresh fleet' }).click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-last-event',
      JSON.stringify({ type: 'dsPageAction', detail: 'refresh' })
    );

    const overflow = shell.getByRole('button', { name: 'Fleet page actions' });
    await overflow.click();
    await expect(page.getByRole('menuitem', { name: 'Create driver' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Export CSV' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Add driver' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Import drivers' })).toBeVisible();
    await expect(shell.locator('ds-menu[id^="shell-app-mobile-action-menu-"] ds-icon')).toHaveCount(
      0
    );
    await page.getByRole('menuitem', { name: 'Export PDF' }).click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-last-event',
      JSON.stringify({ type: 'dsPageAction', detail: 'export-pdf' })
    );
    await expect(overflow).toBeFocused();
  });

  test('preserves routed and tool element identity across responsive presentation changes @pr-critical', async ({
    page,
  }) => {
    await page.evaluate(() => {
      const pageContent = document.getElementById('managed-page-content');
      const agentsView = document.getElementById('managed-agents-view');
      (window as typeof window & { managedPageOwner?: Element | null }).managedPageOwner =
        pageContent;
      (window as typeof window & { managedToolOwner?: Element | null }).managedToolOwner =
        agentsView;
    });

    await page.getByRole('button', { name: 'Agents' }).click();
    const draft = page.locator('#agent-draft');
    await draft.fill('Keep this draft');

    await page.setViewportSize({ width: 390, height: 760 });
    await expect(page.locator('#managed-shell')).toHaveAttribute('responsive-mode', 'mobile');
    await expect(page.getByRole('button', { name: 'Agents' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    await expect(draft).toHaveValue('Keep this draft');

    const identity = await page.evaluate(() => {
      const state = window as typeof window & {
        managedPageOwner?: Element | null;
        managedToolOwner?: Element | null;
      };
      return {
        page: state.managedPageOwner === document.getElementById('managed-page-content'),
        tool: state.managedToolOwner === document.getElementById('managed-agents-view'),
      };
    });
    expect(identity).toEqual({ page: true, tool: true });
  });

  test('forwards rail accessory intents without changing the active drawer or mounted view @pr-critical', async ({
    page,
  }) => {
    const shell = page.locator('#managed-shell');
    await shell.getByRole('button', { name: 'Agents' }).click();
    const draft = shell.locator('#agent-draft');
    await draft.fill('Keep this accessory-independent draft');
    await draft.evaluate(element => {
      (window as typeof window & { accessoryToolOwner?: Element }).accessoryToolOwner = element;
    });

    await shell.evaluate(element => {
      const managed = element as HTMLDsShellAppElement;
      managed.tools = {
        ...managed.tools,
        accessories: [
          {
            type: 'divider',
            id: 'session-boundary',
            railPlacement: 'body',
            order: 10,
          },
          {
            type: 'transient',
            id: 'active-session',
            railPlacement: 'body',
            order: 11,
            ariaLabel: 'Active session',
            visual: { type: 'initial', initial: 'AS' },
            statusText: 'Active for 12 minutes',
            statusTone: 'active',
            primaryAction: { id: 'restore', ariaLabel: 'Restore active session' },
          },
        ],
      };
    });

    const restore = shell.getByRole('button', {
      name: 'Restore active session. Active for 12 minutes',
    });
    await expect(restore).toBeVisible();
    await restore.click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-last-event',
      JSON.stringify({
        type: 'dsRailAccessoryAction',
        detail: {
          accessoryId: 'active-session',
          actionId: 'restore',
          anchorTag: 'BUTTON',
        },
      })
    );
    await expect(shell.locator('ds-shell-tools')).toHaveAttribute('active-tool', 'agents');
    await expect(shell.locator('ds-shell-tools')).toHaveAttribute('open');
    await expect(draft).toHaveValue('Keep this accessory-independent draft');

    await shell.evaluate(element => {
      const managed = element as HTMLDsShellAppElement;
      managed.tools = { ...managed.tools, accessories: [] };
    });
    await expect(restore).toHaveCount(0);
    await expect(shell.locator('ds-shell-tools')).toHaveAttribute('active-tool', 'agents');
    await expect(shell.locator('ds-shell-tools')).toHaveAttribute('open');
    await expect(draft).toHaveValue('Keep this accessory-independent draft');
    expect(
      await draft.evaluate(
        element =>
          (window as typeof window & { accessoryToolOwner?: Element }).accessoryToolOwner ===
          element
      )
    ).toBe(true);
  });

  test('intentionally omits rail accessories on mobile and restores them on tablet @pr-critical', async ({
    page,
  }) => {
    const shell = page.locator('#managed-shell');
    await shell.evaluate(element => {
      const managed = element as HTMLDsShellAppElement;
      managed.tools = {
        ...managed.tools,
        accessories: [
          {
            type: 'shortcut',
            id: 'pinned-conversation',
            railPlacement: 'body',
            order: 10,
            ariaLabel: 'Pinned conversation',
            initials: 'PC',
            dot: true,
            action: { id: 'open', ariaLabel: 'Open pinned conversation' },
          },
        ],
      };
    });

    const shortcut = shell.getByRole('button', { name: 'Open pinned conversation' });
    await expect(shortcut).toBeVisible();
    await page.setViewportSize({ width: 390, height: 760 });
    await expect(shell).toHaveAttribute('responsive-mode', 'mobile');
    await expect(shortcut).toHaveCount(0);
    expect(
      await shell.locator('ds-shell-tools').evaluate(element => {
        return (element as HTMLDsShellToolsElement).accessories.length;
      })
    ).toBe(1);

    await page.setViewportSize({ width: 1024, height: 760 });
    await expect(shell).toHaveAttribute('responsive-mode', 'tablet');
    await expect(shortcut).toBeVisible();
  });

  test('preserves page chrome and routed content when tool items reorder after hydration', async ({
    page,
  }) => {
    const shell = page.locator('#managed-shell');
    const pageContent = page.locator('#managed-page-content');
    const runtimeErrors: string[] = [];
    page.on('console', message => {
      if (message.type() === 'error') runtimeErrors.push(message.text());
    });
    page.on('pageerror', error => runtimeErrors.push(error.message));

    await shell.evaluate(element => {
      const managed = element as HTMLDsShellAppElement;
      managed.tools = {
        ...managed.tools,
        items: [
          { id: 'search', icon: 'MagnifyingGlass', ariaLabel: 'Search' },
          { id: 'agents', icon: 'AI', ariaLabel: 'Agents' },
          { id: 'messages', icon: 'MessageBubbleStack', ariaLabel: 'Messages' },
          { id: 'stacks', icon: 'ViewMenu', ariaLabel: 'Stacks' },
          { id: 'activity', icon: 'Bell', ariaLabel: 'Activity' },
          { id: 'help', icon: 'CircleQuestion', ariaLabel: 'Help & Support' },
        ],
      };
    });

    await expect(shell.getByRole('heading', { level: 1, name: 'Fleet overview' })).toBeVisible();
    await expect(pageContent).toContainText('Persistent routed content');

    await page.setViewportSize({ width: 390, height: 760 });
    await expect(shell).toHaveAttribute('responsive-mode', 'mobile');
    await expect(shell.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
    await expect(pageContent).toContainText('Persistent routed content');
    expect(runtimeErrors).toEqual([]);
  });

  test('applies managed fullscreen presentation without replacing the tool owner', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Agents' }).click();
    const shell = page.locator('#managed-shell');
    const agentsView = page.locator('#managed-agents-view');
    const owner = await agentsView.evaluate(element => {
      (window as typeof window & { fullscreenOwner?: Element }).fullscreenOwner = element;
      return element.id;
    });
    expect(owner).toBe('managed-agents-view');

    await shell.evaluate(async element => {
      await (
        element as HTMLElement & {
          setToolPresentation: (presentation: 'drawer' | 'fullscreen') => Promise<void>;
        }
      ).setToolPresentation('fullscreen');
    });
    await expect(shell).toHaveClass(/shell-app--tools-fullscreen/);
    await expect(page.locator('.shell-app__content')).toHaveAttribute('inert', '');
    expect(
      await agentsView.evaluate(
        element =>
          (window as typeof window & { fullscreenOwner?: Element }).fullscreenOwner === element
      )
    ).toBe(true);

    await shell.evaluate(async element => {
      await (
        element as HTMLElement & {
          setToolPresentation: (presentation: 'drawer' | 'fullscreen') => Promise<void>;
        }
      ).setToolPresentation('drawer');
    });
    await expect(shell).not.toHaveClass(/shell-app--tools-fullscreen/);
  });
});
