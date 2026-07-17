import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.goto('/forms.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('submits, validates, and resets form-associated controls', async ({ page }) => {
  await page.locator('#submit').click();
  expect(await page.evaluate(() => (window as typeof window & { __submitted?: unknown }).__submitted)).toBeUndefined();

  await page.locator('#email input').fill('person@example.com');
  await page.locator('#terms').click();
  await page.locator('#region').evaluate((element: HTMLDsSelectElement) => { element.value = 'ca'; });
  await page.locator('#tier [data-radio-item]').first().click();
  await page.locator('#alert-fieldset').evaluate((element: HTMLFieldSetElement) => { element.disabled = true; });
  await expect(page.locator('#alerts')).toHaveAttribute('aria-disabled', 'true');
  await page.locator('#alert-fieldset').evaluate((element: HTMLFieldSetElement) => { element.disabled = false; });
  await expect(page.locator('#alerts')).not.toHaveAttribute('aria-disabled', 'true');
  await page.locator('#alerts').evaluate((element: HTMLDsSwitchElement) => { element.click(); });
  await page.locator('#submit').click();

  await expect.poll(() => page.evaluate(() => (window as typeof window & { __submitted?: unknown }).__submitted)).toEqual({
    email: 'person@example.com',
    terms: 'accepted',
    region: 'ca',
    tier: 'standard',
    alerts: 'enabled',
  });

  await page.locator('#reset').click();
  await expect(page.locator('#email input')).toHaveValue('');
  await expect(page.locator('#terms')).toHaveAttribute('aria-checked', 'false');
});

test('exposes overridable localized accessibility labels', async ({ page }) => {
  await expect(page.locator('ds-pagination nav')).toHaveAttribute('aria-label', 'Paginación');
  await expect(page.locator('ds-pagination button').first()).toHaveAttribute('aria-label', 'Página anterior');
  await expect(page.locator('ds-pagination button').last()).toHaveAttribute('aria-label', 'Página siguiente');
});

test('field associates one control with its label, guidance, error, and interaction state', async ({ page }) => {
  const field = page.locator('#email-field');
  const input = page.locator('#email');
  const nativeInput = input.locator('input');
  const label = field.locator('label');
  const description = field.locator('.field__description .ds-text__element');

  await expect(label).toHaveAttribute('for', 'email-control');
  await expect(label).toHaveAttribute('id', 'email-control-label');
  await expect(nativeInput).toHaveAttribute('id', 'email-control');
  await expect(nativeInput).toHaveAttribute('aria-labelledby', 'email-control-label');
  await expect(description).toHaveAttribute('id', 'email-control-description');
  await expect(nativeInput).toHaveAttribute('aria-describedby', 'email-control-description');
  await expect(field).toHaveAttribute('data-required', '');

  await label.click();
  await expect(nativeInput).toBeFocused();
  await expect(field).toHaveAttribute('data-focused', '');

  await nativeInput.fill('person@example.com');
  await expect(field).toHaveAttribute('data-filled', '');
  await expect(field).toHaveAttribute('data-dirty', '');

  await page.locator('#terms').focus();
  await expect(field).toHaveAttribute('data-touched', '');
  await expect(field).not.toHaveAttribute('data-focused');

  await field.evaluate((element: HTMLDsFieldElement) => {
    element.error = true;
    element.errorMessage = 'Enter a valid work email.';
  });
  await expect(field).toHaveAttribute('data-invalid', '');
  await expect(nativeInput).toHaveAttribute('aria-invalid', 'true');
  await expect(nativeInput).toHaveAttribute(
    'aria-describedby',
    'email-control-description email-control-error',
  );
  await expect(field.getByRole('alert')).toHaveText('Enter a valid work email.');
  await expect(input.locator('.input-control')).toHaveClass(/input-control--error/);
});

test('input read-only state remains focusable and submittable without a clear action', async ({ page }) => {
  const input = page.locator('#input-readonly');
  const nativeInput = input.locator('input');

  await expect(input).toHaveAttribute('data-readonly', '');
  await expect(input).toHaveAttribute('data-filled', '');
  await expect(nativeInput).toHaveAttribute('readonly', '');
  await nativeInput.focus();
  await expect(nativeInput).toBeFocused();
  await expect(input).toHaveAttribute('data-focused', '');
  await expect.poll(() => page.locator('#readonly-input-form').evaluate(form =>
    new FormData(form as HTMLFormElement).get('readonly-input')
  )).toBe('Kept value');
});

test('select applies selected styling only after choosing an option', async ({ page }) => {
  const trigger = page.locator('#region .trigger');

  await expect(trigger).not.toHaveClass(/ds-interaction-fill--selected/);
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(trigger).not.toHaveClass(/ds-interaction-fill--selected/);

  await page.locator('#region').getByRole('option', { name: 'Canada' }).click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toHaveClass(/ds-interaction-fill--selected/);
});

test('select search clear action has balanced top, right, and bottom insets', async ({ page }) => {
  const select = page.locator('#region');
  await select.evaluate((element: HTMLDsSelectElement) => { element.searchable = true; });
  await select.locator('.trigger').click();
  await select.locator('input[type="search"]').fill('no matching option');

  const clear = select.locator('.select-search__clear');
  await expect(clear).toHaveJSProperty('icon', 'CrossCircle');
  const alignment = await select.evaluate(element => {
    const control = element.querySelector<HTMLElement>('.select-search__control')!.getBoundingClientRect();
    const clearAction = element.querySelector<HTMLElement>('.select-search__clear')!.getBoundingClientRect();
    return {
      top: clearAction.top - control.top,
      right: control.right - clearAction.right,
      bottom: control.bottom - clearAction.bottom,
    };
  });

  expect(alignment.right).toBe(alignment.top);
  expect(alignment.right).toBe(alignment.bottom);
});

test('input follows shared control density, focus, and search-clear recipes', async ({ page }) => {
  const expected = {
    md: { height: 32, icon: 20, textClass: 'ds-text--body-medium' },
    sm: { height: 24, icon: 16, textClass: 'ds-text--body-small' },
    xs: { height: 16, icon: 12, textClass: 'ds-text--caption' },
  } as const;

  for (const [size, dimensions] of Object.entries(expected)) {
    const input = page.locator(`#input-${size}`);
    const actual = await input.evaluate(element => {
      const control = element.querySelector<HTMLElement>('.input-control')!;
      const prefix = element.querySelector<HTMLElement>('.input-control__prefix')!;
      const nativeInput = element.querySelector<HTMLInputElement>('input')!;
      return {
        height: Math.round(control.getBoundingClientRect().height),
        icon: Math.round(prefix.getBoundingClientRect().width),
        classes: [...nativeInput.classList],
        border: getComputedStyle(control, '::after').boxShadow,
      };
    });

    expect(actual).toMatchObject({
      height: dimensions.height,
      icon: dimensions.icon,
    });
    expect(actual.border).toContain('1px');
    expect(actual.classes).toContain(dimensions.textClass);
  }

  const nativeInput = page.locator('#input-md input');
  await nativeInput.focus();
  const activeBorder = await page.locator('#input-md .input-control').evaluate(element => ({
    width: getComputedStyle(element).getPropertyValue('--ds-interaction-border-width').trim(),
    color: getComputedStyle(element).getPropertyValue('--ds-interaction-border-color').trim(),
    expectedColor: getComputedStyle(element).getPropertyValue('--color-border-bold-brand').trim(),
    shadow: getComputedStyle(element, '::after').boxShadow,
  }));
  expect(activeBorder.width).toContain('3 / 16');
  expect(activeBorder.color).toBe(activeBorder.expectedColor);
  expect(activeBorder.shadow).toContain('1.5px');

  const search = page.locator('#input-search');
  await expect(search.locator('ds-button-unfilled')).toHaveCount(1);
  await expect(search.locator('ds-button-unfilled')).toHaveJSProperty('icon', 'CrossCircle');
  for (const id of ['input-search', 'input-search-sm', 'input-search-xs']) {
    const clearAlignment = await page.locator(`#${id}`).evaluate(element => {
      const control = element.querySelector<HTMLElement>('.input-control')!.getBoundingClientRect();
      const clear = element.querySelector<HTMLElement>('ds-button-unfilled')!.getBoundingClientRect();
      return {
        top: clear.top - control.top,
        right: control.right - clear.right,
        bottom: control.bottom - clear.bottom,
      };
    });
    expect(clearAlignment.right).toBe(clearAlignment.top);
    expect(clearAlignment.right).toBe(clearAlignment.bottom);
  }
  await search.locator('ds-button-unfilled button').click();
  await expect(search.locator('input')).toHaveValue('');
  await expect(search.locator('input')).toBeFocused();
  await expect(search.locator('ds-button-unfilled')).toHaveCount(0);
});

test('checkbox sizes center owned marks with density-specific strokes', async ({ page }) => {
  const expected = {
    md: { height: 32, placement: 20, box: 16, mark: 16, stroke: '1.25px' },
    sm: { height: 24, placement: 16, box: 12, mark: 12, stroke: '1px' },
    xs: { height: 16, placement: 12, box: 8, mark: 8, stroke: '0.75px' },
  } as const;

  for (const [size, dimensions] of Object.entries(expected)) {
    const checkbox = page.locator(`#checkbox-${size}`);
    await expect(checkbox.locator('.checkbox__mark')).toHaveCount(1);
    await expect(checkbox.locator('ds-icon')).toHaveCount(0);
    const actual = await checkbox.evaluate(element => {
      const host = element.getBoundingClientRect();
      const placement = element.querySelector('.checkbox__placement')!.getBoundingClientRect();
      const box = element.querySelector('.box')!.getBoundingClientRect();
      const markElement = element.querySelector('.checkbox__mark')!;
      const mark = markElement.getBoundingClientRect();
      return {
        height: Math.round(host.height),
        placement: Math.round(placement.width),
        box: Math.round(box.width),
        mark: Math.round(mark.width),
        stroke: getComputedStyle(markElement).strokeWidth,
        border: getComputedStyle(element.querySelector('.box')!).boxShadow,
      };
    });

    expect(actual).toMatchObject(dimensions);
    expect(actual.border).toBe('none');
    await expect(checkbox.locator('.checkbox__mark path')).toHaveAttribute('d', 'M3.5 8.25L6.75 11.5L12.5 4.75');
  }
});

test('checkbox supports Enter and Space activation with mixed-state and presentation semantics', async ({ page }) => {
  const required = page.locator('#terms');
  await expect(required).toHaveAttribute('aria-required', 'true');
  await expect(required).toHaveAttribute('aria-invalid', 'true');
  await required.click();
  await expect(required).not.toHaveAttribute('aria-invalid');

  const mixed = page.locator('#checkbox-mixed');
  await expect(mixed).toHaveAttribute('aria-checked', 'mixed');
  await expect(mixed.locator('.checkbox__mark path')).toHaveAttribute('d', 'M4 8H12');

  await mixed.press('Enter');
  await expect(mixed).toHaveAttribute('aria-checked', 'true');
  await expect(mixed.locator('.checkbox__mark path')).toHaveAttribute('d', 'M3.5 8.25L6.75 11.5L12.5 4.75');
  await mixed.press('Space');
  await expect(mixed).toHaveAttribute('aria-checked', 'false');
  await expect(mixed.locator('.checkbox__mark')).toHaveCount(0);

  const presentation = page.locator('#checkbox-presentation');
  await expect(presentation).toHaveAttribute('aria-hidden', 'true');
  await expect(presentation).toHaveAttribute('tabindex', '-1');
  await expect(presentation).not.toHaveAttribute('role');
  await expect(presentation.locator('ds-text')).toHaveCount(0);
});

test('radio sizes match checkbox density and use a component-owned selected circle', async ({ page }) => {
  const expected = {
    md: { height: 32, placement: 20, circle: 16, dot: 8, stroke: '1.25px' },
    sm: { height: 24, placement: 16, circle: 12, dot: 6, stroke: '1px' },
    xs: { height: 16, placement: 12, circle: 8, dot: 4, stroke: '0.75px' },
  } as const;

  for (const [size, dimensions] of Object.entries(expected)) {
    const radio = page.locator(`#radio-${size}`);
    const actual = await radio.evaluate(element => {
      const selectedElement = element.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]')!;
      const unselectedElement = element.querySelector<HTMLElement>('[role="radio"][aria-checked="false"]')!;
      const placement = selectedElement.querySelector('.radio__placement')!.getBoundingClientRect();
      const circle = selectedElement.querySelector('.radio__circle')!.getBoundingClientRect();
      const dot = selectedElement.querySelector('.radio__dot')!.getBoundingClientRect();
      const uncheckedCircle = unselectedElement.querySelector('.radio__circle')!;
      return {
        height: Math.round(selectedElement.getBoundingClientRect().height),
        placement: Math.round(placement.width),
        circle: Math.round(circle.width),
        dot: Math.round(dot.width),
        selectedBorder: getComputedStyle(selectedElement.querySelector('.radio__circle')!).boxShadow,
        uncheckedBorder: getComputedStyle(uncheckedCircle).boxShadow,
      };
    });

    expect(actual).toMatchObject({
      height: dimensions.height,
      placement: dimensions.placement,
      circle: dimensions.circle,
      dot: dimensions.dot,
      selectedBorder: 'none',
    });
    expect(actual.uncheckedBorder).toContain(dimensions.stroke);
  }
});

test('radio uses roving focus and arrow-key selection', async ({ page }) => {
  const radio = page.locator('#tier');
  const standard = radio.getByRole('radio', { name: 'Standard' });
  const premium = radio.getByRole('radio', { name: 'Premium' });

  await expect(radio).toHaveAttribute('aria-required', 'true');
  await expect(radio).toHaveAttribute('aria-invalid', 'true');
  await standard.click();
  await expect(radio).not.toHaveAttribute('aria-invalid');
  await expect(standard).toHaveAttribute('aria-checked', 'true');
  await standard.press('ArrowDown');
  await expect(premium).toHaveAttribute('aria-checked', 'true');
  await expect(premium).toBeFocused();
});

test('switch supports readonly, required, unchecked, and external form behavior', async ({ page }) => {
  const readOnly = page.locator('#readonly-switch');
  await expect(readOnly).toHaveAttribute('aria-checked', 'true');
  await expect(readOnly).toHaveAttribute('aria-readonly', 'true');
  await expect(readOnly).toHaveAttribute('data-readonly', '');
  await readOnly.click();
  await readOnly.press('Space');
  await expect(readOnly).toHaveAttribute('aria-checked', 'true');

  const required = page.locator('#required-switch');
  const switchForm = page.locator('#switch-form');
  await expect(required).toHaveAttribute('aria-required', 'true');
  await expect(required).toHaveAttribute('aria-invalid', 'true');
  await expect(required).toHaveAttribute('data-invalid', '');
  await expect.poll(() => switchForm.evaluate(form => (form as HTMLFormElement).checkValidity())).toBe(false);
  await required.click();
  await expect(required).toHaveAttribute('data-filled', '');
  await expect(required).toHaveAttribute('data-dirty', '');
  await expect(required).toHaveAttribute('data-valid', '');
  await expect(required).not.toHaveAttribute('aria-invalid');
  await expect.poll(() => switchForm.evaluate(form => (form as HTMLFormElement).checkValidity())).toBe(true);

  const presentation = page.locator('#presentation-switch');
  await expect(presentation).toHaveAttribute('aria-hidden', 'true');
  await expect(presentation).toHaveAttribute('tabindex', '-1');
  await expect(presentation).not.toHaveAttribute('role');

  const values = await switchForm.evaluate(form =>
    Object.fromEntries(new FormData(form as HTMLFormElement).entries())
  );
  expect(values).toEqual({
    readonly: 'kept',
    unchecked: 'off',
    required: 'on',
    external: 'yes',
  });

  const labeled = page.getByRole('switch', { name: 'Labeled switch' });
  await page.getByText('Labeled switch', { exact: true }).click();
  await expect(labeled).toHaveAttribute('aria-checked', 'true');
});

test('switch sizes preserve density-specific thumb insets and an outset focus ring', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const expected = {
    md: { width: 32, height: 20, thumb: 12, inset: 4, blockInset: 4, stroke: '1.25px' },
    sm: { width: 24, height: 16, thumb: 10, inset: 3, blockInset: 3, stroke: '1px' },
    xs: { width: 20, height: 12, thumb: 8, inset: 2, blockInset: 2, stroke: '0.75px' },
  } as const;

  for (const [size, dimensions] of Object.entries(expected)) {
    const switchControl = page.locator(`#switch-${size}`);
    const off = await switchControl.evaluate(element => {
      const host = element.getBoundingClientRect();
      const thumb = element.shadowRoot!.querySelector('.thumb')!.getBoundingClientRect();
      return {
        width: Math.round(host.width),
        height: Math.round(host.height),
        thumb: Math.round(thumb.width),
        inset: Math.round(thumb.left - host.left),
        blockInset: Math.round(thumb.top - host.top),
        border: getComputedStyle(element).boxShadow,
        thumbBorder: getComputedStyle(element.shadowRoot!.querySelector('.thumb')!).boxShadow,
      };
    });

    expect(off).toMatchObject({
      width: dimensions.width,
      height: dimensions.height,
      thumb: dimensions.thumb,
      inset: dimensions.inset,
      blockInset: dimensions.blockInset,
    });
    expect(off.border).toContain('inset');
    expect(off.border).toContain(dimensions.stroke);
    expect(off.thumbBorder).toContain('inset');
    expect(off.thumbBorder).toContain(dimensions.stroke);

    await switchControl.click();
    await expect(switchControl).toHaveAttribute('aria-checked', 'true');
    await expect.poll(() => switchControl.evaluate(element => {
      const host = element.getBoundingClientRect();
      const thumb = element.shadowRoot!.querySelector('.thumb')!.getBoundingClientRect();
      return Math.round(host.right - thumb.right);
    })).toBe(dimensions.inset);
    const checkedBorders = await switchControl.evaluate(element => ({
      track: getComputedStyle(element).boxShadow,
      thumb: getComputedStyle(element.shadowRoot!.querySelector('.thumb')!).boxShadow,
    }));
    expect(checkedBorders.track).toBe('none');
    expect(checkedBorders.thumb).toBe('none');
  }

  await page.locator('#switch-sm').focus();
  await expect(page.locator('#switch-sm')).toHaveAttribute('data-focused', '');
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#switch-sm')).toHaveAttribute('data-touched', '');
  await page.keyboard.press('Tab');
  const focus = await page.locator('#switch-sm').evaluate(element => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, offset: style.outlineOffset };
  });
  expect(focus).toEqual({ style: 'solid', offset: '2px' });
});

test('switch paints hover and press feedback on the thumb only', async ({ page }) => {
  const switchControl = page.locator('#switch-md');
  const interactionColors = () => switchControl.evaluate(element => ({
    host: getComputedStyle(element, '::after').backgroundColor,
    thumb: getComputedStyle(element.shadowRoot!.querySelector('.thumb')!, '::after').backgroundColor,
  }));

  const rest = await interactionColors();
  await switchControl.hover();
  const hover = await interactionColors();

  expect(hover.host).toBe(rest.host);
  expect(hover.thumb).not.toBe(rest.thumb);

  await page.mouse.down();
  const pressed = await interactionColors();
  await page.mouse.up();

  expect(pressed.host).toBe(rest.host);
  expect(pressed.thumb).not.toBe(hover.thumb);
});

test('slider uses native range semantics with complete labels and dynamic range limits', async ({ page }) => {
  const single = page.locator('#slider-single input[type="range"]');
  await expect(single).toHaveCount(1);
  await expect(single).toHaveAttribute('aria-labelledby', /ds-slider-.*-label/);
  await expect(single).toHaveAttribute('min', '0');
  await expect(single).toHaveAttribute('max', '100');
  await expect(single).toHaveValue('40');

  const range = page.locator('#slider-range input[type="range"]');
  await expect(range).toHaveCount(2);
  await expect(range.nth(0)).toHaveAttribute('aria-label', 'Minimum price');
  await expect(range.nth(1)).toHaveAttribute('aria-label', 'Maximum price');
  await expect(range.nth(0)).toHaveAttribute('max', '70');
  await expect(range.nth(1)).toHaveAttribute('min', '30');
  await expect(range.nth(0)).toHaveValue('20');
  await expect(range.nth(1)).toHaveValue('80');

  const vertical = page.locator('#slider-vertical input[type="range"]');
  await expect(vertical).toHaveAttribute('aria-orientation', 'vertical');

  const externalLabel = page.locator('label[for="slider-external-label"]');
  const externallyLabeledInput = page.locator('#slider-external-label input[type="range"]');
  await expect(externallyLabeledInput).toHaveAttribute('aria-labelledby', /ds-slider-label-/);
  await externalLabel.click();
  await expect(externallyLabeledInput).toBeFocused();
});

test('slider keyboard updates continuously, commits, constrains ranges, and preserves read-only values', async ({ page }) => {
  const single = page.locator('#slider-single input[type="range"]');
  await single.focus();
  await single.press('ArrowRight');
  await expect(single).toHaveValue('41');
  await expect(page.locator('#slider-single')).toHaveJSProperty('value', 41);
  await expect(page.locator('#slider-single')).toHaveAttribute('data-dirty', '');
  await expect(page.locator('#slider-single')).toHaveAttribute('data-focused', '');

  await expect.poll(() => page.evaluate(() => (window as typeof window & {
    __sliderEvents: { change: number[]; commit: number[] };
  }).__sliderEvents)).toEqual({ change: [41], commit: [41] });

  const rangeStart = page.locator('#slider-range input[type="range"]').nth(0);
  await rangeStart.focus();
  await rangeStart.press('End');
  await expect(rangeStart).toHaveValue('70');
  await expect(page.locator('#slider-range input[type="range"]').nth(1)).toHaveAttribute('min', '80');

  const readOnly = page.locator('#slider-readonly input[type="range"]');
  await readOnly.focus();
  await readOnly.press('End');
  await expect(readOnly).toHaveValue('70');
  await expect(readOnly).toHaveAttribute('aria-readonly', 'true');
});

test('slider pointer press selects the nearest thumb and emits one committed value', async ({ page }) => {
  const slider = page.locator('#slider-single');
  const control = slider.locator('.slider__control');
  await control.scrollIntoViewIfNeeded();
  const box = await control.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await page.mouse.click(box.x + box.width * 0.75, box.y + box.height / 2);
  await expect.poll(() => slider.evaluate((element: HTMLDsSliderElement) => element.value)).toBe(75);
  await expect.poll(() => page.evaluate(() => (window as typeof window & {
    __sliderEvents: { change: number[]; commit: number[] };
  }).__sliderEvents.commit)).toEqual([75]);

  const range = page.locator('#slider-range');
  await range.locator('.slider__control').scrollIntoViewIfNeeded();
  const rangeBox = await range.locator('.slider__control').boundingBox();
  expect(rangeBox).not.toBeNull();
  if (!rangeBox) return;
  await page.mouse.click(rangeBox.x + rangeBox.width * 0.3, rangeBox.y + rangeBox.height / 2);
  await expect.poll(() => range.evaluate((element: HTMLDsSliderElement) => element.value)).toEqual([30, 80]);
});

test('slider drag paint stays locked to the pointer without positional easing', async ({ page }) => {
  const slider = page.locator('#slider-single');
  const control = slider.locator('.slider__control');
  const thumb = slider.locator('.slider__thumb');
  await control.scrollIntoViewIfNeeded();

  const motion = await slider.evaluate(element => ({
    indicatorDuration: getComputedStyle(element.querySelector('.slider__indicator')!).transitionDuration,
    thumbDuration: getComputedStyle(element.querySelector('.slider__thumb')!).transitionDuration,
  }));
  expect(motion).toEqual({ indicatorDuration: '0s', thumbDuration: '0s' });

  const controlBox = await control.boundingBox();
  const thumbBox = await thumb.boundingBox();
  expect(controlBox).not.toBeNull();
  expect(thumbBox).not.toBeNull();
  if (!controlBox || !thumbBox) return;

  const targetPercentage = 0.82;
  const targetX = controlBox.x + thumbBox.width / 2
    + (controlBox.width - thumbBox.width) * targetPercentage;
  const targetY = controlBox.y + controlBox.height / 2;
  await page.mouse.move(thumbBox.x + thumbBox.width / 2, thumbBox.y + thumbBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetX, targetY);

  await expect.poll(async () => {
    const box = await thumb.boundingBox();
    return box ? Math.abs(box.x + box.width / 2 - targetX) : Number.POSITIVE_INFINITY;
  }).toBeLessThan(1);
  await page.mouse.up();
  await expect.poll(() => slider.evaluate((element: HTMLDsSliderElement) => element.value)).toBe(82);
});

test('slider sizes align with the control density system', async ({ page }) => {
  const expected = {
    md: { control: 32, thumb: 16, track: 8, trackStroke: '1.25px' },
    sm: { control: 24, thumb: 12, track: 6, trackStroke: '1px' },
    xs: { control: 16, thumb: 8, track: 4, trackStroke: '0.75px' },
  } as const;

  for (const [size, dimensions] of Object.entries(expected)) {
    const actual = await page.locator(`#slider-${size}`).evaluate(element => {
      const control = element.querySelector<HTMLElement>('.slider__control')!;
      const thumb = element.querySelector<HTMLElement>('.slider__thumb')!;
      const rail = element.querySelector<HTMLElement>('.slider__rail')!;
      const visual = element.querySelector<HTMLElement>('.slider__thumb-visual')!;
      const probe = document.createElement('span');
      probe.style.color = 'var(--color-foreground-tertiary)';
      element.append(probe);
      const trackColor = getComputedStyle(probe).color;
      probe.style.color = 'var(--color-border-bold-brand)';
      const thumbColor = getComputedStyle(probe).color;
      probe.remove();
      return {
        control: Math.round(control.getBoundingClientRect().height),
        thumb: Math.round(thumb.getBoundingClientRect().width),
        track: Math.round(rail.getBoundingClientRect().height),
        trackBackground: getComputedStyle(rail).backgroundColor,
        trackBorder: getComputedStyle(rail).boxShadow,
        trackRadius: getComputedStyle(rail).borderRadius,
        thumbBorder: getComputedStyle(visual).boxShadow,
        trackColor,
        thumbColor,
      };
    });

    expect(actual).toMatchObject({
      control: dimensions.control,
      thumb: dimensions.thumb,
      track: dimensions.track,
    });
    expect(actual.trackBackground).toBe('rgba(0, 0, 0, 0)');
    expect(actual.trackRadius).toBe('2px');
    expect(actual.trackBorder).toContain('inset');
    expect(actual.trackBorder).toContain(dimensions.trackStroke);
    expect(actual.trackBorder).toContain(actual.trackColor);
    expect(actual.thumbBorder).toContain('inset');
    expect(actual.thumbBorder).toContain('1.5px');
    expect(actual.thumbBorder).toContain(actual.thumbColor);
  }
});

test('slider submits single and repeated range values, associates externally, and resets', async ({ page }) => {
  const form = page.locator('#slider-form');
  const values = () => form.evaluate(formElement => {
    const data = new FormData(formElement as HTMLFormElement);
    return {
      volume: data.getAll('volume'),
      price: data.getAll('price'),
      locked: data.getAll('locked'),
      external: data.getAll('external-slider'),
    };
  });

  await expect.poll(values).toEqual({
    volume: ['40'],
    price: ['20', '80'],
    locked: ['70'],
    external: ['25'],
  });

  const input = page.locator('#slider-single input[type="range"]');
  await input.focus();
  await input.press('End');
  await expect(input).toHaveValue('100');
  await page.locator('#slider-reset').click();
  await expect(input).toHaveValue('40');
  await expect(page.locator('#slider-single')).not.toHaveAttribute('data-dirty');
});

test('has no serious or critical accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  const highImpact = results.violations.filter(violation =>
    violation.impact === 'serious' || violation.impact === 'critical'
  );
  expect(highImpact).toEqual([]);
});
