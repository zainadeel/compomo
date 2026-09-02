import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/table.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('virtual mode mounts a window of rows and reports the full list to AT', async ({ page }) => {
  const table = page.locator('#virtual');
  const viewport = table.locator('.ds-table__viewport');
  const bodyRows = table.locator('.ds-table__body .ds-table__row');
  await expect(table.locator('.ds-table__table--virtual')).toBeVisible();
  await expect(table.locator('.ds-table__table--native-group-sticky')).toBeVisible();
  await expect.poll(() => bodyRows.count()).toBeLessThan(50);
  await expect.poll(() => bodyRows.count()).toBeGreaterThan(4);
  await expect(table.locator('.ds-table__table')).toHaveAttribute('aria-rowcount', '121');
  await expect(table.locator('.ds-table__footer-summary')).toHaveText('120 items');
  await expect(table.locator('.ds-table__body .ds-table__row').first()).toHaveAttribute(
    'aria-rowindex',
    '2'
  );

  await viewport.evaluate(element => {
    element.scrollTop = 1600;
  });
  await expect
    .poll(() =>
      table.evaluate(element => {
        const rows = [...element.querySelectorAll<HTMLElement>('.ds-table__body .ds-table__row')];
        return (
          !rows.some(row => row.dataset.rowId === 'virtual-0') &&
          rows.some(row => Number(row.dataset.rowId?.replace('virtual-', '')) > 20) &&
          rows.length < 50
        );
      })
    )
    .toBe(true);
});

test('large bounded pagination and infinite windows recycle row DOM without changing modes @pr-critical', async ({
  page,
}) => {
  const paginated = page.locator('#paginated');
  await paginated.evaluate(element => {
    const table = element as HTMLDsTableElement;
    const source = table.rows[0]!;
    table.rows = Array.from({ length: 200 }, (_, index) => ({
      ...source,
      id: `large-page-${index}`,
      selectable: true,
      disabled: false,
    }));
    table.selectedRowIds = [];
    table.pagination = {
      ...table.pagination!,
      pageIndex: 0,
      pageSize: 200,
      totalItems: 200,
    };
  });

  await expect(paginated).toHaveJSProperty('dataMode', 'pagination');
  await expect(paginated.locator('.ds-table__table--windowed')).toBeVisible();
  await expect.poll(() => paginated.locator('.ds-table__row').count()).toBeLessThan(50);
  await expect(paginated.locator('.ds-table__table')).toHaveAttribute('aria-rowcount', '201');
  await paginated.getByRole('checkbox', { name: 'Select all loaded rows' }).click();
  await expect
    .poll(() =>
      paginated.evaluate((element: HTMLDsTableElement) => element.selectedRowIds.length)
    )
    .toBe(200);

  const infinite = page.locator('#lazy');
  await infinite.evaluate(element => {
    const table = element as HTMLDsTableElement;
    const source = table.rows[0]!;
    table.maxHeight = '480px';
    table.rows = Array.from({ length: 200 }, (_, index) => ({
      ...source,
      id: `large-infinite-${index}`,
    }));
    table.displayedCount = 200;
    table.totalCount = 200;
    table.hasMore = false;
  });

  await expect(infinite).toHaveJSProperty('dataMode', 'infinite');
  await expect(infinite.locator('.ds-table__table--windowed')).toBeVisible();
  await expect.poll(() => infinite.locator('.ds-table__row').count()).toBeLessThan(50);
  await expect(infinite.locator('.ds-table__table')).toHaveAttribute('aria-rowcount', '201');
  await expect(infinite.locator('ds-pagination')).toHaveCount(0);
});

test('virtual mode reuses stable row shells when a pool slot re-enters the window', async ({
  page,
}) => {
  const table = page.locator('#virtual');
  const viewport = table.locator('.ds-table__viewport');
  const firstRow = table.locator('[data-row-id="virtual-0"]');
  await firstRow.evaluate(element => {
    (window as Window & { __virtualPoolProbe?: Element }).__virtualPoolProbe = element;
  });

  await viewport.evaluate(element => {
    element.scrollTop = 960;
  });
  await expect(table.locator('[data-row-id="virtual-0"]')).toHaveCount(0);
  await expect
    .poll(() =>
      table.evaluate(() => {
        const probe = (window as Window & { __virtualPoolProbe?: HTMLElement }).__virtualPoolProbe;
        return !!probe?.isConnected && probe.dataset.rowId !== 'virtual-0';
      })
    )
    .toBe(true);
});

test('virtual select-all applies to supplied rows that are not in the DOM', async ({ page }) => {
  const table = page.locator('#virtual');
  await table.getByRole('checkbox', { name: 'Select all loaded rows' }).click();
  await expect
    .poll(() => table.evaluate((element: HTMLDsTableElement) => element.selectedRowIds.length))
    .toBe(60);
  await expect
    .poll(() =>
      table.evaluate((element: HTMLDsTableElement) =>
        element.selectedRowIds.includes('virtual-116')
      )
    )
    .toBe(true);
  await expect.poll(() => table.locator('.ds-table__body .ds-table__row').count()).toBeLessThan(50);
});

test('virtual totals and busy state stay scoped to the complete supplied dataset', async ({
  page,
}) => {
  const table = page.locator('#virtual');
  await table.evaluate(element => {
    const virtual = element as HTMLDsTableElement;
    virtual.totalCount = 2_000;
    virtual.loadingMore = true;
  });

  await expect(table.locator('.ds-table__footer-summary')).toHaveText('120 items');
  await expect(table.locator('.ds-table__table')).toHaveAttribute('aria-rowcount', '121');
  await expect(table.locator('.ds-table__table')).not.toHaveAttribute('aria-busy', 'true');
});

test('keeps a focused row and an open action menu row mounted while virtualizing @pr-critical', async ({
  page,
}) => {
  const table = page.locator('#virtual');
  const viewport = table.locator('.ds-table__viewport');
  const firstRow = table.locator('[data-row-id="virtual-0"]');
  await firstRow.focus();
  await viewport.evaluate(element => {
    element.scrollTop = 1800;
  });
  await expect.poll(() => table.locator('[data-row-id="virtual-0"]').count()).toBe(1);

  await viewport.evaluate(element => {
    element.scrollTop = 0;
  });
  await expect.poll(() => table.locator('[data-row-id="virtual-0"]').count()).toBe(1);
  await table.getByRole('button', { name: 'More actions for Avery Chen 1' }).click();
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await viewport.evaluate(element => {
    element.scrollTop = 1800;
  });
  await expect.poll(() => table.locator('[data-row-id="virtual-0"]').count()).toBe(1);
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
});

test('virtual grouped tables flatten members into one scrollport with sticky push-off', async ({
  page,
}) => {
  const table = page.locator('#virtual-grouped');
  const viewport = table.locator('.ds-table__viewport');
  await expect(table.locator('.ds-table__group-count').first()).toHaveText('60');
  await expect(table.locator('.ds-table__group-count').first()).not.toContainText('of');
  await expect.poll(() => table.locator('.ds-table__body .ds-table__row').count()).toBeLessThan(50);
  await expect(table.locator('.ds-table__table')).toHaveAttribute('aria-rowcount', '123');
  await expect(table.locator('.ds-table__group-load-row')).toHaveCount(0);

  await viewport.evaluate(element => {
    element.scrollTop = 800;
  });
  await expect
    .poll(() =>
      table.evaluate(element => {
        const first = element.querySelector<HTMLElement>(
          'tbody[data-group-id="virtual-first"] .ds-table__group-row'
        );
        return first ? getComputedStyle(first).position : '';
      })
    )
    .toBe('sticky');

  const secondHeader = table.locator('tbody[data-group-id="virtual-second"] .ds-table__group-cell');
  await expect
    .poll(async () => {
      await viewport.evaluate(element => {
        element.scrollTop = element.scrollHeight;
      });
      return table.locator('tbody[data-group-id="virtual-second"] .ds-table__group-row').count();
    })
    .toBeGreaterThan(0);
  await expect(secondHeader).toBeVisible();
  const nestedScroll = await table.evaluate(element => {
    const groups = [...element.querySelectorAll<HTMLElement>('.ds-table__group')];
    return groups.some(group => {
      const overflow = getComputedStyle(group).overflowY;
      return overflow === 'auto' || overflow === 'scroll';
    });
  });
  expect(nestedScroll).toBe(false);

  await table.evaluate(element => {
    const virtual = element as HTMLDsTableElement;
    virtual.groups = virtual.groups.map((group, index) =>
      index === 0 ? { ...group, totalCount: 166 } : group
    );
    element.querySelector<HTMLElement>('.ds-table__viewport')!.scrollTop = 0;
  });
  await expect(
    table.locator('tbody[data-group-id="virtual-first"] .ds-table__group-count')
  ).toHaveText('166');
});

test('virtual table and rowgroup semantics survive windowing styles', async ({ page }) => {
  const virtual = page.locator('#virtual');
  const grouped = page.locator('#virtual-grouped');
  await expect(virtual.getByRole('table')).toBeVisible();
  await expect(virtual.getByRole('rowgroup')).toHaveCount(2);
  await expect(grouped.getByRole('rowgroup').first()).toBeVisible();
  await expect(grouped.getByRole('row').first()).toBeVisible();

  const results = await new AxeBuilder({ page })
    .include('#virtual')
    .include('#virtual-grouped')
    .analyze();
  expect(results.violations).toEqual([]);
});

test('virtual mode fails visibly without a bounded viewport', async ({ page }) => {
  const table = page.locator('#virtual-unbounded');
  await expect(table.getByText('Bounded height required')).toBeVisible();
  await expect(table.locator('.ds-table__body .ds-table__row')).toHaveCount(0);

  await table.evaluate(element => {
    (element as HTMLDsTableElement).maxHeight = 'none';
  });
  await expect(table.getByText('Bounded height required')).toBeVisible();
  await expect(table.locator('.ds-table__body .ds-table__row')).toHaveCount(0);

  await table.evaluate(element => {
    (element as HTMLDsTableElement).maxHeight = '240px';
  });
  await expect
    .poll(() => table.locator('.ds-table__body .ds-table__row').count())
    .toBeGreaterThan(0);
});

test('virtual windows follow height and fitViewport changes', async ({ page }) => {
  const table = page.locator('#virtual');
  const initial = await table.locator('.ds-table__body .ds-table__row').count();
  await table.evaluate(element => {
    (element as HTMLDsTableElement).height = '480px';
  });
  await expect
    .poll(() => table.locator('.ds-table__body .ds-table__row').count())
    .toBeGreaterThan(initial);

  const fit = page.locator('#virtual-fit');
  const owner = page.locator('#virtual-fit-owner');
  await owner.scrollIntoViewIfNeeded();
  await expect.poll(() => fit.locator('.ds-table__body .ds-table__row').count()).toBeGreaterThan(0);
  await expect.poll(() => fit.locator('.ds-table__body .ds-table__row').count()).toBeLessThan(80);
  await owner.evaluate(element => {
    (element as HTMLElement).style.height = '520px';
  });
  await expect
    .poll(() => fit.locator('.ds-table__viewport').evaluate(element => element.clientHeight))
    .toBeGreaterThan(200);
});

test('virtual mode rebuilds from the top when sort or load identity changes', async ({ page }) => {
  const table = page.locator('#virtual');
  const viewport = table.locator('.ds-table__viewport');
  await expect(table.locator('.ds-table__body .ds-table__row').first()).toHaveAttribute(
    'data-row-id',
    'virtual-0'
  );
  await viewport.evaluate(element => {
    element.scrollTop = 1200;
  });
  await expect.poll(() => viewport.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await table.locator('[data-sort-control="label"]').first().click();
  await expect.poll(() => viewport.evaluate(element => element.scrollTop)).toBe(0);
  await expect(table.locator('.ds-table__body .ds-table__row').first()).toHaveAttribute(
    'data-row-id',
    'virtual-119'
  );

  await table.evaluate((element: HTMLDsTableElement) => {
    element.rows = element.rows.map((row, index) => ({
      ...row,
      id: `replacement-${index}`,
    }));
  });
  await expect(table.locator('.ds-table__body .ds-table__row').first()).toHaveAttribute(
    'data-row-id',
    'replacement-0'
  );

  await viewport.evaluate(element => {
    element.scrollTop = 1200;
  });
  await table.evaluate(element => {
    (element as HTMLDsTableElement).loadIdentity = 'query-2';
  });
  await expect.poll(() => viewport.evaluate(element => element.scrollTop)).toBe(0);
});
