import { expect, test, type Page } from '@playwright/test';

test.use({ forcedColors: 'active' });

async function openFixture(page: Page, path: string, browserName: string) {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto(path);
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const supported = await page.evaluate(
    () =>
      window.matchMedia('(forced-colors: active)').matches &&
      CSS.supports('forced-color-adjust', 'auto')
  );
  test.skip(!supported, `${browserName} does not implement forced-colors CSS emulation`);
}

async function systemColors(page: Page) {
  return page.evaluate(() => {
    const probe = document.createElement('span');
    document.body.append(probe);
    const resolve = (color: string) => {
      probe.style.color = color;
      return getComputedStyle(probe).color;
    };
    const colors = {
      canvas: resolve('Canvas'),
      canvasText: resolve('CanvasText'),
      buttonText: resolve('ButtonText'),
      highlight: resolve('Highlight'),
      highlightText: resolve('HighlightText'),
      grayText: resolve('GrayText'),
    };
    probe.remove();
    return colors;
  });
}

test('preserves control boundaries, state, focus, invalid, and disabled meaning', async ({
  page,
  browserName,
}) => {
  await openFixture(page, '/forms.html', browserName);
  const colors = await systemColors(page);

  const checkbox = page.locator('#terms');
  const checkboxBox = checkbox.locator('.box');
  await expect(checkboxBox).toHaveCSS('border-top-style', 'solid');
  expect(
    await checkboxBox.evaluate(element =>
      Number.parseFloat(getComputedStyle(element).borderTopWidth)
    )
  ).toBeGreaterThan(0);
  await checkbox.click();
  await expect(checkbox).toHaveAttribute('aria-checked', 'true');
  await expect(checkboxBox).toHaveCSS('background-color', colors.highlight);
  await expect(checkboxBox).toHaveCSS('color', colors.highlightText);

  const radio = page.locator('#tier [role="radio"]').first();
  await radio.click();
  await expect(radio).toHaveAttribute('aria-checked', 'true');
  await expect(radio.locator('.radio__circle')).toHaveCSS('background-color', colors.highlight);
  await expect(radio.locator('.radio__dot')).toHaveCSS('background-color', colors.highlightText);

  const switchControl = page.locator('#alerts');
  await expect(switchControl).toHaveCSS('border-top-style', 'solid');
  await switchControl.click();
  await expect(switchControl).toHaveAttribute('aria-checked', 'true');
  await expect(switchControl).toHaveCSS('background-color', colors.highlight);
  await expect(switchControl.locator('.thumb')).toHaveCSS('background-color', colors.highlightText);

  const sliderInput = page.locator('#slider-single .slider__input');
  const sliderThumb = page.locator('#slider-single .slider__thumb-visual');
  await expect(page.locator('#slider-single .slider__rail')).toHaveCSS('border-top-style', 'solid');
  await expect(sliderThumb).toHaveCSS('border-top-color', colors.buttonText);
  await page.locator('#slider-range .slider__input').first().focus();
  await page.keyboard.press('Shift+Tab');
  await expect(sliderInput).toBeFocused();
  await expect(sliderThumb).toHaveCSS('outline-style', 'solid');
  await expect(sliderThumb).toHaveCSS('outline-color', colors.highlight);

  const inputControl = page.locator('#email .input-control');
  const inputIcon = page.locator('#input-md ds-icon');
  await expect(inputIcon).toBeVisible();
  await expect(inputIcon).toHaveCSS('color', colors.canvasText);
  expect(await inputIcon.evaluate(element => getComputedStyle(element).forcedColorAdjust)).not.toBe(
    'none'
  );
  await page.locator('#email input').focus();
  await expect
    .poll(() =>
      inputControl.evaluate(element => {
        const style = getComputedStyle(element, '::after');
        return {
          color: style.outlineColor,
          style: style.outlineStyle,
          width: Number.parseFloat(style.outlineWidth),
        };
      })
    )
    .toEqual({
      color: colors.highlight,
      style: 'solid',
      width: expect.any(Number),
    });
  const focusedBoundaryWidth = await inputControl.evaluate(element =>
    Number.parseFloat(getComputedStyle(element, '::after').outlineWidth)
  );
  expect(focusedBoundaryWidth).toBeGreaterThan(0);
  await inputControl.hover();
  expect(
    await inputControl.evaluate(element =>
      Number.parseFloat(getComputedStyle(element, '::after').outlineWidth)
    )
  ).toBe(focusedBoundaryWidth);

  await page.locator('#email-field').evaluate((element: HTMLDsFieldElement) => {
    element.error = true;
    element.errorMessage = 'Enter a valid work email.';
  });
  await expect
    .poll(() => inputControl.evaluate(element => getComputedStyle(element, '::after').outlineStyle))
    .toBe('dashed');

  const select = page.locator('#region');
  const trigger = select.locator('.trigger');
  await trigger.click();
  await expect(select.locator('.select-popup')).toHaveCSS('outline-style', 'solid');
  await select.getByRole('option', { name: 'Canada' }).click();
  await expect
    .poll(() =>
      trigger.evaluate(element => {
        const style = getComputedStyle(element, '::before');
        return {
          color: style.outlineColor,
          style: style.outlineStyle,
          width: Number.parseFloat(style.outlineWidth),
        };
      })
    )
    .toMatchObject({
      color: colors.highlight,
      style: 'solid',
    });

  await page.locator('#alert-fieldset').evaluate((element: HTMLFieldSetElement) => {
    element.disabled = true;
  });
  await expect(switchControl).toHaveCSS('color', colors.grayText);
  await expect(switchControl).toHaveCSS('opacity', '1');
});

test('preserves navigation and overlay boundaries without relying on fills or shadows', async ({
  page,
  browserName,
}) => {
  await openFixture(page, '/panel-sub-nav.html', browserName);
  const colors = await systemColors(page);
  const selectedNav = page.getByRole('tab', { name: 'Overview' });
  const inactiveNav = page.getByRole('tab', { name: 'Activity' });

  await expect
    .poll(() =>
      selectedNav.evaluate(element => {
        const style = getComputedStyle(element, '::before');
        return {
          color: style.outlineColor,
          style: style.outlineStyle,
          width: Number.parseFloat(style.outlineWidth),
        };
      })
    )
    .toMatchObject({
      color: colors.highlight,
      style: 'solid',
    });
  await expect(inactiveNav).toHaveCSS('color', colors.grayText);
  await expect(inactiveNav).toHaveCSS('opacity', '1');

  await openFixture(page, '/tab-group-backgrounds.html', browserName);
  const selectedTab = page.getByRole('tab', { name: 'Overview' });
  const idleTab = page.getByRole('tab', { name: 'Activity' });
  const tabWeights = await Promise.all([
    selectedTab.locator('ds-text').evaluate(element => getComputedStyle(element).fontWeight),
    idleTab.locator('ds-text').evaluate(element => getComputedStyle(element).fontWeight),
  ]);
  expect(tabWeights[0]).not.toBe(tabWeights[1]);
  await expect(selectedTab.locator('.badge__mark')).toHaveCSS('background-color', colors.highlight);

  await openFixture(page, '/accessibility-overlays.html', browserName);
  await page.locator('#filter-anchor').click();
  const menu = page.locator('#filter-menu .ds-choice-popup');
  const selectedItem = page
    .locator('#filter-menu')
    .getByRole('menuitemradio', { name: 'All chats' });
  await expect(menu).toHaveCSS('outline-style', 'solid');
  await expect(menu).toHaveCSS('outline-color', colors.canvasText);
  await expect
    .poll(() =>
      selectedItem.evaluate(element => ({
        color: getComputedStyle(element, '::before').outlineColor,
        style: getComputedStyle(element, '::before').outlineStyle,
      }))
    )
    .toEqual({ color: colors.highlight, style: 'solid' });
  await page.keyboard.press('Escape');

  await page.locator('#modal-trigger').click();
  const dialog = page.getByRole('dialog', { name: 'Confirm changes' });
  await expect(dialog).toHaveCSS('outline-style', 'solid');
  await expect(dialog).toHaveCSS('outline-color', colors.canvasText);
  await page.keyboard.press('Escape');

  await openFixture(page, '/tooltip.html', browserName);
  await page.locator('#aria-anchor').focus();
  const tooltip = page.getByRole('tooltip', { name: 'Supplementary label' });
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveCSS('outline-style', 'solid');
  await expect(tooltip).toHaveCSS('outline-color', colors.canvasText);

  await openFixture(page, '/tooltip-chart.html', browserName);
  const chartTooltip = page.locator('#mixed-tooltip');
  await expect(chartTooltip).toBeVisible();
  await expect(chartTooltip).toHaveCSS('outline-style', 'solid');
  await expect(chartTooltip).toHaveCSS('outline-color', colors.canvasText);

  await openFixture(page, '/toast.html', browserName);
  await page.evaluate(() => {
    (
      window as typeof window & {
        __addToast: (options: Record<string, unknown>) => void;
      }
    ).__addToast({
      id: 'forced-colors-toast',
      title: 'Changes saved',
      description: 'The update is ready.',
      timeout: 0,
    });
  });
  const toast = page.locator('.toast-surface');
  await expect(toast).toBeVisible();
  await expect(toast).toHaveCSS('outline-style', 'solid');
  await expect(toast).toHaveCSS('outline-color', colors.canvasText);
});

test('keeps the panel account trigger legible without selected foreground while expanded', async ({
  page,
  browserName,
}) => {
  await openFixture(page, '/shell-app-chrome.html', browserName);
  const colors = await systemColors(page);
  const panel = page.locator('#panel');
  const account = page.getByRole('button', { name: 'Account' });

  for (const collapsed of [false, true]) {
    await panel.evaluate((element, nextCollapsed) => {
      const control = element as HTMLElement & {
        accountMenuExpanded: boolean;
        collapsed: boolean;
      };
      control.accountMenuExpanded = false;
      control.collapsed = nextCollapsed;
    }, collapsed);
    await expect(account).toHaveAttribute('aria-expanded', 'false');
    const restingForeground = await account.evaluate(element => getComputedStyle(element).color);

    await panel.evaluate(element => {
      (element as HTMLElement & { accountMenuExpanded: boolean }).accountMenuExpanded = true;
    });

    await expect(account).toHaveAttribute('aria-expanded', 'true');
    await expect(account).not.toHaveClass(/panel-nav__item--active/);
    await expect(account).toHaveCSS('color', restingForeground);
    expect([colors.canvasText, colors.buttonText]).toContain(restingForeground);
  }
});

test('keeps loading states visible and removes decorative shimmer motion', async ({
  page,
  browserName,
}) => {
  await openFixture(page, '/loader.html', browserName);
  const colors = await systemColors(page);
  const loader = page.locator('#standalone .loader');
  await expect(loader.locator('svg')).toBeVisible();
  await expect(loader).toHaveCSS('color', colors.canvasText);

  await openFixture(page, '/skeleton.html', browserName);
  const skeleton = page.locator('#text .skeleton__shape');
  await expect(skeleton).toHaveCSS('background-color', colors.grayText);
  await expect
    .poll(() =>
      skeleton.evaluate(element => {
        const style = getComputedStyle(element, '::after');
        return { animation: style.animationName, display: style.display };
      })
    )
    .toEqual({ animation: 'none', display: 'none' });
});

test('preserves only literal data marks while chart chrome follows the OS palette', async ({
  page,
  browserName,
}) => {
  await openFixture(page, '/card-chart.html', browserName);

  for (const selector of [
    '#donut-card .chart__mark',
    '#chart-card .chart__mark',
    '#donut-card .chart-legend__swatch',
  ]) {
    await expect(page.locator(selector).first()).toHaveCSS('forced-color-adjust', 'none');
  }

  expect(
    await page
      .locator('#chart-card .chart__tick')
      .first()
      .evaluate(element => getComputedStyle(element).forcedColorAdjust)
  ).not.toBe('none');
  await expect(page.locator('#donut-card')).toHaveCSS('outline-style', 'solid');
  await expect(page.locator('#donut-card .chart-legend__swatch').first()).toHaveCSS(
    'outline-style',
    'solid'
  );
});
