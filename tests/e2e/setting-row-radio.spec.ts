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
  await expect(group).toHaveAttribute('aria-label', 'Validation mode');
  await expect(enabled).toHaveAttribute('aria-checked', 'true');
  await expect(enabled).toHaveAccessibleDescription(
    'Apply automated checks and human review to validate results.'
  );
  await expect(disabled).toHaveAttribute('aria-checked', 'false');
  await expect(group.locator('.radio__item')).toHaveCount(3);

  const groupLabelBox = await group.locator('.radio__group-label .ds-text__element').boundingBox();
  const firstCircleBox = await group.locator('.radio__circle').first().boundingBox();
  expect(groupLabelBox).not.toBeNull();
  expect(firstCircleBox).not.toBeNull();
  expect(groupLabelBox!.x).toBeCloseTo(firstCircleBox!.x, 1);

  await disabled.click();
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
  const copy = item.locator('.radio__copy');

  const rowBox = await row.boundingBox();
  const groupBox = await group.boundingBox();
  const placementBox = await placement.boundingBox();
  const copyBox = await copy.boundingBox();
  expect(rowBox).not.toBeNull();
  expect(groupBox).not.toBeNull();
  expect(placementBox).not.toBeNull();
  expect(copyBox).not.toBeNull();
  expect(groupBox!.x).toBeGreaterThan(rowBox!.x);
  expect(placementBox!.x + placementBox!.width).toBeLessThanOrEqual(copyBox!.x);
});

test('renders a non-interactive saved-value readout in view presentation', async ({ page }) => {
  const row = page.locator('#setting-row-view');

  await expect(row).toContainText('Validation mode');
  await expect(row).toContainText('Use automated validation');
  await expect(row).toContainText('Apply automated checks and human review to validate results.');
  await expect(row.getByRole('radio')).toHaveCount(0);
});
