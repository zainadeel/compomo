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

test('keeps inactive buttons disabled, styled, and non-activating', async ({ page }) => {
  for (const id of ['filled-inactive', 'unfilled-inactive']) {
    const host = page.locator(`#${id}`);
    const button = host.locator('button');
    await expect(button).toBeDisabled();
    await expect(button).toHaveClass(/ds-control-inactive/);
    await expect(button).toHaveCSS('opacity', '0.25');
    await button.click({ force: true });
  }

  expect(await page.evaluate(() => (
    window as typeof window & { __buttonClicks: number }
  ).__buttonClicks)).toBe(0);
});

test('setFocus targets the native button for both button families', async ({ page }) => {
  for (const id of ['filled-label', 'unfilled-label']) {
    const host = page.locator(`#${id}`);
    await host.evaluate(async element => {
      await (element as HTMLElement & { setFocus(): Promise<void> }).setFocus();
    });
    await expect(host.locator('button')).toBeFocused();
  }
});

test('preserves native submit and reset behavior', async ({ page }) => {
  await page.locator('#filled-submit button').click();
  await page.locator('#unfilled-submit button').click();
  expect(await page.evaluate(() => (
    window as typeof window & { __formSubmits: number }
  ).__formSubmits)).toBe(2);

  await page.locator('#form-value').fill('changed');
  await page.locator('#unfilled-reset button').click();
  await expect(page.locator('#form-value')).toHaveValue('initial');
  expect(await page.evaluate(() => (
    window as typeof window & { __formResets: number }
  ).__formResets)).toBe(1);
});

test('maps every filled intent and contrast recipe', async ({ page }) => {
  const host = page.locator('#filled-label');
  const button = host.locator('button');
  const intents = [
    'neutral',
    'brand',
    'ai',
    'negative',
    'warning',
    'caution',
    'positive',
    'guide',
    'walkthrough',
  ] as const;
  const contrasts = ['bold', 'strong', 'medium', 'faint'] as const;

  for (const intent of intents) {
    for (const contrast of contrasts) {
      await host.evaluate((element, values) => {
        const control = element as HTMLElement & { intent: string; contrast: string };
        control.intent = values.intent;
        control.contrast = values.contrast;
      }, { intent, contrast });
      await expect(button).toHaveClass(new RegExp(`button-filled--intent-${intent}`));
      if (contrast === 'bold') {
        await expect(button).not.toHaveClass(/button-filled--contrast-/);
      } else {
        await expect(button).toHaveClass(new RegExp(`button-filled--contrast-${contrast}`));
      }
      await expect(button).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    }
  }
});

test('emits controlled unfilled toggle intent without mutating isActive', async ({ page }) => {
  const host = page.locator('#unfilled-label');
  const button = host.locator('button');

  await button.click();
  await expect.poll(() => page.evaluate(() => (
    window as typeof window & { __buttonChanges: Array<{ id: string; detail: boolean }> }
  ).__buttonChanges)).toEqual([{ id: 'unfilled-label', detail: true }]);
  expect(await host.evaluate(element => (
    (element as HTMLElement & { isActive: boolean }).isActive
  ))).toBe(false);

  await host.evaluate(element => {
    (element as HTMLElement & { isActive: boolean }).isActive = true;
  });
  await button.click();
  await expect.poll(() => page.evaluate(() => (
    window as typeof window & { __buttonChanges: Array<{ id: string; detail: boolean }> }
  ).__buttonChanges)).toEqual([
    { id: 'unfilled-label', detail: true },
    { id: 'unfilled-label', detail: false },
  ]);
  expect(await host.evaluate(element => (
    (element as HTMLElement & { isActive: boolean }).isActive
  ))).toBe(true);
});

test('requires an explicit accessible name for icon-only buttons', async ({ page }) => {
  for (const tag of ['ds-button-filled', 'ds-button-unfilled']) {
    const id = `unnamed-${tag}`;
    await page.evaluate(({ componentTag, componentId }) => {
      const element = document.createElement(componentTag) as HTMLElement & {
        variant: string;
        icon: string;
      };
      element.id = componentId;
      element.variant = 'icon';
      element.icon = 'Check';
      document.body.append(element);
    }, { componentTag: tag, componentId: id });

    const host = page.locator(`#${id}`);
    const button = host.locator('button');
    await expect(button).not.toHaveAttribute('aria-label');
    await expect(button).toHaveAccessibleName('');

    await host.evaluate(element => {
      (element as HTMLElement & { ariaLabel: string }).ariaLabel = 'Confirm action';
    });
    await expect(button).toHaveAccessibleName('Confirm action');
  }
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
