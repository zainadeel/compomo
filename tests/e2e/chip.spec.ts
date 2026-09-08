import { expect, test } from '@playwright/test';
import { chromiumOnly } from './browser-tier';

test.beforeEach(async ({ page }) => {
  await page.goto('/chip.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('is always removable with the fixed Cross icon', async ({ page }) => {
  const chip = page.locator('#chip');
  const remove = chip.getByRole('button');

  await expect(chip).toHaveAttribute('removable', 'false');
  await expect(remove).toHaveAccessibleName('Remove Vehicle: 452');
  await expect
    .poll(() =>
      remove
        .locator('ds-icon')
        .evaluate(element => (element as HTMLElement & { name: string }).name)
    )
    .toBe('Cross');

  await remove.click();

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as {
              __chipRemovals: Array<{ id: string; hasNoDetail: boolean }>;
            }
          ).__chipRemovals
      )
    )
    .toEqual([{ id: 'chip', hasNoDetail: true }]);
});

test('keeps inactive metadata visible without an interactive dismiss action', async ({ page }) => {
  const inactive = page.locator('#inactive-chip');
  const remove = inactive.getByRole('button');

  await expect(inactive).toBeVisible();
  await expect(remove).toBeDisabled();
  await remove.evaluate((button: HTMLButtonElement) => button.click());
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { __chipRemovals: unknown[] }).__chipRemovals)
    )
    .toEqual([]);
});

test('supports compact inset geometry inside a control of the same density', async ({ page }) => {
  const defaultChip = page.locator('#chip');
  const smChip = page.locator('#sm-chip');
  const xsChip = page.locator('#xs-chip');
  const singleInsetChip = page.locator('#single-inset-chip');
  const doubleInsetChip = page.locator('#inset-chip');

  await expect(singleInsetChip).toHaveJSProperty('size', 'md');
  await expect(singleInsetChip).toHaveJSProperty('isInset', true);
  await expect(doubleInsetChip).toHaveJSProperty('insetDepth', 'double');

  for (const [chip, expectedChipSize, expectedRemoveSize, expectedTrailingPadding] of [
    [defaultChip, '32px', '28px', '2px'],
    [smChip, '24px', '20px', '2px'],
    [xsChip, '16px', '12px', '2px'],
    [singleInsetChip, '28px', '24px', '2px'],
    [doubleInsetChip, '24px', '20px', '2px'],
  ] as const) {
    await expect(chip).toHaveCSS('height', expectedChipSize);
    await expect(chip).toHaveCSS('padding-right', expectedTrailingPadding);
    await expect(chip.getByRole('button')).toHaveCSS('height', expectedRemoveSize);
    await expect(chip.getByRole('button')).toHaveCSS('width', expectedRemoveSize);
  }
});

test('truncates one line only when constrained by maxWidth', async ({ page }) => {
  const host = page.locator('#long-chip');
  const label = host.locator('ds-text');

  await expect
    .poll(() => host.evaluate(element => getComputedStyle(element).maxWidth))
    .toBe('120px');
  await expect(label).toHaveCSS('white-space', 'nowrap');
  await expect(label).toHaveCSS('overflow', 'hidden');
  await expect(label).toHaveCSS('text-overflow', 'ellipsis');
  expect(
    await label.locator('span').evaluate(element => element.scrollWidth > element.clientWidth)
  ).toBe(true);
});

test(
  'pins the dismiss control to the trailing edge when the chip is wider than its label',
  chromiumOnly(
    'layout-geometry',
    'Token-backed flex alignment of the Chip dismiss control in a stretched host.'
  ),
  async ({ page }) => {
    const chip = page.locator('#wide-chip');
    const remove = chip.getByRole('button');

    const metrics = await chip.evaluate(element => {
      const host = element.getBoundingClientRect();
      const action = element.querySelector('.tag__remove')!.getBoundingClientRect();
      const paddingEnd = parseFloat(getComputedStyle(element).paddingRight);
      return {
        hostWidth: host.width,
        trailingGap: host.right - action.right,
        paddingEnd,
        actionAfterLabel:
          action.left > element.querySelector('.tag__label')!.getBoundingClientRect().right,
      };
    });

    expect(metrics.hostWidth).toBeGreaterThan(180);
    expect(metrics.trailingGap).toBeCloseTo(metrics.paddingEnd, 0);
    expect(metrics.actionAfterLabel).toBe(true);
    await expect(remove).toBeVisible();
  }
);

test('shows hover and active feedback for a fine pointer', async ({ page }) => {
  const remove = page.locator('#chip .tag__remove');
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('Chip interaction test requires a viewport');
  await page.mouse.move(viewport.width - 1, viewport.height - 1);

  await expect
    .poll(() => remove.evaluate(element => getComputedStyle(element, '::before').backgroundColor))
    .toBe('rgba(0, 0, 0, 0)');
  await remove.hover();
  await expect
    .poll(() => remove.evaluate(element => getComputedStyle(element, '::before').backgroundColor))
    .not.toBe('rgba(0, 0, 0, 0)');

  await page.mouse.down();
  await expect
    .poll(() =>
      remove.evaluate(element => {
        const probe = document.createElement('span');
        probe.style.backgroundColor = 'var(--color-interaction-pressed)';
        document.body.append(probe);
        const expected = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return getComputedStyle(element, '::before').backgroundColor === expected;
      })
    )
    .toBe(true);
  await page.mouse.up();
});

test.describe('direct-touch chip', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 760 } });

  test('does not retain the host or dismiss hover wash after a tap', async ({ page }) => {
    await expect
      .poll(() =>
        page.evaluate(
          () => matchMedia('(hover: none)').matches && matchMedia('(pointer: coarse)').matches
        )
      )
      .toBe(true);

    const chip = page.locator('#chip');
    const remove = chip.locator('.tag__remove');
    await remove.tap();
    await expect
      .poll(() =>
        chip.evaluate(element => {
          const action = element.querySelector('.tag__remove')!;
          return {
            host: getComputedStyle(element, '::after').backgroundColor,
            action: getComputedStyle(action, '::before').backgroundColor,
          };
        })
      )
      .toEqual({
        host: 'rgba(0, 0, 0, 0)',
        action: 'rgba(0, 0, 0, 0)',
      });
  });
});
