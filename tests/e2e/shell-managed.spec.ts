import { expect, test } from '@playwright/test';
import { chromiumOnly } from './browser-tier';

test.describe('Managed application shell', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shell-managed.html');
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  });

  test('wires managed chrome and header capacity at each breakpoint', async ({
    page,
  }) => {
    const shell = page.locator('#managed-shell');
    await expect(shell).toHaveJSProperty('composition', 'managed');
    await expect(shell).toHaveAttribute('responsive-mode', 'desktop');
    await expect(shell.locator('ds-panel-nav')).toBeVisible();
    await expect(shell.locator('ds-bar-nav')).toBeVisible();
    await expect(shell.locator('ds-shell-page')).toHaveJSProperty(
      'headerCapacity',
      'roomy'
    );
    await expect(
      shell.getByRole('heading', { level: 1, name: 'Fleet overview' })
    ).toBeVisible();
    await expect(shell.locator('ds-mobile-header')).not.toBeVisible();
    await expect(shell.locator('ds-mobile-bar-nav')).not.toBeVisible();
    await expect(shell.getByRole('main')).toHaveCount(1);

    await shell.getByRole('button', { name: 'Search' }).click();
    await expect(shell.locator('ds-shell-page')).toHaveJSProperty(
      'headerCapacity',
      'compact'
    );
    await shell.getByRole('button', { name: 'Search' }).click();
    await expect(shell.locator('ds-shell-page')).toHaveJSProperty(
      'headerCapacity',
      'roomy'
    );

    await page.setViewportSize({ width: 1024, height: 760 });
    await expect(shell).toHaveAttribute('responsive-mode', 'tablet');
    await expect(shell.locator('ds-panel-nav')).toBeVisible();
    await expect(shell.locator('ds-panel-nav')).toHaveJSProperty(
      'breakpoint',
      1200
    );
    await expect(shell.locator('ds-bar-nav')).toBeVisible();
    await expect(shell.locator('ds-shell-page')).toHaveJSProperty(
      'headerCapacity',
      'compact'
    );
    await expect(shell.locator('ds-mobile-header')).not.toBeVisible();

    await shell.getByRole('button', { name: 'Search' }).click();
    await expect(shell.locator('ds-shell-page')).toHaveJSProperty(
      'headerCapacity',
      'constrained'
    );
    await shell.getByRole('button', { name: 'Search' }).click();
    await expect(shell.locator('ds-shell-page')).toHaveJSProperty(
      'headerCapacity',
      'compact'
    );

    await page.setViewportSize({ width: 390, height: 760 });
    await expect(shell).toHaveAttribute('responsive-mode', 'mobile');
    await expect(shell.locator('ds-panel-nav')).not.toBeVisible();
    await expect(shell.locator('ds-bar-nav')).not.toBeVisible();
    await expect(shell.locator('ds-mobile-header[slot="mobile-header"]')).toBeVisible();
    await expect(shell.locator('ds-mobile-bar-nav')).toBeVisible();
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
    await expect(barTitle).toHaveClass(/bar-title-host--compact/);
    await expect(stickyHeader).toHaveCSS('background-color', surfaces.primary);
    await expect(barTitle).toHaveCSS('background-color', surfaces.primary);
    await expect(titleSurface).toHaveCSS('background-color', surfaces.primary);
    await shell.getByRole('button', { name: 'Search' }).click();
    await expect(barTitle).toHaveClass(/bar-title-host--expanded/);
    await expect(titleSurface).toHaveCSS('background-color', surfaces.secondary);

    await page.setViewportSize({ width: 1024, height: 760 });
    await expect(shell).toHaveAttribute('responsive-mode', 'tablet');
    await expect(content).toHaveCSS('background-color', surfaces.secondary);
    await expect(content).toHaveCSS('padding-top', '16px');
    await expect(barTitle).toHaveClass(/bar-title-host--compact/);
    await expect(titleSurface).toHaveCSS('background-color', surfaces.primary);

    await page.setViewportSize({ width: 390, height: 760 });
    await expect(shell).toHaveAttribute('responsive-mode', 'mobile');
    await expect(content).toHaveCSS('background-color', surfaces.secondary);
    await expect(content).toHaveCSS('padding-top', '16px');

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
      const root = element.closest('ds-shell-app')?.querySelector<HTMLElement>('.shell-app__content');
      const sentinel = element.querySelector<HTMLElement>('.shell-page__scroll-sentinel');
      return root && sentinel
        ? root.scrollTop + sentinel.getBoundingClientRect().top - root.getBoundingClientRect().top
        : 0;
    });
    await scroller.evaluate((element: HTMLElement, distance) => {
      element.scrollTop = distance + 1;
    }, snapScrollTop);

    await expect(barTitle).toHaveClass(/bar-title-host--compact/);
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
      'Managed navigation event forwarding is deterministic and does not use an engine-specific API.',
    ),
    async ({ page }) => {
      const originalUrl = page.url();
      await page.getByRole('button', { name: 'Safety' }).click();

      await expect(page.locator('html')).toHaveAttribute(
        'data-last-event',
        JSON.stringify({ type: 'dsNavSelect', detail: 'safety' })
      );
      expect(page.url()).toBe(originalUrl);
    },
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
    await expect(
      shell.getByRole('heading', { level: 1, name: 'John Smith' })
    ).toBeVisible();
    await expect(shell.getByRole('button', { name: 'Back to People' })).toBeVisible();
    await expect(
      shell.getByRole('button', { name: /Current section: Overview/ })
    ).toHaveCount(0);
  });

  test('preserves routed and tool element identity across responsive presentation changes', async ({
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
    await expect(page.locator('#managed-shell')).toHaveAttribute(
      'responsive-mode',
      'mobile'
    );
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
        page:
          state.managedPageOwner === document.getElementById('managed-page-content'),
        tool:
          state.managedToolOwner === document.getElementById('managed-agents-view'),
      };
    });
    expect(identity).toEqual({ page: true, tool: true });
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

    await expect(
      shell.getByRole('heading', { level: 1, name: 'Fleet overview' })
    ).toBeVisible();
    await expect(pageContent).toContainText('Persistent routed content');

    await page.setViewportSize({ width: 390, height: 760 });
    await expect(shell).toHaveAttribute('responsive-mode', 'mobile');
    await expect(
      shell.getByRole('heading', { level: 1, name: 'Overview' })
    ).toBeVisible();
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
      (window as typeof window & { fullscreenOwner?: Element }).fullscreenOwner =
        element;
      return element.id;
    });
    expect(owner).toBe('managed-agents-view');

    await shell.evaluate(async element => {
      await (
        element as HTMLElement & {
          setToolPresentation: (
            presentation: 'drawer' | 'fullscreen'
          ) => Promise<void>;
        }
      ).setToolPresentation('fullscreen');
    });
    await expect(shell).toHaveClass(/shell-app--tools-fullscreen/);
    await expect(page.locator('.shell-app__content')).toHaveAttribute('inert', '');
    expect(
      await agentsView.evaluate(
        element =>
          (window as typeof window & { fullscreenOwner?: Element }).fullscreenOwner ===
          element
      )
    ).toBe(true);

    await shell.evaluate(async element => {
      await (
        element as HTMLElement & {
          setToolPresentation: (
            presentation: 'drawer' | 'fullscreen'
          ) => Promise<void>;
        }
      ).setToolPresentation('drawer');
    });
    await expect(shell).not.toHaveClass(/shell-app--tools-fullscreen/);
  });
});
