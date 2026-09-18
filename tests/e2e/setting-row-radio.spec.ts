import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/setting-row-radio.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('composes a labeled Radio group without adding a second interaction layer', async ({
  page,
}) => {
  const group = page.locator('#validation-mode');
  const enabled = group.getByRole('radio', { name: 'Use automated validation', exact: true });
  const disabled = group.getByRole('radio', {
    name: 'Skip automated validation',
    exact: true,
  });

  await expect(group).toHaveRole('radiogroup', { name: 'Validation mode' });
  await expect(enabled).toHaveAttribute('aria-checked', 'true');
  await expect(enabled).toHaveAccessibleDescription(
    'Apply automated checks and human review to validate results.'
  );
  await expect(disabled).toHaveAttribute('aria-checked', 'false');
  await expect(group.locator('.radio__item')).toHaveCount(3);
  const row = page.locator('#setting-row');
  const heading = row.locator('.setting-row-radio__heading');
  await expect(row.locator('.radio__group-label')).toHaveCount(0);
  await expect(heading).toHaveJSProperty('variant', 'text-body-medium');
  await expect(heading).toHaveJSProperty('emphasis', true);
  await expect(enabled).not.toHaveClass(/ds-interaction-fill/);
  await expect(disabled).not.toHaveClass(/ds-interaction-fill/);

  const groupLabelBox = await heading.locator('.ds-text__element').boundingBox();
  const groupLabelRowBox = await heading.boundingBox();
  const firstCircleBox = await group.locator('.radio__circle').first().boundingBox();
  const firstItemBox = await group.locator('.radio__item').first().boundingBox();
  const secondItemBox = await group.locator('.radio__item').nth(1).boundingBox();
  expect(groupLabelBox).not.toBeNull();
  expect(groupLabelRowBox).not.toBeNull();
  expect(firstCircleBox).not.toBeNull();
  expect(firstItemBox).not.toBeNull();
  expect(secondItemBox).not.toBeNull();
  expect(groupLabelRowBox!.height).toBe(32);
  const rowBox = await page.locator('#setting-row').boundingBox();
  expect(rowBox).not.toBeNull();
  expect(groupLabelBox!.x).toBeCloseTo(rowBox!.x + 16, 0.5);
  expect(secondItemBox!.y - (firstItemBox!.y + firstItemBox!.height)).toBe(4);

  await disabled.locator('.radio__label').click();
  await expect(disabled).toHaveAttribute('aria-checked', 'true');
  await expect(enabled).toHaveAttribute('aria-checked', 'false');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { __settingRowRadioChanges: string[] })
            .__settingRowRadioChanges
      )
    )
    .toEqual(['disabled']);

  await enabled.locator('.radio__circle').click();
  await expect(enabled).toHaveAttribute('aria-checked', 'true');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { __settingRowRadioChanges: string[] })
            .__settingRowRadioChanges
      )
    )
    .toEqual(['disabled', 'enabled']);
  await expect(group.getByRole('radio', { name: 'Unavailable option' })).toHaveAttribute(
    'aria-disabled',
    'true'
  );
});

test('keeps the padded row and Radio copy aligned when descriptions wrap', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const row = page.locator('#setting-row');
  const group = page.locator('#validation-mode');
  const item = group.locator('.radio__item').first();
  const placement = item.locator('.radio__placement');
  const circle = item.locator('.radio__circle');
  const label = item.locator('.radio__label .ds-text__element');
  const copy = item.locator('.radio__copy');

  const rowBox = await row.boundingBox();
  const groupBox = await group.boundingBox();
  const placementBox = await placement.boundingBox();
  const circleBox = await circle.boundingBox();
  const labelBox = await label.boundingBox();
  const copyBox = await copy.boundingBox();
  expect(rowBox).not.toBeNull();
  expect(groupBox).not.toBeNull();
  expect(placementBox).not.toBeNull();
  expect(circleBox).not.toBeNull();
  expect(labelBox).not.toBeNull();
  expect(copyBox).not.toBeNull();
  expect(groupBox!.x).toBeGreaterThan(rowBox!.x);
  expect(placementBox!.x + placementBox!.width).toBeLessThanOrEqual(copyBox!.x);
  expect(circleBox!.y + circleBox!.height / 2).toBeCloseTo(labelBox!.y + labelBox!.height / 2, 1);
});

test('renders a non-interactive saved-value readout in view presentation', async ({ page }) => {
  const row = page.locator('#setting-row-view');
  const heading = row.locator('.setting-row-radio__heading');
  const choice = row.locator('.setting-row-radio__choice ds-text');

  await expect(row).toContainText('Validation mode');
  await expect(row).toContainText('Use automated validation');
  await expect(row).toContainText('Apply automated checks and human review to validate results.');
  await expect(row.getByRole('radio')).toHaveCount(0);
  await expect(row.locator('.radio__circle')).toHaveCount(0);
  await expect(heading).toHaveJSProperty('variant', 'text-body-medium');
  await expect(heading).toHaveJSProperty('emphasis', true);
  await expect(choice.nth(0)).toHaveJSProperty('variant', 'text-body-medium');
  await expect(choice.nth(1)).toHaveJSProperty('variant', 'text-body-small');
  await expect(choice.nth(1)).toHaveJSProperty('color', 'secondary');
});

test('keeps the same host padding in view and edit on the shared settings-row inset', async ({
  page,
}) => {
  const edit = page.locator('#setting-row');
  const view = page.locator('#setting-row-view');
  const group = page.locator('#validation-mode');

  const geometry = await page.evaluate(() => {
    const measure = (id: string) => {
      const element = document.querySelector<HTMLElement>(id)!;
      const style = getComputedStyle(element);
      return {
        paddingTop: Number.parseFloat(style.paddingTop),
        paddingRight: Number.parseFloat(style.paddingRight),
        paddingBottom: Number.parseFloat(style.paddingBottom),
        paddingLeft: Number.parseFloat(style.paddingLeft),
        expectedBlock: Number.parseFloat(style.getPropertyValue('--dimension-space-100')) || 8,
        expectedInline: 16,
      };
    };
    const editRow = document.querySelector<HTMLElement>('#setting-row')!;
    const viewRow = document.querySelector<HTMLElement>('#setting-row-view')!;
    const heading = editRow.querySelector<HTMLElement>('.setting-row-radio__heading')!;
    const headingText = heading.querySelector<HTMLElement>('.ds-text__element') ?? heading;
    const circle = document.querySelector<HTMLElement>('#validation-mode .radio__circle')!;
    const viewLabel = viewRow.querySelector<HTMLElement>('.setting-row-radio__heading')!;
    const viewHeadingText = viewLabel.querySelector<HTMLElement>('.ds-text__element') ?? viewLabel;
    const viewOptionText = viewRow.querySelector<HTMLElement>(
      '.setting-row-radio__choice ds-text .ds-text__element'
    )!;
    const editOptionText = document.querySelector<HTMLElement>(
      '#validation-mode .radio__item .radio__label .ds-text__element'
    )!;
    const item = document.querySelector<HTMLElement>('#validation-mode .radio__item')!;
    const itemStyle = getComputedStyle(item);
    const viewRowLeft = viewRow.getBoundingClientRect().left;
    const editRowLeft = editRow.getBoundingClientRect().left;
    return {
      edit: measure('#setting-row'),
      view: measure('#setting-row-view'),
      itemPaddingLeft: Number.parseFloat(itemStyle.paddingLeft),
      headingPaddingLeft: Number.parseFloat(getComputedStyle(heading).paddingLeft),
      viewHeadingTextOffset: viewHeadingText.getBoundingClientRect().left - viewRowLeft,
      editHeadingTextOffset: headingText.getBoundingClientRect().left - editRowLeft,
      viewOptionTextOffset: viewOptionText.getBoundingClientRect().left - viewRowLeft,
      circleOffset: circle.getBoundingClientRect().left - editRowLeft,
      viewHeadingHeight: viewLabel.getBoundingClientRect().height,
      viewTitleToOption:
        viewOptionText.getBoundingClientRect().top - viewHeadingText.getBoundingClientRect().bottom,
      editTitleToOption:
        editOptionText.getBoundingClientRect().top - headingText.getBoundingClientRect().bottom,
    };
  });

  expect(geometry.edit.paddingTop).toBe(geometry.edit.expectedBlock);
  expect(geometry.edit.paddingLeft).toBe(geometry.edit.expectedInline);
  expect(geometry.view.paddingTop).toBe(geometry.edit.paddingTop);
  expect(geometry.view.paddingRight).toBe(geometry.edit.paddingRight);
  expect(geometry.view.paddingBottom).toBe(geometry.edit.paddingBottom);
  expect(geometry.view.paddingLeft).toBe(geometry.edit.paddingLeft);
  expect(geometry.itemPaddingLeft).toBe(0);
  expect(geometry.headingPaddingLeft).toBe(0);
  expect(geometry.viewHeadingTextOffset).toBe(16);
  expect(geometry.editHeadingTextOffset).toBe(16);
  expect(geometry.viewOptionTextOffset).toBe(16);
  expect(geometry.viewHeadingHeight).toBe(32);
  expect(geometry.viewTitleToOption).toBeCloseTo(geometry.editTitleToOption, 1);
  await expect(view.locator('.setting-row-radio__heading')).toHaveJSProperty(
    'variant',
    'text-body-medium'
  );
  await expect(edit.locator('.setting-row-radio__heading')).toHaveJSProperty(
    'variant',
    'text-body-medium'
  );
  await expect(edit.locator('.radio__group-label')).toHaveCount(0);
  await expect(edit).toBeVisible();
  await expect(view).toBeVisible();
  await expect(group).toBeVisible();
});

test('omits Radio form group labels inside the settings row even if groupLabel is assigned', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const row = document.querySelector('#setting-row')!;
    const radio = document.querySelector('#validation-mode') as HTMLElement & {
      groupLabel: string;
    };
    const seenVariants: string[] = [];
    const observer = new MutationObserver(() => {
      for (const label of row.querySelectorAll('.radio__group-label')) {
        seenVariants.push((label as HTMLElement & { variant?: string }).variant ?? '');
      }
    });
    observer.observe(row, { subtree: true, childList: true, attributes: true });
    radio.groupLabel = 'Validation mode';
    await new Promise<void>(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
    observer.disconnect();
    const heading = row.querySelector('.setting-row-radio__heading') as HTMLElement & {
      variant?: string;
    };
    return {
      seenVariants,
      formLabelCount: row.querySelectorAll('.radio__group-label').length,
      headingVariant: heading?.variant,
    };
  });

  expect(result.seenVariants).toEqual([]);
  expect(result.formLabelCount).toBe(0);
  expect(result.headingVariant).toBe('text-body-medium');
});

test('keeps standalone Radio form group labels on the body-small section heading', async ({
  page,
}) => {
  const formLabel = page.locator('#form-radio .radio__group-label');
  await expect(formLabel).toHaveJSProperty('variant', 'text-body-small');
  await expect(formLabel).toHaveJSProperty('emphasis', true);
  await expect(formLabel).toHaveClass(/ds-control-section-heading/);
  await expect(page.locator('#form-radio')).toHaveRole('radiogroup', { name: 'Plan type' });
});
