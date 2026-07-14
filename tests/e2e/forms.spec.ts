import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.goto('/forms.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('submits, validates, and resets form-associated controls', async ({ page }) => {
  await page.locator('#submit').click();
  expect(await page.evaluate(() => (window as typeof window & { __submitted?: unknown }).__submitted)).toBeUndefined();

  await page.locator('ds-input input').fill('person@example.com');
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
  await expect(page.locator('ds-input input')).toHaveValue('');
  await expect(page.locator('#terms')).toHaveAttribute('aria-checked', 'false');
});

test('exposes overridable localized accessibility labels', async ({ page }) => {
  await expect(page.locator('ds-pagination nav')).toHaveAttribute('aria-label', 'Paginación');
  await expect(page.locator('ds-pagination button').first()).toHaveAttribute('aria-label', 'Página anterior');
  await expect(page.locator('ds-pagination button').last()).toHaveAttribute('aria-label', 'Página siguiente');
});

test('select applies selected styling only after choosing an option', async ({ page }) => {
  const trigger = page.locator('#region .trigger');

  await expect(trigger).not.toHaveClass(/ds-interaction-fill--selected/);
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(trigger).not.toHaveClass(/ds-interaction-fill--selected/);

  await page.locator('#region ds-menu .menu-item').filter({ hasText: 'Canada' }).click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toHaveClass(/ds-interaction-fill--selected/);
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
  await expect.poll(() => switchForm.evaluate(form => (form as HTMLFormElement).checkValidity())).toBe(false);
  await required.click();
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

test('switch sizes keep balanced thumb insets and an outset focus ring', async ({ page }) => {
  const expected = {
    md: { width: 36, height: 24, thumb: 16, inset: 4, blockInset: 4 },
    sm: { width: 24, height: 16, thumb: 12, inset: 2, blockInset: 2 },
    xs: { width: 12, height: 8, thumb: 6, inset: 1, blockInset: 1 },
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
        border: getComputedStyle(element, '::after').boxShadow,
        thumbBorder: getComputedStyle(element.shadowRoot!.querySelector('.thumb')!).boxShadow,
      };
    });

    expect(off).toMatchObject(dimensions);
    expect(off.border).toContain('inset');
    expect(off.thumbBorder).not.toContain('inset');

    await switchControl.click();
    await expect(switchControl).toHaveAttribute('aria-checked', 'true');
    await expect.poll(() => switchControl.evaluate(element => {
      const host = element.getBoundingClientRect();
      const thumb = element.shadowRoot!.querySelector('.thumb')!.getBoundingClientRect();
      return Math.round(host.right - thumb.right);
    })).toBe(dimensions.inset);
  }

  await page.locator('#switch-sm').focus();
  await page.keyboard.press('Shift+Tab');
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

test('has no serious or critical accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  const highImpact = results.violations.filter(violation =>
    violation.impact === 'serious' || violation.impact === 'critical'
  );
  expect(highImpact).toEqual([]);
});
