import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/card-action-center.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('renders grouped actions, status tags, and an explicit empty state', async ({ page }) => {
  const card = page.locator('#action-center');
  const sections = card.locator('.card-action-center__section');
  const actions = card.locator('.card-action-center__item');
  const tags = card.locator('ds-tag');

  await expect(sections).toHaveCount(3);
  await expect(actions).toHaveCount(11);
  await expect(card.getByRole('heading')).toHaveText(['Action center', 'Reports', 'Links']);
  await expect(tags).toHaveText(['44', '41', '182', '59']);
  await expect(tags).toHaveCount(4);
  await expect(page.locator('#empty-action-center')).toHaveText('No actions need attention');

  expect(
    await tags.evaluateAll(elements =>
      elements.map(element => ({
        intent: (element as HTMLElement & { intent: string }).intent,
        contrast: (element as HTMLElement & { contrast: string }).contrast,
        size: (element as HTMLElement & { size: string }).size,
        inset: (element as HTMLElement & { isInset: boolean }).isInset,
        rounded: (element as HTMLElement & { rounded: boolean }).rounded,
      }))
    )
  ).toEqual(
    Array.from({ length: 4 }, () => ({
      intent: 'negative',
      contrast: 'faint',
      size: 'sm',
      inset: true,
      rounded: true,
    }))
  );
});

test('preserves the extracted card geometry and alignment', async ({ page }) => {
  const card = page.locator('#action-center');

  const geometry = await card.evaluate(element => {
    const style = getComputedStyle(element);
    const title = element.querySelector<HTMLElement>('.card-action-center__section-heading')!;
    const item = element.querySelector<HTMLElement>('.card-action-center__item-content')!;
    const tag = element.querySelector<HTMLElement>('ds-tag')!;
    const row = tag.closest<HTMLElement>('.card-action-center__item')!;
    const dividerTrack = element.querySelector<HTMLElement>('.card-action-center__divider')!;
    const divider = dividerTrack.querySelector<HTMLElement>('ds-divider')!;
    const elementBounds = element.getBoundingClientRect();
    const titleStyle = getComputedStyle(title);
    const itemStyle = getComputedStyle(item);
    const rowBounds = row.getBoundingClientRect();
    const tagBounds = tag.getBoundingClientRect();
    const trackBounds = dividerTrack.getBoundingClientRect();
    const dividerBounds = divider.getBoundingClientRect();
    return {
      borderRadius: style.borderRadius,
      titleTextLeft: Math.round(
        title.getBoundingClientRect().left -
          elementBounds.left +
          Number.parseFloat(titleStyle.paddingInlineStart)
      ),
      itemTextLeft: Math.round(
        item.getBoundingClientRect().left -
          elementBounds.left +
          Number.parseFloat(itemStyle.paddingInlineStart)
      ),
      tagInsets: {
        top: Math.round(tagBounds.top - rowBounds.top),
        right: Math.round(rowBounds.right - tagBounds.right),
        bottom: Math.round(rowBounds.bottom - tagBounds.bottom),
      },
      divider: {
        height: trackBounds.height,
        left: Math.round(dividerBounds.left - elementBounds.left),
        right: Math.round(elementBounds.right - dividerBounds.right),
        top: dividerBounds.top - trackBounds.top,
        bottom: trackBounds.bottom - dividerBounds.bottom,
      },
    };
  });

  expect(geometry.borderRadius).toBe('4px');
  expect(geometry.titleTextLeft).toBe(16);
  expect(geometry.itemTextLeft).toBe(16);
  expect(geometry.tagInsets).toEqual({ top: 6, right: 6, bottom: 6 });
  expect(geometry.divider).toEqual({
    height: 32,
    left: 16,
    right: 16,
    top: 15.5,
    bottom: 15.5,
  });
});

test('uses native semantics and emits typed activation details @cross-browser', async ({
  page,
  browserName,
}) => {
  const card = page.locator('#action-center');
  const button = card.getByRole('button', { name: 'Video requests' });
  const link = card.getByRole('link', { name: 'Safety Score trend' });
  const inactive = card.getByRole('button', { name: 'Camera support' });

  await expect(link).toHaveAttribute('href', /\/reports\/safety-score-trend$/);
  await expect(inactive).toBeDisabled();

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const actionCount = await card.locator('.card-action-center__item:not(:disabled)').count();
  for (let index = 0; index < actionCount; index += 1) {
    await page.keyboard.press(
      browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab'
    );
    if (await button.evaluate(element => document.activeElement === element)) break;
  }
  await expect(button).toBeFocused();
  await button.press('Enter');
  await link.click();
  await expect(page).toHaveURL(/card-action-center\.html$/);

  const events = await page.evaluate(
    () =>
      (
        window as typeof window & {
          __cardActionCenterEvents: Array<{
            sectionId: string;
            itemId: string;
            label: string;
            href?: string;
            hasOriginalEvent: boolean;
          }>;
        }
      ).__cardActionCenterEvents
  );
  expect(events).toEqual([
    {
      sectionId: 'links',
      itemId: 'video-requests',
      label: 'Video requests',
      href: undefined,
      hasOriginalEvent: true,
    },
    {
      sectionId: 'reports',
      itemId: 'score-trend',
      label: 'Safety Score trend',
      href: 'http://127.0.0.1:5199/reports/safety-score-trend',
      hasOriginalEvent: true,
    },
  ]);
});

test('paints distinct hover, pressed, and keyboard-focus states', async ({ page }) => {
  const action = page.locator('#action-center').getByRole('button', { name: 'Video requests' });
  const interactionFill = () =>
    action.evaluate(element => getComputedStyle(element, '::after').backgroundColor);

  const restingFill = await interactionFill();
  await action.hover();
  const hoverFill = await interactionFill();
  await page.mouse.down();
  const pressedFill = await interactionFill();
  await page.mouse.up();
  await action.focus();
  const focusOutline = await action.evaluate(
    element => getComputedStyle(element, '::after').outlineWidth
  );

  expect(hoverFill).not.toBe(restingFill);
  expect(pressedFill).not.toBe(restingFill);
  expect(pressedFill).not.toBe(hoverFill);
  expect(Number.parseFloat(focusOutline)).toBeGreaterThan(0);
});
