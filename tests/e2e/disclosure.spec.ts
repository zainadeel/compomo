import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/disclosure.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

const toggles = (page: Page) =>
  page.evaluate(() => (window as unknown as { disclosureToggles: boolean[] }).disclosureToggles);

const center = (box: { x: number; y: number; width: number; height: number }) => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
});

test('heading, trailing status, count, then the chevron on the row inset @pr-critical', async ({
  page,
}) => {
  const host = page.locator('#alerts');
  const [hostBox, headerBox, titleBox, countBox, chevronBox, actionBox] = await Promise.all([
    host.boundingBox(),
    host.locator('.disclosure-header').boundingBox(),
    host.locator('.disclosure-title').boundingBox(),
    host.locator('.disclosure-count').boundingBox(),
    host.locator('.disclosure-chevron').boundingBox(),
    page.locator('#alerts-action').boundingBox(),
  ]);
  expect(Math.round(headerBox!.height)).toBe(48);
  expect(Math.round(titleBox!.x - hostBox!.x)).toBe(16);
  expect(Math.round(hostBox!.x + hostBox!.width - (chevronBox!.x + chevronBox!.width))).toBe(16);
  expect(Math.round(countBox!.x - (actionBox!.x + actionBox!.width))).toBe(8);
  expect(Math.round(chevronBox!.x - (countBox!.x + countBox!.width))).toBe(8);
  expect(Math.round(center(titleBox!).y)).toBe(Math.round(center(headerBox!).y));
  expect(Math.round(center(chevronBox!).y)).toBe(Math.round(center(headerBox!).y));
});

test('the count is the trigger description and toggles like the chevron', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Alerts' });
  await expect(trigger).toHaveAccessibleDescription('3');
  const count = await page.locator('#alerts .disclosure-count').boundingBox();
  await page.mouse.click(center(count!).x, center(count!).y);
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  expect(await toggles(page)).toEqual([true]);
});

test('the chevron toggles and content aligns with the heading', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Alerts' });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#alerts-content')).not.toBeVisible();

  const chevron = await page.locator('#alerts .disclosure-chevron').boundingBox();
  await page.mouse.click(center(chevron!).x, center(chevron!).y);
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#alerts-content')).toBeVisible();
  expect(await toggles(page)).toEqual([true]);

  const [titleBox, contentBox] = await Promise.all([
    page.locator('#alerts .disclosure-title').boundingBox(),
    page.locator('#alerts-content').boundingBox(),
  ]);
  expect(Math.round(contentBox!.x)).toBe(Math.round(titleBox!.x));
});

test('trailing content keeps its own activation', async ({ page }) => {
  const clicks = await page.evaluate(() => {
    const action = document.getElementById('alerts-action')!;
    const count = { value: 0 };
    action.addEventListener('click', () => count.value++);
    (window as unknown as { actionClicks: { value: number } }).actionClicks = count;
    return count.value;
  });
  expect(clicks).toBe(0);
  await page.locator('#alerts-action').click();
  expect(
    await page.evaluate(
      () => (window as unknown as { actionClicks: { value: number } }).actionClicks.value
    )
  ).toBe(1);
  await expect(page.getByRole('button', { name: 'Alerts' })).toHaveAttribute(
    'aria-expanded',
    'false'
  );
  expect(await toggles(page)).toEqual([]);
});
