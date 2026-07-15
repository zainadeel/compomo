import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BUTTON_IDS = [
  'filled-label',
  'filled-icon',
  'filled-icon-label',
  'unfilled-label',
  'unfilled-icon',
  'unfilled-icon-label',
] as const;

test.beforeEach(async ({ page }) => {
  await page.goto('/buttons.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('loading preserves width, disables activation, and inherits foreground color', async ({ page }) => {
  const before = await page.evaluate(ids => Object.fromEntries(ids.map(id => {
    const host = document.getElementById(id) as HTMLElement;
    return [id, host.getBoundingClientRect().width];
  })), BUTTON_IDS);

  await page.evaluate(ids => {
    for (const id of ids) {
      (document.getElementById(id) as HTMLElement & { isLoading: boolean }).isLoading = true;
    }
  }, BUTTON_IDS);

  for (const id of BUTTON_IDS) {
    const host = page.locator(`#${id}`);
    const button = host.locator('button');
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button).not.toHaveClass(/ds-control-inactive/);
    await expect(host.locator('ds-loader')).toHaveCount(1);
  }

  const state = await page.evaluate(ids => Object.fromEntries(ids.map(id => {
    const host = document.getElementById(id) as HTMLElement;
    const button = host.querySelector('button') as HTMLButtonElement;
    const loader = host.querySelector('ds-loader') as HTMLElement;
    const spinner = loader.shadowRoot?.querySelector('.loader') as HTMLElement;
    button.click();
    return [id, {
      width: host.getBoundingClientRect().width,
      buttonColor: getComputedStyle(button).color,
      loaderColor: getComputedStyle(spinner).color,
    }];
  })), BUTTON_IDS);

  for (const id of BUTTON_IDS) {
    expect(state[id].width).toBe(before[id]);
    expect(state[id].loaderColor).toBe(state[id].buttonColor);
  }
  expect(await page.evaluate(() => (
    window as typeof window & { __buttonClicks: number }
  ).__buttonClicks)).toBe(0);
});

test('loading swaps the correct content for each variant', async ({ page }) => {
  await page.evaluate(ids => {
    for (const id of ids) {
      (document.getElementById(id) as HTMLElement & { isLoading: boolean }).isLoading = true;
    }
  }, BUTTON_IDS);

  for (const prefix of ['filled', 'unfilled']) {
    const label = page.locator(`#${prefix}-label`);
    await expect(label.locator('ds-text')).toHaveCSS('visibility', 'hidden');
    await expect(label.locator('[class*="loader-overlay"]')).toBeVisible();

    const icon = page.locator(`#${prefix}-icon`);
    await expect(icon.locator('ds-icon')).toHaveCount(0);
    await expect(icon.locator('[class*="icon-wrap"] ds-loader')).toBeVisible();

    const iconLabel = page.locator(`#${prefix}-icon-label`);
    await expect(iconLabel.locator('ds-icon')).toHaveCount(0);
    await expect(iconLabel.locator('[class*="icon-wrap"] ds-loader')).toBeVisible();
    await expect(iconLabel.locator('ds-text')).toHaveCSS('visibility', 'visible');
  }
});

test('uses one background prop for standard and special surfaces', async ({ page }) => {
  const host = page.locator('#unfilled-label');
  const button = host.locator('button');

  const surfaces = [
    { background: 'faint', componentClass: 'button-unfilled--background-faint' },
    { background: 'medium', componentClass: 'button-unfilled--background-medium' },
    { background: 'bold', componentClass: 'button-unfilled--background-bold' },
    { background: 'strong', componentClass: 'button-unfilled--background-strong' },
    { background: 'translucent', componentClass: 'button-unfilled--background-translucent' },
    { background: 'inverted', componentClass: 'button-unfilled--background-inverted' },
    { background: 'media', componentClass: 'button-unfilled--background-media' },
    { background: 'always-dark', componentClass: 'button-unfilled--on-always-dark' },
  ] as const;

  for (const surface of surfaces) {
    await host.evaluate((element, background) => {
      (element as HTMLElement & { background: string }).background = background;
    }, surface.background);
    await expect(button).toHaveClass(new RegExp(surface.componentClass));
    await expect(button).toHaveClass(new RegExp(`ds-interaction-fill--on-${surface.background}`));
  }
});

test('uses brand active by default and neutral active on faint surfaces', async ({ page }) => {
  const host = page.locator('#unfilled-label');
  const button = host.locator('button');
  const resolveColor = (token: string) => page.evaluate(cssToken => {
    const probe = document.createElement('div');
    probe.style.backgroundColor = `var(${cssToken})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  }, token);

  await host.evaluate(element => {
    const control = element as HTMLElement & { background?: string; isActive: boolean };
    control.background = undefined;
    control.isActive = true;
  });
  await expect.poll(() => button.evaluate(element => (
    getComputedStyle(element, '::before').backgroundColor
  ))).toBe(await resolveColor('--color-interaction-active-brand'));

  await host.evaluate(element => {
    (element as HTMLElement & { background: string }).background = 'faint';
  });
  await expect.poll(() => button.evaluate(element => (
    getComputedStyle(element, '::before').backgroundColor
  ))).toBe(await resolveColor('--color-interaction-active'));
});

test('has no detectable accessibility violations while loading', async ({ page }) => {
  await page.evaluate(ids => {
    for (const id of ids) {
      (document.getElementById(id) as HTMLElement & { isLoading: boolean }).isLoading = true;
    }
  }, BUTTON_IDS);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
