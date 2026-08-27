import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator } from '@playwright/test';
import { chromiumOnly } from './browser-tier';
import { COMPOSITED_EDGE_CEILING_PX, expectGeometryClose } from './rendered-geometry';

declare global {
  interface Window {
    __tableLoadEvents: Array<{
      id: string;
      detail: { reason: string; loadIdentity: string | number; loadedRowCount: number };
    }>;
    __tableCellActionEvents: Array<{
      actionId: string;
      rowId: string;
      columnId: string;
    }>;
    __tableRowActivationEvents: string[];
    __tablePaginationEvents: Array<{
      pageIndex: number;
      pageSize: number;
      previousPageIndex: number;
      previousPageSize: number;
      reason: string;
    }>;
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/table.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

async function focusByKeyboard(anchor: Locator) {
  await anchor.evaluate(element => {
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    (element as HTMLElement).focus();
  });
}

async function expectImageColumnToHugPreview(cell: Locator) {
  const difference = await cell.evaluate(element => {
    const preview = element.querySelector<HTMLElement>('.ds-table__cell-image')!;
    const styles = getComputedStyle(element);
    const expected =
      preview.getBoundingClientRect().width +
      Number.parseFloat(styles.paddingInlineStart) +
      Number.parseFloat(styles.paddingInlineEnd);
    return Math.abs(element.getBoundingClientRect().width - expected);
  });
  expect(difference).toBeLessThanOrEqual(COMPOSITED_EDGE_CEILING_PX);
}

test('renders native caption, header, row, and cell semantics @pr-critical', async ({ page }) => {
  const table = page.locator('#basic');
  const native = table.getByRole('table', { name: 'Workforce overview' });
  await expect(native).toBeVisible();
  await expect(native.locator('caption')).toHaveText('Workforce overview');
  await expect(native.locator('caption')).toHaveClass(/ds-visually-hidden/);
  await expect(table.locator('.ds-table__caption-bar')).toHaveText('Workforce overview');
  await expect(table.locator('.ds-table__caption-title')).toHaveAttribute('aria-hidden', 'true');
  await expect(table.locator('.ds-table__caption-bar')).toHaveCSS('height', '48px');
  const captionDivider = await table.locator('.ds-table__caption-bar').evaluate(element => {
    const probe = document.createElement('span');
    probe.style.background = 'var(--color-border-tertiary)';
    document.body.append(probe);
    const tertiary = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return { actual: getComputedStyle(element).borderBlockEndColor, tertiary };
  });
  expect(captionDivider.actual).toBe(captionDivider.tertiary);
  await expect(native.getByRole('columnheader')).toHaveCount(4);
  await expect(native.getByRole('row')).toHaveCount(5);
  await expect(native.getByRole('cell', { name: 'Avery Chen avery@example.com' })).toBeVisible();
  await expect(native.getByRole('cell', { name: 'Not available' })).toBeVisible();
  await expect(table.locator('.ds-table__footer')).toHaveCount(0);
});

test('highlights controlled literal search terms without changing cell names', async ({ page }) => {
  const table = page.locator('#basic');
  await table.evaluate((element: HTMLDsTableElement) => {
    element.highlightTerms = ['avery', 'V-20'];
  });

  const marks = table.locator('mark.ds-table__match');
  await expect(marks).toHaveCount(3);
  await expect(marks).toHaveText(['Avery', 'avery', 'V-20']);
  await expect(table.getByRole('cell', { name: 'Avery Chen avery@example.com' })).toBeVisible();
  await expect(table.getByRole('cell', { name: 'V-2048' })).toBeVisible();

  const colors = await marks.first().evaluate(element => {
    const actual = getComputedStyle(element);
    const probe = document.createElement('span');
    probe.style.backgroundColor = 'var(--color-background-faint-brand)';
    probe.style.color = 'var(--color-foreground-bold-brand)';
    document.body.append(probe);
    const expected = getComputedStyle(probe);
    const result = {
      background: actual.backgroundColor,
      foreground: actual.color,
      expectedBackground: expected.backgroundColor,
      expectedForeground: expected.color,
    };
    probe.remove();
    return result;
  });
  expect(colors.background).toBe(colors.expectedBackground);
  expect(colors.foreground).toBe(colors.expectedForeground);

  await table.evaluate((element: HTMLDsTableElement) => {
    element.highlightTerms = [];
  });
  await expect(marks).toHaveCount(0);
});

test('composes application controls inside table-owned header and footer chrome', async ({
  page,
}) => {
  const table = page.locator('#composable');
  const header = table.locator('.ds-table__caption-bar');
  const projected = table.locator('[data-table-header]');

  await expect(header).toHaveCSS('height', '48px');
  await expect(projected).toBeVisible();
  await expect(projected).toHaveAttribute('data-table-header', '');
  expect(
    await header.evaluate(
      (element, child) => element.contains(child),
      await projected.elementHandle()
    )
  ).toBe(true);
  const headerGeometry = await header.evaluate(
    (element, projectedElement) => {
      const headerRect = element.getBoundingClientRect();
      const projectedRect = (projectedElement as HTMLElement).getBoundingClientRect();
      const styles = getComputedStyle(element);
      return {
        paddingBlockStart: styles.paddingBlockStart,
        paddingInlineEnd: styles.paddingInlineEnd,
        paddingBlockEnd: styles.paddingBlockEnd,
        paddingInlineStart: styles.paddingInlineStart,
        projectedInsetStart: projectedRect.left - headerRect.left,
        projectedInsetEnd: headerRect.right - projectedRect.right,
      };
    },
    await projected.elementHandle()
  );
  expect(headerGeometry).toEqual({
    paddingBlockStart: '8px',
    paddingInlineEnd: '8px',
    paddingBlockEnd: '8px',
    paddingInlineStart: '8px',
    projectedInsetStart: 8,
    projectedInsetEnd: 8,
  });
  await expect(table.locator('.ds-table__caption-title')).toBeHidden();
  await header.getByRole('button', { name: 'Filter drivers' }).focus();
  await expect(header.getByRole('button', { name: 'Filter drivers' })).toBeFocused();
  await expect(table.locator('.ds-table__footer')).toHaveCSS('height', '48px');
  await expect(table.locator('.ds-table__footer')).toContainText('Displaying 4 of 12');
  await expect(
    table.locator('.ds-table__footer').getByRole('button', { name: 'Export drivers' })
  ).toBeVisible();
});

test('keeps the table geometry stable when composed header content mounts dynamically', async ({
  page,
}) => {
  const table = page.locator('#composable');

  const positions = await table.evaluate(async element => {
    const surface = element.querySelector<HTMLElement>('.ds-table')!;
    const positions = [surface.getBoundingClientRect().top];
    const header = element.querySelector<HTMLElement>('[slot="header"]')!;
    const selectionSummary = document.createElement('span');
    selectionSummary.textContent = '1 selected';
    header.append(selectionSummary);
    positions.push(surface.getBoundingClientRect().top);
    for (let frame = 0; frame < 4; frame += 1) {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      positions.push(surface.getBoundingClientRect().top);
    }
    return positions;
  });

  expect(new Set(positions).size).toBe(1);
  await expect(table.locator('[slot="header"]')).toContainText('1 selected');
});

test('keeps the visible caption bar outside horizontal table scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 900 });
  const table = page.locator('#basic');
  const viewport = table.locator('.ds-table__viewport');
  const captionBar = table.locator('.ds-table__caption-bar');

  const before = await table.evaluate(element => {
    const viewportElement = element.querySelector<HTMLElement>('.ds-table__viewport')!;
    const nativeTable = element.querySelector<HTMLElement>('.ds-table__table')!;
    const caption = element.querySelector<HTMLElement>('.ds-table__caption-bar')!;
    return {
      viewportWidth: viewportElement.getBoundingClientRect().width,
      tableWidth: nativeTable.getBoundingClientRect().width,
      captionLeft: caption.getBoundingClientRect().left,
      captionWidth: caption.getBoundingClientRect().width,
    };
  });
  expect(before.tableWidth).toBeGreaterThan(before.viewportWidth);
  expect(before.captionWidth).toBeCloseTo(before.viewportWidth, 0);

  await viewport.evaluate(element => {
    element.scrollLeft = 320;
  });
  await expect.poll(() => viewport.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  const after = await captionBar.evaluate(element => ({
    left: element.getBoundingClientRect().left,
    width: element.getBoundingClientRect().width,
  }));
  expect(after.left).toBeCloseTo(before.captionLeft, 0);
  expect(after.width).toBeCloseTo(before.captionWidth, 0);
});

test('renders an optional result summary footer from controlled counts', async ({ page }) => {
  const table = page.locator('#footer');
  const footer = table.locator('.ds-table__footer');
  await expect(footer).toBeVisible();
  await expect(footer).toContainText('Last updated: Aug 13, 2026  7:00 PM PT');
  await expect(footer).toContainText('Displaying 50 of 1,500');
  await expect(footer.locator('.ds-table__footer-summary')).toHaveJSProperty(
    'variant',
    'text-body-medium'
  );
  await expect(footer.locator('.ds-table__footer-summary')).toHaveJSProperty('color', 'secondary');
  await expect(footer.locator('.ds-table__footer-summary')).toHaveJSProperty('lineTruncation', 1);
  await expect
    .poll(() => footer.evaluate(element => getComputedStyle(element).blockSize))
    .toBe('48px');
  const footerChrome = await footer.evaluate(element => {
    const style = getComputedStyle(element);
    const probe = document.createElement('span');
    probe.style.background = 'var(--color-border-secondary)';
    document.body.append(probe);
    const secondary = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return {
      display: style.display,
      alignItems: style.alignItems,
      paddingInline: style.paddingInline,
      borderBlockStartStyle: style.borderBlockStartStyle,
      borderBlockStartWidth: Number.parseFloat(style.borderBlockStartWidth),
      borderBlockStartColor: style.borderBlockStartColor,
      secondary,
    };
  });
  expect(footerChrome).toMatchObject({
    display: 'flex',
    alignItems: 'center',
    paddingInline: '8px',
    borderBlockStartStyle: 'solid',
  });
  expect(footerChrome.borderBlockStartWidth).toBeGreaterThan(0);
  expect(footerChrome.borderBlockStartColor).toBe(footerChrome.secondary);
  const footerCopyGeometry = await footer.evaluate(element => {
    const copy = element.querySelector<HTMLElement>('.ds-table__bar-copy')!;
    const status = element.querySelector<HTMLElement>('[slot="footer-leading"]')!;
    const summary = element.querySelector<HTMLElement>('.ds-table__footer-summary')!;
    const statusText = status.querySelector<HTMLElement>('.ds-text__element') ?? status;
    const summaryText = summary.querySelector<HTMLElement>('.ds-text__element') ?? summary;
    const footerRect = element.getBoundingClientRect();
    return {
      copyPaddingInline: getComputedStyle(copy).paddingInline,
      statusPaddingInline: getComputedStyle(status.parentElement!).paddingInline,
      summaryPaddingInline: getComputedStyle(summary).paddingInline,
      leadingStart: statusText.getBoundingClientRect().left - footerRect.left,
      summaryEnd: footerRect.right - summaryText.getBoundingClientRect().right,
      leadingRight: statusText.getBoundingClientRect().right,
      summaryLeft: summaryText.getBoundingClientRect().left,
    };
  });
  expect(footerCopyGeometry.copyPaddingInline).toBe('6px');
  expect(footerCopyGeometry.statusPaddingInline).toBe('2px');
  expect(footerCopyGeometry.summaryPaddingInline).toBe('2px');
  expect(footerCopyGeometry.leadingStart).toBeCloseTo(16, 0);
  expect(footerCopyGeometry.summaryEnd).toBeCloseTo(16, 0);
  expect(footerCopyGeometry.summaryLeft).toBeGreaterThan(footerCopyGeometry.leadingRight);
  await expect(table.locator('caption')).toHaveClass(/ds-visually-hidden/);

  await table.evaluate(element => {
    element.style.inlineSize = '320px';
  });
  await expect
    .poll(() => footer.evaluate(element => getComputedStyle(element).blockSize))
    .toBe('48px');
  const narrowSummary = await footer.locator('.ds-table__footer-summary').evaluate(element => {
    const text = element.querySelector<HTMLElement>('.ds-text__element')!;
    const style = getComputedStyle(text);
    return {
      whiteSpace: style.whiteSpace,
      textOverflow: style.textOverflow,
      overflow: style.overflow,
      clientWidth: text.clientWidth,
      scrollWidth: text.scrollWidth,
    };
  });
  expect(narrowSummary).toMatchObject({
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  });
  expect(narrowSummary.scrollWidth).toBeGreaterThan(narrowSummary.clientWidth);

  await table.evaluate((element: HTMLDsTableElement) => {
    element.displayedCount = undefined;
  });
  await expect(footer).toBeVisible();
  await expect(footer.locator('.ds-table__footer-summary')).toHaveCount(0);
  await expect(footer).toContainText('Last updated: Aug 13, 2026  7:00 PM PT');
});

test('keeps the result summary when nested saved-view dialogs expose their own footer slot', async ({
  page,
}) => {
  const table = page.locator('#footer-nested');
  const footer = table.locator('.ds-table__footer');
  await expect(footer).toContainText('Last updated: Aug 13, 2026  7:00 PM PT');
  await expect(footer.locator('.ds-table__footer-summary')).toHaveText('Displaying 50 of 1,500');
});

test('keeps nested component footer slots scoped to footer-leading content', async ({ page }) => {
  const table = page.locator('#footer');
  await table.evaluate(element => {
    const component = document.createElement('div');
    component.slot = 'footer-leading';
    component.textContent = 'Saved views';
    const dialogAction = document.createElement('button');
    dialogAction.slot = 'footer';
    dialogAction.textContent = 'Save view';
    component.append(dialogAction);
    element.append(component);
  });

  await expect(table.locator('.ds-table__footer-summary')).toHaveText('Displaying 50 of 1,500');
  await table.evaluate(element => {
    (element as HTMLDsTableElement).displayedCount = 51;
  });
  await expect(table.locator('.ds-table__footer-summary')).toHaveText('Displaying 51 of 1,500');
});

test('reacts when owned footer content is added, renamed, and removed after hydration', async ({
  page,
}) => {
  const table = page.locator('#standard');
  await expect(table.locator('.ds-table__footer')).toHaveCount(0);

  await table.evaluate(element => {
    const action = document.createElement('button');
    action.id = 'dynamic-footer-action';
    action.slot = 'footer-trailing';
    action.textContent = 'Export current view';
    element.append(action);
  });
  await expect(table.locator('.ds-table__footer')).toBeVisible();
  await expect(table.getByRole('button', { name: 'Export current view' })).toBeVisible();

  await table.evaluate(element => {
    element.querySelector('#dynamic-footer-action')?.setAttribute('slot', 'unrelated');
  });
  await expect(table.locator('.ds-table__footer')).toHaveCount(0);

  await table.evaluate(element => {
    element.querySelector('#dynamic-footer-action')?.setAttribute('slot', 'footer');
  });
  await expect(table.locator('.ds-table__footer')).toBeVisible();
  await table.evaluate(element => {
    element.querySelector('#dynamic-footer-action')?.remove();
  });
  await expect(table.locator('.ds-table__footer')).toHaveCount(0);
});

test('toggles active sort direction and moves sorting only through another column', async ({
  page,
}) => {
  const table = page.locator('#basic');
  const driverHeader = table.getByRole('columnheader', { name: /Driver/ });
  const labelControl = driverHeader.locator('[data-sort-control="label"]');
  const directionControl = driverHeader.locator('[data-sort-control="direction"]');

  await expect(directionControl).toHaveCount(0);
  await labelControl.click();
  await expect(driverHeader).toHaveAttribute('aria-sort', 'ascending');
  await expect(directionControl).toHaveJSProperty('icon', 'ArrowUp');
  await expect(table.locator('tbody .ds-table__row').first()).toHaveAttribute(
    'data-row-id',
    'avery'
  );

  await directionControl.getByRole('button').click();
  await expect(driverHeader).toHaveAttribute('aria-sort', 'descending');
  await expect(directionControl).toHaveJSProperty('icon', 'ArrowDown');
  await expect(table.locator('tbody .ds-table__row').first()).toHaveAttribute('data-row-id', 'sam');

  await directionControl.getByRole('button').click();
  await expect(driverHeader).toHaveAttribute('aria-sort', 'ascending');
  await expect(directionControl).toHaveJSProperty('icon', 'ArrowUp');
  await expect(table.locator('tbody .ds-table__row').first()).toHaveAttribute(
    'data-row-id',
    'avery'
  );

  await table
    .getByRole('columnheader', { name: /Status/ })
    .locator('[data-sort-control="label"]')
    .click();
  await expect(driverHeader).not.toHaveAttribute('aria-sort');
  await expect(directionControl).toHaveCount(0);
  await expect(table.getByRole('columnheader', { name: /Status/ })).toHaveAttribute(
    'aria-sort',
    'ascending'
  );
});

test('shows dotted header help on the column label without a second control', async ({ page }) => {
  const table = page.locator('#basic');
  const score = table.locator('.ds-table__header-cell[data-column-id="score"]');
  const vehicle = table.locator('.ds-table__header-cell[data-column-id="vehicle"]');

  await expect(score.getByRole('button', { name: /About / })).toHaveCount(0);
  await expect(score.locator('.ds-table__header-label-box')).toHaveClass(
    /ds-text--decoration-dotted-underline/
  );
  await expect(vehicle.locator('.ds-table__header-label-box')).toHaveClass(
    /ds-text--decoration-dotted-underline/
  );
  await expect(vehicle.locator('.ds-table__header-labels')).toHaveAttribute('tabindex', '0');
  await expect(score.locator('.ds-table__header-labels')).not.toHaveAttribute('tabindex', '0');

  await score.locator('.ds-table__header-labels').hover();
  const scoreTip = page.getByRole('tooltip', { name: 'Rolling 7-day safety score from 0 to 100.' });
  await expect(scoreTip).toBeVisible();

  await score.locator('[data-sort-control="label"]').click();
  await expect(score).toHaveAttribute('aria-sort', 'ascending');

  await focusByKeyboard(vehicle.locator('.ds-table__header-labels'));
  await expect(page.getByRole('tooltip', { name: 'Assigned vehicle identifier.' })).toBeVisible();
});

test('keeps application group order fixed and exposes only member-row sorting', async ({
  page,
}) => {
  const table = page.locator('#grouped');
  await expect(table.locator('tbody[data-group-id]')).toHaveCount(3);
  await expect(table.locator('th[scope="rowgroup"]')).toHaveCount(3);
  await expect(table.locator('tbody[data-group-id]').first()).toHaveAttribute(
    'data-group-id',
    'driving'
  );

  const firstGroupHeader = table.locator('th[scope="rowgroup"]').first();
  const singleLineRowHeight = await page
    .locator('#basic tbody .ds-table__row[data-row-id="jordan"]')
    .evaluate(element => element.getBoundingClientRect().height);
  await expect(firstGroupHeader.locator('.ds-table__group-content')).toHaveCSS(
    'height',
    `${singleLineRowHeight}px`
  );
  await expect(firstGroupHeader.locator('.ds-table__group-copy ds-icon')).toHaveCount(0);
  const groupLabel = firstGroupHeader.locator('.ds-table__group-label');
  await expect(groupLabel).toHaveJSProperty('variant', 'text-body-medium');
  await expect(groupLabel).toHaveJSProperty('emphasis', true);
  await expect(firstGroupHeader.locator('.ds-table__group-separator')).toHaveText('·');
  const countText = firstGroupHeader.locator('.ds-table__group-count');
  await expect(countText).toHaveText('2 of 3');
  await expect(countText).toHaveJSProperty('variant', 'text-body-medium');
  await expect(countText).toHaveJSProperty('color', 'secondary');
  await expect(firstGroupHeader.locator('.ds-table__group-copy ds-tag')).toHaveCount(0);
  await expect(firstGroupHeader.locator('.ds-visually-hidden')).toHaveText('2 of 3 items loaded');
  const groupCopyInsets = await firstGroupHeader
    .locator('.ds-table__group-copy')
    .evaluate(element => {
      const styles = getComputedStyle(element);
      return {
        left: Number.parseFloat(styles.paddingLeft),
        right: Number.parseFloat(styles.paddingRight),
      };
    });
  expect(groupCopyInsets).toEqual({ left: 4, right: 4 });

  const toggle = firstGroupHeader.locator('.ds-table__group-toggle');
  await expect(toggle).toHaveJSProperty('variant', 'icon');
  await expect(toggle).toHaveJSProperty('size', 'md');
  await expect(toggle).toHaveJSProperty('isInset', true);
  await expect(toggle).toHaveJSProperty('insetDepth', 'double');
  await expect(toggle).toHaveCSS('width', '24px');
  await expect(toggle).toHaveCSS('height', '24px');
  await expect(toggle).toHaveJSProperty('icon', 'ChevronUp');
  await expect(toggle).toHaveJSProperty('expanded', true);
  await expect(toggle.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  await expect(toggle.getByRole('button')).not.toHaveClass(/button-unfilled--active/);
  await expect(toggle.getByRole('button')).not.toHaveClass(/ds-button--expanded/);
  await expect(toggle).toHaveJSProperty('hasBorder', false);
  await expect(table.locator('tbody[data-group-id="driving"] .ds-table__row')).toHaveCount(2);
  await toggle.click();
  await expect
    .poll(() => table.evaluate((element: HTMLDsTableElement) => element.collapsedGroupIds))
    .toEqual(['driving']);
  await expect(table.locator('tbody[data-group-id="driving"]')).toHaveAttribute(
    'data-collapsed',
    'true'
  );
  await expect(toggle).toHaveJSProperty('icon', 'ChevronDown');
  await expect(toggle).toHaveJSProperty('expanded', false);
  await expect(toggle.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  await expect(table.locator('tbody[data-group-id="driving"] .ds-table__row')).toHaveCount(0);

  const collapseAll = table.locator('.ds-table__collapse-all');
  await expect(collapseAll).toHaveJSProperty('variant', 'icon');
  await expect(collapseAll).toHaveJSProperty('size', 'xs');
  await expect(collapseAll).toHaveJSProperty('isInset', false);
  await expect(collapseAll).toHaveCSS('width', '24px');
  await expect(collapseAll).toHaveCSS('height', '16px');
  await expect(collapseAll).toHaveJSProperty('icon', 'ChevronDownUp');
  await expect(collapseAll).toHaveJSProperty('hasBorder', false);
  await expect(collapseAll).toHaveJSProperty('isActive', false);
  await expect(table.locator('th .ds-table__collapse-all')).toHaveCount(0);
  const collapseOverlay = table.locator('.ds-table__collapse-all-overlay');
  const collapseSurface = collapseOverlay.locator('.ds-table__collapse-all-surface');
  await expect(collapseOverlay).toHaveCSS('width', '24px');
  await expect(collapseOverlay).toHaveCSS('height', '16px');
  await expect(collapseSurface).toHaveClass(/ds-control-elevation--md/);
  await expect(collapseSurface).toHaveCSS('padding', '0px');
  expect(await collapseSurface.evaluate(element => getComputedStyle(element).boxShadow)).not.toBe(
    'none'
  );
  const collapseGeometry = await table.evaluate(element => {
    const frame = element.querySelector<HTMLElement>('.ds-table__frame')!;
    const header = element.querySelector<HTMLElement>('.ds-table__head')!;
    const overlay = element.querySelector<HTMLElement>('.ds-table__collapse-all-overlay')!;
    const surface = element.querySelector<HTMLElement>('.ds-table__collapse-all-surface')!;
    const frameRect = frame.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();
    const surfaceRect = surface.getBoundingClientRect();
    return {
      overlayBlockInset: overlayRect.top - headerRect.top,
      surfaceBlockStartInset: surfaceRect.top - headerRect.top,
      surfaceBlockEndInset: headerRect.bottom - surfaceRect.bottom,
      inlineEndInset: frameRect.right - overlayRect.right,
    };
  });
  expect(collapseGeometry).toEqual({
    overlayBlockInset: 8,
    surfaceBlockStartInset: 8,
    surfaceBlockEndInset: 8,
    inlineEndInset: 8,
  });
  await collapseAll.click();
  await expect
    .poll(() =>
      table.evaluate((element: HTMLDsTableElement) => element.collapsedGroupIds?.slice().sort())
    )
    .toEqual(['driving', 'off-duty', 'on-duty']);
  await expect(table.locator('tbody[data-group-id] .ds-table__row')).toHaveCount(0);
  await expect(table.locator('.ds-table__collapse-all')).toHaveCount(0);

  await table.locator('tbody[data-group-id="driving"] .ds-table__group-toggle').click();
  await expect(table.locator('.ds-table__collapse-all')).toHaveCount(1);
  await expect(table.locator('tbody[data-group-id="driving"] .ds-table__row')).toHaveCount(2);

  const statusHeader = table.getByRole('columnheader', { name: /Status/ });
  await expect(statusHeader.locator('[data-sort-control="direction"]')).toHaveCount(0);
  await expect(statusHeader).not.toHaveAttribute('aria-sort');
  await expect(table.locator('tbody[data-group-id]').first()).toHaveAttribute(
    'data-group-id',
    'driving'
  );
  await expect(table.getByRole('columnheader', { name: /Safety score/ })).toHaveAttribute(
    'aria-sort',
    'descending'
  );

  const scoreHeader = table.getByRole('columnheader', { name: /Safety score/ });
  await scoreHeader.locator('[data-sort-control="label"]').click();
  await expect(scoreHeader).toHaveAttribute('aria-sort', 'ascending');
  await expect(table.locator('tbody[data-group-id]').first()).toHaveAttribute(
    'data-group-id',
    'driving'
  );
});

test('applies faint intent-to-neutral surfaces and bold titles to severity groups', async ({
  page,
}) => {
  const table = page.locator('#severity-grouped');
  const expected = [
    { id: 'critical', intent: 'negative', label: 'Critical', count: 2 },
    { id: 'high', intent: 'warning', label: 'High', count: 2 },
    { id: 'medium', intent: 'caution', label: 'Medium', count: 1 },
    { id: 'low', intent: 'neutral', label: 'Low', count: 1 },
  ] as const;

  for (const group of expected) {
    const body = table.locator(`tbody[data-group-id="${group.id}"]`);
    await expect(body).toHaveAttribute('data-group-intent', group.intent);
    const header = body.locator('th.ds-table__group-cell');
    await expect(header).toHaveClass(new RegExp(`ds-table__group-cell--intent-${group.intent}`));
    const colors = await header.evaluate((element, intent) => {
      const probe = document.createElement('span');
      document.body.append(probe);
      const resolveToken = (token: string) => {
        probe.style.background = `var(${token})`;
        return getComputedStyle(probe).backgroundColor;
      };
      const intentColor = resolveToken(`--color-background-faint-${intent}`);
      const neutralColor = resolveToken('--color-background-faint-neutral');
      probe.remove();
      const content = element.querySelector<HTMLElement>('.ds-table__group-content')!;
      const styles = getComputedStyle(content);
      return {
        backgroundColor: styles.backgroundColor,
        backgroundImage: styles.backgroundImage,
        intentColor,
        neutralColor,
      };
    }, group.intent);
    if (group.intent === 'neutral') {
      expect(colors.backgroundImage).toBe('none');
      expect(colors.backgroundColor).toBe(colors.neutralColor);
    } else {
      expect(colors.backgroundImage).toContain(colors.intentColor);
      expect(colors.backgroundImage).toContain(colors.neutralColor);
    }
    const label = header.locator('.ds-table__group-label');
    await expect(label).toHaveText(group.label);
    if (group.intent === 'neutral') {
      await expect(label).toHaveJSProperty('color', 'var(--color-foreground-bold-neutral)');
    } else {
      await expect(label).toHaveJSProperty('color', group.intent);
    }
    await expect(header.locator('.ds-table__group-separator')).toHaveText('·');
    const countText = header.locator('.ds-table__group-count');
    await expect(countText).toHaveText(`${group.count} of ${group.count}`);
    await expect(countText).toHaveJSProperty('variant', 'text-body-medium');
    await expect(countText).toHaveJSProperty('color', 'secondary');
    await expect(countText).toHaveAttribute('aria-hidden', 'true');
    await expect(header.locator('.ds-table__group-copy ds-tag')).toHaveCount(0);
    await expect(header.locator('.ds-visually-hidden')).toHaveText(
      `${group.count} of ${group.count} ${group.count === 1 ? 'item' : 'items'} loaded`
    );
  }

  const selectableGroupCopyInsets = await table
    .locator('tbody[data-group-id="critical"] .ds-table__group-copy')
    .evaluate(element => {
      const styles = getComputedStyle(element);
      return {
        left: Number.parseFloat(styles.paddingLeft),
        right: Number.parseFloat(styles.paddingRight),
      };
    });
  expect(selectableGroupCopyInsets).toEqual({ left: 10, right: 4 });

  const expandedGeometry = await table.locator('tbody[data-group-id="critical"]').evaluate(body => {
    const content = body.querySelector<HTMLElement>('.ds-table__group-content')!;
    const toggle = body.querySelector<HTMLElement>('.ds-table__group-toggle')!;
    const contentRect = content.getBoundingClientRect();
    const toggleRect = toggle.getBoundingClientRect();
    const border = Number.parseFloat(getComputedStyle(content).borderBottomWidth);
    return {
      height: contentRect.height,
      top: toggleRect.top - contentRect.top,
      bottomInsideBorder: contentRect.bottom - toggleRect.bottom - border,
    };
  });
  const singleLineRowHeight = await page
    .locator('#basic tbody .ds-table__row[data-row-id="jordan"]')
    .evaluate(element => element.getBoundingClientRect().height);
  expect(expandedGeometry.height).toBe(singleLineRowHeight);
  expect(expandedGeometry.top).toBeCloseTo(expandedGeometry.bottomInsideBorder, 0);

  const sectionDivider = await table
    .locator('tbody[data-group-id="critical"] .ds-table__group-content')
    .evaluate(element => {
      const probe = document.createElement('span');
      probe.style.background = 'var(--color-border-secondary)';
      document.body.append(probe);
      const secondary = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return {
        actual: getComputedStyle(element, '::after').backgroundColor,
        secondary,
      };
    });
  expect(sectionDivider.actual).toBe(sectionDivider.secondary);

  await table.locator('.ds-table__collapse-all').click();
  const collapsedContents = table.locator('tbody[data-group-id] .ds-table__group-content');
  await expect(table.locator('tbody[data-group-id] .ds-table__row')).toHaveCount(0);
  for (let index = 0; index < expected.length; index += 1) {
    const body = table.locator(`tbody[data-group-id="${expected[index].id}"]`);
    await expect(body.locator('.ds-table__group-cell')).toHaveCSS('border-bottom-width', '0px');
    await expect(collapsedContents.nth(index)).toHaveCSS('background-clip', 'border-box');
    await expect(collapsedContents.nth(index)).toHaveCSS('border-bottom-width', '0px');
    const separatorDisplay = await collapsedContents
      .nth(index)
      .evaluate(element => getComputedStyle(element, '::after').display);
    expect(separatorDisplay).toBe(index === expected.length - 1 ? 'none' : 'block');
  }
});

test('yields the grouped load divider only at the terminal table edge', async ({ page }) => {
  const table = page.locator('#severity-grouped');
  await table.evaluate((element: HTMLDsTableElement) => {
    element.loadMoreMode = 'manual';
    element.displayedCount = element.groups.reduce((count, group) => count + group.rows.length, 0);
    element.totalCount = element.displayedCount + element.groups.length;
    element.groups = element.groups.map(group => ({
      ...group,
      totalCount: group.rows.length + 1,
      hasMore: true,
    }));
  });

  const loadCells = table.locator('.ds-table__group-load-row .ds-table__load-cell');
  const criticalProgress = table.locator('tbody[data-group-id="critical"] .ds-table__group-count');
  await expect(loadCells).toHaveCount(4);
  await expect(table.locator('.ds-table__footer')).toBeVisible();
  await expect(criticalProgress).toHaveText('2 of 3');
  await expect(loadCells.first()).not.toHaveCSS('border-bottom-width', '0px');
  await expect(loadCells.last()).toHaveCSS('border-bottom-width', '0px');

  await table.evaluate((element: HTMLDsTableElement) => {
    element.groups = element.groups.map((group, index) =>
      index === 0
        ? {
            ...group,
            rows: [
              ...group.rows,
              {
                id: 'crit-3',
                cells: {
                  behavior: 'Hard braking',
                  severity: 'Critical',
                  driver: 'Avery Chen',
                },
              },
            ],
            hasMore: false,
          }
        : group
    );
  });
  await expect(criticalProgress).toHaveText('3 of 3');
});

test('group section checkboxes select and clear group members when selectable', async ({
  page,
}) => {
  const table = page.locator('#severity-grouped');
  const criticalBody = table.locator('tbody[data-group-id="critical"]');
  const groupCheckbox = criticalBody.getByRole('checkbox', {
    name: 'Select loaded rows in Critical group',
  });
  await expect(criticalBody.locator('.ds-table__group-selection')).toHaveCount(1);
  await expect(groupCheckbox).toHaveAttribute('aria-checked', 'false');

  await groupCheckbox.click();
  await expect
    .poll(() =>
      table.evaluate((element: HTMLDsTableElement) => element.selectedRowIds?.slice().sort())
    )
    .toEqual(['crit-1', 'crit-2']);
  await expect(
    criticalBody.getByRole('checkbox', { name: 'Deselect loaded rows in Critical group' })
  ).toHaveAttribute('aria-checked', 'true');

  await criticalBody
    .getByRole('checkbox', { name: 'Deselect loaded rows in Critical group' })
    .click();
  await expect
    .poll(() => table.evaluate((element: HTMLDsTableElement) => element.selectedRowIds))
    .toEqual([]);
});

test('keeps group section chrome pinned to the visible horizontal scrollport', async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 900 });
  const table = page.locator('#severity-grouped');
  const viewport = table.locator('.ds-table__viewport');
  const groupContent = table.locator('.ds-table__group-content').first();

  const measure = () =>
    table.evaluate(element => {
      const viewportElement = element.querySelector<HTMLElement>('.ds-table__viewport')!;
      const nativeTable = element.querySelector<HTMLElement>('.ds-table__table')!;
      const content = element.querySelector<HTMLElement>('.ds-table__group-content')!;
      const viewportRect = viewportElement.getBoundingClientRect();
      const tableRect = nativeTable.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      return {
        viewportClientWidth: viewportElement.clientWidth,
        viewportLeft: viewportRect.left,
        tableWidth: tableRect.width,
        contentLeft: contentRect.left,
        contentWidth: contentRect.width,
        collapseOverlayLeft: element
          .querySelector<HTMLElement>('.ds-table__collapse-all-overlay')!
          .getBoundingClientRect().left,
      };
    });

  // ResizeObserver delivery is asynchronous. In particular, WebKit can expose
  // the previous viewport measurement until the controller's next animation
  // frame after Playwright changes the page viewport.
  await expect
    .poll(async () => {
      const current = await measure();
      return Math.round(
        current.contentWidth - Math.min(current.tableWidth, current.viewportClientWidth)
      );
    })
    .toBe(0);

  const before = await measure();
  expect(before.tableWidth).toBeGreaterThan(before.viewportClientWidth);
  expect(before.contentWidth).toBeCloseTo(
    Math.min(before.tableWidth, before.viewportClientWidth),
    0
  );
  expect(before.contentLeft).toBeCloseTo(before.viewportLeft, 0);

  await viewport.evaluate(element => {
    element.scrollLeft = 320;
  });
  await expect.poll(() => viewport.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  const after = await measure();
  expect(after.contentWidth).toBeCloseTo(before.contentWidth, 0);
  expect(after.contentLeft).toBeCloseTo(after.viewportLeft, 0);
  expect(after.collapseOverlayLeft).toBeCloseTo(before.collapseOverlayLeft, 0);
  await expect(groupContent).toBeVisible();
});

test('uses declared action-column metadata without replacing a visible header', async ({
  page,
}) => {
  const table = page.locator('#grouped');
  await table.evaluate((element: HTMLDsTableElement) => {
    element.columns = [
      ...element.columns,
      {
        id: 'actions',
        kind: 'action',
        header: 'Row actions',
        align: 'center',
        size: 120,
      },
    ];
  });
  const actionHeader = table.locator('th[data-column-id="actions"]');
  await expect(actionHeader).toContainText('Row actions');
  await expect(table.locator('.ds-table__collapse-all-overlay')).toHaveCount(0);
  await expect(actionHeader.locator('.ds-table__collapse-all')).toHaveCount(1);
});

test('sorts compound columns by independent label-width controls', async ({ page }) => {
  const table = page.locator('#compound');
  const header = table.locator('th[data-column-id="behaviorDetails"]');
  const labels = header.locator('[data-sort-control="label"]');
  await expect(labels).toHaveCount(2);
  await expect(header.locator('.ds-table__header-separator')).toHaveJSProperty('color', 'tertiary');
  await expect(table.locator('ds-tag')).toHaveCount(2);
  await expect(table.locator('ds-tag').first()).toHaveJSProperty('label', 'Pending review');
  await expect(table.locator('ds-tag').first()).toHaveJSProperty('intent', 'caution');
  await expect(table.locator('ds-tag').first()).toHaveJSProperty('size', 'md');
  await expect(table.locator('ds-tag').first()).toHaveJSProperty('isInset', true);
  await expect(table.locator('ds-tag').first()).toHaveJSProperty('insetDepth', 'double');
  await expect(table.locator('ds-tag').first()).toHaveCSS('height', '24px');

  const firstRow = table.locator('tbody .ds-table__row').first();
  const firstDataCell = firstRow.locator('.ds-table__cell:not(.ds-table__selection-cell)').first();
  await expect(firstDataCell).toHaveCSS('padding-top', '8px');
  await expect(firstDataCell).toHaveCSS('padding-right', '8px');
  await expect(firstDataCell).toHaveCSS('padding-bottom', '8px');
  await expect(firstDataCell).toHaveCSS('padding-left', '8px');
  const primaryTrack = firstRow.locator('.ds-table__cell-primary');
  const secondaryTrack = firstRow.locator('.ds-table__cell-secondary');
  await expect(primaryTrack).toHaveJSProperty('variant', 'text-body-medium');
  await expect(secondaryTrack).toHaveJSProperty('variant', 'text-body-small');
  await expect(secondaryTrack).toHaveJSProperty('color', 'negative');

  const trackGeometry = await firstRow.evaluate(row => {
    const bounds = (selector: string) => {
      const rect = row.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, height: rect.height };
    };
    return {
      checkbox: bounds('.ds-table__selection-control'),
      primary: bounds('.ds-table__cell-primary'),
      secondary: bounds('.ds-table__cell-secondary'),
      tag: bounds('ds-tag'),
    };
  });
  expect(trackGeometry.checkbox.top).toBeCloseTo(trackGeometry.primary.top, 0);
  expect(trackGeometry.tag.top).toBeCloseTo(trackGeometry.primary.top, 0);
  expect(trackGeometry.checkbox.height).toBeCloseTo(24, 0);
  expect(trackGeometry.primary.height).toBeCloseTo(24, 0);
  expect(trackGeometry.tag.height).toBeCloseTo(24, 0);
  expect(trackGeometry.secondary.top - trackGeometry.primary.bottom).toBeCloseTo(2, 0);
  expect(trackGeometry.secondary.height).toBeCloseTo(20, 0);

  const geometry = await labels.evaluateAll(elements =>
    elements.map(element => {
      const control = element.getBoundingClientRect();
      const label = element.querySelector('.ds-table__header-label-box')!.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        controlWidth: control.width,
        labelWidth: label.width,
        paddingLeft: Number.parseFloat(style.paddingLeft),
        paddingRight: Number.parseFloat(style.paddingRight),
      };
    })
  );
  for (const item of geometry) {
    expect(item.paddingLeft).toBe(2);
    expect(item.paddingRight).toBe(2);
    expect(item.controlWidth - item.labelWidth).toBeCloseTo(4, 0);
    expect(item.controlWidth).toBeLessThan(100);
  }

  const labelColors = async () =>
    labels.nth(0).evaluate(element => {
      const tokenColor = (token: string) => {
        const probe = document.createElement('span');
        probe.style.color = `var(${token})`;
        document.body.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      };
      return {
        actual: getComputedStyle(element).color,
        primary: tokenColor('--color-foreground-primary'),
        secondary: tokenColor('--color-foreground-secondary'),
      };
    });
  const restingColors = await labelColors();
  expect(restingColors.actual).toBe(restingColors.secondary);
  await labels.nth(0).hover();
  const hoveredColors = await labelColors();
  expect(hoveredColors.actual).toBe(hoveredColors.primary);

  await labels.nth(1).click();
  await expect
    .poll(() => table.evaluate((element: HTMLDsTableElement) => element.sort))
    .toEqual({
      columnId: 'severity',
      direction: 'asc',
    });
  await expect(labels.nth(1).locator('ds-text')).toHaveJSProperty('emphasis', true);
  await expect(labels.nth(0).locator('ds-text')).toHaveJSProperty('emphasis', false);

  await labels.nth(0).click();
  await expect
    .poll(() => table.evaluate((element: HTMLDsTableElement) => element.sort))
    .toEqual({
      columnId: 'behavior',
      direction: 'asc',
    });
});

test('renders independently styled standard cell types', async ({ page }) => {
  // Reproduce an application where nested ds-text styles hydrate after ds-table.
  await page.addStyleTag({
    content: '.sc-ds-text-h:not(.tag__label) { display: block; padding: 0; border: 0; }',
  });
  const table = page.locator('#cell-types');
  const selectionCell = table.locator('[data-row-id="tag-variants"] .ds-table__selection-cell');
  const singleText = table.locator('[data-column-id="singleText"][data-cell-variant="single"]');
  const primarySecondary = table.locator(
    '[data-column-id="primarySecondary"][data-cell-variant="multi"]'
  );
  const linkedText = table.locator('[data-column-id="linkedText"][data-cell-variant="multi"]');
  const primaryPair = table.locator(
    '[data-column-id="primaryPair"][data-cell-variant="primary-pair"]'
  );
  const event = table.locator('[data-column-id="event"][data-cell-variant="multi"]');
  const image = table.locator('[data-column-id="image"][data-cell-type="image"]');
  const icon = table.locator('[data-column-id="icon"][data-cell-type="icon"]');
  const iconText = table.locator('[data-column-id="iconText"][data-cell-type="icon-text"]');
  const empty = table.locator('[data-column-id="empty"][data-cell-type="empty"]');
  const blank = table.locator('[data-column-id="blank"][data-cell-type="blank"]');
  const tagOnly = table.locator('[data-cell-variant="tag-only"]');
  const tagWithText = table.locator('[data-cell-variant="tag-with-text"]');
  const textWithTag = table.locator('[data-cell-variant="text-with-tag"]');
  const action = table.locator('[data-column-id="action"][data-cell-type="action"]');
  const borderedAction = table.locator(
    '[data-column-id="borderedAction"][data-cell-type="action"]'
  );
  const actionHeader = table.locator('.ds-table__header-cell[data-column-id="action"]');
  const borderedActionHeader = table.locator(
    '.ds-table__header-cell[data-column-id="borderedAction"]'
  );

  const headerLabel = table.locator('.ds-table__header-label-box').first();
  await expect(headerLabel).toHaveCSS('padding-left', '2px');
  await expect(headerLabel).toHaveCSS('padding-right', '2px');

  for (const cell of [tagOnly, tagWithText, textWithTag]) {
    await expect(cell).toHaveAttribute('data-cell-type', 'tag');
  }

  await expect(selectionCell).toHaveCSS('padding-top', '8px');
  await expect(selectionCell).toHaveCSS('padding-right', '8px');
  await expect(selectionCell).toHaveCSS('padding-bottom', '8px');
  await expect(selectionCell).toHaveCSS('padding-left', '8px');
  await expect(selectionCell.locator('.ds-table__selection-control')).toHaveCSS('width', '24px');
  await expect(selectionCell.locator('.ds-table__selection-control')).toHaveCSS('height', '24px');
  await expect(selectionCell.locator('ds-checkbox')).toHaveCSS('width', '20px');
  await expect(selectionCell.locator('ds-checkbox')).toHaveCSS('height', '20px');

  for (const cell of [singleText, empty, blank]) {
    await expect(cell).toHaveCSS('padding-top', '8px');
    await expect(cell).toHaveCSS('padding-right', '8px');
    await expect(cell).toHaveCSS('padding-bottom', '8px');
    await expect(cell).toHaveCSS('padding-left', '8px');
    await expect(cell.locator('.ds-table__cell-content')).toHaveCSS('min-height', '0px');
  }
  await expect(singleText.locator('.ds-table__cell-track')).toHaveCSS('min-height', '0px');
  await expect(singleText.locator('.ds-table__cell-track')).toHaveCSS('padding-left', '4px');
  await expect(singleText.locator('.ds-table__cell-track')).toHaveCSS('padding-right', '4px');
  await expect(singleText.locator('.ds-table__cell-track')).toHaveCSS('padding-top', '2px');
  await expect(singleText.locator('.ds-table__cell-track')).toHaveCSS('padding-bottom', '2px');
  await expect(singleText.locator('.ds-table__cell-track')).toHaveCSS('height', '24px');
  await expect(empty.locator('.ds-table__cell-track')).toHaveCSS('padding-left', '4px');
  await expect(empty.locator('.ds-table__cell-track')).toHaveCSS('padding-right', '4px');
  await expect(primarySecondary).toHaveClass(/ds-table__cell--text-multi/);
  await expect(primarySecondary).toHaveCSS('height', '62px');
  await expect(primarySecondary).toHaveCSS('padding-top', '8px');
  await expect(primarySecondary).toHaveCSS('padding-right', '8px');
  await expect(primarySecondary).toHaveCSS('padding-bottom', '8px');
  await expect(primarySecondary).toHaveCSS('padding-left', '8px');
  await expect(primarySecondary.locator('.ds-table__cell-content')).toHaveCSS('min-height', '0px');
  await expect(primarySecondary.locator('.ds-table__cell-copy')).toHaveCSS('gap', '2px');
  for (const track of [
    primarySecondary.locator('.ds-table__cell-primary'),
    primarySecondary.locator('.ds-table__cell-secondary'),
  ]) {
    await expect(track).toHaveCSS('min-height', '0px');
    await expect(track).toHaveCSS('padding-left', '4px');
    await expect(track).toHaveCSS('padding-right', '4px');
  }
  await expect(primarySecondary.locator('.ds-table__cell-secondary')).toHaveCSS(
    'padding-top',
    '2px'
  );
  await expect(primarySecondary.locator('.ds-table__cell-secondary')).toHaveCSS(
    'padding-bottom',
    '2px'
  );
  await expect(primarySecondary.locator('.ds-table__cell-primary')).toHaveCSS('padding-top', '2px');
  await expect(primarySecondary.locator('.ds-table__cell-primary')).toHaveCSS(
    'padding-bottom',
    '2px'
  );
  await expect(primarySecondary.locator('.ds-table__cell-primary')).toHaveCSS('height', '24px');
  await expect(linkedText).toHaveClass(/ds-table__cell--text-multi/);
  await expect(linkedText.locator('a.ds-table__cell-link')).toHaveClass(/ds-text-action/);
  await expect(linkedText.locator('a.ds-table__cell-link')).toHaveClass(/ds-focus-ring/);
  await expect(linkedText.locator('a.ds-table__cell-link .ds-table__cell-primary')).toBeVisible();
  await expect(linkedText.locator('a .ds-table__cell-secondary')).toHaveCount(0);
  await expect(linkedText.locator('.ds-table__cell-secondary')).toHaveText('VEH-1042');
  await expect(primaryPair).toHaveClass(/ds-table__cell--primary-text/);
  await expect(primaryPair).toHaveCSS('padding-top', '8px');
  await expect(primaryPair).toHaveCSS('padding-right', '8px');
  await expect(primaryPair).toHaveCSS('padding-bottom', '8px');
  await expect(primaryPair).toHaveCSS('padding-left', '8px');
  await expect(primaryPair.locator('.ds-table__cell-copy')).toHaveCSS('gap', '2px');
  await expect(primaryPair.locator('.ds-table__cell-primary')).toHaveCSS('padding-top', '2px');
  await expect(primaryPair.locator('.ds-table__cell-primary')).toHaveCSS('padding-bottom', '2px');
  await expect(primaryPair.locator('.ds-table__cell-secondary')).toHaveCSS('padding-top', '0px');
  await expect(primaryPair.locator('.ds-table__cell-secondary')).toHaveCSS('padding-bottom', '0px');
  for (const track of [
    primaryPair.locator('.ds-table__cell-primary'),
    primaryPair.locator('.ds-table__cell-secondary'),
  ]) {
    await expect(track).toHaveJSProperty('variant', 'text-body-medium');
    await expect(track).toHaveJSProperty('color', 'primary');
    await expect(track).toHaveCSS('padding-left', '4px');
    await expect(track).toHaveCSS('padding-right', '4px');
  }
  await expect(event).toHaveClass(/ds-table__cell--text-multi/);
  await expect(event.locator('.ds-table__cell-track--runs')).toHaveCount(1);
  await expect(event.locator('.ds-table__cell-run')).toHaveCount(2);
  await expect(event.locator('.ds-table__cell-run-separator')).toHaveCount(1);
  await expect(event.locator('.ds-table__cell-run').nth(0)).toHaveText('High');
  await expect(event.locator('.ds-table__cell-run').nth(0)).toHaveJSProperty('color', 'negative');
  await expect(event.locator('.ds-table__cell-run').nth(1)).toHaveText('45 mph over');
  await expect(event.locator('.ds-table__cell-secondary')).toHaveCSS('height', '20px');
  await expect(image).toHaveClass(/ds-table__cell--image/);
  await expect(image).toHaveClass(/ds-table__cell--image-multi/);
  await expect(image).toHaveAttribute('data-cell-variant', 'multi');
  await expect(image).toHaveCSS('padding-top', '8px');
  await expect(image).toHaveCSS('padding-right', '8px');
  await expect(image).toHaveCSS('padding-bottom', '8px');
  await expect(image).toHaveCSS('padding-left', '8px');
  await expectImageColumnToHugPreview(image);
  await expect(image).toHaveCSS('height', '62px');
  const imagePlaceholder = image.getByRole('img', { name: 'Safety event preview unavailable' });
  await expect(imagePlaceholder).toBeVisible();
  await expect(imagePlaceholder.locator('..')).toHaveCSS('height', '46px');
  await expect(imagePlaceholder.locator('..')).toHaveCSS('border-radius', '2px');
  const imageGeometry = await image.locator('.ds-table__cell-image').evaluate(element => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-border-tertiary)';
    document.body.append(probe);
    const tertiaryBorder = getComputedStyle(probe).color;
    probe.remove();
    return {
      width: rect.width,
      height: rect.height,
      borderColor: style.borderColor,
      tertiaryBorder,
    };
  });
  expect(imageGeometry.width / imageGeometry.height).toBeCloseTo(16 / 9, 2);
  expect(imageGeometry.borderColor).toBe(imageGeometry.tertiaryBorder);
  await expect(icon).toHaveClass(/ds-table__cell--icon/);
  await expect(icon).toHaveCSS('padding-top', '8px');
  await expect(icon).toHaveCSS('padding-right', '8px');
  await expect(icon).toHaveCSS('padding-bottom', '8px');
  await expect(icon).toHaveCSS('padding-left', '8px');
  await expect(icon.locator('.ds-table__cell-content')).toHaveCSS('min-height', '24px');
  await expect(icon.getByRole('img', { name: 'Has notes' })).toBeVisible();
  await expect(icon.locator('ds-icon')).toHaveJSProperty('name', 'DocumentInverted');
  await expect(icon.locator('ds-icon')).toHaveJSProperty('size', 'md');
  await expect(icon.locator('ds-icon')).toHaveJSProperty('color', 'secondary');
  await expect(icon.locator('ds-icon')).toHaveCSS('width', '20px');
  await expect(icon.locator('ds-icon')).toHaveCSS('height', '20px');
  await expect(iconText).toHaveClass(/ds-table__cell--icon-text/);
  await expect(iconText).toHaveClass(/ds-table__cell--icon-text-multi/);
  await expect(iconText).not.toHaveClass(/ds-table__cell--text-multi/);
  await expect(iconText).toHaveAttribute('data-cell-variant', 'multi');
  await expect(iconText).toHaveCSS('height', '62px');
  await expect(iconText).toHaveCSS('padding-top', '8px');
  await expect(iconText).toHaveCSS('padding-right', '8px');
  await expect(iconText).toHaveCSS('padding-bottom', '8px');
  await expect(iconText).toHaveCSS('padding-left', '8px');
  await expect(iconText.locator('.ds-table__cell-icon-text')).toHaveCSS('gap', '2px');
  await expect(iconText.locator('.ds-table__cell-icon-text-icon')).toHaveCSS('padding-top', '2px');
  await expect(iconText.locator('.ds-table__cell-icon-text-icon')).toHaveCSS(
    'padding-right',
    '2px'
  );
  await expect(iconText.locator('.ds-table__cell-icon-text-icon')).toHaveCSS(
    'padding-bottom',
    '2px'
  );
  await expect(iconText.locator('.ds-table__cell-icon-text-icon')).toHaveCSS('padding-left', '2px');
  await expect(iconText.locator('ds-icon')).toHaveJSProperty('name', 'VehicleTruck');
  await expect(iconText.locator('ds-icon')).toHaveJSProperty('size', 'md');
  await expect(iconText.locator('ds-icon')).toHaveJSProperty('color', 'secondary');
  await expect(iconText.locator('ds-icon')).toHaveCSS('width', '20px');
  await expect(iconText.locator('ds-icon')).toHaveCSS('height', '20px');
  await expect(iconText.locator('.ds-table__cell-copy')).toHaveCSS('gap', '2px');
  await expect(iconText.locator('.ds-table__cell-primary')).toHaveCSS('padding-left', '4px');
  await expect(iconText.locator('.ds-table__cell-primary')).toHaveCSS('padding-right', '4px');
  await expect(iconText.locator('.ds-table__cell-primary')).toHaveCSS('padding-top', '2px');
  await expect(iconText.locator('.ds-table__cell-primary')).toHaveCSS('padding-bottom', '2px');
  await expect(iconText.locator('a.ds-table__cell-link .ds-table__cell-primary')).toBeVisible();
  await expect(iconText.locator('a .ds-table__cell-icon-text-icon')).toHaveCount(0);
  await expect(iconText.locator('a .ds-table__cell-secondary')).toHaveCount(0);
  await expect(iconText.locator('.ds-table__cell-run')).toHaveCount(2);
  for (const cell of [action, borderedAction]) {
    await expect(cell).toHaveCSS('width', '40px');
    await expect(cell).toHaveCSS('padding-top', '8px');
    await expect(cell).toHaveCSS('padding-right', '8px');
    await expect(cell).toHaveCSS('padding-bottom', '8px');
    await expect(cell).toHaveCSS('padding-left', '8px');
    await expect(cell.locator('.ds-table__cell-content')).toHaveCSS('min-height', '24px');
    await expect(cell.locator('ds-button-unfilled')).toHaveJSProperty('size', 'md');
    await expect(cell.locator('ds-button-unfilled')).toHaveJSProperty('isInset', true);
    await expect(cell.locator('ds-button-unfilled')).toHaveJSProperty('insetDepth', 'double');
    await expect(cell.locator('ds-button-unfilled')).toHaveCSS('height', '24px');
  }
  for (const header of [actionHeader, borderedActionHeader]) {
    await expect(header).toHaveCSS('width', '40px');
    await expect(header.locator('.ds-table__header-label-box')).toHaveText('');
  }
  await expect(action.locator('ds-button-unfilled')).toHaveJSProperty('hasBorder', false);
  await expect(borderedAction.locator('ds-button-unfilled')).toHaveJSProperty('hasBorder', true);
  await expect(action).toHaveClass(/ds-table__cell--action-menu/);
  await expect(borderedAction).not.toHaveClass(/ds-table__cell--action-menu/);
  for (const cell of [action, borderedAction]) {
    await expect(cell.locator('ds-button-unfilled')).toHaveJSProperty('variant', 'icon');
    await expect(cell.locator('ds-button-unfilled')).toHaveJSProperty('icon', 'Ellipses');
  }
  await expect(action.locator('ds-button-unfilled')).toHaveJSProperty('hasMenu', true);
  await expect(borderedAction.locator('ds-button-unfilled')).toHaveJSProperty('hasMenu', false);
  await page.evaluate(() => {
    window.__tableCellActionEvents = [];
  });
  await borderedAction.getByRole('button', { name: 'More actions with border' }).click();
  await expect
    .poll(() => page.evaluate(() => window.__tableCellActionEvents))
    .toEqual([{ actionId: 'more-bordered', rowId: 'tag-variants', columnId: 'borderedAction' }]);
  await expect(empty).toContainText('—');
  await expect(empty).toContainText('Not available');
  await expect(empty.locator('ds-text')).toHaveJSProperty('color', 'tertiary');
  await expect(blank).toHaveText('');
  await expect(blank.locator('.ds-table__cell-content')).toBeEmpty();

  await expect(tagOnly).toHaveClass(/ds-table__cell--tag-tag-only/);
  await expect(tagOnly).toHaveCSS('padding-top', '8px');
  await expect(tagOnly).toHaveCSS('padding-right', '8px');
  await expect(tagOnly).toHaveCSS('padding-bottom', '8px');
  await expect(tagOnly).toHaveCSS('padding-left', '8px');
  await expect(tagOnly.locator('ds-tag')).toHaveJSProperty('size', 'md');
  await expect(tagOnly.locator('ds-tag')).toHaveJSProperty('isInset', true);
  await expect(tagOnly.locator('ds-tag')).toHaveJSProperty('insetDepth', 'double');
  await expect(tagOnly.locator('ds-tag')).toHaveCSS('height', '24px');

  await expect(tagWithText).toHaveClass(/ds-table__cell--tag-tag-with-text/);
  await expect(tagWithText).toHaveCSS('padding-top', '8px');
  await expect(tagWithText).toHaveCSS('padding-right', '8px');
  await expect(tagWithText).toHaveCSS('padding-bottom', '8px');
  await expect(tagWithText).toHaveCSS('padding-left', '8px');
  await expect(tagWithText.locator('.ds-table__cell-tag-stack')).toHaveCSS('gap', '2px');
  await expect(tagWithText.locator('ds-tag')).toHaveJSProperty('size', 'md');
  await expect(tagWithText.locator('ds-tag')).toHaveJSProperty('isInset', true);
  await expect(tagWithText.locator('ds-tag')).toHaveJSProperty('insetDepth', 'double');
  await expect(tagWithText.locator('ds-tag')).toHaveCSS('height', '24px');
  await expect(tagWithText.locator('.ds-table__cell-tag-text')).toHaveJSProperty(
    'variant',
    'text-body-small'
  );
  await expect(tagWithText.locator('.ds-table__cell-tag-text')).toHaveJSProperty(
    'color',
    'secondary'
  );
  await expect(tagWithText.locator('.ds-table__cell-tag-text')).toHaveCSS('padding-left', '4px');
  await expect(tagWithText.locator('.ds-table__cell-tag-text')).toHaveCSS('padding-right', '4px');
  await expect(tagWithText.locator('.ds-table__cell-tag-text')).toHaveCSS('padding-top', '2px');
  await expect(tagWithText.locator('.ds-table__cell-tag-text')).toHaveCSS('padding-bottom', '2px');
  await expect(tagWithText.locator('.ds-table__cell-tag-text')).toHaveCSS('min-height', '0px');

  await expect(textWithTag).toHaveClass(/ds-table__cell--tag-text-with-tag/);
  await expect(textWithTag).toHaveCSS('padding-top', '8px');
  await expect(textWithTag).toHaveCSS('padding-right', '8px');
  await expect(textWithTag).toHaveCSS('padding-bottom', '8px');
  await expect(textWithTag).toHaveCSS('padding-left', '8px');
  await expect(textWithTag.locator('.ds-table__cell-tag-stack')).toHaveCSS('gap', '2px');
  await expect(textWithTag.locator('.ds-table__cell-tag-text')).toHaveJSProperty(
    'variant',
    'text-body-medium'
  );
  await expect(textWithTag.locator('.ds-table__cell-tag-text')).toHaveJSProperty(
    'color',
    'secondary'
  );
  await expect(textWithTag.locator('.ds-table__cell-tag-text')).toHaveCSS('padding-left', '4px');
  await expect(textWithTag.locator('.ds-table__cell-tag-text')).toHaveCSS('padding-right', '4px');
  await expect(textWithTag.locator('.ds-table__cell-tag-text')).toHaveCSS('padding-top', '2px');
  await expect(textWithTag.locator('.ds-table__cell-tag-text')).toHaveCSS('padding-bottom', '2px');
  await expect(textWithTag.locator('.ds-table__cell-tag-text')).toHaveCSS('min-height', '0px');
  await expect(textWithTag.locator('ds-tag')).toHaveJSProperty('size', 'sm');
  await expect(textWithTag.locator('ds-tag')).toHaveJSProperty('isInset', true);
  await expect(textWithTag.locator('ds-tag')).toHaveJSProperty('insetDepth', 'single');
  await expect(textWithTag.locator('ds-tag')).toHaveCSS('height', '20px');
  await expect(textWithTag.locator('.ds-table__cell-tag-control-track')).toHaveCSS(
    'height',
    '20px'
  );

  const orderAndTracks = await table.locator('[data-row-id="tag-variants"]').evaluate(row => {
    const cellDetails = (variant: string) => {
      const cell = row.querySelector<HTMLElement>(`[data-cell-variant="${variant}"]`)!;
      const stack = cell.querySelector<HTMLElement>('.ds-table__cell-tag-stack');
      const children = stack
        ? Array.from(stack.children).map(child =>
            child.tagName === 'DS-TAG'
              ? 'tag'
              : child.classList.contains('ds-table__cell-tag-text')
                ? 'text'
                : 'tag-track'
          )
        : [];
      const bounds = (selector: string) => {
        const rect = cell.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom };
      };
      return {
        children,
        tag: bounds('ds-tag'),
        text: stack ? bounds('.ds-table__cell-tag-text') : null,
      };
    };
    return {
      tagWithText: cellDetails('tag-with-text'),
      textWithTag: cellDetails('text-with-tag'),
    };
  });

  expect(orderAndTracks.tagWithText.children).toEqual(['tag', 'text']);
  expect(orderAndTracks.tagWithText.text!.top - orderAndTracks.tagWithText.tag.bottom).toBeCloseTo(
    2,
    0
  );
  expect(orderAndTracks.textWithTag.children).toEqual(['text', 'tag-track']);
  expect(orderAndTracks.textWithTag.tag.top - orderAndTracks.textWithTag.text!.bottom).toBeCloseTo(
    2,
    0
  );

  const crossCellAlignment = await table.locator('[data-row-id="tag-variants"]').evaluate(row => {
    const bounds = (selector: string) => {
      const rect = row.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, height: rect.height };
    };
    return {
      secondary: bounds('[data-column-id="primarySecondary"] .ds-table__cell-secondary'),
      singleText: bounds('[data-column-id="singleText"] .ds-table__cell-track'),
      tagText: bounds('[data-cell-variant="tag-with-text"] .ds-table__cell-tag-text'),
      tagTextLabel: bounds(
        '[data-cell-variant="tag-with-text"] .ds-table__cell-tag-text .ds-text__element'
      ),
      tagLabel: bounds('[data-cell-variant="tag-with-text"] ds-tag .tag__label .ds-text__element'),
      textWithTagText: bounds('[data-cell-variant="text-with-tag"] .ds-table__cell-tag-text'),
      textWithTagTag: bounds('[data-cell-variant="text-with-tag"] ds-tag'),
      iconCell: bounds('[data-column-id="icon"]'),
      icon: bounds('[data-column-id="icon"] ds-icon'),
    };
  });
  expect(crossCellAlignment.tagText.top).toBeCloseTo(crossCellAlignment.secondary.top, 0);
  expect(crossCellAlignment.tagText.height).toBeCloseTo(crossCellAlignment.secondary.height, 0);
  expect(crossCellAlignment.tagTextLabel.left).toBeCloseTo(crossCellAlignment.tagLabel.left, 0);
  expect(crossCellAlignment.textWithTagText.top).toBeCloseTo(crossCellAlignment.singleText.top, 0);
  expect(crossCellAlignment.textWithTagText.height).toBeCloseTo(
    crossCellAlignment.singleText.height,
    0
  );
  expect(crossCellAlignment.textWithTagTag.top).toBeCloseTo(crossCellAlignment.secondary.top, 0);
  expect(crossCellAlignment.textWithTagTag.height).toBeCloseTo(20, 0);
  const iconCenter = (crossCellAlignment.icon.left + crossCellAlignment.icon.right) / 2;
  const iconCellCenter = (crossCellAlignment.iconCell.left + crossCellAlignment.iconCell.right) / 2;
  expect(Math.abs(iconCenter - iconCellCenter)).toBeLessThanOrEqual(0.5);
});

test('opens a shared overflow action menu and emits only on command select @pr-critical', async ({
  page,
}) => {
  const table = page.locator('#cell-types');
  const trigger = table
    .locator('[data-row-id="tag-variants"] [data-column-id="action"]')
    .getByRole('button', { name: 'More actions', exact: true });
  await page.evaluate(() => {
    window.__tableCellActionEvents = [];
    window.__tableRowActivationEvents = [];
  });

  await expect(table.locator('ds-menu')).toHaveCount(1);
  expect(
    await table.evaluate(element => {
      const viewport = element.querySelector('.ds-table__viewport');
      const menu = element.querySelector('ds-menu');
      return Boolean(viewport && menu && viewport.contains(menu));
    })
  ).toBe(false);
  await trigger.click();
  await expect.poll(() => page.evaluate(() => window.__tableCellActionEvents)).toEqual([]);
  await expect.poll(() => page.evaluate(() => window.__tableRowActivationEvents)).toEqual([]);

  const menu = page.getByRole('menu', { name: 'More actions', exact: true });
  await expect(menu).toBeVisible();
  await expect(menu).toHaveJSProperty('popover', 'manual');
  expect(await menu.evaluate(element => element.matches(':popover-open'))).toBe(true);
  await expect(menu.getByRole('menuitem', { name: 'Download report' })).toBeDisabled();
  await expect(menu.getByRole('menuitem', { name: 'Delete' })).toHaveClass(
    /menu-item--destructive/
  );
  await expect(menu.getByRole('menuitem', { name: 'View details' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect.poll(() => page.evaluate(() => window.__tableCellActionEvents)).toEqual([]);

  await trigger.click();
  await menu.getByRole('menuitem', { name: 'View details' }).click();
  await expect
    .poll(() => page.evaluate(() => window.__tableCellActionEvents))
    .toEqual([{ actionId: 'view', rowId: 'tag-variants', columnId: 'action' }]);
  await expect.poll(() => page.evaluate(() => window.__tableRowActivationEvents)).toEqual([]);
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test(
  'keeps single-track rows at 40px including tag-only cells',
  chromiumOnly(
    'layout-geometry',
    'Single-track 40px row lock is a Chromium-authoritative geometry contract.'
  ),
  async ({ page }) => {
    const table = page.locator('#single-track');
    const row = table.locator('[data-row-id="single-track-one"]');
    const tagOnly = row.locator('[data-column-id="tagOnly"]');
    const icon = row.locator('[data-column-id="icon"]');
    const iconText = row.locator('[data-column-id="iconText"]');
    const scalar = row.locator('[data-column-id="scalar"]');
    const action = row.locator('[data-column-id="action"]');
    const image = row.locator('[data-column-id="image"]');
    const selection = row.locator('.ds-table__selection-cell');

    for (const cell of [scalar, icon, iconText, tagOnly, action, image, selection]) {
      await expect(cell).toHaveCSS('height', '40px');
    }
    await expect(image).toHaveClass(/ds-table__cell--image-single/);
    await expect(image).toHaveAttribute('data-cell-variant', 'single');
    await expectImageColumnToHugPreview(image);
    await expect(image.locator('.ds-table__cell-image')).toHaveCSS('height', '24px');
    await expect(tagOnly.locator('ds-tag')).toHaveCSS('height', '24px');
    await expect(icon.locator('.ds-table__cell-content')).toHaveCSS('min-height', '24px');
    await expect(icon.locator('ds-icon')).toHaveCSS('height', '20px');
    await expect(iconText).toHaveClass(/ds-table__cell--icon-text-single/);
    await expect(iconText.locator('.ds-table__cell-icon-text')).toHaveCSS('gap', '2px');
    await expect(iconText.locator('.ds-table__cell-icon-text-icon')).toHaveCSS(
      'padding-top',
      '2px'
    );
    await expect(iconText.locator('.ds-table__cell-icon-text-icon')).toHaveCSS(
      'padding-right',
      '2px'
    );
    await expect(iconText.locator('.ds-table__cell-icon-text-icon')).toHaveCSS(
      'padding-bottom',
      '2px'
    );
    await expect(iconText.locator('.ds-table__cell-icon-text-icon')).toHaveCSS(
      'padding-left',
      '2px'
    );
    await expect(iconText.locator('.ds-table__cell-primary')).toHaveCSS('padding-left', '4px');
    await expect(iconText.locator('.ds-table__cell-primary')).toHaveCSS('padding-right', '4px');
  }
);

test('renders three-track text cells with a uniform 84px row', async ({ page }) => {
  const table = page.locator('#three-track');
  const averyDriver = table.locator('[data-row-id="three-track-avery"] [data-column-id="driver"]');
  const jordanDriver = table.locator(
    '[data-row-id="three-track-jordan"] [data-column-id="driver"]'
  );
  const averyVehicle = table.locator(
    '[data-row-id="three-track-avery"] [data-column-id="vehicle"]'
  );
  const averyEvent = table.locator('[data-row-id="three-track-avery"] [data-column-id="event"]');
  const averyImage = table.locator('[data-row-id="three-track-avery"] [data-column-id="image"]');
  const averyIconText = table.locator(
    '[data-row-id="three-track-avery"] [data-column-id="iconText"]'
  );

  await expect(averyDriver).toHaveClass(/ds-table__cell--text-triple/);
  await expect(averyDriver).toHaveCSS('height', '84px');
  await expect(jordanDriver).toHaveCSS('height', '84px');
  await expect(averyVehicle).toHaveCSS('height', '84px');
  await expect(averyEvent).toHaveCSS('height', '84px');
  await expect(averyDriver).toHaveCSS('padding-top', '8px');
  await expect(averyDriver).toHaveCSS('padding-bottom', '8px');
  await expect(averyDriver.locator('.ds-table__cell-copy')).toHaveCSS('gap', '2px');
  await expect(averyDriver.locator('.ds-table__cell-primary')).toHaveCSS('padding-top', '2px');
  await expect(averyDriver.locator('.ds-table__cell-primary')).toHaveCSS('padding-bottom', '2px');
  await expect(averyDriver.locator('.ds-table__cell-primary')).toHaveCSS('padding-left', '4px');
  await expect(averyDriver.locator('.ds-table__cell-primary')).toHaveCSS('padding-right', '4px');
  await expect(averyDriver.locator('.ds-table__cell-primary')).toHaveCSS('height', '24px');
  for (const track of [
    averyDriver.locator('.ds-table__cell-secondary'),
    averyDriver.locator('.ds-table__cell-tertiary'),
  ]) {
    await expect(track).toHaveCSS('padding-top', '2px');
    await expect(track).toHaveCSS('padding-bottom', '2px');
    await expect(track).toHaveCSS('padding-left', '4px');
    await expect(track).toHaveCSS('padding-right', '4px');
    await expect(track).toHaveCSS('height', '20px');
  }
  await expect(averyDriver.locator('.ds-table__cell-primary')).toHaveText('Avery Chen');
  await expect(averyDriver.locator('.ds-table__cell-secondary')).toHaveText('DRV-1048');
  await expect(averyDriver.locator('.ds-table__cell-tertiary')).toHaveText('Dallas, TX');
  await expect(averyVehicle).toHaveClass(/ds-table__cell--text-triple/);
  await expect(averyVehicle.locator('.ds-table__cell-primary')).toHaveText('Freightliner Cascadia');
  await expect(averyVehicle.locator('.ds-table__cell-secondary')).toHaveText('VEH-1042');
  await expect(averyVehicle.locator('.ds-table__cell-tertiary')).toHaveText('Class 8');
  await expect(averyEvent).toHaveClass(/ds-table__cell--text-triple/);
  await expect(averyEvent.locator('.ds-table__cell-primary')).toHaveText('Speeding');
  await expect(averyEvent.locator('.ds-table__cell-secondary')).toHaveText('High');
  await expect(averyEvent.locator('.ds-table__cell-secondary')).toHaveJSProperty(
    'color',
    'negative'
  );
  await expect(averyEvent.locator('.ds-table__cell-tertiary')).toHaveText('45 mph over');
  await expect(averyEvent.locator('.ds-table__cell-secondary')).toHaveCSS('height', '20px');
  await expect(averyEvent.locator('.ds-table__cell-tertiary')).toHaveCSS('height', '20px');
  await expect(averyImage).toHaveClass(/ds-table__cell--image-triple/);
  await expect(averyImage).toHaveAttribute('data-cell-variant', 'triple');
  await expect(averyImage).toHaveCSS('height', '84px');
  await expectImageColumnToHugPreview(averyImage);
  await expect(averyImage.locator('.ds-table__cell-image')).toHaveCSS('height', '68px');
  await expect(averyIconText).toHaveClass(/ds-table__cell--icon-text-triple/);
  await expect(averyIconText).not.toHaveClass(/ds-table__cell--text-triple/);
  await expect(averyIconText).toHaveCSS('height', '84px');
  await expect(averyIconText.locator('.ds-table__cell-icon-text')).toHaveCSS('gap', '2px');
  await expect(averyIconText.locator('.ds-table__cell-icon-text-icon')).toHaveCSS(
    'padding-top',
    '2px'
  );
  await expect(averyIconText.locator('.ds-table__cell-icon-text-icon')).toHaveCSS(
    'padding-right',
    '2px'
  );
  await expect(averyIconText.locator('.ds-table__cell-icon-text-icon')).toHaveCSS(
    'padding-bottom',
    '2px'
  );
  await expect(averyIconText.locator('.ds-table__cell-icon-text-icon')).toHaveCSS(
    'padding-left',
    '2px'
  );
  await expect(averyIconText.locator('.ds-table__cell-copy')).toHaveCSS('gap', '2px');
  await expect(averyIconText.locator('.ds-table__cell-primary')).toHaveCSS('padding-left', '4px');
  await expect(averyIconText.locator('.ds-table__cell-primary')).toHaveCSS('padding-right', '4px');
  await expect(averyIconText.locator('.ds-table__cell-primary')).toHaveCSS('padding-top', '2px');
  await expect(averyIconText.locator('.ds-table__cell-primary')).toHaveCSS('padding-bottom', '2px');
  await expect(averyIconText.locator('.ds-table__cell-primary')).toHaveText('Avery Chen');
  await expect(averyIconText.locator('.ds-table__cell-secondary')).toHaveText('DRV-1048');
  await expect(averyIconText.locator('.ds-table__cell-tertiary')).toHaveText('Dallas, TX');
});

test('wrapping primary occupies 2-track and 3-track row heights', async ({ page }) => {
  const two = page.locator('#wrap-two');
  const three = page.locator('#wrap-three');
  const oneLine = two.locator('[data-row-id="wrap-one-line"] [data-column-id="notes"]');
  const twoLine = two.locator('[data-row-id="wrap-two-line"] [data-column-id="notes"]');
  const threeLine = three.locator('[data-row-id="wrap-three-line"] [data-column-id="notes"]');
  const threeTrack = three.locator('[data-row-id="wrap-three-line"] [data-column-id="name"]');

  const lineCount = (cell: ReturnType<typeof two.locator>) =>
    cell.locator('.ds-text__element').evaluate(element => {
      const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
      return Math.round(element.getBoundingClientRect().height / lineHeight);
    });

  await expect(oneLine).toHaveClass(/ds-table__cell--text-single/);
  await expect(oneLine).toHaveClass(/ds-table__cell--text-wrap/);
  await expect(twoLine).toHaveClass(/ds-table__cell--text-single/);
  await expect(threeLine).toHaveClass(/ds-table__cell--text-single/);
  await expect(oneLine).toHaveCSS('width', '140px');
  await expect(twoLine).toHaveCSS('width', '140px');
  await expect(threeLine).toHaveCSS('width', '200px');
  expect(await lineCount(oneLine)).toBe(1);
  expect(await lineCount(twoLine)).toBe(2);
  expect(await lineCount(threeLine)).toBe(3);

  for (const cell of [oneLine, twoLine, threeLine]) {
    await expect(cell.locator('.ds-table__cell-primary')).toHaveCSS('line-height', '22px');
    await expect(cell.locator('.ds-table__cell-primary')).toHaveCSS('padding-top', '1px');
    await expect(cell.locator('.ds-table__cell-primary')).toHaveCSS('padding-bottom', '1px');
  }

  await expect(oneLine).toHaveCSS('height', '40px');
  await expect(oneLine.locator('.ds-table__cell-primary')).toHaveCSS('height', '24px');
  await expect(twoLine).toHaveCSS('height', '62px');
  await expect(twoLine.locator('.ds-table__cell-primary')).toHaveCSS('height', '46px');
  await expect(threeLine).toHaveCSS('height', '84px');
  await expect(threeLine.locator('.ds-table__cell-primary')).toHaveCSS('height', '68px');
  await expect(threeTrack).toHaveClass(/ds-table__cell--text-triple/);
  await expect(threeTrack).toHaveCSS('height', '84px');
});

test('wrapping secondary occupies 3-track and 4-track row heights', async ({ page }) => {
  const two = page.locator('#wrap-secondary-two');
  const three = page.locator('#wrap-secondary-three');
  const oneLine = two.locator('[data-row-id="wrap-secondary-one-line"] [data-column-id="notes"]');
  const twoLine = two.locator('[data-row-id="wrap-secondary-two-line"] [data-column-id="notes"]');
  const threeLine = three.locator(
    '[data-row-id="wrap-secondary-three-line"] [data-column-id="notes"]'
  );
  const threeTrack = two.locator('[data-row-id="wrap-secondary-two-line"] [data-column-id="name"]');

  const secondaryLines = (cell: ReturnType<typeof two.locator>) =>
    cell.locator('.ds-table__cell-secondary').evaluate(element => {
      const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
      return Math.round(element.getBoundingClientRect().height / lineHeight);
    });

  for (const cell of [oneLine, twoLine, threeLine]) {
    await expect(cell).toHaveClass(/ds-table__cell--text-wrap/);
    await expect(cell).toHaveClass(/ds-table__cell--text-multi/);
    await expect(cell.locator('.ds-table__cell-copy')).toHaveCSS('gap', '0px');
    await expect(cell.locator('.ds-table__cell-secondary')).toHaveCSS('line-height', '22px');
    await expect(cell.locator('.ds-table__cell-secondary')).toHaveCSS('padding-top', '0px');
    await expect(cell.locator('.ds-table__cell-secondary')).toHaveCSS('padding-bottom', '0px');
    await expect(cell.locator('.ds-table__cell-primary')).toHaveCSS('line-height', '22px');
    await expect(cell.locator('.ds-table__cell-primary')).toHaveCSS('height', '24px');
  }

  expect(await secondaryLines(oneLine)).toBe(1);
  expect(await secondaryLines(twoLine)).toBe(2);
  expect(await secondaryLines(threeLine)).toBe(3);

  await expect(oneLine).toHaveCSS('height', '62px');
  await expect(twoLine).toHaveCSS('height', '84px');
  await expect(threeTrack).toHaveClass(/ds-table__cell--text-triple/);
  await expect(threeTrack).toHaveCSS('height', '84px');
  await expect(threeLine).toHaveCSS('height', '106px');
  await expect(threeLine.locator('.ds-table__cell-secondary')).toHaveCSS('height', '66px');
});

test('shows a truncation tooltip when 1-, 2-, or 3-line text overflows', async ({ page }) => {
  const table = page.locator('#truncate-tooltip');
  const longLocation =
    'Northbound Highway 99 near the George Massey Tunnel, Richmond, British Columbia';
  const tooltip = page.getByRole('tooltip', { name: longLocation });
  const hoverNotes = async (rowId: string) => {
    await table
      .locator(`[data-row-id="${rowId}"] [data-column-id="notes"] .ds-table__cell-primary`)
      .hover();
  };

  const one = table.locator('[data-row-id="truncate-one"] [data-column-id="notes"]');
  const two = table.locator('[data-row-id="truncate-two"] [data-column-id="notes"]');
  const three = table.locator('[data-row-id="truncate-three"] [data-column-id="notes"]');
  const wrap = table.locator('[data-row-id="truncate-wrap"] [data-column-id="notes"]');
  const link = table.locator('[data-row-id="truncate-link"] [data-column-id="notes"] a');

  await expect(one).toHaveCSS('height', '40px');
  await expect(two).toHaveClass(/ds-table__cell--text-wrap/);
  await expect(two).toHaveCSS('width', '140px');
  await expect(two.locator('.ds-table__cell-primary')).toHaveClass(/ds-text--truncate-2/);
  await expect(two).toHaveCSS('height', '62px');
  await expect(three.locator('.ds-table__cell-primary')).toHaveClass(/ds-text--truncate-3/);
  await expect(three).toHaveCSS('height', '84px');

  await hoverNotes('truncate-one');
  await expect(tooltip).toBeVisible();
  await expect(one.locator('.ds-table__cell-primary')).not.toHaveAttribute('aria-describedby');

  await hoverNotes('truncate-two');
  await expect(tooltip).toBeVisible();

  await hoverNotes('truncate-three');
  await expect(tooltip).toBeVisible();

  await hoverNotes('truncate-short');
  await expect(tooltip).toHaveCount(0);

  await hoverNotes('truncate-wrap');
  await expect(tooltip).toHaveCount(0);
  await expect(wrap).toHaveClass(/ds-table__cell--text-wrap/);
  await expect(wrap.locator('.ds-table__cell-primary')).not.toHaveClass(/ds-text--truncate-/);

  await hoverNotes('truncate-disabled');
  await expect(tooltip).toHaveCount(0);
  await expect(table.locator('[data-row-id="truncate-disabled"]')).toHaveClass(
    /ds-table__row--disabled/
  );

  await link.hover();
  await expect(tooltip).toBeVisible();
});

test('positions sort controls according to column alignment', async ({ page }) => {
  const geometry = await page.locator('#grouped').evaluate(element => {
    const measure = (columnId: string) => {
      const cell = element.querySelector<HTMLElement>(`th[data-column-id="${columnId}"]`)!;
      const labels = cell.querySelector<HTMLElement>('.ds-table__header-labels')!;
      const slot = cell.querySelector<HTMLElement>(
        '.ds-table__sort-slot:not(.ds-table__sort-slot--balance)'
      )!;
      const content = cell.querySelector<HTMLElement>('.ds-table__header-content')!;
      const balance = cell.querySelector<HTMLElement>('.ds-table__sort-slot--balance');
      const cellRect = cell.getBoundingClientRect();
      const labelsRect = labels.getBoundingClientRect();
      const slotRect = slot.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      const balanceRect = balance?.getBoundingClientRect();
      const cellStyle = getComputedStyle(cell);
      return {
        cellLeft: cellRect.left,
        cellRight: cellRect.right,
        contentInsetStart:
          Number.parseFloat(cellStyle.paddingLeft) + Number.parseFloat(cellStyle.borderLeftWidth),
        contentInsetEnd:
          Number.parseFloat(cellStyle.paddingRight) + Number.parseFloat(cellStyle.borderRightWidth),
        labelsLeft: labelsRect.left,
        labelsRight: labelsRect.right,
        slotLeft: slotRect.left,
        slotRight: slotRect.right,
        contentCenter: contentRect.left + contentRect.width / 2,
        labelCenter: labelsRect.left + labelsRect.width / 2,
        balanceLeft: balanceRect?.left,
        balanceRight: balanceRect?.right,
        collapseLeft: cell
          .querySelector<HTMLElement>('.ds-table__collapse-slot')
          ?.getBoundingClientRect().left,
        collapseRight: cell
          .querySelector<HTMLElement>('.ds-table__collapse-slot')
          ?.getBoundingClientRect().right,
        order: Array.from(content.children).map(child =>
          child.classList.contains('ds-table__sort-slot--balance')
            ? 'balance'
            : child.classList.contains('ds-table__sort-slot')
              ? 'sort'
              : child.classList.contains('ds-table__collapse-slot')
                ? 'collapse'
                : 'label'
        ),
      };
    };
    const frameRect = element
      .querySelector<HTMLElement>('.ds-table__frame')!
      .getBoundingClientRect();
    const collapseOverlayRect = element
      .querySelector<HTMLElement>('.ds-table__collapse-all-overlay')!
      .getBoundingClientRect();
    return {
      center: measure('status'),
      end: measure('score'),
      collapseOverlay: {
        inlineEndInset: frameRect.right - collapseOverlayRect.right,
        width: collapseOverlayRect.width,
      },
    };
  });

  expect(geometry.center.order).toEqual(['balance', 'label', 'sort']);
  expect(geometry.center.labelsLeft - geometry.center.balanceRight!).toBeCloseTo(4, 0);
  expect(geometry.center.slotLeft - geometry.center.labelsRight).toBeCloseTo(4, 0);
  expect(geometry.center.labelCenter).toBeCloseTo(geometry.center.contentCenter, 0);
  expect(geometry.center.slotRight - geometry.center.slotLeft).toBeCloseTo(16, 0);
  expect(geometry.center.balanceRight! - geometry.center.balanceLeft!).toBeCloseTo(16, 0);

  expect(geometry.end.order).toEqual(['sort', 'label']);
  expect(geometry.end.slotLeft - geometry.end.cellLeft).toBeCloseTo(
    geometry.end.contentInsetStart,
    0
  );
  expect(geometry.end.labelsLeft).toBeGreaterThan(geometry.end.slotRight);
  expect(geometry.end.cellRight - geometry.end.labelsRight).toBeCloseTo(
    geometry.end.contentInsetEnd,
    0
  );
  expect(geometry.collapseOverlay).toEqual({ inlineEndInset: 8, width: 24 });
});

test('selects loaded rows while preserving off-window IDs', async ({ page }) => {
  const table = page.locator('#selectable');
  const selectAll = table.getByRole('checkbox', { name: 'Select all loaded rows' });
  await expect(selectAll).toHaveAttribute('aria-checked', 'mixed');

  const selectedVisuals = await table
    .locator('.ds-table__row[data-row-id="jordan"]')
    .evaluate(row => {
      const probe = document.createElement('span');
      probe.style.background = 'var(--color-interaction-active-brand)';
      document.body.append(probe);
      const brandActive = getComputedStyle(probe).backgroundColor;
      probe.remove();
      const firstCell = row.querySelector<HTMLElement>('.ds-table__cell')!;
      return {
        selectedOverlay: getComputedStyle(firstCell, '::before').backgroundColor,
        brandActive,
        firstCellShadow: getComputedStyle(firstCell).boxShadow,
      };
    });
  expect(selectedVisuals.selectedOverlay).toBe(selectedVisuals.brandActive);
  expect(selectedVisuals.firstCellShadow).toBe('none');

  await selectAll.click();
  await expect(table.getByRole('checkbox', { name: 'Deselect all loaded rows' })).toHaveAttribute(
    'aria-checked',
    'true'
  );
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

test('activates interactive rows without stealing nested control intent', async ({ page }) => {
  const table = page.locator('#interactive');
  const row = table.locator('[data-row-id="avery"]');
  await expect(row).toHaveAttribute('tabindex', '0');
  await row.hover();

  const hover = await row
    .locator('.ds-table__cell')
    .first()
    .evaluate(cell => {
      const probe = document.createElement('span');
      probe.style.background = 'var(--color-interaction-hover)';
      document.body.append(probe);
      const token = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return { overlay: getComputedStyle(cell, '::after').backgroundColor, token };
    });
  expect(hover.overlay).toBe(hover.token);

  await row.focus();
  await row.press('Enter');
  await expect
    .poll(() => page.evaluate(() => window.__tableRowActivationEvents))
    .toEqual(['avery']);

  await row.getByRole('button', { name: 'More actions for Avery Chen' }).click();
  await expect
    .poll(() => page.evaluate(() => window.__tableRowActivationEvents))
    .toEqual(['avery']);
});

test('links primary text without stealing interactive row activation', async ({ page }) => {
  const table = page.locator('#linked-text');
  const relative = table.locator('[data-row-id="veh-1042"] [data-column-id="vehicle"] a');
  const external = table.locator('[data-row-id="veh-external"] [data-column-id="vehicle"] a');
  const unsafe = table.locator('[data-row-id="veh-unsafe"] [data-column-id="vehicle"]');

  await expect(relative).toHaveClass(/ds-table__cell-link/);
  await expect(relative).toHaveClass(/ds-text-action/);
  await expect(relative).toHaveClass(/ds-focus-ring/);
  await expect(relative).toHaveJSProperty('pathname', '/vehicles/VEH-1042');
  await expect(relative).not.toHaveAttribute('target', '_blank');

  await expect(external).toHaveAttribute('href', 'https://example.test/manual');
  await expect(external).toHaveAttribute('target', '_blank');
  await expect(external).toHaveAttribute('rel', 'noopener noreferrer');

  await expect(unsafe.locator('a')).toHaveCount(0);
  await expect(unsafe.locator('.ds-table__cell-primary')).toHaveText('Rejected script');
  await expect(unsafe.locator('.ds-table__cell-primary')).toHaveJSProperty('color', 'primary');

  const brand = await relative.evaluate(element => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-foreground-bold-brand)';
    document.body.append(probe);
    const token = getComputedStyle(probe).color;
    probe.remove();
    return { color: getComputedStyle(element).color, token };
  });
  expect(brand.color).toBe(brand.token);
  await expect(relative).toHaveCSS('text-decoration-line', 'none');
  await relative.hover();
  await expect(relative).toHaveCSS('text-decoration-line', 'underline');

  await page.evaluate(() => {
    window.__tableRowActivationEvents = [];
    document.addEventListener(
      'click',
      event => {
        const node = event.target as Node | null;
        const element = node instanceof Element ? node : node?.parentElement;
        if (element?.closest('a')) event.preventDefault();
      },
      true
    );
  });

  await relative.click();
  await expect.poll(() => page.evaluate(() => window.__tableRowActivationEvents)).toEqual([]);

  await table.locator('[data-row-id="veh-1042"] [data-column-id="status"]').click();
  await expect
    .poll(() => page.evaluate(() => window.__tableRowActivationEvents))
    .toEqual(['veh-1042']);
});

test('uses the shared focus-ring utility for every table-owned keyboard target', async ({
  page,
}) => {
  const targets = [
    page.locator('#overflow .ds-table__viewport'),
    page.locator('#basic .ds-table__header-label--interactive').first(),
    page.locator('#selectable .ds-table__selection-control').first(),
    page.locator('#interactive .ds-table__row--interactive').first(),
  ];

  for (const target of targets) {
    await expect(target).toHaveClass(/ds-focus-ring/);
    await target.focus();
    const focus = await target.evaluate(element => {
      const focusToken = getComputedStyle(element).getPropertyValue('--ds-focus-ring-color');
      const probe = document.createElement('span');
      probe.style.color = focusToken;
      document.body.append(probe);
      const focusColor = getComputedStyle(probe).color;
      probe.remove();
      const style = getComputedStyle(element);
      return {
        outlineColor: style.outlineColor,
        outlineStyle: style.outlineStyle,
        focusColor,
      };
    });
    expect(focus).toEqual({
      outlineColor: focus.focusColor,
      outlineStyle: 'solid',
      focusColor: focus.focusColor,
    });
  }

  for (const control of [
    page.locator('#interactive [data-column-id="actions"] ds-button-unfilled button').first(),
    page.locator('#severity-grouped .ds-table__group-toggle button').first(),
    page.locator('#severity-grouped .ds-table__collapse-all button').first(),
    page.locator('#lazy .ds-table__load-cell ds-button-unfilled button').first(),
  ]) {
    await expect(control).toHaveClass(/ds-focus-ring-inset/);
    await control.focus();
    const focus = await control.evaluate(element => {
      const focusToken = getComputedStyle(element).getPropertyValue('--ds-focus-ring-color');
      const probe = document.createElement('span');
      probe.style.color = focusToken;
      document.body.append(probe);
      const focusColor = getComputedStyle(probe).color;
      probe.remove();
      const style = getComputedStyle(element);
      const insetStyle = getComputedStyle(element, '::after');
      return {
        outlineStyle: style.outlineStyle,
        insetOutlineColor: insetStyle.outlineColor,
        insetOutlineStyle: insetStyle.outlineStyle,
        focusColor,
      };
    });
    expect(focus).toEqual({
      outlineStyle: 'none',
      insetOutlineColor: focus.focusColor,
      insetOutlineStyle: 'solid',
      focusColor: focus.focusColor,
    });
  }
});

test('drives manual lazy loading and terminal state without pagination', async ({ page }) => {
  const table = page.locator('#lazy');
  await expect(table.locator('.ds-table__footer-summary')).toHaveText('Displaying 2 of 4');
  await table.getByRole('button', { name: 'Load more' }).click();
  await expect(table.locator('.ds-table__load-cell').getByText('Loading more items')).toBeVisible();
  await expect(table.locator('tbody .ds-table__row')).toHaveCount(4);
  await expect(table.locator('.ds-table__load-cell').getByText('All results loaded')).toBeVisible();
  await expect(table.locator('.ds-table__footer-summary')).toHaveText('Displaying 4 of 4');
  await expect(table).toHaveJSProperty('hasMore', false);
  await expect
    .poll(() => page.evaluate(() => window.__tableLoadEvents.filter(event => event.id === 'lazy')))
    .toMatchObject([
      {
        id: 'lazy',
        detail: { reason: 'manual', loadIdentity: 'default', loadedRowCount: 2 },
      },
    ]);
  await expect(table.getByText(/page/i)).toHaveCount(0);
});

test('forwards controlled pagination while preserving off-page selection', async ({ page }) => {
  const table = page.locator('#paginated');
  const pagination = table.locator('ds-pagination');

  await expect(table.locator('.ds-table__footer-summary')).toHaveCount(0);
  await expect(pagination).toContainText('Rows:');
  await expect(pagination.locator('.pagination__total')).toHaveText('25 of 63');
  await expect(pagination.locator('.pagination__page')).toHaveText('1 of 3');
  await expect(pagination.locator('ds-divider')).toHaveJSProperty('orientation', 'vertical');
  await expect(pagination.locator('ds-divider')).toHaveCSS('height', '20px');
  await expect(pagination.locator('.pagination__page')).toHaveCSS('min-width', '0px');
  await expect(pagination.locator('.pagination__page')).toHaveCSS('padding-left', '8px');
  await expect(pagination.locator('.pagination__page')).toHaveCSS('padding-right', '8px');
  const [labelBox, selectBox] = await Promise.all([
    pagination.locator('.pagination__label').boundingBox(),
    pagination.locator('ds-select').boundingBox(),
  ]);
  expect(labelBox).not.toBeNull();
  expect(selectBox).not.toBeNull();
  expectGeometryClose(selectBox!.x - (labelBox!.x + labelBox!.width), 0);
  await expect(pagination.locator('ds-select .trigger__chevron ds-icon')).toHaveJSProperty(
    'name',
    'ChevronUpDown'
  );
  await expect(pagination.locator('ds-select')).toHaveJSProperty('hasBorder', false);
  await expect
    .poll(() =>
      pagination.locator('ds-select .trigger__label-box').evaluate(element => {
        const probe = document.createElement('span');
        probe.style.color = 'var(--color-foreground-secondary)';
        element.append(probe);
        const secondary = getComputedStyle(probe).color;
        probe.remove();
        return getComputedStyle(element).color === secondary;
      })
    )
    .toBe(true);

  for (const [label, iconName] of [
    ['First page', 'ChevronLeftDouble'],
    ['Previous page', 'ChevronLeft'],
    ['Next page', 'ChevronRight'],
    ['Last page', 'ChevronRightDouble'],
  ] as const) {
    const button = pagination.getByRole('button', { name: label });
    await expect(button.locator('ds-icon')).toHaveJSProperty('name', iconName);
    await expect(button.locator('ds-icon svg')).toHaveCount(1);
  }

  await expect(pagination.getByRole('button', { name: 'First page' })).toBeDisabled();
  await expect(pagination.getByRole('button', { name: 'Previous page' })).toBeDisabled();

  await pagination.getByRole('button', { name: 'Next page' }).click();
  await expect(pagination.locator('.pagination__total')).toHaveText('25 of 63');
  await expect(pagination.locator('.pagination__page')).toHaveText('2 of 3');
  await expect(table.locator('tbody .ds-table__row').first()).toHaveAttribute(
    'data-row-id',
    'paginated-row-26'
  );
  await expect(table).toHaveJSProperty('selectedRowIds', ['paginated-row-60']);
  await expect
    .poll(() => page.evaluate(() => window.__tablePaginationEvents))
    .toMatchObject([
      {
        pageIndex: 1,
        pageSize: 25,
        pageSizeMode: 'fixed',
        totalItems: 63,
        pageSizeOptions: [25, 50, 100, 200],
        itemLabel: 'rows',
        pageSizeLabel: 'Rows',
        ariaLabel: 'Paginated drivers pagination',
        previousPageIndex: 0,
        previousPageSize: 25,
        previousPageSizeMode: 'fixed',
        reason: 'page',
      },
    ]);

  await table.getByRole('checkbox', { name: 'Select all loaded rows' }).click();
  await expect
    .poll(() => table.evaluate((element: HTMLDsTableElement) => element.selectedRowIds.length))
    .toBe(26);
  await expect
    .poll(() =>
      table.evaluate((element: HTMLDsTableElement) =>
        element.selectedRowIds.includes('paginated-row-60')
      )
    )
    .toBe(true);
});

test('compacts table pagination without dropping adjacent-page navigation', async ({ page }) => {
  const table = page.locator('#paginated');
  const pagination = table.locator('ds-pagination');

  await table.evaluate((element: HTMLElement) => {
    element.style.inlineSize = '898px';
  });

  await expect(pagination.locator('.pagination__label')).toBeVisible();
  await expect(pagination.locator('ds-select')).toBeVisible();
  await expect(pagination.locator('.pagination__total')).toBeHidden();
  await expect(pagination.locator('.pagination__boundary')).toHaveCount(2);
  await expect(pagination.locator('.pagination__boundary').first()).toBeHidden();
  await expect(pagination.getByRole('button', { name: 'Previous page' })).toBeVisible();
  await expect(pagination.locator('.pagination__page')).toBeVisible();
  await expect(pagination.getByRole('button', { name: 'Next page' })).toBeVisible();
  await expect(pagination.locator('.pagination__boundary').last()).toBeHidden();
  const [compactSelectBox, compactDividerBox] = await Promise.all([
    pagination.locator('ds-select').boundingBox(),
    pagination.locator('ds-divider').boundingBox(),
  ]);
  expect(compactSelectBox).not.toBeNull();
  expect(compactDividerBox).not.toBeNull();
  expectGeometryClose(compactDividerBox!.x - (compactSelectBox!.x + compactSelectBox!.width), 8);

  await table.evaluate((element: HTMLElement) => {
    element.style.inlineSize = '900px';
  });

  await expect(pagination.locator('.pagination__total')).toBeVisible();
  await expect(pagination.getByRole('button', { name: 'First page' })).toBeVisible();
  await expect(pagination.getByRole('button', { name: 'Last page' })).toBeVisible();
});

test('resets to page one after a controlled page-size request', async ({ page }) => {
  const table = page.locator('#paginated');
  const pagination = table.locator('ds-pagination');
  await pagination.getByRole('button', { name: 'Next page' }).click();

  await pagination.getByRole('combobox', { name: 'Rows per page' }).click();
  await page.getByRole('option', { name: '50', exact: true }).click();

  await expect(pagination.locator('.pagination__total')).toHaveText('50 of 63');
  await expect(pagination.locator('.pagination__page')).toHaveText('1 of 2');
  await expect
    .poll(() => page.evaluate(() => window.__tablePaginationEvents.at(-1)))
    .toMatchObject({
      pageIndex: 0,
      pageSize: 50,
      pageSizeMode: 'fixed',
      totalItems: 63,
      pageSizeOptions: [25, 50, 100, 200],
      itemLabel: 'rows',
      pageSizeLabel: 'Rows',
      ariaLabel: 'Paginated drivers pagination',
      previousPageIndex: 1,
      previousPageSize: 25,
      previousPageSizeMode: 'fixed',
      reason: 'page-size',
    });
});

test('supports keyboard focus and terminal page boundaries @pr-critical', async ({ page }) => {
  const table = page.locator('#paginated');
  const pagination = page.locator('#paginated ds-pagination');
  const pageSize = pagination.getByRole('combobox', { name: 'Rows per page' });

  await expect(pagination.locator('.pagination__page')).toHaveText('1 of 3');
  const selectAll = table.getByRole('checkbox', { name: 'Select all loaded rows' });
  await selectAll.press('ArrowRight');
  await expect(pagination.locator('.pagination__page')).toHaveText('2 of 3');

  await pageSize.focus();
  await expect(pageSize).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(pagination.locator('.pagination__page')).toHaveText('2 of 3');

  const next = pagination.getByRole('button', { name: 'Next page' });
  await next.focus();
  await expect(next).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(pagination.locator('.pagination__page')).toHaveText('3 of 3');

  await selectAll.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(pagination.locator('.pagination__page')).toHaveText('2 of 3');

  const last = pagination.getByRole('button', { name: 'Last page' });
  await last.focus();
  await page.keyboard.press('Enter');
  await expect(pagination.locator('.pagination__total')).toHaveText('13 of 63');
  await expect(pagination.locator('.pagination__page')).toHaveText('3 of 3');
  await expect(next).toBeDisabled();
  await expect(last).toBeDisabled();
});

test('paginates from a containing page scroller without moving focus into the table', async ({
  page,
}) => {
  const table = page.locator('#paginated');
  const pagination = page.locator('#paginated ds-pagination');

  await table.evaluate((element: HTMLDsTableElement) => {
    const scroller = element.ownerDocument.createElement('div');
    scroller.className = 'page-scroller';
    scroller.tabIndex = 0;
    element.parentElement?.insertBefore(scroller, element);
    scroller.append(element);
  });

  const scroller = page.locator('.page-scroller');
  await scroller.focus();
  await expect(scroller).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(pagination.locator('.pagination__page')).toHaveText('2 of 3');
  await expect(scroller).toBeFocused();
});

test('paginates from a slotted shadow page scroller without moving focus into the table', async ({
  page,
}) => {
  const table = page.locator('#paginated');
  const pagination = page.locator('#paginated ds-pagination');

  await table.evaluate((element: HTMLDsTableElement) => {
    const host = element.ownerDocument.createElement('div');
    host.className = 'shell-host';
    const scroller = element.ownerDocument.createElement('div');
    scroller.className = 'page-scroller';
    scroller.tabIndex = 0;
    scroller.append(element.ownerDocument.createElement('slot'));
    host.attachShadow({ mode: 'open' }).append(scroller);
    element.parentElement?.insertBefore(host, element);
    host.append(element);
  });

  await page.locator('.shell-host').evaluate((host: HTMLElement) => {
    host.shadowRoot?.querySelector<HTMLElement>('.page-scroller')?.focus();
  });
  await expect
    .poll(() =>
      page
        .locator('.shell-host')
        .evaluate(host => host.shadowRoot?.activeElement?.classList.contains('page-scroller'))
    )
    .toBe(true);
  await page.keyboard.press('ArrowRight');
  await expect(pagination.locator('.pagination__page')).toHaveText('2 of 3');
  await expect
    .poll(() =>
      page
        .locator('.shell-host')
        .evaluate(host => host.shadowRoot?.activeElement?.classList.contains('page-scroller'))
    )
    .toBe(true);
});

test('keeps Fit to page visible but inactive when the data shape cannot support it', async ({
  page,
}) => {
  const table = page.locator('#paginated');
  const pagination = table.locator('ds-pagination');
  await table.evaluate((element: HTMLDsTableElement) => {
    element.pagination = {
      ...element.pagination!,
      fitToPage: true,
      fitToPageInactive: true,
    };
  });

  await pagination.getByRole('combobox', { name: 'Rows per page' }).click();
  await expect(page.getByRole('option', { name: 'Fit to page', exact: true })).toBeDisabled();
  await expect(pagination).toHaveJSProperty('fitToPageInactive', true);
});

test('captures Fit once, then remeasures only for a new fit identity', async ({ page }) => {
  const table = page.locator('#paginated');
  const pagination = table.locator('ds-pagination');
  const pageSize = pagination.getByRole('combobox', { name: 'Rows per page' });

  await pageSize.click();
  await page.getByRole('option', { name: 'Fit to page', exact: true }).click();
  await expect(pageSize).toContainText('Fit');
  const fitted = await table.evaluate(
    (element: HTMLDsTableElement) => element.pagination!.pageSize
  );
  expect(fitted).toBeGreaterThan(0);
  expect(fitted).toBeLessThan(25);
  await expect(table.locator('tbody .ds-table__row')).toHaveCount(fitted);

  await table.evaluate((element: HTMLDsTableElement) => {
    element.maxHeight = '320px';
  });
  await page.waitForTimeout(100);
  await expect
    .poll(() => table.evaluate((element: HTMLDsTableElement) => element.pagination!.pageSize))
    .toBe(fitted);

  await table.evaluate((element: HTMLDsTableElement) => {
    element.pagination = { ...element.pagination!, fitIdentity: 'shorter-query' };
  });
  await expect
    .poll(() => table.evaluate((element: HTMLDsTableElement) => element.pagination!.pageSize))
    .toBeLessThan(fitted);
  await expect
    .poll(() => page.evaluate(() => window.__tablePaginationEvents.at(-1)?.reason))
    .toBe('fit');
});

test('keeps pagination stable and inactive while replacement rows load', async ({ page }) => {
  const table = page.locator('#paginated');
  await table.evaluate((element: HTMLDsTableElement) => {
    element.rows = [];
    element.loading = true;
  });

  const pagination = table.locator('ds-pagination');
  await expect(pagination).toBeVisible();
  await expect(pagination).toHaveJSProperty('loading', true);
  await expect(pagination.getByRole('navigation')).toHaveAttribute('aria-busy', 'true');
  await expect(pagination.getByRole('button', { name: 'Next page' })).toBeDisabled();
  await expect(table.locator('.ds-table__skeleton-row')).toHaveCount(10);
  await expect(table.locator('.ds-table__footer')).toContainText('Last updated: just now');
});

test('paginates parent groups while each group loads members independently', async ({ page }) => {
  const table = page.locator('#grouped-paginated');
  const pagination = table.locator('ds-pagination');

  await expect(table.locator('tbody[data-group-id]')).toHaveCount(25);
  await expect(pagination).toContainText('Groups:');
  await expect(pagination.locator('.pagination__total')).toHaveText('25 of 30');
  await expect(pagination.locator('.pagination__page')).toHaveText('1 of 2');
  await expect(table.locator('.ds-table__load-body')).toHaveCount(0);

  const firstGroup = table.locator('tbody[data-group-id="group-1"]');
  await expect(firstGroup.locator('.ds-table__row')).toHaveCount(1);
  await firstGroup.getByRole('button', { name: 'Load more Group 1 results' }).click();
  await expect(firstGroup.locator('.ds-table__row')).toHaveCount(3);
  await expect(firstGroup.locator('.ds-table__group-count')).toHaveText('3 of 3');

  await pagination.getByRole('button', { name: 'Next page' }).click();
  await expect(table.locator('tbody[data-group-id]')).toHaveCount(5);
  await expect(pagination.locator('.pagination__total')).toHaveText('5 of 30');
  await expect(pagination.locator('.pagination__page')).toHaveText('2 of 2');
  await pagination.getByRole('button', { name: 'Previous page' }).click();
  await expect(table.locator('tbody[data-group-id="group-1"] .ds-table__row')).toHaveCount(1);

  const pageSize = pagination.getByRole('combobox', { name: 'Groups per page' });
  await pageSize.click();
  await page.getByRole('option', { name: 'Fit to page', exact: true }).click();
  const fittedGroups = await table.evaluate(
    (element: HTMLDsTableElement) => element.pagination!.pageSize
  );
  await expect(table.locator('tbody[data-group-id]')).toHaveCount(fittedGroups);
  await table
    .locator('tbody[data-group-id]')
    .first()
    .getByRole('button', { name: /Load more/ })
    .click();
  await expect
    .poll(() => table.evaluate((element: HTMLDsTableElement) => element.pagination!.pageSize))
    .toBe(fittedGroups);
});

test('keeps table-level outcome and incremental-loading bands fixed to the visible width', async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 900 });

  for (const selector of ['#lazy', '#empty', '#error']) {
    const table = page.locator(selector);
    const viewport = table.locator('.ds-table__viewport');
    const band = table.locator('.ds-table__viewport-band');
    await expect(band).toBeVisible();
    await expect
      .poll(() => viewport.evaluate(element => element.scrollWidth - element.clientWidth))
      .toBeGreaterThan(0);

    const [viewportBox, visibleInlineSize, bandBox] = await Promise.all([
      viewport.boundingBox(),
      viewport.evaluate(element => element.clientWidth),
      band.boundingBox(),
    ]);
    expect(viewportBox).not.toBeNull();
    expect(bandBox).not.toBeNull();
    expect(bandBox!.x).toBeCloseTo(viewportBox!.x, 0);
    expect(bandBox!.width).toBeCloseTo(visibleInlineSize, 0);

    await viewport.evaluate((element: HTMLElement) => {
      element.scrollLeft = 120;
    });
    await expect.poll(() => viewport.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
    const after = await band.boundingBox();
    expect(after).not.toBeNull();
    expect(after!.x).toBeCloseTo(viewportBox!.x, 0);
    expect(after!.width).toBeCloseTo(visibleInlineSize, 0);
  }
});

test('guards duplicate requests and distinguishes retry intent', async ({ page }) => {
  const guard = page.locator('#lazy-guard');
  await guard.getByRole('button', { name: 'Load more' }).dblclick();
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__tableLoadEvents.filter(event => event.id === 'lazy-guard').length
      )
    )
    .toBe(1);

  await page.locator('#lazy-retry').getByRole('button', { name: 'Retry' }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__tableLoadEvents.find(event => event.id === 'lazy-retry')?.detail.reason
      )
    )
    .toBe('retry');
});

test('observes automatic lazy loading from the document viewport', async ({ page }) => {
  await page.waitForTimeout(100);
  await expect
    .poll(() =>
      page.evaluate(() => window.__tableLoadEvents.filter(event => event.id === 'lazy-auto'))
    )
    .toEqual([]);

  await page.locator('#lazy-auto .ds-table__load-row').scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page.evaluate(() => window.__tableLoadEvents.filter(event => event.id === 'lazy-auto'))
    )
    .toEqual([
      {
        id: 'lazy-auto',
        detail: { reason: 'auto', loadIdentity: 'default', loadedRowCount: 2 },
      },
    ]);
});

test(
  'uses fixed cell tracks and focusable sticky overflow geometry',
  chromiumOnly(
    'layout-geometry',
    'Cell tracks and sticky overflow are rendered geometry contracts.'
  ),
  async ({ page }) => {
    const standard = page.locator('#standard');
    await expect(standard.locator('.ds-table')).toHaveCSS('user-select', 'none');
    const firstHeader = standard.locator('.ds-table__header-cell').first();
    await expect(firstHeader).toHaveCSS('height', '32px');
    await expect(firstHeader.locator('.ds-table__header-label')).toHaveCSS('height', '16px');
    await expect(firstHeader.locator('.ds-table__header-label')).toHaveCSS('padding-left', '2px');
    await expect(firstHeader.locator('.ds-table__header-label')).toHaveCSS('padding-right', '2px');
    await expect(firstHeader.locator('.ds-table__header-label-box')).toHaveCSS(
      'padding-left',
      '2px'
    );
    await expect(firstHeader.locator('.ds-table__header-label-box')).toHaveCSS(
      'padding-right',
      '2px'
    );
    await expect(firstHeader.locator('.ds-table__sort-slot')).toHaveCSS('width', '16px');
    await expect(firstHeader.locator('.ds-table__sort-slot')).toHaveCSS('height', '16px');
    await expect(firstHeader.locator('.ds-table__header-label--interactive')).not.toHaveClass(
      /ds-interaction-fill/
    );
    await expect(
      standard.locator('.ds-table__row[data-row-id="jordan"] .ds-table__cell').first()
    ).toHaveCSS('height', '40px');
    await expect(standard.locator('.ds-table__overflow-shadow')).toHaveCount(0);

    const inactiveLabel = firstHeader.locator('ds-text');
    await expect(inactiveLabel).toHaveJSProperty('variant', 'text-caption');
    await expect(inactiveLabel).toHaveJSProperty('color', 'inherit');
    await expect(inactiveLabel).toHaveJSProperty('emphasis', false);

    const dividerColors = await standard
      .locator('.ds-table__cell')
      .nth(1)
      .evaluate(element => {
        const style = getComputedStyle(element);
        const tokenColor = (token: string) => {
          const probe = document.createElement('span');
          probe.style.borderColor = `var(${token})`;
          document.body.append(probe);
          const color = getComputedStyle(probe).borderTopColor;
          probe.remove();
          return color;
        };
        const headerCell = document.querySelector<HTMLElement>('#standard .ds-table__header-cell')!;
        const dividedHeaderCell = document.querySelector<HTMLElement>(
          '#standard .ds-table__header-cell + .ds-table__header-cell'
        )!;
        const headerDividerStyle = getComputedStyle(headerCell, '::after');
        return {
          horizontalDivider: getComputedStyle(element, '::after').boxShadow,
          verticalDivider: getComputedStyle(element, '::after').boxShadow,
          verticalBorderWidth: style.borderLeftWidth,
          headerBottomDivider: headerDividerStyle.backgroundColor,
          headerVerticalDivider: getComputedStyle(dividedHeaderCell, '::before').boxShadow,
          secondary: tokenColor('--color-border-secondary'),
          tertiary: tokenColor('--color-border-tertiary'),
        };
      });
    expect(dividerColors.verticalDivider).toContain(dividerColors.tertiary);
    expect(dividerColors.verticalBorderWidth).toBe('0px');
    expect(dividerColors.horizontalDivider).toContain(dividerColors.tertiary);
    expect(dividerColors.headerBottomDivider).toBe(dividerColors.secondary);
    expect(dividerColors.headerVerticalDivider).toContain(dividerColors.tertiary);

    const selectedDivider = await page
      .locator('#selectable .ds-table__row[data-selected="true"] .ds-table__cell')
      .nth(1)
      .evaluate(element => getComputedStyle(element, '::after').boxShadow);
    expect(selectedDivider).toContain(dividerColors.tertiary);

    const terminalRowDividers = await standard
      .locator('.ds-table__body:last-child .ds-table__row:last-child .ds-table__cell')
      .nth(2)
      .evaluate(element => {
        const style = getComputedStyle(element, '::after');
        return {
          boxShadow: style.boxShadow,
          rowWidth: getComputedStyle(element)
            .getPropertyValue('--ds-interaction-group-divider-width')
            .trim(),
        };
      });
    expect(terminalRowDividers.rowWidth).toBe('0px');
    expect(terminalRowDividers.boxShadow).toContain(dividerColors.tertiary);

    const overflow = page.locator('#overflow');
    const viewport = overflow.locator('.ds-table__viewport');
    await expect(viewport).toHaveAttribute('role', 'region');
    await expect(viewport).toHaveAttribute('aria-label', 'Scrollable driver data');
    await expect(viewport).toHaveAttribute('tabindex', '0');
    await expect(overflow.locator('.ds-table__head')).toHaveCSS('position', 'sticky');
    await viewport.evaluate(element => {
      element.scrollLeft = 120;
    });
    await expect(overflow.locator('.ds-table__frame')).toHaveClass(
      /ds-table__frame--overflow-start/
    );
  }
);

test('uses a zero-minimum elastic spacer while keeping fixed edge lanes stable @cross-browser', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  const interactive = page.locator('#interactive');
  await expect(interactive.locator('.ds-table__row .ds-table__selection-cell').first()).toHaveCSS(
    'width',
    '40px'
  );
  await expect(interactive.locator('.ds-table__row [data-column-id="actions"]').first()).toHaveCSS(
    'width',
    '40px'
  );
  const wideSpacer = interactive.locator('.ds-table__row [data-elastic-spacer="true"]').first();
  await expect(wideSpacer).toBeVisible();
  expect(
    await wideSpacer.evaluate(element => element.getBoundingClientRect().width)
  ).toBeGreaterThan(0);
  await expect(wideSpacer.locator('xpath=following-sibling::*[1]')).toHaveAttribute(
    'data-column-id',
    'actions'
  );

  const overflow = page.locator('#overflow');
  const overflowViewport = overflow.locator('.ds-table__viewport');
  const collapsedSpacer = overflow.locator('.ds-table__row [data-elastic-spacer="true"]').first();
  const overflowGeometry = await overflowViewport.evaluate(element => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(overflowGeometry.scrollWidth).toBeGreaterThan(overflowGeometry.clientWidth);
  expect(
    await collapsedSpacer.evaluate(element => element.getBoundingClientRect().width)
  ).toBeLessThanOrEqual(COMPOSITED_EDGE_CEILING_PX);

  const grouped = page.locator('#severity-grouped');
  await expect(grouped.locator('.ds-table__row .ds-table__selection-cell').first()).toHaveCSS(
    'width',
    '40px'
  );
  await expect(grouped.locator('.ds-table__selection-column')).toHaveCSS('max-width', '40px');
  await expect(grouped.locator('.ds-table__collapse-column')).toHaveCount(0);
  await expect(grouped.locator('.ds-table__collapse-cell')).toHaveCount(0);
});

test('bounds the complete header, frame, and footer composition with height', async ({ page }) => {
  const table = page.locator('#fixed-height');
  await expect(table).toHaveCSS('height', '320px');
  await expect(table.locator('.ds-table')).toHaveCSS('height', '320px');
  await expect(table.locator('.ds-table__caption-bar')).toHaveCSS('height', '48px');
  await expect(table.locator('.ds-table__frame')).toHaveCSS('height', '224px');
  await expect(table.locator('.ds-table__footer')).toHaveCSS('height', '48px');
  await expect(table.locator('.ds-table__head')).toHaveCSS('position', 'sticky');
  await expect(table.locator('.ds-table__frame')).toHaveCSS('border-radius', '0px');
  await expect(table.locator('.ds-table__viewport')).toHaveCSS('border-radius', '0px');
  await expect(table.locator('.ds-table__frame')).toHaveCSS('overflow', 'clip');

  // Radius remains opt-in. When a consumer sets it, the outer bars own the
  // corners and the frame is flat where those bars meet—no rounded notch.
  await table.evaluate(element => element.style.setProperty('--ds-table-radius', '10px'));
  await expect(table.locator('.ds-table__caption-bar')).toHaveCSS(
    'border-start-start-radius',
    '10px'
  );
  await expect(table.locator('.ds-table__frame')).toHaveCSS('border-start-start-radius', '0px');
  await expect(table.locator('.ds-table__frame')).toHaveCSS('border-end-start-radius', '0px');
  await expect(table.locator('.ds-table__footer')).toHaveCSS('border-end-start-radius', '10px');
});

test('fits to a collapsing page scrollport before handing vertical scroll to native groups', async ({
  page,
}) => {
  const owner = page.locator('#viewport-fit-owner');
  const table = page.locator('#viewport-fit');
  const surface = table.locator('.ds-table');
  const viewport = table.locator('.ds-table__viewport');
  const footer = table.locator('.ds-table__footer');
  await owner.scrollIntoViewIfNeeded();
  await owner.evaluate(element => {
    element.scrollTop = 0;
  });

  await expect(table).toHaveCSS('height', '368px');
  await expect(surface).toHaveCSS('height', '296px');
  await expect(surface).toHaveClass(/ds-table--viewport-fit-pending/);
  await expect(viewport).toHaveCSS('overflow-y', 'hidden');
  await expect
    .poll(() =>
      table.evaluate(element => {
        const owner = element.closest('#viewport-fit-owner')!.getBoundingClientRect();
        const footer = element
          .querySelector<HTMLElement>('.ds-table__footer')!
          .getBoundingClientRect();
        return footer.bottom - (owner.bottom - 32);
      })
    )
    .toBeCloseTo(0, 1);

  await owner.evaluate(element => {
    element.scrollTop = element.scrollHeight;
  });
  await expect.poll(() => owner.evaluate(element => element.scrollTop)).toBeCloseTo(72, 0);
  await expect(surface).toHaveCSS('height', '368px');
  await expect(surface).toHaveClass(/ds-table--viewport-fit-settled/);
  await expect(surface).toHaveClass(/ds-table--contained-scroll/);
  await expect(table.locator('.ds-table__frame')).toHaveCSS('overflow', 'clip');
  await expect(viewport).toHaveCSS('overflow-y', 'auto');
  await expect(viewport).toHaveCSS('overscroll-behavior-y', 'none');
  await expect
    .poll(() =>
      table.evaluate(element => {
        const owner = element.closest('#viewport-fit-owner')!.getBoundingClientRect();
        const host = element.getBoundingClientRect();
        const footer = element
          .querySelector<HTMLElement>('.ds-table__footer')!
          .getBoundingClientRect();
        return {
          top: host.top - (owner.top + 80),
          bottom: footer.bottom - (owner.bottom - 32),
        };
      })
    )
    .toEqual({ top: 0, bottom: 0 });

  await viewport.evaluate(element => {
    element.scrollTop = 96;
  });
  const headerPaintOrder = await table.evaluate(element => {
    const header = element.querySelector<HTMLElement>('.ds-table__head')!;
    const selection = header
      .querySelector<HTMLElement>('.ds-table__selection-cell')!
      .getBoundingClientRect();
    const action = header
      .querySelector<HTMLElement>('[data-column-id="actions"]')!
      .getBoundingClientRect();
    const hitLane = (rect: DOMRect) =>
      document
        .elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
        ?.closest('.ds-table__head') === header;
    return {
      headerZIndex: getComputedStyle(header).zIndex,
      stickyGroupZIndex: getComputedStyle(
        element.querySelector<HTMLElement>('.ds-table__group-row--native-sticky')!
      ).zIndex,
      bodyStickyZIndex: getComputedStyle(
        element.querySelector<HTMLElement>('.ds-table__body .ds-table__selection-cell')!
      ).zIndex,
      selectionHeaderWins: hitLane(selection),
      actionHeaderWins: hitLane(action),
    };
  });
  expect(headerPaintOrder).toEqual({
    headerZIndex: '6',
    stickyGroupZIndex: '5',
    bodyStickyZIndex: '2',
    selectionHeaderWins: true,
    actionHeaderWins: true,
  });

  await viewport.evaluate(element => {
    element.scrollTop = 0;
  });
  const upwardEdge = await viewport.evaluate(element => {
    const owner = element.closest('#viewport-fit-owner') as HTMLElement;
    const event = new WheelEvent('wheel', { deltaY: -40, cancelable: true });
    element.dispatchEvent(event);
    return { prevented: event.defaultPrevented, ownerScrollTop: owner.scrollTop };
  });
  expect(upwardEdge).toEqual({ prevented: true, ownerScrollTop: 32 });
  await owner.evaluate(element => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(surface).toHaveClass(/ds-table--viewport-fit-settled/);

  const downwardEdge = await viewport.evaluate(element => {
    const owner = element.closest('#viewport-fit-owner') as HTMLElement;
    element.scrollTop = element.scrollHeight;
    const before = owner.scrollTop;
    const event = new WheelEvent('wheel', { deltaY: 80, cancelable: true });
    element.dispatchEvent(event);
    return {
      prevented: event.defaultPrevented,
      ownerScrollTop: owner.scrollTop,
      ownerScrollTopBefore: before,
      viewportScrollTop: element.scrollTop,
      viewportMax: element.scrollHeight - element.clientHeight,
    };
  });
  expect(downwardEdge.prevented).toBe(true);
  expect(downwardEdge.ownerScrollTop).toBe(downwardEdge.ownerScrollTopBefore);
  expect(downwardEdge.viewportScrollTop).toBe(downwardEdge.viewportMax);

  const firstGroup = table.locator('tbody[data-group-id="fit-first"] .ds-table__group-cell');
  const secondGroup = table.locator('tbody[data-group-id="fit-second"] .ds-table__group-cell');
  await viewport.evaluate(element => {
    element.scrollTop = 0;
  });
  await expect.poll(() => viewport.evaluate(element => element.scrollTop)).toBe(0);
  await viewport.evaluate(
    (element, incoming) => {
      const headerBottom = element
        .querySelector<HTMLElement>('.ds-table__head')!
        .getBoundingClientRect().bottom;
      const incomingTop = incoming.getBoundingClientRect().top;
      element.scrollTop += incomingTop - headerBottom - 20;
    },
    await secondGroup.elementHandle()
  );
  await expect
    .poll(() =>
      table.evaluate(element => {
        const outgoing = element
          .querySelector<HTMLElement>('tbody[data-group-id="fit-first"] .ds-table__group-cell')!
          .getBoundingClientRect();
        const incoming = element
          .querySelector<HTMLElement>('tbody[data-group-id="fit-second"] .ds-table__group-cell')!
          .getBoundingClientRect();
        return outgoing.bottom - incoming.top;
      })
    )
    .toBeCloseTo(0, 1);
  await expect(firstGroup.locator('xpath=..')).toHaveCSS('position', 'sticky');
  await expect(firstGroup).toHaveCSS('visibility', 'visible');
  await viewport.evaluate(
    (element, incoming) => {
      const headerBottom = element
        .querySelector<HTMLElement>('.ds-table__head')!
        .getBoundingClientRect().bottom;
      const incomingTop = incoming.getBoundingClientRect().top;
      element.scrollTop += incomingTop - headerBottom + 1;
    },
    await secondGroup.elementHandle()
  );
  await expect
    .poll(() =>
      table.evaluate(element => {
        const headerBottom = element
          .querySelector<HTMLElement>('.ds-table__head')!
          .getBoundingClientRect().bottom;
        const incoming = element
          .querySelector<HTMLElement>('tbody[data-group-id="fit-second"] .ds-table__group-cell')!
          .getBoundingClientRect();
        return incoming.top - headerBottom;
      })
    )
    .toBeCloseTo(0, 1);
  await expect(secondGroup.locator('xpath=..')).toHaveCSS('position', 'sticky');
  await expect(footer).toBeVisible();

  await table.evaluate(element => {
    const fitted = element as HTMLDsTableElement;
    fitted.groups = [
      {
        id: 'fit-short',
        label: 'Short fitted section',
        rows: [fitted.groups[0].rows[0]],
      },
    ];
    fitted.displayedCount = 1;
    fitted.totalCount = 1;
  });
  await expect(table.locator('tbody[data-group-id="fit-short"] .ds-table__row')).toHaveCount(1);
  await expect(surface).toHaveCSS('height', '368px');
  await expect(surface).toHaveCSS('min-height', '368px');
  await expect(table.locator('.ds-table__frame')).toHaveCSS('height', '272px');
  await expect
    .poll(() =>
      table.evaluate(element => {
        const owner = element.closest('#viewport-fit-owner')!.getBoundingClientRect();
        const footerRect = element
          .querySelector<HTMLElement>('.ds-table__footer')!
          .getBoundingClientRect();
        return footerRect.bottom - (owner.bottom - 32);
      })
    )
    .toBeCloseTo(0, 1);
});

test('keeps native group push-off gapless through continuous scroll and resize frames', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  const owner = page.locator('#viewport-fit-owner');
  const table = page.locator('#viewport-fit');
  const viewport = table.locator('.ds-table__viewport');
  await owner.scrollIntoViewIfNeeded();
  await owner.evaluate(element => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(table.locator('.ds-table')).toHaveClass(/ds-table--viewport-fit-settled/);
  await expect(table.locator('.ds-table__sticky-group')).toHaveCount(0);
  await expect(table.locator('.ds-table__group-row--native-sticky')).toHaveCount(2);
  await expect(table.locator('.ds-table__header-cell').first()).toHaveCSS('height', '32px');
  const intrinsicRowGeometry = await table.locator('[data-row-id="fit-first-0"]').evaluate(row => {
    const rowHeight = row.getBoundingClientRect().height;
    const cellHeights = Array.from(row.querySelectorAll<HTMLElement>('.ds-table__cell')).map(
      cell => cell.getBoundingClientRect().height
    );
    return { rowHeight, cellHeights };
  });
  expect(intrinsicRowGeometry.rowHeight).toBeGreaterThan(40);
  for (const [index, cellHeight] of intrinsicRowGeometry.cellHeights.entries()) {
    expectGeometryClose(
      cellHeight,
      intrinsicRowGeometry.rowHeight,
      `grouped grid cell ${index} height`
    );
  }
  await expect(table.getByRole('rowheader', { name: /First fitted section/ })).toBeVisible();
  await expect(table.getByRole('rowheader', { name: /Second fitted section/ })).toBeVisible();

  const result = await table.evaluate(async element => {
    const scrollport = element.querySelector<HTMLElement>('.ds-table__viewport')!;
    const header = element.querySelector<HTMLElement>('.ds-table__head')!;
    const sectionRows = Array.from(
      element.querySelectorAll<HTMLElement>('.ds-table__group-row--native-sticky')
    );
    const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    scrollport.scrollTop = 0;
    await nextFrame();

    const headerBottom = header.getBoundingClientRect().bottom;
    const incomingTop = sectionRows[1]!.getBoundingClientRect().top;
    const transition = scrollport.scrollTop + incomingTop - headerBottom;
    const start = Math.max(0, transition - 64);
    const end = transition + 24;
    const frames = 44;
    let uncoveredFrames = 0;
    let maxOverlap = 0;

    for (let index = 0; index <= frames; index += 1) {
      scrollport.scrollTop = start + ((end - start) * index) / frames;
      await nextFrame();
      const lane = header.getBoundingClientRect().bottom + 1;
      const rectangles = sectionRows.map(row => row.getBoundingClientRect());
      if (!rectangles.some(rect => rect.top <= lane && rect.bottom >= lane)) {
        uncoveredFrames += 1;
      }
      const overlap = Math.max(
        0,
        Math.min(rectangles[0]!.bottom, rectangles[1]!.bottom) -
          Math.max(rectangles[0]!.top, rectangles[1]!.top)
      );
      maxOverlap = Math.max(maxOverlap, overlap);
    }

    const mutations: MutationRecord[] = [];
    const observer = new MutationObserver(records => mutations.push(...records));
    observer.observe(element, { childList: true, subtree: true });
    const initialRows = element.querySelectorAll('.ds-table__group-row--native-sticky').length;
    const initialInlineSize = element.getBoundingClientRect().width;
    for (let index = 0; index < 12; index += 1) {
      element.style.inlineSize = `${initialInlineSize - index * 16}px`;
      await nextFrame();
    }
    element.style.removeProperty('inline-size');
    await nextFrame();
    observer.disconnect();

    return {
      uncoveredFrames,
      maxOverlap,
      childListMutations: mutations.filter(record => record.type === 'childList').length,
      initialRows,
      finalRows: element.querySelectorAll('.ds-table__group-row--native-sticky').length,
      hiddenSources: element.querySelectorAll('.ds-table__group-cell--sticky-source-hidden').length,
    };
  });

  expect(result.uncoveredFrames).toBe(0);
  expect(result.maxOverlap).toBeLessThanOrEqual(COMPOSITED_EDGE_CEILING_PX);
  expect(result.childListMutations).toBe(0);
  expect(result.finalRows).toBe(result.initialRows);
  expect(result.hiddenSources).toBe(0);
  await expect(viewport).toHaveCSS('overflow-y', 'auto');
});

test('keeps a document-flow header and edge columns sticky while vertical input scrolls the page', async ({
  page,
}) => {
  const table = page.locator('#document-sticky');
  const frame = table.locator('.ds-table__frame');
  const viewport = table.locator('.ds-table__viewport');
  const stickyHeader = table.locator('.ds-table__document-sticky-header');
  const captionBar = table.locator('.ds-table__caption-bar');
  await table.scrollIntoViewIfNeeded();
  await page.evaluate(
    element => {
      const top = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top + 80);
    },
    await frame.elementHandle()
  );

  await expect(stickyHeader).toHaveCSS('position', 'sticky');
  await expect(captionBar).toHaveCSS('position', 'sticky');
  await expect
    .poll(() => captionBar.evaluate(element => element.getBoundingClientRect().top))
    .toBeCloseTo(48, 0);
  await expect
    .poll(() => stickyHeader.evaluate(element => element.getBoundingClientRect().top))
    .toBeCloseTo(96, 0);
  const stickyGroup = table.locator('.ds-table__sticky-group');
  const secondGroup = table.locator('tbody[data-group-id="second-section"] .ds-table__group-cell');
  await page.evaluate(
    element => {
      const top = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top + 280);
    },
    await frame.elementHandle()
  );
  await expect(stickyGroup).toHaveAttribute('data-group-id', 'first-section');
  const firstGroupRow = table.locator('tbody[data-group-id="first-section"] .ds-table__group-row');
  await expect(firstGroupRow).toHaveAttribute('aria-hidden', 'true');
  await expect(firstGroupRow.locator('.ds-table__group-cell')).not.toHaveAttribute(
    'aria-hidden',
    'true'
  );
  await expect
    .poll(() => stickyGroup.evaluate(element => element.getBoundingClientRect().top))
    .toBeCloseTo(128, 0);
  await expect
    .poll(() => secondGroup.evaluate(element => element.getBoundingClientRect().top))
    .toBeGreaterThan(128);
  await page.evaluate(
    element => {
      const top = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top - 148);
    },
    await secondGroup.elementHandle()
  );
  await expect(stickyGroup).toHaveAttribute('data-group-id', 'first-section');
  await expect
    .poll(() =>
      table.evaluate(element => {
        const outgoing = element
          .querySelector<HTMLElement>('.ds-table__sticky-group')!
          .getBoundingClientRect();
        const incoming = element
          .querySelector<HTMLElement>(
            'tbody[data-group-id="second-section"] .ds-table__group-cell'
          )!
          .getBoundingClientRect();
        return {
          overlap: outgoing.bottom - incoming.top,
          pushedAboveStickyLane: outgoing.top < 128,
        };
      })
    )
    .toEqual({ overlap: 0, pushedAboveStickyLane: true });
  await page.evaluate(
    element => {
      const top = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top - 108);
    },
    await secondGroup.elementHandle()
  );
  await expect(stickyGroup).toHaveAttribute('data-group-id', 'second-section');
  await expect(firstGroupRow).not.toHaveAttribute('aria-hidden', 'true');
  await expect(
    table.locator('tbody[data-group-id="second-section"] .ds-table__group-row')
  ).toHaveAttribute('aria-hidden', 'true');
  await expect
    .poll(() => stickyGroup.evaluate(element => element.getBoundingClientRect().top))
    .toBeCloseTo(128, 0);
  await expect(table.locator('.ds-table__head--semantic-copy')).toHaveCSS('opacity', '0');
  await expect(stickyHeader.locator('th[aria-sort]')).toHaveCount(0);
  await expect(viewport.locator('th[aria-sort="descending"]')).toHaveCount(1);
  const firstSelectionCell = table.locator('.ds-table__body .ds-table__selection-cell').first();
  const firstActionCell = table.locator('.ds-table__body [data-column-id="actions"]').first();
  const firstStartEdge = firstSelectionCell.locator('.ds-table__sticky-edge--start');
  const firstEndEdge = firstActionCell.locator('.ds-table__sticky-edge--end');
  await expect(firstSelectionCell).toHaveCSS('box-shadow', 'none');
  await expect(firstActionCell).toHaveCSS('box-shadow', 'none');
  const stickyEdgeColors = await firstStartEdge.evaluate(element => {
    const probe = document.createElement('span');
    document.body.append(probe);
    probe.style.background = 'var(--color-border-tertiary)';
    const stickyDivider = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return { start: getComputedStyle(element).backgroundColor, stickyDivider };
  });
  const stickyEndColor = await firstEndEdge.evaluate(
    element => getComputedStyle(element).backgroundColor
  );
  expect(stickyEdgeColors.start).toBe(stickyEdgeColors.stickyDivider);
  expect(stickyEndColor).toBe(stickyEdgeColors.stickyDivider);
  expect(
    await firstStartEdge.evaluate(element => getComputedStyle(element, '::after').boxShadow)
  ).toBe('none');
  expect(
    await firstEndEdge.evaluate(element => getComputedStyle(element, '::after').boxShadow)
  ).not.toBe('none');

  await expect(viewport).toHaveCSS('overscroll-behavior-x', 'none');
  const horizontalEdgeContainment = await viewport.evaluate(element => {
    const dispatchAt = (scrollLeft: number, deltaX: number) => {
      element.scrollLeft = scrollLeft;
      const event = new WheelEvent('wheel', { deltaX, cancelable: true });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    };
    return {
      start: dispatchAt(0, -80),
      end: dispatchAt(element.scrollWidth, 80),
    };
  });
  expect(horizontalEdgeContainment).toEqual({ start: true, end: true });
  await viewport.evaluate(element => {
    element.scrollLeft = 240;
  });
  await expect(frame).toHaveClass(/ds-table__frame--overflow-start/);
  await expect(frame).toHaveClass(/ds-table__frame--overflow-end/);

  const expectHeaderAligned = async () => {
    await expect
      .poll(() =>
        table.evaluate(element => {
          const sticky = element
            .querySelector<HTMLElement>(
              '.ds-table__document-sticky-header [data-column-id="name"]'
            )!
            .getBoundingClientRect();
          const semantic = element
            .querySelector<HTMLElement>(
              '.ds-table__viewport .ds-table__head [data-column-id="name"]'
            )!
            .getBoundingClientRect();
          return Math.abs(sticky.left - semantic.left) + Math.abs(sticky.right - semantic.right);
        })
      )
      .toBeLessThan(0.1);
  };
  await expectHeaderAligned();

  for (const position of ['end', 0, 240, 'end', 120]) {
    await viewport.evaluate((element, target) => {
      element.scrollLeft = target === 'end' ? element.scrollWidth : Number(target);
    }, position);
    await expectHeaderAligned();
  }

  const stickyBoundaryGeometry = await table.evaluate(element => {
    const headerSelection = element.querySelector<HTMLElement>(
      '.ds-table__document-sticky-header .ds-table__selection-cell'
    )!;
    const bodySelection = element.querySelector<HTMLElement>(
      '.ds-table__body .ds-table__selection-cell'
    )!;
    const headerStartEdge = headerSelection.querySelector<HTMLElement>(
      '.ds-table__sticky-edge--start'
    )!;
    const bodyStartEdge = bodySelection.querySelector<HTMLElement>(
      '.ds-table__sticky-edge--start'
    )!;
    const headerEndEdge = element.querySelector<HTMLElement>(
      '.ds-table__document-sticky-header .ds-table__sticky-edge--end'
    )!;
    const bodyEndEdge = element.querySelector<HTMLElement>(
      '.ds-table__body .ds-table__sticky-edge--end'
    )!;
    const firstScrollingHeader = element.querySelector<HTMLElement>(
      '.ds-table__document-sticky-header [data-column-id="name"]'
    )!;
    const rect = (node: HTMLElement) => node.getBoundingClientRect();
    return {
      headerStartRight: rect(headerStartEdge).right,
      bodyStartRight: rect(bodyStartEdge).right,
      headerEndLeft: rect(headerEndEdge).left,
      bodyEndLeft: rect(bodyEndEdge).left,
      headerEdgeBottomGap: rect(headerSelection).bottom - rect(headerStartEdge).bottom,
      bodyEdgeBottomGap: rect(bodySelection).bottom - rect(bodyStartEdge).bottom,
      obsoleteScrollingDivider: getComputedStyle(firstScrollingHeader, '::before').boxShadow,
    };
  });
  expect(stickyBoundaryGeometry.headerStartRight).toBeCloseTo(
    stickyBoundaryGeometry.bodyStartRight,
    1
  );
  expect(stickyBoundaryGeometry.headerEndLeft).toBeCloseTo(stickyBoundaryGeometry.bodyEndLeft, 1);
  expect(stickyBoundaryGeometry.headerEdgeBottomGap).toBe(1);
  expect(stickyBoundaryGeometry.bodyEdgeBottomGap).toBe(1);
  expect(stickyBoundaryGeometry.obsoleteScrollingDivider).toBe('none');

  const terminalColumnDivider = await table
    .locator('.ds-table__body:last-child .ds-table__row:last-child .ds-table__cell')
    .nth(2)
    .evaluate(element => getComputedStyle(element, '::after').boxShadow);
  expect(terminalColumnDivider).toContain(stickyEdgeColors.stickyDivider);

  const lanes = await table.locator('[data-row-id="document-row-2"]').evaluate(row => {
    const viewport = row.closest('.ds-table__viewport')!.getBoundingClientRect();
    const selection = row
      .querySelector<HTMLElement>('.ds-table__selection-cell')!
      .getBoundingClientRect();
    const action = row
      .querySelector<HTMLElement>('[data-column-id="actions"]')!
      .getBoundingClientRect();
    return {
      viewportLeft: viewport.left,
      viewportRight: viewport.right,
      selectionLeft: selection.left,
      actionRight: action.right,
    };
  });
  expect(lanes.selectionLeft).toBeCloseTo(lanes.viewportLeft, 0);
  expect(lanes.actionRight).toBeCloseTo(lanes.viewportRight, 0);
  await expect(firstSelectionCell).toHaveCSS('box-shadow', 'none');
  await expect(firstActionCell).toHaveCSS('box-shadow', 'none');
  const stickyShadows = await Promise.all([
    firstStartEdge.evaluate(element => getComputedStyle(element, '::after').boxShadow),
    firstEndEdge.evaluate(element => getComputedStyle(element, '::after').boxShadow),
  ]);
  for (const shadow of stickyShadows) {
    expect(shadow).toContain('inset');
    expect(shadow).not.toContain('0px 0px 0px 1px');
  }
  await expect(table.locator('.ds-table__overflow-shadow')).toHaveCount(0);

  await page.evaluate(() => window.scrollBy(0, -320));
  const before = await page.evaluate(() => window.scrollY);
  await viewport.hover({ position: { x: 200, y: 200 } });
  await page.mouse.wheel(0, 160);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
});

test('renders initial state bodies and passes an accessibility scan', async ({ page }) => {
  const loading = page.locator('#loading');
  await expect(loading.getByRole('table')).toHaveAttribute('aria-busy', 'true');
  await expect(loading.locator('ds-skeleton')).toHaveCount(70);
  const skeletonRows = loading.locator('.ds-table__skeleton-row');
  await expect(skeletonRows).toHaveCount(10);
  const skeletonCells = skeletonRows
    .first()
    .locator('.ds-table__skeleton-cell:not([data-elastic-spacer])');
  await expect(skeletonCells).toHaveCount(6);
  await expect(
    skeletonRows.first().locator('.ds-table__skeleton-cell[data-elastic-spacer="true"]')
  ).toHaveCount(1);
  const selectionSkeleton = skeletonRows.first().locator('.ds-table__selection-cell');
  await expect(selectionSkeleton).toHaveAttribute('data-skeleton-kind', 'checkbox');
  const selectionSkeletonGeometry = await selectionSkeleton
    .locator('ds-skeleton')
    .evaluate(element => {
      const cell = element.closest<HTMLElement>('.ds-table__selection-cell')!;
      const cellRect = cell.getBoundingClientRect();
      const rect = element.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        inlineOffset: rect.left - cellRect.left,
        blockOffset: rect.top - cellRect.top,
      };
    });
  const checkboxGeometry = await page
    .locator('#selectable .ds-table__row .ds-table__selection-cell ds-checkbox .box')
    .first()
    .evaluate(element => {
      const cell = element.closest<HTMLElement>('.ds-table__selection-cell')!;
      const cellRect = cell.getBoundingClientRect();
      const rect = element.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        inlineOffset: rect.left - cellRect.left,
        blockOffset: rect.top - cellRect.top,
      };
    });
  expect(selectionSkeletonGeometry).toEqual(checkboxGeometry);
  await expect(skeletonCells.nth(1)).toHaveAttribute('data-skeleton-kind', 'image');
  await expect(skeletonCells.nth(2)).toHaveAttribute('data-skeleton-kind', 'text');
  await expect(skeletonCells.nth(2)).toHaveClass(/ds-table__cell--text-multi/);
  await expect(skeletonCells.nth(3)).toHaveAttribute('data-skeleton-kind', 'tag');
  await expect(skeletonCells.nth(4)).toHaveAttribute('data-skeleton-kind', 'icon');
  await expect(skeletonCells.nth(5)).toHaveAttribute('data-skeleton-kind', 'action');
  await expect(skeletonCells.first()).toHaveClass(/ds-interaction-fill--grouped/);
  await expect(skeletonRows.first()).toHaveCSS('height', '62px');
  await expect(skeletonCells.nth(1)).toHaveClass(/ds-table__cell--image-multi/);
  await expect(skeletonCells.nth(1).locator('.ds-table__skeleton-image')).toHaveCSS(
    'height',
    '46px'
  );
  const dividerShadows = async (row: ReturnType<typeof page.locator>) =>
    row
      .locator('.ds-table__cell')
      .evaluateAll(cells =>
        cells.slice(0, 3).map(cell => getComputedStyle(cell, '::after').boxShadow)
      );
  expect(await dividerShadows(skeletonRows.first())).toEqual(
    await dividerShadows(page.locator('#interactive .ds-table__row').first())
  );
  expect(await dividerShadows(skeletonRows.last())).toEqual(
    await dividerShadows(page.locator('#interactive .ds-table__row').last())
  );
  const skeletonInsets = await skeletonCells.first().evaluate(cell => {
    const styles = getComputedStyle(cell);
    return { top: styles.paddingTop, right: styles.paddingRight, bottom: styles.paddingBottom };
  });
  const selectionInsets = await page
    .locator('#selectable .ds-table__row[data-row-id="avery"] .ds-table__selection-cell')
    .evaluate(cell => {
      const styles = getComputedStyle(cell);
      return { top: styles.paddingTop, right: styles.paddingRight, bottom: styles.paddingBottom };
    });
  expect(skeletonInsets).toEqual(selectionInsets);
  await expect(page.locator('#empty').getByText('No matching drivers')).toBeVisible();
  await expect(page.locator('#error').getByText('Drivers unavailable')).toBeVisible();
  await expect(page.locator('#empty').locator('ds-empty-state')).toBeVisible();
  await expect(page.locator('#error').locator('ds-empty-state')).toBeVisible();

  const results = await new AxeBuilder({ page })
    .include('#basic')
    .include('#grouped')
    .include('#selectable')
    .include('#document-sticky')
    .analyze();
  expect(results.violations).toEqual([]);
});

test(
  'fills remaining bounded table body with empty and error EmptyState',
  chromiumOnly('layout-geometry', 'Empty-state body fill is a token-backed geometry contract.'),
  async ({ page }) => {
    for (const selector of ['#empty', '#error']) {
      const table = page.locator(selector);
      const viewport = table.locator('.ds-table__viewport');
      const header = table.locator('.ds-table__header-row');
      const region = table.locator('.ds-table__state-cell');
      const empty = table.locator('ds-empty-state');
      await expect(empty).toBeVisible();
      const [viewportBox, headerBox, regionBox, emptyBox] = await Promise.all([
        viewport.boundingBox(),
        header.boundingBox(),
        region.boundingBox(),
        empty.boundingBox(),
      ]);
      expect(viewportBox).not.toBeNull();
      expect(headerBox).not.toBeNull();
      expect(regionBox).not.toBeNull();
      expect(emptyBox).not.toBeNull();
      expect(emptyBox!.height).toBeGreaterThan(80);
      expectGeometryClose(
        regionBox!.height + headerBox!.height,
        viewportBox!.height,
        `${selector} empty-state fills remaining viewport`,
        2
      );
    }
  }
);
