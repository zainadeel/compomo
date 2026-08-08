import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { chromiumOnly } from './browser-tier';

declare global {
  interface Window {
    __tableLoadEvents: Array<{
      id: string;
      detail: { reason: string; loadIdentity: string | number; loadedRowCount: number };
    }>;
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/table.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('renders native caption, header, row, and cell semantics', async ({ page }) => {
  const table = page.locator('#basic');
  const native = table.getByRole('table', { name: 'Workforce overview' });
  await expect(native).toBeVisible();
  await expect(native.locator('caption')).toHaveText('Workforce overview');
  await expect(native.getByRole('columnheader')).toHaveCount(4);
  await expect(native.getByRole('row')).toHaveCount(5);
  await expect(native.getByRole('cell', { name: 'Avery Chen avery@example.com' })).toBeVisible();
  await expect(native.getByRole('cell', { name: 'Not available' })).toBeVisible();
});

test('emits controlled sort cycles and renders the supplied order', async ({ page }) => {
  const table = page.locator('#basic');
  const driverHeader = table.getByRole('columnheader', { name: /Driver/ });

  await table.getByRole('button', { name: 'Sort Driver ascending' }).click();
  await expect(driverHeader).toHaveAttribute('aria-sort', 'ascending');
  await expect(table.locator('tbody .ds-table__row').first()).toHaveAttribute('data-row-id', 'avery');

  await table.getByRole('button', { name: /Sort Driver descending/ }).click();
  await expect(driverHeader).toHaveAttribute('aria-sort', 'descending');
  await expect(table.locator('tbody .ds-table__row').first()).toHaveAttribute('data-row-id', 'sam');

  await table.getByRole('button', { name: /Clear Driver sorting/ }).click();
  await expect(driverHeader).not.toHaveAttribute('aria-sort');
  await expect(table.locator('tbody .ds-table__row').first()).toHaveAttribute('data-row-id', 'avery');
});

test('keeps group order and member-row sorting independent', async ({ page }) => {
  const table = page.locator('#grouped');
  await expect(table.locator('tbody[data-group-id]')).toHaveCount(3);
  await expect(table.locator('th[scope="rowgroup"]')).toHaveCount(3);
  await expect(table.locator('tbody[data-group-id]').first()).toHaveAttribute('data-group-id', 'driving');

  await table.getByRole('button', { name: /Sort Status groups descending/ }).click();
  await expect(table.locator('tbody[data-group-id]').first()).toHaveAttribute('data-group-id', 'on-duty');
  await expect(table.getByRole('columnheader', { name: /Safety score/ })).toHaveAttribute('aria-sort', 'descending');

  await table.getByRole('button', { name: /Clear Safety score sorting/ }).click();
  await expect(table.getByRole('columnheader', { name: /Safety score/ })).not.toHaveAttribute('aria-sort');
  await expect
    .poll(() => table.evaluate((element: HTMLDsTableElement) => element.grouping?.direction))
    .toBe('desc');
});

test('selects loaded rows while preserving off-window IDs', async ({ page }) => {
  const table = page.locator('#selectable');
  const selectAll = table.getByRole('checkbox', { name: 'Select all loaded rows' });
  await expect(selectAll).toHaveAttribute('aria-checked', 'mixed');

  await selectAll.click();
  await expect(table.getByRole('checkbox', { name: 'Deselect all loaded rows' })).toHaveAttribute('aria-checked', 'true');
  await expect
    .poll(() => table.evaluate((element: HTMLDsTableElement) => element.selectedRowIds))
    .toEqual(expect.arrayContaining(['avery', 'jordan', 'not-loaded']));
  await expect
    .poll(() => table.evaluate((element: HTMLDsTableElement) => element.selectedRowIds))
    .not.toEqual(expect.arrayContaining(['sam', 'morgan']));

  await table.getByRole('checkbox', { name: 'Deselect Avery Chen' }).click();
  await expect
    .poll(() => table.evaluate((element: HTMLDsTableElement) => element.selectedRowIds))
    .not.toContain('avery');
  await expect
    .poll(() => table.evaluate((element: HTMLDsTableElement) => element.selectedRowIds))
    .toContain('not-loaded');
});

test('drives manual lazy loading and terminal state without pagination', async ({ page }) => {
  const table = page.locator('#lazy');
  await table.getByRole('button', { name: 'Load more' }).click();
  await expect(table.locator('.ds-table__load-cell').getByText('Loading more results')).toBeVisible();
  await expect(table.locator('tbody .ds-table__row')).toHaveCount(4);
  await expect(table.locator('.ds-table__load-cell').getByText('All results loaded')).toBeVisible();
  await expect(table).toHaveJSProperty('hasMore', false);
  await expect
    .poll(() => page.evaluate(() => window.__tableLoadEvents.filter(event => event.id === 'lazy')))
    .toEqual([
      {
        id: 'lazy',
        detail: { reason: 'manual', loadIdentity: 'default', loadedRowCount: 2 },
      },
    ]);
  await expect(table.getByText(/page/i)).toHaveCount(0);
});

test('guards duplicate requests and distinguishes retry intent', async ({ page }) => {
  const guard = page.locator('#lazy-guard');
  await guard.getByRole('button', { name: 'Load more' }).dblclick();
  await expect
    .poll(() => page.evaluate(() => window.__tableLoadEvents.filter(event => event.id === 'lazy-guard').length))
    .toBe(1);

  await page.locator('#lazy-retry').getByRole('button', { name: 'Retry' }).click();
  await expect
    .poll(() => page.evaluate(() => window.__tableLoadEvents.find(event => event.id === 'lazy-retry')?.detail.reason))
    .toBe('retry');
});

test('uses compact density and focusable sticky overflow geometry',
  chromiumOnly('layout-geometry', 'Density and sticky overflow are rendered geometry contracts.'),
  async ({ page }) => {
    const small = page.locator('#small');
    await expect(small.locator('.ds-table__header-cell').first()).toHaveCSS('height', '32px');
    await expect(
      small.locator('.ds-table__row[data-row-id="jordan"] .ds-table__cell').first(),
    ).toHaveCSS('height', '40px');

    const overflow = page.locator('#overflow');
    const viewport = overflow.locator('.ds-table__viewport');
    await expect(viewport).toHaveAttribute('role', 'region');
    await expect(viewport).toHaveAttribute('aria-label', 'Scrollable driver data');
    await expect(viewport).toHaveAttribute('tabindex', '0');
    await expect(overflow.locator('.ds-table__head')).toHaveCSS('position', 'sticky');
    await viewport.evaluate(element => { element.scrollLeft = 120; });
    await expect(overflow.locator('.ds-table__frame')).toHaveClass(/ds-table__frame--overflow-start/);
  });

test('renders initial state bodies and passes an accessibility scan', async ({ page }) => {
  await expect(page.locator('#loading').getByRole('table')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#loading').locator('ds-skeleton')).toHaveCount(15);
  await expect(page.locator('#empty').getByText('No matching drivers')).toBeVisible();
  await expect(page.locator('#error').getByText('Drivers unavailable')).toBeVisible();

  const results = await new AxeBuilder({ page })
    .include('#basic')
    .include('#grouped')
    .include('#selectable')
    .analyze();
  expect(results.violations).toEqual([]);
});
