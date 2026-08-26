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
  await expect(bar.getByRole('group', { name: 'Selected item actions' })).toBeVisible();
  await expect(bar.locator('.bar-action__status')).toHaveAttribute('aria-live', 'polite');
  await expect(bar.locator('.bar-action__status')).toHaveAttribute('aria-atomic', 'true');
  await expect(bar.locator('.bar-action__count')).toHaveText('3 selected');
  await expect(bar.getByRole('button', { name: 'Clear' })).toBeVisible();
  await expect(bar.getByRole('button', { name: 'Coaching status' })).toBeVisible();

  await bar.getByRole('button', { name: 'Clear' }).click();

  const events = await page.evaluate(() => window.__barActionEvents);
  expect(events).toEqual([{ type: 'clear' }]);
  await expect(bar.locator('.bar-action__count')).toHaveText('3 selected');
});

test('hides while the selected count is below one', async ({ page }) => {
  const bar = page.locator('#bar-action');
  await expect(bar).toBeVisible();

  await bar.evaluate((element: HTMLDsBarActionElement) => {
    element.count = 0;
  });

  await expect(bar).toBeHidden();
  await expect(page.getByRole('group', { name: 'Selected item actions' })).toHaveCount(0);
  await expect(bar.locator('.bar-action__status')).toHaveText('');
});

test('normalizes fractional counts and rejects non-finite counts', async ({ page }) => {
  const bar = page.locator('#bar-action');

  await bar.evaluate((element: HTMLDsBarActionElement) => {
    element.count = 2.9;
  });
  await expect(bar.locator('.bar-action__count')).toHaveText('2 selected');

  await bar.evaluate((element: HTMLDsBarActionElement) => {
    element.count = Number.POSITIVE_INFINITY;
  });
  await expect(bar).toBeHidden();
  await expect(bar.locator('.bar-action__status')).toHaveText('');
});

test('removes the empty action lane without removing the persistent status region', async ({
  page,
}) => {
  const bar = page.locator('#bar-action');
  const actions = bar.locator('.bar-action__actions');
  const action = bar.getByRole('button', { name: 'Coaching status' });

  await expect(actions).toBeVisible();
  await action.evaluate(element => element.remove());

  await expect(actions).toBeHidden();
  await expect(bar.locator('.bar-action__status')).toHaveCount(1);
});

test('keeps Clear beside the selected count and actions at the trailing edge', async ({ page }) => {
  const bar = page.locator('#bar-action');
  const count = await bar.locator('.bar-action__count').boundingBox();
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
  const surface = bar.locator('.bar-action');

  const chrome = await surface.evaluate(element => {
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

  expect(chrome.height).toBe(48);
  expect(chrome.background).toBe(chrome.expectedBackground);
  expect(chrome.shadow).toBe(chrome.expectedShadow);
  expect(chrome.highlight).toBe(chrome.expectedHighlight);
});
