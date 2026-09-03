import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/card-navigation.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('opens an accessible empty profiles popup and restores keyboard focus @cross-browser', async ({
  page,
}) => {
  const scope = page.getByRole('region', { name: 'Settings scope' });
  const trigger = scope.getByRole('button', { name: 'Organization' });
  await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  await trigger.focus();
  await trigger.press('Enter');
  const popup = page.getByRole('dialog', { name: 'Settings profiles' });
  await expect(popup).toBeFocused();
  await expect(popup).toHaveAccessibleDescription('You have no profiles to manage yet');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(popup.getByRole('menuitem')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(popup).not.toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();
});

test('uses the complete navigation-only card as one native link', async ({ page }) => {
  const card = page.locator('#navigation-only-card');
  const link = card.getByRole('link', {
    name: 'Profiles Manage product settings for groups.',
  });

  await expect(link).toHaveAttribute('href', /\/profiles$/);
  await expect(card.locator('ds-icon')).toHaveJSProperty('name', 'ChevronRight');
  await expect(card.locator('.card-navigation__body')).toHaveCount(0);

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press('Tab');
  await expect(link).toBeFocused();
  await link.press('Enter');

  const events = await page.evaluate(
    () =>
      (
        window as typeof window & {
          __cardNavigationEvents: Array<{ href: string; hasOriginalEvent: boolean }>;
        }
      ).__cardNavigationEvents
  );
  expect(events).toEqual([{ href: 'http://127.0.0.1:5199/profiles', hasOriginalEvent: true }]);
  await expect(page).toHaveURL(/card-navigation\.html$/);
});

test('paints distinct hover, pressed, and keyboard-focus states', async ({ page }) => {
  const link = page
    .locator('#navigation-only-card')
    .getByRole('link', { name: 'Profiles Manage product settings for groups.' });
  const interactionFill = () =>
    link.evaluate(element => getComputedStyle(element, '::after').backgroundColor);

  await page.keyboard.press('Tab');
  await expect(link).toBeFocused();
  const focusOutline = await link.evaluate(
    element => getComputedStyle(element, '::after').outlineWidth
  );
  expect(Number.parseFloat(focusOutline)).toBeGreaterThan(0);

  const restingFill = await interactionFill();
  await link.hover();
  const hoverFill = await interactionFill();
  await page.mouse.down();
  const pressedFill = await interactionFill();
  await page.mouse.up();

  expect(hoverFill).not.toBe(restingFill);
  expect(pressedFill).not.toBe(restingFill);
  expect(pressedFill).not.toBe(hoverFill);
});

test('keeps projected content outside the header link', async ({ page }) => {
  const card = page.locator('#content-card');
  const link = card.getByRole('link', {
    name: 'Coaching Choose how you want to coach your drivers.',
  });
  const bodyAction = card.getByRole('button', { name: 'Body action' });

  await expect(link).toBeVisible();
  await expect(bodyAction).toBeVisible();
  await expect(link.locator('button')).toHaveCount(0);

  const geometry = await card.evaluate(element => {
    const style = getComputedStyle(element);
    const linkElement = element.querySelector<HTMLElement>('.card-navigation__header')!;
    const body = element.querySelector<HTMLElement>('.card-navigation__body')!;
    return {
      width: element.getBoundingClientRect().width,
      expectedWidth: Number.parseFloat(style.getPropertyValue('--dimension-card-width-sm')),
      minHeight: Number.parseFloat(style.minHeight),
      expectedMinHeight: Number.parseFloat(style.getPropertyValue('--dimension-card-height-sm')),
      headerBottom: linkElement.getBoundingClientRect().bottom,
      bodyTop: body.getBoundingClientRect().top,
    };
  });

  expect(geometry.width).toBe(geometry.expectedWidth);
  expect(geometry.minHeight).toBe(geometry.expectedMinHeight);
  expect(geometry.bodyTop).toBeCloseTo(geometry.headerBottom, 1);
});
