import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/button-inverted.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('uses the fixed inverted recipe with filled-button geometry @cross-browser', async ({
  page,
}) => {
  const host = page.locator('#label');
  const button = host.locator('button');
  const tokens = await page.evaluate(() => {
    const probe = document.createElement('div');
    document.body.append(probe);
    const resolve = (property: string, token: string) => {
      probe.style.setProperty(property, `var(${token})`);
      return getComputedStyle(probe).getPropertyValue(property);
    };
    const result = {
      background: resolve('background-color', '--color-inverted-background'),
      foreground: resolve('color', '--color-inverted-foreground-primary'),
      hover: resolve('background-color', '--color-inverted-interaction-hover'),
      focus: resolve('outline-color', '--color-inverted-interaction-focus'),
    };
    probe.remove();
    return result;
  });

  await expect(host).toHaveClass(/button-inverted-host/);
  await expect(button).toHaveClass(/ds-interaction-fill/);
  await expect(button).toHaveClass(/ds-interaction-fill--on-inverted/);
  await expect(button).not.toHaveClass(/button-inverted--(?:intent|contrast)/);
  await expect(button).toHaveCSS('background-color', tokens.background);
  await expect(button).toHaveCSS('color', tokens.foreground);
  await expect(button).toHaveCSS('height', '32px');

  await button.hover();
  await expect
    .poll(() => button.evaluate(element => getComputedStyle(element, '::after').backgroundColor))
    .toBe(tokens.hover);

  await button.focus();
  await expect(button).toBeFocused();
  await expect
    .poll(() => button.evaluate(element => getComputedStyle(element, '::after').outlineColor))
    .toBe(tokens.focus);
});

test('keeps content variants, accessible names, loading, and inactive behavior', async ({
  page,
}) => {
  await expect(page.locator('#label button')).toHaveAccessibleName('Continue');
  await expect(page.locator('#icon button')).toHaveAccessibleName('Continue');
  await expect(page.locator('#icon-label button')).toHaveAccessibleName('Continue');

  const loading = page.locator('#loading');
  const loadingButton = loading.locator('button');
  await expect(loadingButton).toHaveAttribute('aria-busy', 'true');
  await expect(loadingButton).toHaveAttribute('aria-disabled', 'true');
  await expect(loadingButton).not.toHaveAttribute('disabled');
  await expect(loading.locator('ds-loader')).toHaveCount(1);

  const inactive = page.locator('#inactive');
  await expect(inactive.locator('button')).toBeDisabled();
  await expect(inactive.locator('button')).toHaveClass(/ds-control-inactive/);
  await expect(inactive.locator('button')).toHaveCSS('opacity', '0.5');
});

test('keeps split segments on the same inverted recipe and emits separate events @cross-browser', async ({
  page,
}) => {
  const host = page.locator('#split');
  const buttons = host.getByRole('button');
  await expect(buttons).toHaveCount(2);
  await expect(buttons.nth(0)).toHaveAccessibleName('Create');
  await expect(buttons.nth(1)).toHaveAccessibleName('More create options');

  const metrics = await host.evaluate(element => {
    const wrapper = element.querySelector<HTMLElement>('.ds-button-split')!;
    const divider = element.querySelector<HTMLElement>('.ds-button-split__divider')!;
    const [primary, menu] = Array.from(wrapper.querySelectorAll<HTMLElement>('button'));
    return {
      gap: menu.getBoundingClientRect().left - primary.getBoundingClientRect().right,
      primaryBackground: getComputedStyle(primary).backgroundColor,
      menuBackground: getComputedStyle(menu).backgroundColor,
      primaryColor: getComputedStyle(primary).color,
      menuColor: getComputedStyle(menu).color,
      dividerColor: getComputedStyle(divider).borderInlineStartColor,
    };
  });
  const expectedDivider = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.borderColor = 'var(--color-inverted-border-tertiary)';
    document.body.append(probe);
    const color = getComputedStyle(probe).borderColor;
    probe.remove();
    return color;
  });

  expect(Math.abs(metrics.gap)).toBeLessThan(0.01);
  expect(metrics.primaryBackground).toBe(metrics.menuBackground);
  expect(metrics.primaryColor).toBe(metrics.menuColor);
  expect(metrics.dividerColor).toBe(expectedDivider);

  await buttons.nth(0).click();
  await buttons.nth(1).click();
  const counts = await page.evaluate(() => ({
    clicks: (window as typeof window & { __buttonClicks: number }).__buttonClicks,
    menuClicks: (window as typeof window & { __buttonMenuClicks: number }).__buttonMenuClicks,
  }));
  expect(counts.clicks).toBe(1);
  expect(counts.menuClicks).toBe(1);

  await host.evaluate(async element => {
    await (
      element as HTMLElement & { setFocus: (segment: 'primary' | 'menu') => Promise<void> }
    ).setFocus('menu');
  });
  await expect(buttons.nth(1)).toBeFocused();
});
