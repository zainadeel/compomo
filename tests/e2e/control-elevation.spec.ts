import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/control-elevation.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('paints the md outer shadow once and keeps its highlight above an opaque child', async ({
  page,
}) => {
  for (const theme of ['light', 'dark']) {
    await page.locator('html').evaluate((element, nextTheme) => {
      element.setAttribute('data-theme', nextTheme);
    }, theme);

    const result = await page.locator('#opaque-wrapper').evaluate(wrapper => {
      const controlHost = wrapper.querySelector<HTMLElement>('ds-button-filled')!;
      const control = controlHost.querySelector<HTMLElement>('.button-filled')!;
      const probe = document.createElement('span');
      document.body.append(probe);
      probe.style.boxShadow = 'var(--effect-shadow-elevated-md)';
      const expectedShadow = getComputedStyle(probe).boxShadow;
      probe.style.boxShadow = 'var(--effect-highlight-elevated-md)';
      const expectedHighlight = getComputedStyle(probe).boxShadow;
      probe.remove();

      const bounds = (element: Element) => {
        const rect = element.getBoundingClientRect();
        return {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        };
      };

      return {
        shadow: getComputedStyle(wrapper).boxShadow,
        expectedShadow,
        highlight: getComputedStyle(wrapper, '::after').boxShadow,
        expectedHighlight,
        overlayPointerEvents: getComputedStyle(wrapper, '::after').pointerEvents,
        overlayZIndex: Number(getComputedStyle(wrapper, '::after').zIndex),
        controlZIndex: Number(getComputedStyle(control).zIndex),
        controlOverlayZIndex: Number(getComputedStyle(control, '::after').zIndex),
        wrapperRadius: getComputedStyle(wrapper).borderRadius,
        controlRadius: getComputedStyle(control).borderRadius,
        wrapperBounds: bounds(wrapper),
        hostBounds: bounds(controlHost),
        controlBounds: bounds(control),
        hasBorder: (controlHost as HTMLElement & { hasBorder: boolean }).hasBorder,
      };
    });

    expect(result.shadow).toBe(result.expectedShadow);
    expect(result.shadow).not.toContain('inset');
    expect(result.highlight).toBe(result.expectedHighlight);
    expect(result.highlight).toContain('inset');
    expect(result.overlayPointerEvents).toBe('none');
    expect(result.overlayZIndex).toBeGreaterThan(result.controlZIndex);
    expect(result.overlayZIndex).toBeGreaterThan(result.controlOverlayZIndex);
    expect(result.wrapperRadius).toBe(result.controlRadius);
    expect(result.wrapperBounds).toEqual(result.hostBounds);
    expect(result.wrapperBounds).toEqual(result.controlBounds);
    expect(result.hasBorder).toBe(false);
  }

  await page.locator('#opaque-control button').click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as typeof window & { __opaqueClicks?: number }).__opaqueClicks,
      ),
    )
    .toBe(1);
});

test('retains transparent backdrop blur and borderless unfilled geometry', async ({
  page,
}) => {
  const result = await page.locator('#blur-wrapper').evaluate(wrapper => {
    const controlHost = wrapper.querySelector<HTMLElement>('ds-button-unfilled')!;
    const control = controlHost.querySelector<HTMLElement>('.button-unfilled')!;
    const styles = getComputedStyle(wrapper);
    const bounds = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    };
    return {
      backdropFilter: styles.backdropFilter,
      expectedBlur: `blur(${styles.getPropertyValue('--effect-blur-sm').trim()})`,
      background: styles.backgroundColor,
      wrapperBounds: bounds(wrapper),
      hostBounds: bounds(controlHost),
      controlBounds: bounds(control),
      hasBorder: (controlHost as HTMLElement & { hasBorder: boolean }).hasBorder,
      borderWidth: getComputedStyle(control)
        .getPropertyValue('--ds-interaction-border-width')
        .trim(),
      overlayZIndex: Number(getComputedStyle(wrapper, '::after').zIndex),
      controlOverlayZIndex: Number(getComputedStyle(control, '::after').zIndex),
    };
  });

  expect(result.backdropFilter).toBe(result.expectedBlur);
  expect(result.background).toMatch(/^rgba\(.*,[ ]?0\)$/);
  expect(result.wrapperBounds).toEqual(result.hostBounds);
  expect(result.wrapperBounds).toEqual(result.controlBounds);
  expect(result.hasBorder).toBe(false);
  expect(result.borderWidth).toBe('0px');
  expect(result.overlayZIndex).toBeGreaterThan(result.controlOverlayZIndex);
});

test('keeps wrapped Input strokes intact beneath the topmost highlight', async ({
  page,
}) => {
  const resting = await page.locator('#input-rest-wrapper').evaluate(wrapper => {
    const inputHost = wrapper.querySelector<HTMLElement>('ds-input')!;
    const control = inputHost.querySelector<HTMLElement>('.input-control')!;
    const bounds = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    };
    return {
      wrapperBounds: bounds(wrapper),
      hostBounds: bounds(inputHost),
      controlBounds: bounds(control),
      hasBorder: (inputHost as HTMLElement & { hasBorder: boolean }).hasBorder,
      borderedClass: control.classList.contains('input-control--bordered'),
      borderWidth: getComputedStyle(control)
        .getPropertyValue('--ds-interaction-border-width')
        .trim(),
    };
  });

  expect(resting.wrapperBounds).toEqual(resting.hostBounds);
  expect(resting.wrapperBounds).toEqual(resting.controlBounds);
  expect(resting.hasBorder).toBe(false);
  expect(resting.borderedClass).toBe(false);
  expect(resting.borderWidth).toBe('0px');

  await page.locator('#input-focus input').focus();
  const focus = await page.locator('#input-focus-wrapper').evaluate(wrapper => {
    const control = wrapper.querySelector<HTMLElement>('.input-control')!;
    const probe = document.createElement('span');
    document.body.append(probe);
    probe.style.boxShadow =
      'inset 0 0 0 var(--dimension-stroke-width-018) var(--color-border-bold-brand)';
    const expected = getComputedStyle(probe).boxShadow;
    probe.remove();
    return {
      actual: getComputedStyle(control, '::after').boxShadow,
      expected,
      controlZIndex: Number(getComputedStyle(control, '::after').zIndex),
      overlayZIndex: Number(getComputedStyle(wrapper, '::after').zIndex),
    };
  });
  expect(focus.actual).toBe(focus.expected);
  expect(focus.overlayZIndex).toBeGreaterThan(focus.controlZIndex);

  const error = await page.locator('#input-error-wrapper').evaluate(wrapper => {
    const control = wrapper.querySelector<HTMLElement>('.input-control')!;
    const probe = document.createElement('span');
    document.body.append(probe);
    probe.style.boxShadow =
      'inset 0 0 0 var(--dimension-stroke-width-018) var(--color-border-bold-negative)';
    const expected = getComputedStyle(probe).boxShadow;
    probe.remove();
    return {
      actual: getComputedStyle(control, '::after').boxShadow,
      expected,
      controlZIndex: Number(getComputedStyle(control, '::after').zIndex),
      overlayZIndex: Number(getComputedStyle(wrapper, '::after').zIndex),
    };
  });
  expect(error.actual).toBe(error.expected);
  expect(error.overlayZIndex).toBeGreaterThan(error.controlZIndex);
  await expect(page.locator('#input-error input')).toHaveAttribute('aria-invalid', 'true');
});

test('keeps the focused fixture free of serious accessibility violations', async ({
  page,
}) => {
  const results = await new AxeBuilder({ page }).include('main').analyze();
  const blocking = results.violations.filter(finding =>
    ['critical', 'serious'].includes(finding.impact ?? ''),
  );
  expect(blocking).toEqual([]);
});
