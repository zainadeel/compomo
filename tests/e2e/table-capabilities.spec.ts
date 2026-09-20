import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('shared editors preserve cell geometry, draft boundaries, popup anchoring and keyboard ownership @cross-browser', async ({
  page,
}) => {
  await page.goto('/table-capabilities.html?mode=fields');
  const table = page.locator('#review');
  const cell = (id: string) => table.locator(`[data-row-id="edit-0"] [data-column-id="${id}"]`);
  const name = cell('name');
  const restingChevron = cell('status').locator('.ds-table__select-indicator');
  await expect(restingChevron).toBeVisible();
  await expect(restingChevron).toHaveJSProperty('name', 'ChevronDown');
  const chevronBox = (await restingChevron.boundingBox())!;
  const before = await name.boundingBox();
  const textColor = await name
    .locator('.ds-table__cell-primary')
    .evaluate(el => getComputedStyle(el).color);
  const origin = await name.locator('.ds-table__cell-primary').evaluate(el => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return range.getBoundingClientRect().x;
  });
  await name.click();
  const input = name.locator('ds-input input');
  await expect(input).toBeFocused();
  await expect(input).toHaveCSS('color', textColor);
  for (const pseudo of ['::before', '::after'])
    expect(
      await name.evaluate((el, pseudo) => getComputedStyle(el, pseudo).backgroundColor, pseudo)
    ).toBe('rgba(0, 0, 0, 0)');
  // Compare against a token probe: Chromium snaps physical strokes at DPR 1.
  const outline = await name.evaluate(el => {
    const probe = document.createElement('span');
    probe.style.outline = 'var(--dimension-stroke-width-018) solid var(--color-border-bold-brand)';
    probe.style.outlineOffset = 'calc(-1 * var(--dimension-stroke-width-018))';
    el.append(probe);
    const expected = getComputedStyle(probe);
    const result = {
      width: expected.outlineWidth,
      offset: expected.outlineOffset,
      color: expected.outlineColor,
    };
    probe.remove();
    return result;
  });
  expect(
    await name.evaluate(el => {
      const style = getComputedStyle(el, '::after');
      return { width: style.outlineWidth, offset: style.outlineOffset, color: style.outlineColor };
    })
  ).toEqual(outline);
  const editingOrigin = await input.evaluate(
    el => el.getBoundingClientRect().x + parseFloat(getComputedStyle(el).paddingLeft)
  );
  expect(Math.abs(editingOrigin - origin)).toBeLessThanOrEqual(1);
  expect((await name.boundingBox())!.height).toBe(before!.height);
  await input.fill('Draft only');
  expect(await table.evaluate((el: HTMLDsTableElement) => el.rows[0].cells.name)).toBe('Driver 1');
  await input.press('Escape');
  await expect(name).toContainText('Driver 1');
  await cell('limit').click();
  const numeric = cell('limit').getByRole('spinbutton');
  await expect(numeric).toBeFocused();
  await cell('limit').getByRole('button', { name: 'Increase value' }).click();
  await expect(numeric).toHaveValue('55');
  await numeric.press('Enter');
  await expect(cell('limit')).toContainText('55');
  await cell('status').click();
  const trigger = cell('status').getByRole('combobox');
  await expect(trigger).toBeFocused();
  await expect(cell('status').locator('ds-icon')).toHaveCount(1);
  const editingChevronBox = (await trigger.locator('.trigger__chevron ds-icon').boundingBox())!;
  expect(Math.abs(editingChevronBox.x - chevronBox.x)).toBeLessThanOrEqual(1);
  expect(editingChevronBox.width).toBe(chevronBox.width);
  await expect(trigger).not.toHaveClass(/ds-interaction-fill|ds-focus-ring/);
  await trigger.press('ArrowDown');
  const popup = cell('status').getByRole('listbox');
  await expect(popup).toBeVisible();
  const bounds = (await cell('status').boundingBox())!;
  await expect
    .poll(async () => Math.abs((await popup.boundingBox())!.x - bounds.x))
    .toBeLessThanOrEqual(1);
  expect((await popup.boundingBox())!.y).toBeGreaterThanOrEqual(bounds.y + bounds.height);
  await trigger.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(cell('status')).toHaveAttribute('data-cell-editing', 'true');
  await trigger.press('ArrowDown');
  await popup.getByRole('option', { name: 'In transit', exact: true }).click();
  await expect(cell('status')).toContainText('In transit');
  await expect(cell('status')).toBeFocused();
  await expect(restingChevron).toBeVisible();
  for (const id of ['date', 'time']) {
    await cell(id).click();
    await cell(id)
      .getByRole('button', { name: id === 'date' ? 'Choose date' : 'Choose time' })
      .click();
    const dialog = cell(id).getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(cell(id)).toHaveAttribute('data-cell-editing', 'true');
    await page.keyboard.press('Escape');
    await expect(cell(id)).toBeFocused();
  }
  for (const [id, text, expected] of [
    ['date', '2026-09-21', '2026-09-21'],
    ['time', '2:30 PM', '14:30'],
  ]) {
    await cell(id).click();
    const field = cell(id).locator('input');
    await expect(field).toBeFocused();
    await field.fill(text);
    await field.press('Enter');
    await expect(cell(id)).toContainText(expected);
  }
  await cell('note').click();
  const multiline = cell('note').locator('textarea');
  await multiline.fill('First line');
  await multiline.press('End');
  await multiline.press('Enter');
  await multiline.press('a');
  await expect(multiline).toHaveValue('First line\na');
  await multiline.press('Control+Enter');
  await expect(cell('note')).toContainText('First line');
  await expect(table.locator('.ds-table__cell-editor')).toHaveCount(0);
  await table.evaluate((el: HTMLDsTableElement) => {
    el.interactionMode = 'edit';
  });
  await expect(table.locator('.ds-table__select-indicator')).toHaveCount(0);
});

test('cards have inset field dividers, one interaction surface, and edge-to-edge chrome @cross-browser', async ({
  page,
}) => {
  await page.goto('/table-capabilities.html');
  const table = page.locator('#review');
  await expect(table.locator('[data-row-id="review-0"]')).toBeVisible();
  await table.evaluate((el: HTMLDsTableElement) => {
    el.rows = el.rows.slice(0, 3);
    el.dataMode = 'infinite';
    el.style.width = '768px';
    el.displayedCount = 3;
    el.totalCount = 3;
  });
  await expect(table.locator('.ds-table__frame')).toHaveAttribute('data-narrow', 'false');
  await table.evaluate((el: HTMLElement) => {
    el.style.width = '767px';
  });
  await expect(table.locator('.ds-table__frame')).toHaveAttribute('data-narrow', 'true');
  const row = table.locator('[data-row-id="review-0"]');
  const nextRow = table.locator('[data-row-id="review-1"]');
  const viewport = table.locator('.ds-table__viewport');
  const first = (await row.boundingBox())!;
  const next = (await nextRow.boundingBox())!;
  const view = (await viewport.boundingBox())!;
  expect(first.x - view.x).toBe(16);
  expect(first.y - view.y).toBe(16);
  expect(view.width - first.width).toBe(32);
  expect(next.y - first.y - first.height).toBe(16);
  await expect(row).toHaveCSS('border-width', '1px');
  await expect(row).toHaveCSS('border-radius', '4px');
  const dividers = row.locator('.ds-table__card-field-divider');
  await expect(dividers).toHaveCount(4);
  const label = row.locator('[data-column-id="driver"] .ds-table__card-label');
  await expect(label).toHaveCSS('margin-bottom', '8px');
  const labelBounds = (await label.boundingBox())!;
  const dividerBounds = (await dividers.first().boundingBox())!;
  expect(dividerBounds.x).toBe(labelBounds.x + 4);
  expect(dividerBounds.width).toBeLessThan(first.width - 24);
  const checkbox = row.locator('[role="checkbox"]');
  const action = row.getByRole('button', { name: 'Actions for Driver 1', exact: true });
  const checkBounds = (await checkbox.boundingBox())!;
  const actionBounds = (await action.boundingBox())!;
  expect(Math.abs(checkBounds.y - actionBounds.y)).toBeLessThan(1);
  expect(actionBounds.x).toBeGreaterThan(checkBounds.x + checkBounds.width);
  await expect(row.locator('.ds-table__card-action-divider')).toBeVisible();
  await action.click();
  await expect(table.getByRole('menuitem', { name: 'Review event' })).toBeVisible();
  await page.keyboard.press('Escape');
  for (const bar of ['.ds-table__caption-bar', '.ds-table__footer']) {
    const bounds = (await table.locator(bar).boundingBox())!;
    expect(bounds.x).toBe(view.x);
    expect(bounds.width).toBe(view.width);
  }
  const cells = row.locator('.ds-table__cell:not([data-elastic-spacer])');
  expect(
    await cells.evaluateAll(els =>
      els.every(el => {
        const style = getComputedStyle(el);
        return style.borderWidth === '0px' && getComputedStyle(el, '::after').display === 'none';
      })
    )
  ).toBe(true);
  await row.locator('[role="checkbox"]').hover();
  expect(await row.evaluate(el => getComputedStyle(el, '::after').backgroundColor)).not.toBe(
    'rgba(0, 0, 0, 0)'
  );
  await row.locator('[role="checkbox"]').click();
  await expect(row.locator('[role="checkbox"]')).toHaveAttribute('aria-checked', 'true');
});

test('worksheet feedback is cell-local and read-only cells keep borders but cannot select @cross-browser', async ({
  page,
}) => {
  await page.goto('/table-capabilities.html?mode=edit');
  const table = page.locator('#review');
  const cell = (row: number, column: string) =>
    table.locator(`[data-row-id="edit-${row}"] [data-column-id="${column}"]`);
  const first = cell(0, 'name');
  await first.hover();
  const fill = (locator: typeof first) =>
    locator.evaluate(el => getComputedStyle(el, '::after').backgroundColor);
  expect(await fill(first)).not.toBe('rgba(0, 0, 0, 0)');
  expect(await fill(cell(0, 'limit'))).toBe('rgba(0, 0, 0, 0)');
  const hover = await fill(first);
  await page.mouse.down();
  expect(await fill(first)).not.toBe(hover);
  await page.mouse.up();
  await expect(first).toHaveAttribute('aria-selected', 'true');
  expect(await first.evaluate(el => getComputedStyle(el, '::before').backgroundColor)).toBe(
    'rgba(0, 0, 0, 0)'
  );
  for (const readonly of [cell(3, 'name'), cell(0, 'recordId')]) {
    await readonly.click({ force: true });
    expect(await fill(readonly)).toBe('rgba(0, 0, 0, 0)');
    await expect(readonly).toHaveAttribute('aria-selected', 'false');
    await expect(readonly).not.toHaveAttribute('tabindex');
    await expect(readonly).toHaveCSS('opacity', '1');
    await expect(readonly.locator('.ds-table__cell-content')).toHaveCSS('opacity', '0.5');
    await expect(first).toHaveAttribute('aria-selected', 'true');
  }
  await expect(table.locator('[data-row-id="edit-3"]')).toHaveCSS('opacity', '1');
  const border = (locator: typeof first) =>
    locator.locator('.ds-table__sticky-edge').evaluate(el => getComputedStyle(el).backgroundColor);
  expect(await border(cell(3, 'name'))).toBe(await border(first));
  await cell(2, 'name').click();
  await table.locator('.ds-table__cell-editor input').press('Escape');
  await expect(cell(2, 'name')).toBeFocused();
  await page.keyboard.press('Shift+ArrowDown');
  await expect(cell(4, 'name')).toBeFocused();
  await expect(cell(3, 'name')).toHaveAttribute('aria-selected', 'false');
  await expect(table.locator('[aria-selected="true"]')).toHaveCount(2);
  await cell(5, 'name').click({ modifiers: ['Shift'] });
  await expect(table.locator('.ds-table__cell-editor')).toHaveCount(0);
  await expect(cell(5, 'name')).toHaveAttribute('aria-selected', 'true');
  await expect(cell(2, 'name').locator('.ds-table__cell-primary')).toHaveCSS(
    'color',
    await cell(1, 'name')
      .locator('.ds-table__cell-primary')
      .evaluate(el => getComputedStyle(el).color)
  );
  for (const selected of [cell(2, 'name'), cell(4, 'name'), cell(5, 'name')]) {
    expect(await selected.evaluate(el => getComputedStyle(el, '::before').backgroundColor)).toBe(
      'rgba(0, 0, 0, 0)'
    );
    expect(await fill(selected)).toBe('rgba(0, 0, 0, 0)');
    expect(await selected.evaluate(el => getComputedStyle(el, '::after').outlineStyle)).toBe(
      'solid'
    );
  }
});

test('pencil editing keeps table semantics and supports keyboard focus, commit and cancel @cross-browser', async ({
  page,
}) => {
  await page.goto('/table-capabilities.html?mode=edit');
  const table = page.locator('#review');
  await table.evaluate((el: HTMLDsTableElement) => {
    el.interactionMode = 'edit';
  });
  await expect(table.locator('table')).toHaveAttribute('role', 'table');
  await expect(table.locator('[role="gridcell"]')).toHaveCount(0);
  const first = table.locator('[data-row-id="edit-0"] [data-column-id="name"]');
  const pencil = first.getByRole('button', { name: 'Edit Driver for edit-0', exact: true });
  await page.mouse.move(0, 0);
  await expect(first.locator('.ds-table__edit-trigger')).toHaveCSS('opacity', '0');
  await first.click();
  await expect(table.locator('.ds-table__cell-editor')).toHaveCount(0);
  await expect(first.locator('.ds-table__edit-trigger')).toHaveCSS('opacity', '1');
  await pencil.click();
  const editor = table.locator('.ds-table__cell-editor input');
  await expect(editor).toBeFocused();
  await editor.fill('Pencil update');
  await editor.press('Enter');
  await expect(first).toContainText('Pencil update');
  await expect(pencil).toBeFocused();
  await pencil.press('Enter');
  await editor.fill('Cancelled');
  await editor.press('Escape');
  await expect(first).toContainText('Pencil update');
  await expect(pencil).toBeFocused();
  await expect(table.locator('[data-row-id="edit-3"] .ds-table__edit-trigger')).toHaveCount(0);
  await expect(table.locator('[data-column-id="recordId"] .ds-table__edit-trigger')).toHaveCount(0);
  const lastBeforeDisabled = table.locator('[data-row-id="edit-2"] [data-column-id="note"]');
  await lastBeforeDisabled.hover();
  await lastBeforeDisabled.getByRole('button').click();
  await editor.press('Tab');
  await expect(
    table.locator('[data-row-id="edit-4"] [data-column-id="name"] button')
  ).toBeFocused();
  await expect(table.locator('[aria-selected="true"]')).toHaveCount(0);
});

for (const layout of ['virtual', 'native', 'document'] as const) {
  test(`${layout} superheaders share normal header geometry and retain every pin divider @cross-browser`, async ({
    page,
  }) => {
    await page.goto('/table-capabilities.html');
    const table = page.locator('#review');
    await expect(table.locator('[data-row-id="review-0"]')).toBeVisible();
    await table.evaluate((el: HTMLDsTableElement) => {
      el.style.width = '760px';
      el.responsiveLayout = 'scroll';
    });
    if (layout !== 'virtual')
      await table.evaluate((el: HTMLDsTableElement, documentFlow) => {
        el.rows = el.rows.slice(0, 8);
        el.dataMode = 'pagination';
        if (documentFlow) {
          el.height = undefined;
          el.responsiveLayout = 'scroll';
        }
      }, layout === 'document');
    const head = table.locator('.ds-table__head:not(.ds-table__head--semantic-copy)');
    const selection = head.locator('.ds-table__selection-cell');
    await expect(selection).toHaveCount(1);
    await expect(selection).toHaveAttribute('rowspan', '2');
    const band = head.locator('.ds-table__super-header-cell').filter({ hasText: 'Identity' });
    const driver = head.locator('[data-column-id="driver"]');
    const location = head.locator('[data-column-id="location"]');
    await expect(location).toHaveAttribute('rowspan', '2');
    await expect.poll(async () => (await band.boundingBox())!.height).toBe(32);
    expect((await driver.boundingBox())!.height).toBe(32);
    expect((await selection.boundingBox())!.height).toBe(64);
    const labelTop = async (locator: typeof driver) =>
      (await locator.locator('.ds-table__header-label-box').boundingBox())!.y;
    expect(Math.abs((await labelTop(location)) - (await labelTop(driver)))).toBeLessThan(1);
    const borderColor = (locator: typeof band) =>
      locator.evaluate(el => getComputedStyle(el, '::after').backgroundColor);
    expect(await borderColor(band)).not.toBe(await borderColor(driver));
    // A leaf header beside a row-spanned lane must not repaint its pinned edge.
    const status = head.locator('[data-column-id="status"]');
    await expect(status).toHaveClass(/after-rowspan/);
    expect(await status.evaluate(el => getComputedStyle(el, '::before').boxShadow)).toBe('none');
    await expect(status.locator('.ds-table__sticky-edge')).toHaveCSS('width', '1px');
    for (const parent of [
      selection,
      driver,
      table.locator('[data-row-id="review-0"] .ds-table__selection-cell'),
      table.locator('[data-row-id="review-0"] [data-column-id="driver"]'),
    ]) {
      await expect(parent.locator('.ds-table__sticky-edge')).toBeVisible();
      await expect(parent.locator('.ds-table__sticky-edge')).toHaveCSS('width', '1px');
      await expect(parent.locator('.ds-table__sticky-edge')).toHaveClass(/internal/);
    }
    for (const scrollLeft of [0, 80, 300]) {
      await table.locator('.ds-table__viewport').evaluate((el, x) => {
        el.scrollLeft = x;
      }, scrollLeft);
      if (scrollLeft)
        await expect
          .poll(() => table.locator('.ds-table__viewport').evaluate(el => el.scrollLeft))
          .toBeGreaterThan(0);
      const bandBox = (await band.boundingBox())!;
      const driverBox = (await driver.boundingBox())!;
      const vehicleBox = (await head.locator('[data-column-id="vehicle"]').boundingBox())!;
      expect(Math.abs(bandBox.x - driverBox.x)).toBeLessThan(1);
      expect(Math.abs(bandBox.x + bandBox.width - vehicleBox.x - vehicleBox.width)).toBeLessThan(1);
    }
    const icon = table.locator('[data-row-id="review-0"] .ds-table__cell-flag ds-icon');
    await expect(icon).toHaveJSProperty('color', 'secondary');
    const highlight = table.locator('[data-row-id="review-0"] [data-column-id="event"]');
    await expect(highlight).toHaveAttribute('data-cell-highlight', 'negative');
    const accent = highlight.locator('.ds-table__cell-highlight');
    await expect(highlight).toHaveCSS('outline-style', 'none');
    await expect(accent).toHaveCSS('outline-width', '4px');
    await expect(accent).toHaveCSS('outline-offset', '-4px');
    expect(await accent.evaluate(el => getComputedStyle(el).clipPath)).toContain('4px');
    expect(
      await accent.evaluate(el => {
        const expected = document.createElement('span');
        expected.style.color = 'var(--color-border-bold-negative)';
        el.append(expected);
        const matches = getComputedStyle(el).outlineColor === getComputedStyle(expected).color;
        expected.remove();
        return matches;
      })
    ).toBe(true);
    expect((await icon.boundingBox())!.width).toBe(20);
    expect((await icon.boundingBox())!.height).toBe(20);
    const primary = table.locator(
      '[data-row-id="review-0"] [data-column-id="location"] .ds-table__cell-primary'
    );
    const iconBox = (await icon.boundingBox())!;
    const primaryBox = (await primary.boundingBox())!;
    expect(
      Math.abs(iconBox.y + iconBox.height / 2 - primaryBox.y - primaryBox.height / 2)
    ).toBeLessThan(1);
  });
}

test('native cards expose a clickable corner checkbox without header UI @cross-browser', async ({
  page,
}) => {
  await page.goto('/table-capabilities.html');
  const table = page.locator('#review');
  await expect(table.locator('[data-row-id="review-0"]')).toBeVisible();
  await table.evaluate((el: HTMLDsTableElement) => {
    el.rows = el.rows.slice(0, 3);
    el.dataMode = 'pagination';
    el.height = undefined;
    el.style.width = '400px';
  });
  const checkbox = table.locator('[data-row-id="review-0"] [role="checkbox"]');
  await checkbox.click();
  await expect(checkbox).toHaveAttribute('aria-checked', 'true');
  await expect(table.locator('thead button')).toHaveCount(0);
  const row = table.locator('[data-row-id="review-0"]');
  const rowBox = (await row.boundingBox())!;
  const lastField = (await row.locator('[data-column-id="action"]').boundingBox())!;
  expect(lastField.y + lastField.height).toBeLessThanOrEqual(rowBox.y + rowBox.height);
  expect(
    (await new AxeBuilder({ page }).include('#review').analyze()).violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    )
  ).toEqual([]);
});

test('combined features keep bounded DOM, aligned tracks and cumulative pins @cross-browser', async ({
  page,
}) => {
  await page.goto('/table-capabilities.html');
  const table = page.locator('#review');
  await expect(table.locator('[data-row-id="review-0"]')).toBeVisible();
  await expect(table.locator('table')).toHaveAttribute('aria-rowcount', '10002');
  await expect(table.locator('[data-row-id]').first()).toHaveAttribute('aria-rowindex', '3');
  await expect.poll(() => table.locator('[data-row-id]').count()).toBeLessThan(50);
  await expect(
    table.locator('.ds-table__super-header-cell').filter({ hasText: 'Identity' })
  ).toHaveAttribute('colspan', '2');
  await table.locator('.ds-table__viewport').evaluate(el => {
    el.scrollLeft = 300;
  });
  const selection = await table
    .locator('[data-row-id="review-0"] .ds-table__selection-cell')
    .boundingBox();
  const driver = await table
    .locator('[data-row-id="review-0"] [data-column-id="driver"]')
    .boundingBox();
  const vehicle = await table
    .locator('[data-row-id="review-0"] [data-column-id="vehicle"]')
    .boundingBox();
  expect(Math.abs(driver!.x - selection!.x - selection!.width)).toBeLessThan(1);
  expect(Math.abs(vehicle!.x - driver!.x - driver!.width)).toBeLessThan(1);
  const tracks = await table
    .locator('[data-row-id="review-0"] .ds-table__cell-primary')
    .evaluateAll(els => els.map(el => el.getBoundingClientRect().top));
  expect(Math.max(...tracks) - Math.min(...tracks)).toBeLessThan(1);
  await table.locator('.ds-table__viewport').evaluate(el => {
    el.scrollTop = el.scrollHeight;
  });
  await expect(table.locator('[data-row-id="review-9999"]')).toBeVisible();
  await expect.poll(() => table.locator('[data-row-id]').count()).toBeLessThan(50);
  await expect(table.locator('[data-row-id="review-9999"]')).toHaveAttribute(
    'aria-rowindex',
    '10002'
  );
  await table.evaluate((el: HTMLDsTableElement) => {
    el.hiddenFieldIds = ['vehicle'];
  });
  await expect(
    table.locator('.ds-table__super-header-cell').filter({ hasText: 'Identity' })
  ).toHaveAttribute('colspan', '1');
});

test('responsive cards preserve controls, selection, focus and bounded recycling @cross-browser', async ({
  page,
}) => {
  await page.goto('/table-capabilities.html');
  const table = page.locator('#review');
  const checkbox = table.locator('[data-row-id="review-0"] button[role="checkbox"]');
  await checkbox.click();
  await checkbox.focus();
  await page.setViewportSize({ width: 390, height: 800 });
  await expect(checkbox).toBeFocused();
  await expect(checkbox).toHaveAttribute('aria-checked', 'true');
  await expect(table.locator('thead button')).toHaveCount(0);
  await expect(table.locator('thead')).toHaveCSS('clip-path', 'inset(50%)');
  const rowBox = (await table.locator('[data-row-id="review-0"]').boundingBox())!;
  const checkboxBox = (await checkbox.boundingBox())!;
  expect(checkboxBox.x).toBeGreaterThan(rowBox.x + rowBox.width - 88);
  expect(checkboxBox.y - rowBox.y).toBeLessThan(20);
  await checkbox.click();
  await expect(checkbox).toHaveAttribute('aria-checked', 'false');
  await checkbox.click();
  await expect(checkbox).toHaveAttribute('aria-checked', 'true');
  await expect(
    table.locator('[data-row-id="review-0"] .ds-table__card-label').first()
  ).toBeVisible();
  await expect.poll(() => table.locator('[data-row-id]').count()).toBeLessThan(50);
  expect(
    await table.locator('.ds-table__viewport').evaluate(el => el.scrollWidth - el.clientWidth)
  ).toBeLessThan(2);
  // Safari does not focus buttons on pointer activation; establish keyboard
  // focus explicitly before checking that resizing preserves it.
  await checkbox.focus();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(checkbox).toBeFocused();
  await expect(
    table.locator('[data-row-id="review-0"] .ds-table__card-label').first()
  ).toBeHidden();
});

test('narrow cards keep the last virtual record reachable and resize back to table tracks @cross-browser', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/table-capabilities.html');
  const table = page.locator('#review');
  const viewport = table.locator('.ds-table__viewport');
  await expect(table.locator('.ds-table__frame')).toHaveAttribute('data-narrow', 'true');
  await expect(
    table.locator('[data-row-id="review-0"] .ds-table__elastic-spacer-cell')
  ).toBeHidden();
  await expect(
    table.locator('[data-row-id="review-0"] .ds-table__card-label').first()
  ).toBeVisible();
  await viewport.evaluate(el => {
    el.scrollTop = el.scrollHeight;
  });
  await expect(table.locator('[data-row-id="review-9999"]')).toBeVisible();
  await expect.poll(() => table.locator('[data-row-id]').count()).toBeLessThan(50);
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(table.locator('.ds-table__frame')).toHaveAttribute('data-narrow', 'false');
  await viewport.evaluate(el => {
    el.scrollTop = 0;
  });
  await expect(table.locator('[data-row-id="review-0"]')).toBeVisible();
  await expect(
    table.locator('[data-row-id="review-0"] .ds-table__card-label').first()
  ).toBeHidden();
});

test('crowded pins release and invalid virtual merges preserve every value @cross-browser', async ({
  page,
}) => {
  await page.goto('/table-capabilities.html');
  const table = page.locator('#review');
  await table.evaluate((el: HTMLDsTableElement) => {
    el.responsiveLayout = 'scroll';
    el.cellSpans = [{ rowIds: ['review-0', 'review-1'], columnIds: ['driver'] }];
  });
  await page.setViewportSize({ width: 390, height: 800 });
  await expect(table.locator('.ds-table__frame')).toHaveAttribute('data-pins-crowded', 'true');
  await expect(table.locator('[data-row-id="review-1"] [data-column-id="driver"]')).toBeVisible();
  await expect(table.locator('[data-row-id="review-0"] [data-column-id="driver"]')).toHaveCSS(
    'position',
    'relative'
  );
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(table.locator('[data-row-id="review-0"] .ds-table__cell-highlight')).toHaveCSS(
    'outline-style',
    'solid'
  );
});

test('virtual grid focus survives recycling and never mounts the full worksheet @cross-browser', async ({
  page,
}) => {
  await page.goto('/table-capabilities.html?mode=edit');
  const table = page.locator('#review');
  await table.evaluate((el: HTMLDsTableElement) => {
    el.rows = Array.from({ length: 10000 }, (_, index) => ({
      id: `worksheet-${index}`,
      cells: { name: `Driver ${index}`, limit: 50, note: 'Ready' },
    }));
    el.dataMode = 'virtual';
  });
  await expect(table.locator('[data-row-id="worksheet-0"]')).toBeVisible();
  await table.evaluate((el: HTMLDsTableElement) => el.scrollRowIntoView('worksheet-500'));
  const cell = table.locator('[data-row-id="worksheet-500"] [data-column-id="name"]');
  await cell.click();
  await table.locator('.ds-table__cell-editor input').press('Escape');
  await cell.press('ArrowDown');
  const next = table.locator('[data-row-id="worksheet-501"] [data-column-id="name"]');
  await expect(next).toBeFocused();
  await next.press('F2');
  await expect(table.locator('.ds-table__cell-editor input')).toBeFocused();
  await table.locator('.ds-table__viewport').evaluate(el => {
    el.scrollTop = el.scrollHeight;
  });
  await expect(table.locator('.ds-table__cell-editor input')).toBeFocused();
  await expect.poll(() => table.locator('[data-row-id]').count()).toBeLessThan(50);
});

test('native merged reports preserve a complete grid and reject hidden-member spans @cross-browser', async ({
  page,
}) => {
  await page.goto('/table-capabilities.html?mode=merge');
  const table = page.locator('#review');
  await expect(table.locator('[data-row-id="west-am"] [data-column-id="fleet"]')).toHaveAttribute(
    'rowspan',
    '2'
  );
  await expect(table.locator('[data-row-id="west-am"] [data-column-id="monday"]')).toHaveAttribute(
    'colspan',
    '2'
  );
  await expect(table.locator('[data-row-id="west-pm"] [data-column-id="fleet"]')).toHaveCount(0);
  await expect(table.locator('tbody button[role="checkbox"]')).toHaveCount(3);
  expect(
    await table
      .locator('thead [data-column-id="monday"]')
      .evaluate(el => getComputedStyle(el, '::before').boxShadow)
  ).toMatch(/1px 0px 0px 0px inset/);
  expect(
    await table
      .locator('[data-row-id="west-pm"] [data-column-id="monday"]')
      .evaluate(el => getComputedStyle(el, '::after').boxShadow)
  ).toMatch(/1px 0px 0px 0px inset/);
  await table.evaluate((el: HTMLDsTableElement) => {
    el.hiddenFieldIds = ['tuesday'];
  });
  await expect(
    table.locator('[data-row-id="west-am"] [data-column-id="monday"]')
  ).not.toHaveAttribute('colspan', '2');
  expect(
    (await new AxeBuilder({ page }).include('#review').analyze()).violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    )
  ).toEqual([]);
});

test('grid navigation, editing, cancellation, range and atomic paste @cross-browser', async ({
  page,
}) => {
  await page.goto('/table-capabilities.html?mode=edit');
  const table = page.locator('#review');
  const first = table.locator('[data-row-id="edit-0"] [data-column-id="name"]');
  await first.click();
  const editor = table.locator('.ds-table__cell-editor input');
  await expect(editor).toBeFocused();
  await editor.fill('Updated driver');
  await editor.press('Enter');
  await expect(first).toContainText('Updated driver');
  await expect(first).toBeFocused();
  await first.press('ArrowRight');
  const limit = table.locator('[data-row-id="edit-0"] [data-column-id="limit"]');
  await expect(limit).toBeFocused();
  await limit.press('F2');
  await editor.fill('101');
  await editor.press('Enter');
  await expect(editor).toBeVisible();
  await editor.press('Escape');
  await expect(limit).toContainText('50');
  await limit.press('Shift+ArrowDown');
  await expect(table.locator('[role="gridcell"][aria-selected="true"]')).toHaveCount(2);
  await limit.focus();
  await limit.evaluate(el => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', '60\tNew note\n61\tOther note');
    el.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData }));
  });
  await expect(limit).toContainText('60');
  await expect(table.locator('[data-row-id="edit-1"] [data-column-id="note"]')).toContainText(
    'Other note'
  );
  expect(
    (await new AxeBuilder({ page }).include('#review').analyze()).violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    )
  ).toEqual([]);
});
