import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/setting-row-checkbox.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('composes a labeled Checkbox group without adding a second interaction layer', async ({
  page,
}) => {
  const group = page.locator('#alert-channels');
  const email = group.getByRole('checkbox', { name: 'Email', exact: true });
  const push = group.getByRole('checkbox', { name: 'Mobile push', exact: true });
  const sms = group.getByRole('checkbox', { name: 'SMS', exact: true });

  await expect(group).toHaveRole('group', { name: 'Alert channels' });
  await expect(email).toHaveAttribute('aria-checked', 'true');
  await expect(email).toHaveAccessibleDescription('Send a summary to the fleet email list.');
  await expect(push).toHaveAttribute('aria-checked', 'true');
  await expect(sms).toHaveAttribute('aria-checked', 'false');
  await expect(group.locator('.checkbox-group__options > ds-checkbox')).toHaveCount(4);
  const row = page.locator('#setting-row');
  const heading = row.locator('.setting-row-checkbox__heading');
  await expect(row.locator('.checkbox-group__label')).toHaveCount(0);
  await expect(heading).toHaveJSProperty('variant', 'text-body-medium');
  await expect(heading).toHaveJSProperty('emphasis', true);
  await expect(email).not.toHaveClass(/ds-interaction-fill/);
  await expect(sms).not.toHaveClass(/ds-interaction-fill/);

  const headingTextBox = await heading.locator('.ds-text__element').boundingBox();
  const headingRowBox = await heading.boundingBox();
  const firstBox = await group.locator('.box').first().boundingBox();
  const firstItemBox = await group
    .locator('.checkbox-group__options > ds-checkbox')
    .first()
    .boundingBox();
  const secondItemBox = await group
    .locator('.checkbox-group__options > ds-checkbox')
    .nth(1)
    .boundingBox();
  expect(headingTextBox).not.toBeNull();
  expect(headingRowBox).not.toBeNull();
  expect(firstBox).not.toBeNull();
  expect(firstItemBox).not.toBeNull();
  expect(secondItemBox).not.toBeNull();
  expect(headingRowBox!.height).toBe(32);
  const rowBox = await page.locator('#setting-row').boundingBox();
  expect(rowBox).not.toBeNull();
  expect(headingTextBox!.x).toBeCloseTo(rowBox!.x + 16, 0.5);
  expect(secondItemBox!.y - (firstItemBox!.y + firstItemBox!.height)).toBe(4);

  await sms.locator('.checkbox__label').click();
  await expect(sms).toHaveAttribute('aria-checked', 'true');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as typeof window & {
              __settingRowCheckboxChanges: { value: string; checked: boolean }[];
            }
          ).__settingRowCheckboxChanges
      )
    )
    .toEqual([{ value: 'sms', checked: true }]);

  await email.locator('.box').click();
  await expect(email).toHaveAttribute('aria-checked', 'false');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as typeof window & {
              __settingRowCheckboxChanges: { value: string; checked: boolean }[];
            }
          ).__settingRowCheckboxChanges
      )
    )
    .toEqual([
      { value: 'sms', checked: true },
      { value: 'email', checked: false },
    ]);
  await expect(group.getByRole('checkbox', { name: 'Unavailable option' })).toHaveAttribute(
    'aria-disabled',
    'true'
  );
});

test('keeps the padded row and Checkbox copy aligned when descriptions wrap', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const row = page.locator('#setting-row');
  const group = page.locator('#alert-channels');
  const item = group.locator('.checkbox-group__options > ds-checkbox').first();
  const placement = item.locator('.checkbox__placement');
  const box = item.locator('.box');
  const label = item.locator('.checkbox__label .ds-text__element');
  const copy = item.locator('.checkbox__copy');

  const rowBox = await row.boundingBox();
  const groupBox = await group.boundingBox();
  const placementBox = await placement.boundingBox();
  const boxBox = await box.boundingBox();
  const labelBox = await label.boundingBox();
  const copyBox = await copy.boundingBox();
  expect(rowBox).not.toBeNull();
  expect(groupBox).not.toBeNull();
  expect(placementBox).not.toBeNull();
  expect(boxBox).not.toBeNull();
  expect(labelBox).not.toBeNull();
  expect(copyBox).not.toBeNull();
  expect(groupBox!.x).toBeGreaterThan(rowBox!.x);
  expect(placementBox!.x + placementBox!.width).toBeLessThanOrEqual(copyBox!.x);
  expect(boxBox!.y + boxBox!.height / 2).toBeCloseTo(labelBox!.y + labelBox!.height / 2, 1);
});

test('renders a non-interactive saved-value readout in view presentation', async ({ page }) => {
  const row = page.locator('#setting-row-view');
  const heading = row.locator('.setting-row-checkbox__heading');
  const choice = row.locator('.setting-row-checkbox__choice ds-text');

  await expect(row).toContainText('Alert channels');
  await expect(row).toContainText('Email, Mobile push');
  await expect(row).toContainText('Selected channels receive in-cab and fleet alerts.');
  await expect(row.getByRole('checkbox')).toHaveCount(0);
  await expect(row.locator('ds-checkbox-group')).toHaveCount(1);
  await expect(row.locator('ds-checkbox-group')).toBeHidden();
  await expect(row.locator('.box').first()).toBeHidden();
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
  const group = page.locator('#alert-channels');

  const geometry = await page.evaluate(() => {
    const measure = (id: string) => {
      const element = document.querySelector<HTMLElement>(id)!;
      const style = getComputedStyle(element);
      return {
        paddingTop: Number.parseFloat(style.paddingTop),
        paddingRight: Number.parseFloat(style.paddingRight),
        paddingBottom: Number.parseFloat(style.paddingBottom),
        paddingLeft: Number.parseFloat(style.paddingLeft),
        expectedInline: 16,
      };
    };
    const editRow = document.querySelector<HTMLElement>('#setting-row')!;
    const viewRow = document.querySelector<HTMLElement>('#setting-row-view')!;
    const heading = editRow.querySelector<HTMLElement>('.setting-row-checkbox__heading')!;
    const headingText = heading.querySelector<HTMLElement>('.ds-text__element') ?? heading;
    const box = document.querySelector<HTMLElement>('#alert-channels .box')!;
    const viewLabel = viewRow.querySelector<HTMLElement>('.setting-row-checkbox__heading')!;
    const viewHeadingText = viewLabel.querySelector<HTMLElement>('.ds-text__element') ?? viewLabel;
    const viewOptionText = viewRow.querySelector<HTMLElement>(
      '.setting-row-checkbox__choice ds-text .ds-text__element'
    )!;
    const editOptionText = document.querySelector<HTMLElement>(
      '#alert-channels .checkbox__label .ds-text__element'
    )!;
    const item = document.querySelector<HTMLElement>(
      '#alert-channels .checkbox-group__options > ds-checkbox'
    )!;
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
      boxOffset: box.getBoundingClientRect().left - editRowLeft,
      viewHeadingHeight: viewLabel.getBoundingClientRect().height,
      viewTitleToOption:
        viewOptionText.getBoundingClientRect().top - viewHeadingText.getBoundingClientRect().bottom,
      editTitleToOption:
        editOptionText.getBoundingClientRect().top - headingText.getBoundingClientRect().bottom,
    };
  });

  expect(geometry.edit.paddingTop).toBe(0);
  expect(geometry.edit.paddingBottom).toBe(0);
  expect(geometry.edit.paddingLeft).toBe(geometry.edit.expectedInline);
  expect(geometry.view.paddingTop).toBe(0);
  expect(geometry.view.paddingBottom).toBe(0);
  expect(geometry.view.paddingRight).toBe(geometry.edit.paddingRight);
  expect(geometry.view.paddingLeft).toBe(geometry.edit.paddingLeft);
  expect(geometry.itemPaddingLeft).toBe(0);
  expect(geometry.headingPaddingLeft).toBe(0);
  expect(geometry.viewHeadingTextOffset).toBe(16);
  expect(geometry.editHeadingTextOffset).toBe(16);
  expect(geometry.viewOptionTextOffset).toBe(16);
  expect(geometry.viewHeadingHeight).toBe(32);
  expect(geometry.viewTitleToOption).toBeCloseTo(geometry.editTitleToOption, 1);
  await expect(view.locator('.setting-row-checkbox__heading')).toHaveJSProperty(
    'variant',
    'text-body-medium'
  );
  await expect(edit.locator('.setting-row-checkbox__heading')).toHaveJSProperty(
    'variant',
    'text-body-medium'
  );
  await expect(edit.locator('.checkbox-group__label')).toHaveCount(0);
  await expect(edit).toBeVisible();
  await expect(view).toBeVisible();
  await expect(group).toBeVisible();
});

test('keeps heading, choice, and checkbox group mounted with no empty frames across view and edit', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const row = document.querySelector('#setting-row') as HTMLElement & {
      presentation: string;
      valueLabel?: string;
      description?: string;
    };
    const heading = row.querySelector('.setting-row-checkbox__heading');
    const choice = row.querySelector('.setting-row-checkbox__choice');
    const group = row.querySelector('ds-checkbox-group');
    const isVisible = (element: Element | null) => {
      if (!element) return false;
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const box = element.getBoundingClientRect();
      return box.width > 0 && box.height > 0;
    };
    const snapshot = () => {
      const headingVisible = isVisible(heading);
      const choiceVisible = isVisible(choice);
      const groupVisible = isVisible(group);
      return {
        headingVisible,
        choiceVisible,
        groupVisible,
        emptyOptions: !choiceVisible && !groupVisible,
        headingGone: !headingVisible,
        headingSame: row.querySelector('.setting-row-checkbox__heading') === heading,
        choiceSame: row.querySelector('.setting-row-checkbox__choice') === choice,
        groupSame: row.querySelector('ds-checkbox-group') === group,
      };
    };
    const frames: ReturnType<typeof snapshot>[] = [];
    const observer = new MutationObserver(() => frames.push(snapshot()));
    observer.observe(row, { subtree: true, childList: true, attributes: true });
    const waitFrames = async (count: number) => {
      for (let i = 0; i < count; i += 1) {
        frames.push(snapshot());
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      }
    };
    row.valueLabel = 'Email, Mobile push';
    row.description = 'Selected channels receive in-cab and fleet alerts.';
    row.presentation = 'view';
    await waitFrames(8);
    const afterExit = snapshot();
    row.presentation = 'edit';
    await waitFrames(8);
    const afterEnter = snapshot();
    row.presentation = 'view';
    await waitFrames(8);
    const afterSecondExit = snapshot();
    observer.disconnect();
    return {
      emptyOptionFrames: frames.filter(frame => frame.emptyOptions),
      headingGoneFrames: frames.filter(frame => frame.headingGone),
      identityBreaks: frames.filter(
        frame => !frame.headingSame || !frame.choiceSame || !frame.groupSame
      ),
      headingConnected: Boolean(heading?.isConnected),
      choiceConnected: Boolean(choice?.isConnected),
      groupConnected: Boolean(group?.isConnected),
      afterExit,
      afterEnter,
      afterSecondExit,
      viewGroupDisplay: getComputedStyle(group!).display,
    };
  });

  expect(result.emptyOptionFrames).toEqual([]);
  expect(result.headingGoneFrames).toEqual([]);
  expect(result.identityBreaks).toEqual([]);
  expect(result.headingConnected).toBe(true);
  expect(result.choiceConnected).toBe(true);
  expect(result.groupConnected).toBe(true);
  expect(result.afterExit).toMatchObject({
    headingVisible: true,
    choiceVisible: true,
    groupVisible: false,
    emptyOptions: false,
  });
  expect(result.afterEnter).toMatchObject({
    headingVisible: true,
    choiceVisible: false,
    groupVisible: true,
    emptyOptions: false,
  });
  expect(result.afterSecondExit).toMatchObject({
    headingVisible: true,
    choiceVisible: true,
    groupVisible: false,
    emptyOptions: false,
  });
  expect(result.viewGroupDisplay).toBe('none');
});

test('omits CheckboxGroup form labels inside the settings row even if label is assigned', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const row = document.querySelector('#setting-row')!;
    const group = document.querySelector('#alert-channels') as HTMLElement & {
      label: string;
    };
    const seenVariants: string[] = [];
    const observer = new MutationObserver(() => {
      for (const label of row.querySelectorAll('.checkbox-group__label')) {
        seenVariants.push((label as HTMLElement & { variant?: string }).variant ?? '');
      }
    });
    observer.observe(row, { subtree: true, childList: true, attributes: true });
    group.label = 'Alert channels';
    await new Promise<void>(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
    observer.disconnect();
    const heading = row.querySelector('.setting-row-checkbox__heading') as HTMLElement & {
      variant?: string;
    };
    return {
      seenVariants,
      formLabelCount: row.querySelectorAll('.checkbox-group__label').length,
      headingVariant: heading?.variant,
    };
  });

  expect(result.seenVariants).toEqual([]);
  expect(result.formLabelCount).toBe(0);
  expect(result.headingVariant).toBe('text-body-medium');
});

test('keeps standalone CheckboxGroup form labels on the body-small section heading', async ({
  page,
}) => {
  const formLabel = page.locator('#form-checkbox-group .checkbox-group__label');
  await expect(formLabel).toHaveJSProperty('variant', 'text-body-small');
  await expect(formLabel).toHaveJSProperty('emphasis', true);
  await expect(formLabel).toHaveClass(/ds-control-section-heading/);
  await expect(page.locator('#form-checkbox-group')).toHaveRole('group', {
    name: 'Select preferences',
  });
});

test('renders selected values without supporting copy when the row and options have no subtext', async ({
  page,
}) => {
  const view = page.locator('#setting-row-view-no-subtext');
  const edit = page.locator('#setting-row-no-subtext');
  const choice = view.locator('.setting-row-checkbox__choice ds-text');
  const group = page.locator('#alert-channels-no-subtext');
  const options = group.locator('.checkbox-group__options > ds-checkbox');

  await expect(view).toContainText('Alert channels');
  await expect(view).toContainText('Email, Mobile push');
  await expect(choice).toHaveCount(1);
  await expect(choice).toHaveJSProperty('variant', 'text-body-medium');
  await expect(view.getByRole('checkbox')).toHaveCount(0);
  await expect(view.locator('ds-checkbox-group')).toBeHidden();

  await expect(options).toHaveCount(3);
  await expect(options.nth(0)).not.toHaveClass(/checkbox--described/);
  await expect(options.nth(0).locator('.checkbox__copy ds-text')).toHaveCount(1);
  const optionHeight = await options
    .nth(0)
    .evaluate(element => element.getBoundingClientRect().height);
  expect(optionHeight).toBe(32);
  await expect(edit.locator('.checkbox-group__label')).toHaveCount(0);
});
