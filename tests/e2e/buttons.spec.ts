import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { chromiumOnly } from './browser-tier';

const loadingAxe = chromiumOnly(
  'accessibility',
  'Axe audits the integrated loading-state matrix in Chromium; loading semantics retain dedicated rendered coverage.'
);

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

test('unfilled buttons only own a tooltip for the collapsible table-caption contract', async ({
  page,
}) => {
  await expect(page.locator('#unfilled-label > ds-tooltip')).toHaveCount(0);
  await expect(page.locator('#unfilled-collapsible-label > ds-tooltip')).toHaveCount(1);
});

test('filled lg consumes the complete 40px control recipe', async ({ page }) => {
  const metrics = await page.locator('#filled-lg').evaluate(element => {
    const button = element.querySelector<HTMLElement>('button')!;
    const icon = element.querySelector<HTMLElement>('.button-filled__icon-wrap')!;
    const label = element.querySelector<HTMLElement>('.button-filled__label')!;
    const labelStyle = getComputedStyle(label);
    return {
      height: Math.round(button.getBoundingClientRect().height),
      icon: Math.round(icon.getBoundingClientRect().width),
      lineHeight: labelStyle.lineHeight,
      paddingInlineStart: labelStyle.paddingInlineStart,
    };
  });

  expect(metrics).toEqual({
    height: 40,
    icon: 24,
    lineHeight: '24px',
    paddingInlineStart: '4px',
  });
});

test('supports emphasized and regular labels across both button families', async ({ page }) => {
  for (const id of ['filled-label', 'unfilled-label']) {
    const host = page.locator(`#${id}`);
    const label = host.locator('.ds-button__label');

    await expect(host).toHaveJSProperty('labelEmphasis', true);
    await expect(label).toHaveJSProperty('emphasis', true);
    await expect(label).toHaveCSS('font-weight', '500');

    await host.evaluate(element => {
      (element as HTMLElement & { labelEmphasis: boolean }).labelEmphasis = false;
    });

    await expect(label).toHaveJSProperty('emphasis', false);
    await expect(label).toHaveCSS('font-weight', '400');
  }
});

test('filled and unfilled buttons opt into the inset density recipe', async ({ page }) => {
  for (const id of ['filled-inset-md', 'unfilled-inset-md']) {
    const host = page.locator(`#${id}`);
    const button = host.locator('button');
    await expect(host).toHaveJSProperty('isInset', true);
    await expect(host).toHaveCSS('width', '28px');
    await expect(host).toHaveCSS('height', '28px');
    await expect(button).toHaveCSS('width', '28px');
    await expect(button).toHaveCSS('height', '28px');
    await expect(button).toHaveClass(/ds-control--inset/);
  }

  for (const id of ['filled-double-inset-md', 'unfilled-double-inset-md']) {
    const host = page.locator(`#${id}`);
    const button = host.locator('button');
    await expect(host).toHaveJSProperty('isInset', true);
    await expect(host).toHaveJSProperty('insetDepth', 'double');
    await expect(host).toHaveCSS('width', '24px');
    await expect(host).toHaveCSS('height', '24px');
    await expect(button).toHaveCSS('width', '24px');
    await expect(button).toHaveCSS('height', '24px');
    await expect(button).toHaveClass(/ds-control--inset-double/);
  }
});

test('hug buttons preserve parent-owned cross-axis alignment @pr-critical', async ({ page }) => {
  const column = page.locator('#hug-column');
  const columnWidth = await column.evaluate(element => element.getBoundingClientRect().width);
  for (const id of ['filled-hug-column', 'unfilled-hug-column']) {
    const button = page.locator(`#${id}`);
    await expect(button).toHaveCSS('align-self', 'auto');
    const width = await button.evaluate(element => element.getBoundingClientRect().width);
    expect(width).toBeLessThan(columnWidth);
  }

  const row = page.locator('#hug-centered-row');
  const rowBox = await row.boundingBox();
  expect(rowBox).not.toBeNull();
  for (const id of ['filled-centered', 'unfilled-centered']) {
    const button = page.locator(`#${id}`);
    const buttonBox = await button.boundingBox();
    expect(buttonBox).not.toBeNull();
    expect(buttonBox!.y + buttonBox!.height / 2).toBeCloseTo(rowBox!.y + rowBox!.height / 2, 1);
  }
});

test('physical press scales only eligible filled and unfilled buttons', async ({ page }) => {
  for (const id of ['filled-label', 'unfilled-label']) {
    const button = page.locator(`#${id} button`);
    await expect(button).toHaveClass(/ds-control-press-scale/);
    await expect(button).toHaveCSS('scale', 'none');

    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await expect(button).toHaveCSS('scale', '0.99');
    await page.mouse.up();
    await expect(button).toHaveCSS('scale', 'none');
  }

  for (const id of ['filled-inactive', 'unfilled-inactive']) {
    const button = page.locator(`#${id} button`);
    await expect(button).toHaveCSS('scale', 'none');
  }

  await page.locator('#filled-label').evaluate(element => {
    (element as HTMLElement & { isLoading: boolean }).isLoading = true;
  });
  const loadingButton = page.locator('#filled-label button');
  const loadingBox = await loadingButton.boundingBox();
  expect(loadingBox).not.toBeNull();
  await page.mouse.move(
    loadingBox!.x + loadingBox!.width / 2,
    loadingBox!.y + loadingBox!.height / 2
  );
  await page.mouse.down();
  await expect(loadingButton).toHaveCSS('scale', 'none');
  await page.mouse.up();

  const stableHost = page.locator('#unfilled-no-press-scale');
  const stableButton = stableHost.locator('button');
  await expect(stableHost).toHaveJSProperty('pressScale', false);
  await expect(stableButton).not.toHaveClass(/ds-control-press-scale/);
  const stableBox = await stableButton.boundingBox();
  expect(stableBox).not.toBeNull();
  await page.mouse.move(stableBox!.x + stableBox!.width / 2, stableBox!.y + stableBox!.height / 2);
  await page.mouse.down();
  await expect(stableButton).toHaveCSS('scale', 'none');
  await page.mouse.up();
});

test('reduced motion keeps physical press at resting scale', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const button = page.locator('#filled-label button');
  const box = await button.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await expect(button).toHaveCSS('scale', 'none');
  await expect(button).toHaveCSS('transition', 'none');
  await page.mouse.up();
});

test('release outside and keyboard activation always restore resting scale', async ({ page }) => {
  const button = page.locator('#filled-label button');
  const box = await button.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(button).toHaveCSS('scale', '0.99');
  await page.mouse.move(box.x + box.width + 40, box.y + box.height + 40);
  await page.mouse.up();
  await expect(button).toHaveCSS('scale', 'none');

  await button.focus();
  await button.press('Enter');
  await expect(button).toHaveCSS('scale', 'none');
  await button.press('Space');
  await expect(button).toHaveCSS('scale', 'none');
});

test('loading preserves width, disables activation, and inherits foreground color', async ({
  page,
}) => {
  const before = await page.evaluate(
    ids =>
      Object.fromEntries(
        ids.map(id => {
          const host = document.getElementById(id) as HTMLElement;
          return [id, host.getBoundingClientRect().width];
        })
      ),
    BUTTON_IDS
  );

  await page.evaluate(ids => {
    for (const id of ids) {
      (document.getElementById(id) as HTMLElement & { isLoading: boolean }).isLoading = true;
    }
  }, BUTTON_IDS);

  for (const id of BUTTON_IDS) {
    const host = page.locator(`#${id}`);
    const button = host.locator('button');
    await expect(button).not.toHaveAttribute('disabled');
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button).not.toHaveClass(/ds-control-inactive/);
    await expect(host.locator('ds-loader')).toHaveCount(1);
  }

  const state = await page.evaluate(
    ids =>
      Object.fromEntries(
        ids.map(id => {
          const host = document.getElementById(id) as HTMLElement;
          const button = host.querySelector('button') as HTMLButtonElement;
          const loader = host.querySelector('ds-loader') as HTMLElement;
          const spinner = loader.shadowRoot?.querySelector('.loader') as HTMLElement;
          button.click();
          return [
            id,
            {
              width: host.getBoundingClientRect().width,
              buttonColor: getComputedStyle(button).color,
              loaderColor: getComputedStyle(spinner).color,
            },
          ];
        })
      ),
    BUTTON_IDS
  );

  for (const id of BUTTON_IDS) {
    expect(state[id].width).toBe(before[id]);
    expect(state[id].loaderColor).toBe(state[id].buttonColor);
  }
  expect(
    await page.evaluate(() => (window as typeof window & { __buttonClicks: number }).__buttonClicks)
  ).toBe(0);
});

test('loading preserves keyboard focus and blocks native form submission', async ({ page }) => {
  const host = page.locator('#filled-submit');
  const button = host.locator('button');
  await button.focus();

  await host.evaluate(element => {
    (element as HTMLElement & { isLoading: boolean }).isLoading = true;
  });

  await expect(button).toBeFocused();
  await expect(button).not.toHaveAttribute('disabled');
  await expect(button).toHaveAttribute('aria-disabled', 'true');
  await button.evaluate(element => (element as HTMLButtonElement).click());
  expect(
    await page.evaluate(() => (window as typeof window & { __formSubmits: number }).__formSubmits)
  ).toBe(0);
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

test('keeps the filled inset border opt-in and visible while inactive', async ({ page }) => {
  const defaultHost = page.locator('#filled-label');
  const defaultButton = defaultHost.locator('button');
  const borderedHost = page.locator('#filled-bordered');
  const borderedButton = borderedHost.locator('button');

  await expect(defaultHost).toHaveJSProperty('hasBorder', false);
  await expect(defaultButton).not.toHaveClass(/button-filled--bordered/);
  await expect(defaultButton).toHaveCSS('--ds-interaction-border-width', '0px');

  await expect(borderedHost).toHaveJSProperty('hasBorder', true);
  await expect(borderedButton).toHaveClass(/button-filled--bordered/);
  const borderWidth = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue('--dimension-stroke-width-012')
      .trim()
  );
  await expect(borderedButton).toHaveCSS('--ds-interaction-border-width', borderWidth);
  await expect
    .poll(() => borderedButton.evaluate(element => getComputedStyle(element, '::after').boxShadow))
    .toContain('inset');

  await borderedHost.evaluate(element => {
    (element as HTMLElement & { isInactive: boolean }).isInactive = true;
  });
  await expect
    .poll(() =>
      borderedButton.evaluate(element => element.classList.contains('ds-interaction-fill'))
    )
    .toBe(false);
  await expect(borderedButton).toHaveCSS('box-shadow', /inset/);
});

test('filled background remaps only the optional inset border color', async ({ page }) => {
  const host = page.locator('#filled-bordered');
  const button = host.locator('button');
  const surfaces = [
    { background: 'faint', token: '--color-border-secondary' },
    { background: 'medium', token: '--color-border-on-medium-background-secondary' },
    { background: 'bold', token: '--color-border-on-bold-background-secondary' },
    { background: 'strong', token: '--color-border-on-strong-background-secondary' },
    { background: 'translucent', token: '--color-translucent-border-secondary' },
    { background: 'inverted', token: '--color-inverted-border-secondary' },
    { background: 'media', token: '--color-media-border-secondary' },
    { background: 'always-dark', token: '--color-always-dark-border-secondary' },
  ] as const;

  const baseline = await button.evaluate(element => {
    const styles = getComputedStyle(element);
    return {
      backgroundColor: styles.backgroundColor,
      color: styles.color,
      hover: styles.getPropertyValue('--ds-interaction-hover'),
      pressed: styles.getPropertyValue('--ds-interaction-pressed'),
      focus: styles.getPropertyValue('--ds-focus-ring-color'),
      stableClasses: [...element.classList]
        .filter(className => !className.startsWith('button-filled--background-'))
        .sort(),
    };
  });

  for (const surface of surfaces) {
    await host.evaluate((element, background) => {
      (element as HTMLElement & { background: string }).background = background;
    }, surface.background);
    await expect(button).toHaveClass(new RegExp(`button-filled--background-${surface.background}`));

    const expectedBorder = await page.evaluate(token => {
      const probe = document.createElement('div');
      probe.style.borderColor = `var(${token})`;
      document.body.append(probe);
      const color = getComputedStyle(probe).borderColor;
      probe.remove();
      return color;
    }, surface.token);

    const state = await button.evaluate(element => {
      const styles = getComputedStyle(element);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        hover: styles.getPropertyValue('--ds-interaction-hover'),
        pressed: styles.getPropertyValue('--ds-interaction-pressed'),
        focus: styles.getPropertyValue('--ds-focus-ring-color'),
        borderShadow: getComputedStyle(element, '::after').boxShadow,
        stableClasses: [...element.classList]
          .filter(className => !className.startsWith('button-filled--background-'))
          .sort(),
      };
    });

    expect(state).toMatchObject({
      ...baseline,
      borderShadow: expect.stringContaining(expectedBorder),
    });
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
  const resolveColor = (token: string) =>
    page.evaluate(cssToken => {
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
  await expect
    .poll(() => button.evaluate(element => getComputedStyle(element, '::before').backgroundColor))
    .toBe(await resolveColor('--color-interaction-active-brand'));

  await host.evaluate(element => {
    (element as HTMLElement & { background: string }).background = 'faint';
  });
  await expect
    .poll(() => button.evaluate(element => getComputedStyle(element, '::before').backgroundColor))
    .toBe(await resolveColor('--color-interaction-active'));
});

test('keeps popup triggers visibly pressed when expanded without creating selected fill', async ({
  page,
}) => {
  const host = page.locator('#unfilled-icon');
  const button = host.locator('button');
  const tokens = await page.evaluate(() => {
    const probe = document.createElement('div');
    document.body.append(probe);
    const resolve = (property: string, token: string) => {
      probe.style.setProperty(property, `var(${token})`);
      return getComputedStyle(probe).getPropertyValue(property);
    };
    const result = {
      secondary: resolve('color', '--color-foreground-secondary'),
      pressed: resolve('background-color', '--color-interaction-pressed'),
    };
    probe.remove();
    return result;
  });

  await host.evaluate(element => {
    const control = element as HTMLElement & {
      activeFill: boolean;
      expanded: boolean;
      haspopup: 'menu';
    };
    control.activeFill = false;
    control.haspopup = 'menu';
    control.expanded = true;
  });

  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(button).toHaveClass(/button-unfilled--expanded/);
  await expect(button).not.toHaveClass(/button-unfilled--active/);
  await expect(button).not.toHaveClass(/ds-interaction-fill--selected/);
  await expect
    .poll(() => button.evaluate(element => getComputedStyle(element).transitionProperty))
    .not.toContain('color');
  await expect(button).toHaveCSS('color', tokens.secondary);
  await expect
    .poll(() => button.evaluate(element => getComputedStyle(element, '::after').backgroundColor))
    .toBe(tokens.pressed);
});

test('icon-label chrome active promotes the complete control foreground', async ({ page }) => {
  const host = page.locator('#unfilled-icon-label');
  const button = host.locator('button');
  const tokens = await page.evaluate(() => {
    const probe = document.createElement('div');
    document.body.append(probe);
    const resolve = (token: string) => {
      probe.style.color = `var(${token})`;
      return getComputedStyle(probe).color;
    };
    const result = {
      primary: resolve('--color-foreground-primary'),
      secondary: resolve('--color-foreground-secondary'),
    };
    probe.remove();
    return result;
  });

  await host.evaluate(element => {
    const control = element as HTMLElement & {
      activeFill: boolean;
      hasMenu: boolean;
      isActive: boolean;
    };
    control.activeFill = false;
    control.hasMenu = true;
    control.isActive = true;
  });

  await expect(button).toHaveClass(/button-unfilled--icon-label/);
  await expect(button).toHaveClass(/button-unfilled--active/);
  await expect(button).not.toHaveClass(/ds-interaction-fill--selected/);
  await expect(button).toHaveCSS('color', tokens.primary);
  await expect(button.locator('.button-unfilled__label')).toHaveCSS('color', tokens.primary);
  await expect(button.locator('.button-unfilled__icon-wrap')).toHaveCSS('color', tokens.primary);
  await expect(button.locator('.button-unfilled__chevron')).toHaveCSS('color', tokens.primary);
});

test('icon chrome active promotes the glyph foreground', async ({ page }) => {
  const host = page.locator('#unfilled-icon');
  const button = host.locator('button');
  const tokens = await page.evaluate(() => {
    const probe = document.createElement('div');
    document.body.append(probe);
    const resolve = (token: string) => {
      probe.style.color = `var(${token})`;
      return getComputedStyle(probe).color;
    };
    const result = {
      primary: resolve('--color-foreground-primary'),
      secondary: resolve('--color-foreground-secondary'),
    };
    probe.remove();
    return result;
  });

  await host.evaluate(element => {
    const control = element as HTMLElement & { activeFill: boolean; isActive: boolean };
    control.activeFill = false;
    control.isActive = true;
  });

  await expect(button).toHaveClass(/button-unfilled--icon/);
  await expect(button).toHaveClass(/button-unfilled--active/);
  await expect(button).toHaveCSS('color', tokens.primary);
  await expect(button.locator('.button-unfilled__icon-wrap')).toHaveCSS('color', tokens.primary);
});

test('keeps expanded disclosure buttons visually neutral', async ({ page }) => {
  const host = page.locator('#unfilled-icon');
  const button = host.locator('button');

  await host.evaluate(element => {
    (element as HTMLElement & { expanded: boolean }).expanded = true;
  });

  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(button).not.toHaveClass(/button-unfilled--active/);
  await expect(button).not.toHaveClass(/button-unfilled--expanded/);
  await expect(button).not.toHaveClass(/ds-button--expanded/);
});

test('keeps inactive buttons disabled, styled, and non-activating', async ({ page }) => {
  for (const id of ['filled-inactive', 'unfilled-inactive']) {
    const host = page.locator(`#${id}`);
    const button = host.locator('button');
    await expect(button).toBeDisabled();
    await expect(button).toHaveClass(/ds-control-inactive/);
    await expect(button).toHaveCSS('opacity', '0.5');
    await button.click({ force: true });
  }

  expect(
    await page.evaluate(() => (window as typeof window & { __buttonClicks: number }).__buttonClicks)
  ).toBe(0);
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

test('supports the rounded treatment across both button families', async ({ page }) => {
  for (const id of ['filled-icon', 'unfilled-icon']) {
    const host = page.locator(`#${id}`);
    await host.evaluate(element => {
      (element as HTMLElement & { rounded: boolean }).rounded = true;
    });
    await expect(host).toHaveJSProperty('rounded', true);
    await expect(host.locator('button')).toHaveCSS('border-radius', '9999px');
  }
});

test('preserves native submit and reset behavior', async ({ page }) => {
  await page.locator('#filled-submit button').click();
  await page.locator('#unfilled-submit button').click();
  expect(
    await page.evaluate(() => (window as typeof window & { __formSubmits: number }).__formSubmits)
  ).toBe(2);

  await page.locator('#form-value').fill('changed');
  await page.locator('#unfilled-reset button').click();
  await expect(page.locator('#form-value')).toHaveValue('initial');
  expect(
    await page.evaluate(() => (window as typeof window & { __formResets: number }).__formResets)
  ).toBe(1);
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
      await host.evaluate(
        (element, values) => {
          const control = element as HTMLElement & { intent: string; contrast: string };
          control.intent = values.intent;
          control.contrast = values.contrast;
        },
        { intent, contrast }
      );
      await expect(button).toHaveClass(new RegExp(`button-filled--intent-${intent}`));
      await expect(button).toHaveClass(new RegExp(`button-filled--contrast-${contrast}`));
      await expect(button).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    }
  }
});

test('emits controlled toggle intent only for pressed without mutating state', async ({ page }) => {
  const host = page.locator('#unfilled-label');
  const button = host.locator('button');

  await button.click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { __buttonChanges: Array<{ id: string; detail: boolean }> })
            .__buttonChanges
      )
    )
    .toEqual([]);

  await host.evaluate(element => {
    (element as HTMLElement & { pressed?: boolean }).pressed = false;
  });
  await button.click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { __buttonChanges: Array<{ id: string; detail: boolean }> })
            .__buttonChanges
      )
    )
    .toEqual([{ id: 'unfilled-label', detail: true }]);

  expect(
    await host.evaluate(element => (element as HTMLElement & { pressed?: boolean }).pressed)
  ).toBe(false);

  await host.evaluate(element => {
    const control = element as HTMLElement & { pressed?: boolean; isActive: boolean };
    control.pressed = true;
    control.isActive = false;
  });
  await button.click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { __buttonChanges: Array<{ id: string; detail: boolean }> })
            .__buttonChanges
      )
    )
    .toEqual([
      { id: 'unfilled-label', detail: true },
      { id: 'unfilled-label', detail: false },
    ]);
  await expect(button).toHaveAttribute('aria-pressed', 'true');
});

test('requires an explicit accessible name for icon-only buttons', async ({ page }) => {
  for (const tag of ['ds-button-filled', 'ds-button-unfilled']) {
    const id = `unnamed-${tag}`;
    await page.evaluate(
      ({ componentTag, componentId }) => {
        const element = document.createElement(componentTag) as HTMLElement & {
          variant: string;
          icon: string;
        };
        element.id = componentId;
        element.variant = 'icon';
        element.icon = 'Check';
        document.body.append(element);
      },
      { componentTag: tag, componentId: id }
    );

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

test('has no detectable accessibility violations while loading', loadingAxe, async ({ page }) => {
  await page.evaluate(ids => {
    for (const id of ids) {
      (document.getElementById(id) as HTMLElement & { isLoading: boolean }).isLoading = true;
    }
  }, BUTTON_IDS);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
