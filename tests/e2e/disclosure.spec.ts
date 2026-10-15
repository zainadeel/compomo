import { expect, test, type Page } from '@playwright/test';
import { chromiumOnly } from './browser-tier';

test.beforeEach(async ({ page }) => {
  await page.goto('/disclosure.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

type Counters = { disclosureToggles: boolean[]; ownerClicks: number };
const counters = (page: Page) =>
  page.evaluate(() => {
    const { disclosureToggles, ownerClicks } = window as unknown as Counters;
    return { disclosureToggles, ownerClicks };
  });

test('the trigger is a hugging button with a leading chevron @pr-critical', async ({ page }) => {
  const host = page.locator('#snapshot');
  const trigger = page.getByRole('button', { name: 'View JSON snapshot' });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(host.locator('ds-icon')).toHaveJSProperty('name', 'ChevronRight');

  const [hostBox, triggerBox, iconBox, contentBox] = await Promise.all([
    host.boundingBox(),
    trigger.boundingBox(),
    host.locator('ds-icon').boundingBox(),
    page.getByText('View JSON snapshot').boundingBox(),
  ]);
  expect(Math.round(triggerBox!.x)).toBe(Math.round(hostBox!.x));
  expect(triggerBox!.width).toBeLessThan(hostBox!.width);
  expect(iconBox!.x).toBeLessThan(contentBox!.x);
  // No container styling: the host paints nothing of its own.
  await expect(host).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(host).toHaveCSS('border-top-width', '0px');
});

test('activation reveals content below the trigger', async ({ page }) => {
  const host = page.locator('#snapshot');
  const trigger = page.getByRole('button', { name: 'View JSON snapshot' });
  const content = page.locator('#snapshot-content');
  await expect(content).not.toBeVisible();

  await trigger.focus();
  await trigger.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(host.locator('ds-icon')).toHaveJSProperty('name', 'ChevronDown');
  await expect(content).toBeVisible();
  await expect(page.getByRole('region', { name: 'View JSON snapshot' })).toBeVisible();

  const [hostBox, triggerBox, contentBox] = await Promise.all([
    host.boundingBox(),
    trigger.boundingBox(),
    content.boundingBox(),
  ]);
  expect(Math.round(contentBox!.x)).toBe(Math.round(hostBox!.x));
  expect(Math.round(contentBox!.y - (triggerBox!.y + triggerBox!.height))).toBe(8);
  expect(await counters(page)).toEqual({ disclosureToggles: [true], ownerClicks: 0 });

  await trigger.press('Enter');
  await expect(content).not.toBeVisible();
  expect((await counters(page)).disclosureToggles).toEqual([true, false]);
});

test(
  'collapsed content is skipped by Tab',
  chromiumOnly('interaction', 'macOS WebKit does not move Tab focus to buttons by default.'),
  async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'View JSON snapshot' });
    await trigger.focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#after')).toBeFocused();
  }
);

test('open content follows a hiding ancestor', async ({ page }) => {
  await page.locator('#snapshot').evaluate(element => {
    (element as HTMLElement & { open: boolean }).open = true;
  });
  await expect(page.locator('#snapshot-content')).toBeVisible();
  await page.locator('#owner').evaluate(element => {
    element.style.visibility = 'hidden';
  });
  await expect(page.locator('#snapshot-content')).toBeHidden();
});
