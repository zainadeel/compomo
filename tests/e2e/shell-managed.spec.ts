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
