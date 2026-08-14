import { expect, test } from '@playwright/test';
import { expectGeometryBelow } from './rendered-geometry';

type BarActionEvent = { type: string };

declare global {
  interface Window {
    __barActionEvents: BarActionEvent[];
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/bar-action.html');
  await page.waitForFunction(() => document.documentElement.dataset['ready'] === 'true');
});

test('reports the selected count and emits dsClear without mutating count', async ({ page }) => {
  const bar = page.locator('#bar-action');

  await expect(bar).toBeVisible();
  await expect(bar).toHaveAttribute('role', 'toolbar');
  await expect(bar).toHaveAttribute('aria-label', 'Selected item actions');
  await expect(bar.getByText('3 selected')).toBeVisible();
  await expect(bar.getByRole('button', { name: 'Clear' })).toBeVisible();
  await expect(bar.getByRole('button', { name: 'Coaching status' })).toBeVisible();

  await bar.getByRole('button', { name: 'Clear' }).click();

  const events = await page.evaluate(() => window.__barActionEvents);
  expect(events).toEqual([{ type: 'clear' }]);
  await expect(bar.getByText('3 selected')).toBeVisible();
});

test('hides while the selected count is below one', async ({ page }) => {
  const bar = page.locator('#bar-action');
  await expect(bar).toBeVisible();

  await bar.evaluate((element: HTMLDsBarActionElement) => {
    element.count = 0;
  });

  await expect(bar).toBeHidden();
  await expect(page.getByRole('toolbar', { name: 'Selected item actions' })).toHaveCount(0);
});

test('keeps Clear beside the selected count and actions at the trailing edge', async ({
  page,
}) => {
  const bar = page.locator('#bar-action');
  const count = await bar.getByText('3 selected').boundingBox();
  const clear = await bar.getByRole('button', { name: 'Clear' }).boundingBox();
  const action = await bar.getByRole('button', { name: 'Coaching status' }).boundingBox();

  expect(count, 'selected count bounds').not.toBeNull();
  expect(clear, 'Clear bounds').not.toBeNull();
  expect(action, 'action bounds').not.toBeNull();

  const countToClear = clear!.x - (count!.x + count!.width);
  const clearToAction = action!.x - (clear!.x + clear!.width);

  expectGeometryBelow(countToClear, 24, 'count to Clear gap');
  expect(clearToAction, 'Clear must sit before trailing actions').toBeGreaterThan(countToClear);
});

test('paints compact bold-brand chrome with medium elevation', async ({ page }) => {
  const bar = page.locator('#bar-action');

  const surface = await bar.evaluate(element => {
    const probe = document.createElement('div');
    document.body.append(probe);
    probe.style.backgroundColor = 'var(--color-background-bold-brand)';
    const expectedBackground = getComputedStyle(probe).backgroundColor;
    probe.style.boxShadow = 'var(--effect-shadow-elevated-md)';
    const expectedShadow = getComputedStyle(probe).boxShadow;
    probe.style.boxShadow = 'var(--effect-highlight-elevated-md)';
    const expectedHighlight = getComputedStyle(probe).boxShadow;
    probe.remove();

    return {
      height: element.getBoundingClientRect().height,
      background: getComputedStyle(element).backgroundColor,
      expectedBackground,
      shadow: getComputedStyle(element).boxShadow,
      expectedShadow,
      highlight: getComputedStyle(element, '::after').boxShadow,
      expectedHighlight,
    };
  });

  expect(surface.height).toBe(48);
  expect(surface.background).toBe(surface.expectedBackground);
  expect(surface.shadow).toBe(surface.expectedShadow);
  expect(surface.highlight).toBe(surface.expectedHighlight);
});
