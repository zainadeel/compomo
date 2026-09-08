import { expect, test } from '@playwright/test';
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
  chromiumOnly(
    'layout-geometry',
    'All-or-nothing tab collapse is a measured layout contract.'
  ),
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
