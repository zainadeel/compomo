import { expect, test } from '@playwright/test';
import type { ChartDefinition } from '../../src/wc/utils/chart-grammar';

test('10,000 grouped rows retain bounded DOM through selection, scrolling and reconnects @cross-browser', async ({
  page,
}) => {
  await page.goto('/table.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const table = page.locator('#virtual');
  await table.evaluate(element => {
    const host = element as HTMLDsTableElement;
    host.columns = [{ id: 'name', label: 'Name' }];
    host.groups = Array.from({ length: 100 }, (_, group) => ({
      id: `group-${group}`,
      label: `Group ${group}`,
      rows: Array.from({ length: 100 }, (_, index) => {
        const id = `stress-${group * 100 + index}`;
        return { id, cells: { name: id }, selectionLabel: id };
      }),
    }));
    host.grouping = { fieldId: 'name', direction: 'asc' };
    host.rows = [];
    host.totalCount = 10000;
    host.height = '480px';
    host.selectedRowIds = host.groups.flatMap(group => group.rows.map(row => row.id));
  });
  await expect(
    table.getByRole('checkbox', { name: 'Deselect all loaded rows', exact: true })
  ).toBeChecked();
  const rows = table.locator('.ds-table__body .ds-table__row');
  for (const id of ['stress-9999', 'stress-5000', 'stress-0']) {
    await expect
      .poll(() =>
        table.evaluate((element: HTMLDsTableElement, rowId) => element.scrollRowIntoView(rowId), id)
      )
      .toBe(true);
    const row = table.locator(`[data-row-id="${id}"]`);
    await expect(row).toBeVisible();
    await expect(row.getByRole('checkbox')).toBeChecked();
    await expect.poll(() => rows.count()).toBeLessThan(100);
    await table.evaluate(element => {
      const parent = element.parentElement!;
      element.remove();
      parent.append(element);
    });
  }
  await table.evaluate(element => {
    const host = element as HTMLDsTableElement;
    host.groups = host.groups
      .slice(0, 1)
      .map(group => ({ ...group, rows: group.rows.slice(0, 3) }));
    host.totalCount = 3;
    host.selectedRowIds = [];
  });
  await expect(rows).toHaveCount(3);
  await expect(
    table.getByRole('checkbox', { name: 'Select all loaded rows', exact: true })
  ).not.toBeChecked();
});

test('1,000-point chart focus reuses guide measurements and formats each tooltip item once @cross-browser', async ({
  page,
}) => {
  await page.goto('/formatting.html');
  const chart = page.locator('#dense');
  await expect(chart.locator('svg')).toBeVisible();
  await chart.evaluate(async element => {
    const host = element as HTMLDsChartElement;
    const previous = host.definition.chart;
    host.definition = {
      chart: context => {
        const spec = typeof previous === 'function' ? previous(context) : previous;
        return {
          ...spec,
          tooltip: {
            format: point => {
              host.dataset.formats = String(Number(host.dataset.formats ?? 0) + 1);
              return `Value ${point.yValue}`;
            },
          },
        };
      },
    } satisfies ChartDefinition;
    await document.fonts.ready;
    for (let frame = 0; frame < 8; frame++)
      await new Promise(resolve => requestAnimationFrame(resolve));
    host.dataset.formats = '0';
    host.dataset.measurements = '0';
    for (const label of host.querySelectorAll<SVGTextElement>('[data-chart-measure]')) {
      const measure = label.getBBox.bind(label);
      label.getBBox = (...args) => {
        host.dataset.measurements = String(Number(host.dataset.measurements) + 1);
        return measure(...args);
      };
    }
  });
  await chart.locator('svg').press('Home');
  await expect(chart.locator('.chart__status')).toContainText('Value');
  await expect(chart).toHaveAttribute('data-formats', '2');
  await expect(chart).toHaveAttribute('data-measurements', '0');
  await chart.locator('svg').press('End');
  await expect(chart).toHaveAttribute('data-formats', '4');
  await expect(chart).toHaveAttribute('data-measurements', '0');
  await chart.evaluate(element =>
    (element as HTMLElement).style.setProperty('--typography-fontsize-xs', '24px')
  );
  await chart.locator('svg').press('Home');
  await expect
    .poll(() => chart.getAttribute('data-measurements').then(value => Number(value)))
    .toBeGreaterThan(0);
});

test('streamed and large Markdown replaces prior output across reconnects @cross-browser', async ({
  page,
}) => {
  await page.goto('/runtime-lifecycle.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const markdown = page.locator('#markdown');
  await markdown.evaluate(async element => {
    const host = element as HTMLDsMarkdownElement;
    host.streaming = true;
    const block = 'A **formatted** paragraph with [details](https://example.com).\n\n';
    const text = block.repeat(Math.ceil(10000 / block.length)).slice(0, 10000);
    for (let end = 500; end <= text.length; end += 500) {
      host.content = text.slice(0, end);
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    host.content = '# Latest stream\n\n' + text;
    host.streaming = false;
  });
  await expect(markdown.getByRole('heading', { name: 'Latest stream' })).toBeVisible();
  await expect(markdown).not.toHaveAttribute('aria-busy', 'true');
  await markdown.evaluate(element => {
    (element as HTMLDsMarkdownElement).content =
      '# Large document\n\n' + 'A **large** paragraph.\n\n'.repeat(5000).slice(0, 100000);
  });
  await expect(markdown.getByRole('heading', { name: 'Large document' })).toBeVisible();
  for (let cycle = 0; cycle < 3; cycle++) {
    await markdown.evaluate((element, index) => {
      const host = element as HTMLDsMarkdownElement;
      const parent = host.parentElement!;
      host.content = '# Superseded';
      host.remove();
      host.content = `## Replacement ${index}\n\nOnly **current** content.`;
      parent.append(host);
    }, cycle);
    await expect(markdown.getByRole('heading')).toHaveText(`Replacement ${cycle}`);
    await expect(markdown.locator('.markdown__paragraph')).toHaveCount(1);
    await expect(markdown.locator('strong')).toHaveCount(1);
  }
});
