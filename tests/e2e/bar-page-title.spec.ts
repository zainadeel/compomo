import { expect, test } from '@playwright/test';
import type { BarTitleActionConfigItem } from '../../src/wc/components/BarTitle/bar-title-types';
import { chromiumOnly } from './browser-tier';

type BarPageTitleEventRecord = { type: string; id?: string; host?: string };

function readEvents(page: import('@playwright/test').Page) {
  return page.evaluate(
    () =>
      (
        window as typeof window & {
          __barPageTitleEvents: BarPageTitleEventRecord[];
        }
      ).__barPageTitleEvents
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto('/bar-page-title.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('wide chrome shows every section tab and emits dsSectionChange @cross-browser', async ({
  page,
}) => {
  const header = page.locator('#wide-header');
  await expect(header.getByRole('heading', { level: 1, name: 'People' })).toHaveCount(1);
  await expect(header.getByRole('tablist', { name: 'Change People view' })).toBeVisible();
  await expect(header.locator('.bar-page-title__section-trigger')).toHaveCount(0);
  await header.getByRole('tab', { name: 'Managers' }).click();
  expect(await readEvents(page)).toEqual([
    { type: 'section', id: 'managers', host: 'wide-header' },
  ]);
});

test('narrow chrome shows the section button and emits dsSectionChange @cross-browser', async ({
  page,
}) => {
  const header = page.locator('#narrow-header');
  await expect(header.locator('.bar-page-title__title-row .bar-page-title__tab-list')).toHaveCount(
    0
  );
  const trigger = header.locator('.bar-page-title__section-trigger');
  await expect(trigger).toBeVisible();
  await trigger.click();
  await page.getByRole('menuitem', { name: 'Contractors', exact: true }).click();
  expect(await readEvents(page)).toEqual([
    { type: 'section', id: 'contractors', host: 'narrow-header' },
  ]);
});

test(
  'resizing swaps the complete tab row for the section button',
  chromiumOnly('layout-geometry', 'All-or-nothing tab collapse is a measured layout contract.'),
  async ({ page }) => {
    const header = page.locator('#resize-header');
    await expect(header.getByRole('tablist', { name: 'Change People view' })).toBeVisible({
      timeout: 5000,
    });
    await expect(header.locator('.bar-page-title__section-trigger')).toHaveCount(0);

    await page.evaluate(() => {
      (
        window as typeof window & { __setBarPageTitleWidth: (px: number) => void }
      ).__setBarPageTitleWidth(280);
    });

    await expect(header.locator('.bar-page-title__section-trigger')).toBeVisible({
      timeout: 5000,
    });
    await expect(header.locator('.bar-page-title__title-row [role="tablist"]')).toHaveCount(0);

    await page.evaluate(() => {
      (
        window as typeof window & { __setBarPageTitleWidth: (px: number) => void }
      ).__setBarPageTitleWidth(960);
    });

    await expect(header.getByRole('tablist', { name: 'Change People view' })).toBeVisible({
      timeout: 5000,
    });
    await expect(header.locator('.bar-page-title__section-trigger')).toHaveCount(0);
  }
);

test(
  'namespaces action-menu ids across BarTitle and BarPageTitle',
  chromiumOnly(
    'controlled-behavior',
    'Document-wide menu relationships are engine-neutral component composition.'
  ),
  async ({ page }) => {
    await page.goto('/bar-action.html');
    const actionItems: BarTitleActionConfigItem[] = [
      {
        type: 'menu',
        id: 'export',
        label: 'Export',
        choices: [{ id: 'csv', label: 'CSV' }],
      },
    ];

    const relationships = await page.evaluate(async items => {
      await Promise.all([
        import('/dist/components/ds-bar-title.js'),
        import('/dist/components/ds-bar-page-title.js'),
      ]);
      await Promise.all([
        customElements.whenDefined('ds-bar-title'),
        customElements.whenDefined('ds-bar-page-title'),
      ]);

      const pageTitle = document.createElement('ds-bar-page-title');
      const title = document.createElement('ds-bar-title');
      pageTitle.heading = 'Page title';
      pageTitle.actionItems = items;
      title.heading = 'Title';
      title.actionItems = items;
      document.body.append(pageTitle, title);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      return [pageTitle, title].map(host => {
        const trigger = host.querySelector('ds-button-unfilled');
        const menu = host.querySelector('ds-menu');
        return { controls: trigger?.controls, menuId: menu?.id };
      });
    }, actionItems);

    expect(relationships).toEqual([
      {
        controls: 'bar-page-title-action-menu-0-0',
        menuId: 'bar-page-title-action-menu-0-0',
      },
      { controls: 'bar-title-action-menu-0-0', menuId: 'bar-title-action-menu-0-0' },
    ]);
    expect(new Set(relationships.map(({ menuId }) => menuId)).size).toBe(2);
  }
);
