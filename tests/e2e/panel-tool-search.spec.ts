import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/panel-tool-search.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('renders the complete md content recipe independently of inherited page text', async ({
  page,
}) => {
  const search = page.locator('#search');
  const input = search.getByRole('searchbox', { name: 'Search chats' });
  const control = search.locator('.select-search__control');
  const icon = control.locator(':scope > ds-icon');

  await expect(search).toHaveCSS('height', '48px');
  await expect(control).toHaveCSS('height', '32px');
  await expect(input).toHaveCSS('font-size', '14px');
  await expect(input).toHaveCSS('line-height', '20px');

  const iconBox = await icon.boundingBox();
  expect(iconBox?.width).toBe(20);
  expect(iconBox?.height).toBe(20);
});

test('keeps the search icon secondary while focused and filled', async ({ page }) => {
  const search = page.locator('#search');
  const input = search.getByRole('searchbox', { name: 'Search chats' });
  const icon = search.locator('.select-search__control > ds-icon');
  const secondaryColor = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-foreground-secondary)';
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });

  await expect(icon).toHaveCSS('color', secondaryColor);
  await input.fill('Focused query');
  await expect(input).toBeFocused();
  await expect(icon).toHaveCSS('color', secondaryColor);
});

test('keeps the container divider unchanged while the input is focused', async ({ page }) => {
  const search = page.locator('#search');
  const input = search.getByRole('searchbox', { name: 'Search chats' });
  const dividerBefore = await search.locator('.panel-tool-search').evaluate(element => {
    const style = getComputedStyle(element, '::after');
    return { height: style.height, color: style.backgroundColor };
  });

  await input.focus();
  const dividerAfter = await search.locator('.panel-tool-search').evaluate(element => {
    const style = getComputedStyle(element, '::after');
    return { height: style.height, color: style.backgroundColor };
  });

  expect(dividerAfter).toEqual(dividerBefore);
});

test('keeps 8px gaps around the divider and a borderless md filter trigger', async ({ page }) => {
  const frame = page.locator('#filter-frame');
  const search = page.locator('#search-with-filter');
  const control = search.locator('.select-search__control');
  const divider = search.locator('ds-divider');
  const trigger = search.locator('#message-filter-trigger');
  const icon = trigger.locator('ds-icon');
  const svg = icon.locator('svg');

  const [frameBox, searchBox, controlBox, dividerBox, triggerBox] = await Promise.all([
    frame.boundingBox(),
    search.boundingBox(),
    control.boundingBox(),
    divider.boundingBox(),
    trigger.boundingBox(),
  ]);

  expect(frameBox).not.toBeNull();
  expect(searchBox).not.toBeNull();
  expect(controlBox).not.toBeNull();
  expect(dividerBox).not.toBeNull();
  expect(triggerBox).not.toBeNull();
  expect(Math.round(dividerBox!.x - (controlBox!.x + controlBox!.width))).toBe(8);
  expect(Math.round(triggerBox!.x - (dividerBox!.x + dividerBox!.width))).toBe(8);
  expect(dividerBox!.height).toBe(16);
  expect(triggerBox!.width).toBe(32);
  expect(triggerBox!.height).toBe(32);
  expect(searchBox!.width).toBe(frameBox!.width);
  expect(Math.round(searchBox!.x + searchBox!.width - (triggerBox!.x + triggerBox!.width))).toBe(8);
  await expect(trigger.locator('button')).toHaveCSS('border-width', '0px');
  await expect
    .poll(() =>
      trigger
        .locator('ds-icon')
        .evaluate(icon => (icon as HTMLElement & { name?: string }).name ?? '')
    )
    .toBe('Filters');

  const [iconBox, svgBox] = await Promise.all([icon.boundingBox(), svg.boundingBox()]);
  expect(iconBox).toMatchObject({ width: 20, height: 20 });
  expect(svgBox).toMatchObject({ width: 20, height: 20 });
  await expect(svg).toHaveAttribute('viewBox', '0 0 16 16');
});

test('exposes the filter trigger menu relationship and emits toggle intent', async ({ page }) => {
  const search = page.locator('#search-with-filter');
  const trigger = search.getByRole('button', { name: 'Filter messages' });
  const toggles = search.evaluate(element => {
    let count = 0;
    let searchChangeCount = 0;
    element.addEventListener('dsFilterToggle', () => count++);
    element.addEventListener('dsChange', () => searchChangeCount++);
    (element as HTMLElement & { getToggleCount?: () => number }).getToggleCount = () => count;
    (element as HTMLElement & { getSearchChangeCount?: () => number }).getSearchChangeCount = () =>
      searchChangeCount;
  });
  await toggles;

  await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
  await expect(trigger).toHaveAttribute('aria-controls', 'message-filter-menu');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  await expect
    .poll(() =>
      search.evaluate(
        element =>
          (element as HTMLElement & { getToggleCount?: () => number }).getToggleCount?.() ?? 0
      )
    )
    .toBe(1);
  await expect
    .poll(() =>
      search.evaluate(
        element =>
          (
            element as HTMLElement & { getSearchChangeCount?: () => number }
          ).getSearchChangeCount?.() ?? 0
      )
    )
    .toBe(0);
});
