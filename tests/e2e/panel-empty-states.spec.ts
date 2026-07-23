import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/panel-empty-states.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('centers a generic empty state in the visible space above its footer', async ({ page }) => {
  const geometry = await page.locator('#generic').evaluate(element => {
    const viewport = element.querySelector<HTMLElement>('.scroll-overlay__viewport')!;
    const empty = element.querySelector<HTMLElement>('ds-empty-state')!;
    const viewportRect = viewport.getBoundingClientRect();
    const emptyRect = empty.getBoundingClientRect();
    const overlay = Number.parseFloat(
      getComputedStyle(element).getPropertyValue('--ds-scroll-overlay-block-size'),
    );
    return {
      actual: (emptyRect.top + emptyRect.bottom) / 2,
      expected: viewportRect.top + (viewportRect.height - overlay) / 2,
    };
  });

  expect(geometry.actual).toBeCloseTo(geometry.expected, 0);
});

test('centers a conversation empty state above its persistent action', async ({ page }) => {
  const list = page.locator('#conversations');
  await expect(list.getByRole('button', { name: 'New conversation' })).toBeVisible();

  const geometry = await list.evaluate(element => {
    const viewport = element.querySelector<HTMLElement>('.conversation-list__viewport')!;
    const empty = element.querySelector<HTMLElement>('ds-empty-state')!;
    const viewportRect = viewport.getBoundingClientRect();
    const emptyRect = empty.getBoundingClientRect();
    const overlay = Number.parseFloat(
      getComputedStyle(element).getPropertyValue('--ds-scroll-overlay-block-size'),
    );
    return {
      actual: (emptyRect.top + emptyRect.bottom) / 2,
      expected: viewportRect.top + (viewportRect.height - overlay) / 2,
    };
  });

  expect(geometry.actual).toBeCloseTo(geometry.expected, 0);
});

test('centers an empty list in the full viewport when no action exists', async ({ page }) => {
  const geometry = await page.locator('#activity').evaluate(element => {
    const viewport = element.querySelector<HTMLElement>('.conversation-list__viewport')!;
    const empty = element.querySelector<HTMLElement>('ds-empty-state')!;
    const viewportRect = viewport.getBoundingClientRect();
    const emptyRect = empty.getBoundingClientRect();
    return {
      actual: (emptyRect.top + emptyRect.bottom) / 2,
      expected: (viewportRect.top + viewportRect.bottom) / 2,
      overlay: Number.parseFloat(
        getComputedStyle(element).getPropertyValue('--ds-scroll-overlay-block-size'),
      ),
    };
  });

  expect(geometry.overlay).toBe(0);
  expect(geometry.actual).toBeCloseTo(geometry.expected, 0);
});
