import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { chromiumOnly } from './browser-tier';

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

test('toggles active sort direction and moves sorting only through another column', async ({ page }) => {
  const table = page.locator('#basic');
  const driverHeader = table.getByRole('columnheader', { name: /Driver/ });
  const labelControl = driverHeader.locator('[data-sort-control="label"]');
  const directionControl = driverHeader.locator('[data-sort-control="direction"]');

  await expect(directionControl).toHaveCount(0);
  await labelControl.click();
  await expect(driverHeader).toHaveAttribute('aria-sort', 'ascending');
  await expect(directionControl).toHaveJSProperty('icon', 'ArrowUp');
  await expect(table.locator('tbody .ds-table__row').first()).toHaveAttribute('data-row-id', 'avery');

  await directionControl.getByRole('button').click();
  await expect(driverHeader).toHaveAttribute('aria-sort', 'descending');
  await expect(directionControl).toHaveJSProperty('icon', 'ArrowDown');
  await expect(table.locator('tbody .ds-table__row').first()).toHaveAttribute('data-row-id', 'sam');

  await directionControl.getByRole('button').click();
  await expect(driverHeader).toHaveAttribute('aria-sort', 'ascending');
  await expect(directionControl).toHaveJSProperty('icon', 'ArrowUp');
  await expect(table.locator('tbody .ds-table__row').first()).toHaveAttribute('data-row-id', 'avery');

  await table
    .getByRole('columnheader', { name: /Status/ })
    .locator('[data-sort-control="label"]')
    .click();
  await expect(driverHeader).not.toHaveAttribute('aria-sort');
  await expect(directionControl).toHaveCount(0);
  await expect(table.getByRole('columnheader', { name: /Status/ })).toHaveAttribute('aria-sort', 'ascending');
});

test('keeps group order and member-row sorting independent', async ({ page }) => {
  const table = page.locator('#grouped');
  await expect(table.locator('tbody[data-group-id]')).toHaveCount(3);
  await expect(table.locator('th[scope="rowgroup"]')).toHaveCount(3);
  await expect(table.locator('tbody[data-group-id]').first()).toHaveAttribute('data-group-id', 'driving');

  await table
    .getByRole('columnheader', { name: /Status/ })
    .locator('[data-sort-control="direction"]')
    .getByRole('button')
    .click();
  await expect(table.locator('tbody[data-group-id]').first()).toHaveAttribute('data-group-id', 'on-duty');
  await expect(table.getByRole('columnheader', { name: /Safety score/ })).toHaveAttribute('aria-sort', 'descending');

  const scoreHeader = table.getByRole('columnheader', { name: /Safety score/ });
  await scoreHeader.locator('[data-sort-control="label"]').click();
  await expect(scoreHeader).toHaveAttribute('aria-sort', 'ascending');
  await expect
    .poll(() => table.evaluate((element: HTMLDsTableElement) => element.grouping?.direction))
    .toBe('desc');
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
  await expect(table.locator('ds-tag').first()).toHaveCSS('height', '28px');

  const firstRow = table.locator('tbody .ds-table__row').first();
  const firstDataCell = firstRow.locator('.ds-table__cell:not(.ds-table__selection-cell)').first();
  await expect(firstDataCell).toHaveCSS('padding-top', '10px');
  await expect(firstDataCell).toHaveCSS('padding-right', '10px');
  await expect(firstDataCell).toHaveCSS('padding-bottom', '10px');
  await expect(firstDataCell).toHaveCSS('padding-left', '10px');
  const primaryTrack = firstRow.locator('.ds-table__cell-primary');
  const secondaryTrack = firstRow.locator('.ds-table__cell-secondary');
  await expect(primaryTrack).toHaveJSProperty('variant', 'text-body-medium');
  await expect(secondaryTrack).toHaveJSProperty('variant', 'text-body-small');

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
  expect(trackGeometry.tag.top).toBeCloseTo(trackGeometry.primary.top - 4, 0);
  expect(trackGeometry.checkbox.height).toBeCloseTo(20, 0);
  expect(trackGeometry.primary.height).toBeCloseTo(20, 0);
  expect(trackGeometry.tag.height).toBeCloseTo(28, 0);
  expect(trackGeometry.secondary.top - trackGeometry.primary.bottom).toBeCloseTo(4, 0);
  expect(trackGeometry.secondary.height).toBeCloseTo(20, 0);

  const geometry = await labels.evaluateAll(elements => elements.map(element => {
    const control = element.getBoundingClientRect();
    const label = element.querySelector('.ds-table__header-label-box')!.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      controlWidth: control.width,
      labelWidth: label.width,
      paddingLeft: Number.parseFloat(style.paddingLeft),
      paddingRight: Number.parseFloat(style.paddingRight),
    };
  }));
  for (const item of geometry) {
    expect(item.paddingLeft).toBe(2);
    expect(item.paddingRight).toBe(2);
    expect(item.controlWidth - item.labelWidth).toBeCloseTo(4, 0);
    expect(item.controlWidth).toBeLessThan(100);
  }

  const labelColors = async () => labels.nth(0).evaluate(element => {
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
  await expect.poll(() => table.evaluate((element: HTMLDsTableElement) => element.sort)).toEqual({
    columnId: 'severity',
    direction: 'asc',
  });
  await expect(labels.nth(1).locator('ds-text')).toHaveJSProperty('emphasis', true);
  await expect(labels.nth(0).locator('ds-text')).toHaveJSProperty('emphasis', false);

  await labels.nth(0).click();
  await expect.poll(() => table.evaluate((element: HTMLDsTableElement) => element.sort)).toEqual({
    columnId: 'behavior',
    direction: 'asc',
  });
});

test('renders independently styled standard cell types', async ({ page }) => {
  const table = page.locator('#cell-types');
  const selectionCell = table.locator('[data-row-id="tag-variants"] .ds-table__selection-cell');
  const singleText = table.locator('[data-column-id="singleText"][data-cell-variant="single"]');
  const primarySecondary = table.locator('[data-column-id="primarySecondary"][data-cell-variant="multi"]');
  const primaryPair = table.locator('[data-column-id="primaryPair"][data-cell-variant="primary-pair"]');
  const image = table.locator('[data-column-id="image"][data-cell-type="image"]');
  const icon = table.locator('[data-column-id="icon"][data-cell-type="icon"]');
  const empty = table.locator('[data-column-id="empty"][data-cell-type="empty"]');
  const blank = table.locator('[data-column-id="blank"][data-cell-type="blank"]');
  const tagOnly = table.locator('[data-cell-variant="tag-only"]');
  const tagWithText = table.locator('[data-cell-variant="tag-with-text"]');
  const textWithTag = table.locator('[data-cell-variant="text-with-tag"]');
  const action = table.locator('[data-column-id="action"][data-cell-type="action"]');
  const borderedAction = table.locator('[data-column-id="borderedAction"][data-cell-type="action"]');
  const actionHeader = table.locator('.ds-table__header-cell[data-column-id="action"]');
  const borderedActionHeader = table.locator(
    '.ds-table__header-cell[data-column-id="borderedAction"]',
  );

  for (const cell of [tagOnly, tagWithText, textWithTag]) {
    await expect(cell).toHaveAttribute('data-cell-type', 'tag');
  }

  await expect(selectionCell).toHaveCSS('padding-top', '10px');
  await expect(selectionCell).toHaveCSS('padding-right', '10px');
  await expect(selectionCell).toHaveCSS('padding-bottom', '10px');
  await expect(selectionCell).toHaveCSS('padding-left', '10px');
  await expect(selectionCell.locator('.ds-table__selection-control')).toHaveCSS('width', '20px');
  await expect(selectionCell.locator('.ds-table__selection-control')).toHaveCSS('height', '20px');
  await expect(selectionCell.locator('ds-checkbox')).toHaveCSS('width', '20px');
  await expect(selectionCell.locator('ds-checkbox')).toHaveCSS('height', '20px');

  for (const cell of [singleText, empty, blank]) {
    await expect(cell).toHaveCSS('padding-top', '10px');
    await expect(cell).toHaveCSS('padding-right', '10px');
    await expect(cell).toHaveCSS('padding-bottom', '10px');
    await expect(cell).toHaveCSS('padding-left', '10px');
    await expect(cell.locator('.ds-table__cell-content')).toHaveCSS('min-height', '0px');
  }
  await expect(singleText.locator('.ds-table__cell-track')).toHaveCSS('min-height', '0px');
  await expect(singleText.locator('.ds-table__cell-track')).toHaveCSS('padding-left', '2px');
  await expect(singleText.locator('.ds-table__cell-track')).toHaveCSS('padding-right', '2px');
  await expect(primarySecondary).toHaveClass(/ds-table__cell--text-multi/);
  await expect(primarySecondary).toHaveCSS('padding-top', '10px');
  await expect(primarySecondary).toHaveCSS('padding-right', '10px');
  await expect(primarySecondary).toHaveCSS('padding-bottom', '10px');
  await expect(primarySecondary).toHaveCSS('padding-left', '10px');
  await expect(primarySecondary.locator('.ds-table__cell-content')).toHaveCSS('min-height', '0px');
  await expect(primarySecondary.locator('.ds-table__cell-copy')).toHaveCSS('gap', '4px');
  for (const track of [
    primarySecondary.locator('.ds-table__cell-primary'),
    primarySecondary.locator('.ds-table__cell-secondary'),
  ]) {
    await expect(track).toHaveCSS('min-height', '0px');
    await expect(track).toHaveCSS('padding-left', '2px');
    await expect(track).toHaveCSS('padding-right', '2px');
  }
  await expect(primarySecondary.locator('.ds-table__cell-secondary')).toHaveCSS('padding-top', '2px');
  await expect(primarySecondary.locator('.ds-table__cell-secondary')).toHaveCSS('padding-bottom', '2px');
  await expect(primaryPair).toHaveClass(/ds-table__cell--primary-text/);
  await expect(primaryPair).toHaveCSS('padding-top', '10px');
  await expect(primaryPair).toHaveCSS('padding-right', '10px');
  await expect(primaryPair).toHaveCSS('padding-bottom', '10px');
  await expect(primaryPair).toHaveCSS('padding-left', '10px');
  await expect(primaryPair.locator('.ds-table__cell-copy')).toHaveCSS('gap', '4px');
  for (const track of [
    primaryPair.locator('.ds-table__cell-primary'),
    primaryPair.locator('.ds-table__cell-secondary'),
  ]) {
    await expect(track).toHaveJSProperty('variant', 'text-body-medium');
    await expect(track).toHaveJSProperty('color', 'primary');
    await expect(track).toHaveCSS('padding-left', '2px');
    await expect(track).toHaveCSS('padding-right', '2px');
    await expect(track).toHaveCSS('padding-top', '0px');
    await expect(track).toHaveCSS('padding-bottom', '0px');
  }
  await expect(image).toHaveClass(/ds-table__cell--image/);
  await expect(image).toHaveCSS('padding-top', '6px');
  await expect(image).toHaveCSS('padding-right', '6px');
  await expect(image).toHaveCSS('padding-bottom', '6px');
  await expect(image).toHaveCSS('padding-left', '6px');
  await expect(image).toHaveCSS('width', '105px');
  await expect(image).toHaveCSS('height', '64px');
  const imagePlaceholder = image.getByRole('img', { name: 'Safety event preview unavailable' });
  await expect(imagePlaceholder).toBeVisible();
  await expect(imagePlaceholder.locator('..')).toHaveCSS('height', '52px');
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
  await expect(icon).toHaveCSS('padding-top', '10px');
  await expect(icon).toHaveCSS('padding-right', '10px');
  await expect(icon).toHaveCSS('padding-bottom', '10px');
  await expect(icon).toHaveCSS('padding-left', '10px');
  await expect(icon.getByRole('img', { name: 'Has notes' })).toBeVisible();
  await expect(icon.locator('ds-icon')).toHaveJSProperty('name', 'DocumentInverted');
  await expect(icon.locator('ds-icon')).toHaveJSProperty('size', 'md');
  await expect(icon.locator('ds-icon')).toHaveJSProperty('color', 'secondary');
  await expect(icon.locator('ds-icon')).toHaveCSS('width', '20px');
  await expect(icon.locator('ds-icon')).toHaveCSS('height', '20px');
  for (const cell of [action, borderedAction]) {
    await expect(cell).toHaveCSS('width', '40px');
    await expect(cell).toHaveCSS('padding-top', '6px');
    await expect(cell).toHaveCSS('padding-right', '6px');
    await expect(cell).toHaveCSS('padding-bottom', '6px');
    await expect(cell).toHaveCSS('padding-left', '6px');
    await expect(cell.locator('.ds-table__cell-content')).toHaveCSS('min-height', '28px');
    await expect(cell.locator('ds-button-unfilled')).toHaveJSProperty('size', 'md');
    await expect(cell.locator('ds-button-unfilled')).toHaveJSProperty('isInset', true);
    await expect(cell.locator('ds-button-unfilled')).toHaveCSS('height', '28px');
  }
  for (const header of [actionHeader, borderedActionHeader]) {
    await expect(header).toHaveCSS('width', '40px');
    await expect(header.locator('.ds-table__header-label-box')).toHaveText('');
  }
  await expect(action.locator('ds-button-unfilled')).toHaveJSProperty('hasBorder', false);
  await expect(borderedAction.locator('ds-button-unfilled')).toHaveJSProperty('hasBorder', true);
  for (const cell of [action, borderedAction]) {
    await expect(cell.locator('ds-button-unfilled')).toHaveJSProperty('variant', 'icon');
    await expect(cell.locator('ds-button-unfilled')).toHaveJSProperty('icon', 'Ellipses');
  }
  await action.getByRole('button', { name: 'More actions' }).click();
  await expect.poll(() => page.evaluate(() => window.__tableCellActionEvents)).toEqual([
    { actionId: 'more', rowId: 'tag-variants', columnId: 'action' },
  ]);
  await expect(empty).toContainText('—');
  await expect(empty).toContainText('Not available');
  await expect(blank).toHaveText('');
  await expect(blank.locator('.ds-table__cell-content')).toBeEmpty();

  await expect(tagOnly).toHaveClass(/ds-table__cell--tag-tag-only/);
  await expect(tagOnly).toHaveCSS('padding-top', '6px');
  await expect(tagOnly).toHaveCSS('padding-right', '6px');
  await expect(tagOnly).toHaveCSS('padding-bottom', '6px');
  await expect(tagOnly).toHaveCSS('padding-left', '6px');
  await expect(tagOnly.locator('ds-tag')).toHaveJSProperty('size', 'md');
  await expect(tagOnly.locator('ds-tag')).toHaveJSProperty('isInset', true);
  await expect(tagOnly.locator('ds-tag')).toHaveCSS('height', '28px');

  await expect(tagWithText).toHaveClass(/ds-table__cell--tag-tag-with-text/);
  await expect(tagWithText).toHaveCSS('padding-top', '6px');
  await expect(tagWithText).toHaveCSS('padding-right', '6px');
  await expect(tagWithText).toHaveCSS('padding-bottom', '6px');
  await expect(tagWithText).toHaveCSS('padding-left', '6px');
  await expect(tagWithText.locator('ds-tag')).toHaveJSProperty('size', 'md');
  await expect(tagWithText.locator('ds-tag')).toHaveJSProperty('isInset', true);
  await expect(tagWithText.locator('ds-tag')).toHaveCSS('height', '28px');
  await expect(tagWithText.locator('.ds-table__cell-tag-text')).toHaveJSProperty('variant', 'text-body-small');
  await expect(tagWithText.locator('.ds-table__cell-tag-text')).toHaveJSProperty('color', 'secondary');
  await expect(tagWithText.locator('.ds-table__cell-tag-text')).toHaveCSS('padding-top', '2px');
  await expect(tagWithText.locator('.ds-table__cell-tag-text')).toHaveCSS('padding-bottom', '2px');
  await expect(tagWithText.locator('.ds-table__cell-tag-text')).toHaveCSS('min-height', '0px');

  await expect(textWithTag).toHaveClass(/ds-table__cell--tag-text-with-tag/);
  await expect(textWithTag).toHaveCSS('padding-top', '10px');
  await expect(textWithTag).toHaveCSS('padding-right', '10px');
  await expect(textWithTag).toHaveCSS('padding-bottom', '10px');
  await expect(textWithTag).toHaveCSS('padding-left', '10px');
  await expect(textWithTag.locator('.ds-table__cell-tag-stack')).toHaveCSS('gap', '4px');
  await expect(textWithTag.locator('.ds-table__cell-tag-text')).toHaveJSProperty('variant', 'text-body-medium');
  await expect(textWithTag.locator('.ds-table__cell-tag-text')).toHaveJSProperty('color', 'secondary');
  await expect(textWithTag.locator('.ds-table__cell-tag-text')).toHaveCSS('padding-left', '2px');
  await expect(textWithTag.locator('.ds-table__cell-tag-text')).toHaveCSS('padding-right', '2px');
  await expect(textWithTag.locator('.ds-table__cell-tag-text')).toHaveCSS('min-height', '0px');
  await expect(textWithTag.locator('ds-tag')).toHaveJSProperty('size', 'sm');
  await expect(textWithTag.locator('ds-tag')).toHaveJSProperty('isInset', true);
  await expect(textWithTag.locator('ds-tag')).toHaveCSS('height', '20px');
  await expect(textWithTag.locator('.ds-table__cell-tag-control-track')).toHaveCSS('height', '20px');

  const orderAndTracks = await table.locator('[data-row-id="tag-variants"]').evaluate(row => {
    const cellDetails = (variant: string) => {
      const cell = row.querySelector<HTMLElement>(`[data-cell-variant="${variant}"]`)!;
      const stack = cell.querySelector<HTMLElement>('.ds-table__cell-tag-stack');
      const children = stack
        ? Array.from(stack.children).map(child => child.tagName === 'DS-TAG' ? 'tag' : child.classList.contains('ds-table__cell-tag-text') ? 'text' : 'tag-track')
        : [];
      const bounds = (selector: string) => {
        const rect = cell.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom };
      };
      return { children, tag: bounds('ds-tag'), text: stack ? bounds('.ds-table__cell-tag-text') : null };
    };
    return {
      tagWithText: cellDetails('tag-with-text'),
      textWithTag: cellDetails('text-with-tag'),
    };
  });

  expect(orderAndTracks.tagWithText.children).toEqual(['tag', 'text']);
  expect(orderAndTracks.tagWithText.text!.top).toBeCloseTo(orderAndTracks.tagWithText.tag.bottom, 0);
  expect(orderAndTracks.textWithTag.children).toEqual(['text', 'tag-track']);
  expect(orderAndTracks.textWithTag.tag.top - orderAndTracks.textWithTag.text!.bottom).toBeCloseTo(4, 0);

  const crossCellAlignment = await table.locator('[data-row-id="tag-variants"]').evaluate(row => {
    const bounds = (selector: string) => {
      const rect = row.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, height: rect.height };
    };
    return {
      secondary: bounds('[data-column-id="primarySecondary"] .ds-table__cell-secondary'),
      singleText: bounds('[data-column-id="singleText"] .ds-table__cell-track'),
      tagText: bounds('[data-cell-variant="tag-with-text"] .ds-table__cell-tag-text'),
      textWithTagText: bounds('[data-cell-variant="text-with-tag"] .ds-table__cell-tag-text'),
      textWithTagTag: bounds('[data-cell-variant="text-with-tag"] ds-tag'),
      iconCell: bounds('[data-column-id="icon"]'),
      icon: bounds('[data-column-id="icon"] ds-icon'),
    };
  });
  expect(crossCellAlignment.tagText.top).toBeCloseTo(crossCellAlignment.secondary.top, 0);
  expect(crossCellAlignment.tagText.height).toBeCloseTo(crossCellAlignment.secondary.height, 0);
  expect(crossCellAlignment.textWithTagText.top).toBeCloseTo(crossCellAlignment.singleText.top, 0);
  expect(crossCellAlignment.textWithTagText.height).toBeCloseTo(crossCellAlignment.singleText.height, 0);
  expect(crossCellAlignment.textWithTagTag.top).toBeCloseTo(crossCellAlignment.secondary.top, 0);
  expect(crossCellAlignment.textWithTagTag.height).toBeCloseTo(crossCellAlignment.secondary.height, 0);
  const iconCenter = (crossCellAlignment.icon.left + crossCellAlignment.icon.right) / 2;
  const iconCellCenter = (crossCellAlignment.iconCell.left + crossCellAlignment.iconCell.right) / 2;
  expect(Math.abs(iconCenter - iconCellCenter)).toBeLessThanOrEqual(0.5);
});

test('positions sort controls according to column alignment', async ({ page }) => {
  const geometry = await page.locator('#grouped').evaluate(element => {
    const measure = (columnId: string) => {
      const cell = element.querySelector<HTMLElement>(`th[data-column-id="${columnId}"]`)!;
      const labels = cell.querySelector<HTMLElement>('.ds-table__header-labels')!;
      const slot = cell.querySelector<HTMLElement>(
        '.ds-table__sort-slot:not(.ds-table__sort-slot--balance)',
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
        contentInsetStart: Number.parseFloat(cellStyle.paddingLeft) + Number.parseFloat(cellStyle.borderLeftWidth),
        contentInsetEnd: Number.parseFloat(cellStyle.paddingRight) + Number.parseFloat(cellStyle.borderRightWidth),
        labelsLeft: labelsRect.left,
        labelsRight: labelsRect.right,
        slotLeft: slotRect.left,
        slotRight: slotRect.right,
        contentCenter: contentRect.left + contentRect.width / 2,
        labelCenter: labelsRect.left + labelsRect.width / 2,
        balanceLeft: balanceRect?.left,
        balanceRight: balanceRect?.right,
        order: Array.from(content.children).map(child =>
          child.classList.contains('ds-table__sort-slot--balance')
            ? 'balance'
            : child.classList.contains('ds-table__sort-slot')
              ? 'sort'
              : 'label'),
      };
    };
    return { center: measure('status'), end: measure('score') };
  });

  expect(geometry.center.order).toEqual(['balance', 'label', 'sort']);
  expect(geometry.center.labelsLeft - geometry.center.balanceRight!).toBeCloseTo(4, 0);
  expect(geometry.center.slotLeft - geometry.center.labelsRight).toBeCloseTo(4, 0);
  expect(geometry.center.labelCenter).toBeCloseTo(geometry.center.contentCenter, 0);
  expect(geometry.center.slotRight - geometry.center.slotLeft).toBeCloseTo(16, 0);
  expect(geometry.center.balanceRight! - geometry.center.balanceLeft!).toBeCloseTo(16, 0);

  expect(geometry.end.order).toEqual(['sort', 'label']);
  expect(geometry.end.slotLeft - geometry.end.cellLeft).toBeCloseTo(geometry.end.contentInsetStart, 0);
  expect(geometry.end.cellRight - geometry.end.labelsRight).toBeCloseTo(geometry.end.contentInsetEnd, 0);
  expect(geometry.end.labelsLeft).toBeGreaterThan(geometry.end.slotRight);
});

test('selects loaded rows while preserving off-window IDs', async ({ page }) => {
  const table = page.locator('#selectable');
  const selectAll = table.getByRole('checkbox', { name: 'Select all loaded rows' });
  await expect(selectAll).toHaveAttribute('aria-checked', 'mixed');

  const selectedVisuals = await table.locator('.ds-table__row[data-row-id="jordan"]').evaluate(row => {
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

test('activates interactive rows without stealing nested control intent', async ({ page }) => {
  const table = page.locator('#interactive');
  const row = table.locator('[data-row-id="avery"]');
  await expect(row).toHaveAttribute('tabindex', '0');
  await row.hover();

  const hover = await row.locator('.ds-table__cell').first().evaluate(cell => {
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
  await expect.poll(() => page.evaluate(() => window.__tableRowActivationEvents)).toEqual(['avery']);

  await row.getByRole('button', { name: 'More actions for Avery Chen' }).click();
  await expect.poll(() => page.evaluate(() => window.__tableRowActivationEvents)).toEqual(['avery']);
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

test('observes automatic lazy loading from the document viewport', async ({ page }) => {
  await page.waitForTimeout(100);
  await expect
    .poll(() => page.evaluate(() => window.__tableLoadEvents.filter(event => event.id === 'lazy-auto')))
    .toEqual([]);

  await page.locator('#lazy-auto .ds-table__load-row').scrollIntoViewIfNeeded();
  await expect
    .poll(() => page.evaluate(() => window.__tableLoadEvents.filter(event => event.id === 'lazy-auto')))
    .toEqual([
      {
        id: 'lazy-auto',
        detail: { reason: 'auto', loadIdentity: 'default', loadedRowCount: 2 },
      },
    ]);
});

test('uses fixed cell tracks and focusable sticky overflow geometry',
  chromiumOnly('layout-geometry', 'Cell tracks and sticky overflow are rendered geometry contracts.'),
  async ({ page }) => {
    const standard = page.locator('#standard');
    await expect(standard.locator('.ds-table')).toHaveCSS('user-select', 'none');
    const firstHeader = standard.locator('.ds-table__header-cell').first();
    await expect(firstHeader).toHaveCSS('height', '32px');
    await expect(firstHeader.locator('.ds-table__header-label')).toHaveCSS('height', '16px');
    await expect(firstHeader.locator('.ds-table__header-label')).toHaveCSS('padding-left', '2px');
    await expect(firstHeader.locator('.ds-table__header-label')).toHaveCSS('padding-right', '2px');
    await expect(firstHeader.locator('.ds-table__header-label-box')).toHaveCSS('padding-left', '2px');
    await expect(firstHeader.locator('.ds-table__header-label-box')).toHaveCSS('padding-right', '2px');
    await expect(firstHeader.locator('.ds-table__sort-slot')).toHaveCSS('width', '16px');
    await expect(firstHeader.locator('.ds-table__sort-slot')).toHaveCSS('height', '16px');
    await expect(firstHeader.locator('.ds-table__header-label--interactive')).not.toHaveClass(/ds-interaction-fill/);
    await expect(
      standard.locator('.ds-table__row[data-row-id="jordan"] .ds-table__cell').first(),
    ).toHaveCSS('height', '40px');
    await expect(standard.locator('.ds-table__overflow-shadow')).toHaveCount(0);

    const inactiveLabel = firstHeader.locator('ds-text');
    await expect(inactiveLabel).toHaveJSProperty('variant', 'text-caption');
    await expect(inactiveLabel).toHaveJSProperty('color', 'inherit');
    await expect(inactiveLabel).toHaveJSProperty('emphasis', false);

    const dividerColors = await standard.locator('.ds-table__cell').nth(1).evaluate(element => {
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
        '#standard .ds-table__header-cell + .ds-table__header-cell',
      )!;
      const headerDividerStyle = getComputedStyle(
        headerCell,
        '::after',
      );
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
    expect(dividerColors.horizontalDivider).toContain(dividerColors.secondary);
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
    await viewport.evaluate(element => { element.scrollLeft = 120; });
    await expect(overflow.locator('.ds-table__frame')).toHaveClass(/ds-table__frame--overflow-start/);
  });

test('keeps a document-flow header and edge columns sticky while vertical input scrolls the page', async ({ page }) => {
  const table = page.locator('#document-sticky');
  const frame = table.locator('.ds-table__frame');
  const viewport = table.locator('.ds-table__viewport');
  const stickyHeader = table.locator('.ds-table__document-sticky-header');
  await table.scrollIntoViewIfNeeded();
  await page.evaluate(element => {
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top + 80);
  }, await frame.elementHandle());

  await expect(stickyHeader).toHaveCSS('position', 'sticky');
  await expect.poll(() => stickyHeader.evaluate(element => element.getBoundingClientRect().top)).toBeCloseTo(48, 0);
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
    probe.style.background = 'var(--color-border-secondary)';
    document.body.append(probe);
    const divider = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return { edge: getComputedStyle(element).backgroundColor, divider };
  });
  expect(stickyEdgeColors.edge).toBe(stickyEdgeColors.divider);
  expect(await firstStartEdge.evaluate(element => getComputedStyle(element, '::after').boxShadow))
    .toBe('none');
  expect(await firstEndEdge.evaluate(element => getComputedStyle(element, '::after').boxShadow))
    .not.toBe('none');

  await expect(viewport).toHaveCSS('overscroll-behavior-x', 'none');
  await viewport.evaluate(element => { element.scrollLeft = 240; });
  await expect(frame).toHaveClass(/ds-table__frame--overflow-start/);
  await expect(frame).toHaveClass(/ds-table__frame--overflow-end/);

  const expectHeaderAligned = async () => {
    await expect.poll(() => table.evaluate(element => {
      const sticky = element.querySelector<HTMLElement>(
        '.ds-table__document-sticky-header [data-column-id="name"]',
      )!.getBoundingClientRect();
      const semantic = element.querySelector<HTMLElement>(
        '.ds-table__viewport .ds-table__head [data-column-id="name"]',
      )!.getBoundingClientRect();
      return Math.abs(sticky.left - semantic.left) + Math.abs(sticky.right - semantic.right);
    })).toBeLessThan(0.1);
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
      '.ds-table__document-sticky-header .ds-table__selection-cell',
    )!;
    const bodySelection = element.querySelector<HTMLElement>(
      '.ds-table__body .ds-table__selection-cell',
    )!;
    const headerStartEdge = headerSelection.querySelector<HTMLElement>(
      '.ds-table__sticky-edge--start',
    )!;
    const bodyStartEdge = bodySelection.querySelector<HTMLElement>(
      '.ds-table__sticky-edge--start',
    )!;
    const headerEndEdge = element.querySelector<HTMLElement>(
      '.ds-table__document-sticky-header .ds-table__sticky-edge--end',
    )!;
    const bodyEndEdge = element.querySelector<HTMLElement>(
      '.ds-table__body .ds-table__sticky-edge--end',
    )!;
    const firstScrollingHeader = element.querySelector<HTMLElement>(
      '.ds-table__document-sticky-header [data-column-id="name"]',
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
  expect(stickyBoundaryGeometry.headerStartRight)
    .toBeCloseTo(stickyBoundaryGeometry.bodyStartRight, 1);
  expect(stickyBoundaryGeometry.headerEndLeft)
    .toBeCloseTo(stickyBoundaryGeometry.bodyEndLeft, 1);
  expect(stickyBoundaryGeometry.headerEdgeBottomGap).toBe(1);
  expect(stickyBoundaryGeometry.bodyEdgeBottomGap).toBe(1);
  expect(stickyBoundaryGeometry.obsoleteScrollingDivider).toBe('none');

  const terminalColumnDivider = await table
    .locator('.ds-table__body:last-child .ds-table__row:last-child .ds-table__cell')
    .nth(2)
    .evaluate(element => getComputedStyle(element, '::after').boxShadow);
  expect(terminalColumnDivider).toContain(stickyEdgeColors.divider);

  const lanes = await table.locator('[data-row-id="document-row-2"]').evaluate(row => {
    const viewport = row.closest('.ds-table__viewport')!.getBoundingClientRect();
    const selection = row.querySelector<HTMLElement>('.ds-table__selection-cell')!.getBoundingClientRect();
    const action = row.querySelector<HTMLElement>('[data-column-id="actions"]')!.getBoundingClientRect();
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

  const before = await page.evaluate(() => window.scrollY);
  await viewport.hover({ position: { x: 200, y: 200 } });
  await page.mouse.wheel(0, 160);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
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
    .include('#document-sticky')
    .analyze();
  expect(results.violations).toEqual([]);
});
