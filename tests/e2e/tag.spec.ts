import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/tag.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('renders visible static metadata without interaction semantics', async ({ page }) => {
  const tag = page.locator('#tag');

  await expect(tag.locator('ds-text')).toHaveText('Active vehicle');
  await expect(tag).not.toHaveAttribute('tabindex');
  await expect(tag).not.toHaveAttribute('role');
  await expect(tag.locator('button, a')).toHaveCount(0);
  await expect(tag.locator('.tag__suffix-icon')).toHaveCount(0);
});

test('keeps a leading icon decorative beside the visible label', async ({ page }) => {
  const tag = page.locator('#icon-tag');

  await expect(tag.locator('ds-text')).toHaveText('Fleet');
  await expect.poll(() => tag.locator('ds-icon').evaluate(element => (
    (element as HTMLElement & { name: string }).name
  ))).toBe('VehicleTruck');
  await expect(tag.locator('ds-icon .icon')).toHaveAttribute('aria-hidden', 'true');
  await expect(tag.locator('ds-icon .icon')).not.toHaveAttribute('aria-label');
});

test('renders a controlled native menu trigger with a fixed ChevronUpDown suffix', async ({ page }) => {
  const tag = page.locator('#interactive-tag');
  const button = tag.getByRole('button');

  await expect(button).toHaveAccessibleName('Vehicle status');
  await expect(button).toHaveAttribute('aria-haspopup', 'menu');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).toHaveAttribute('aria-controls', 'vehicle-status-menu');
  await expect.poll(() => tag.locator('.tag__suffix-icon').evaluate(element => (
    (element as HTMLElement & { name: string }).name
  ))).toBe('ChevronUpDown');
  await expect(tag.locator('.tag__suffix-icon .icon')).toHaveAttribute('aria-hidden', 'true');

  await button.click();
  await button.focus();
  await button.press('Enter');
  await expect.poll(() => page.evaluate(() => (
    (window as Window & { tagClicks: string[] }).tagClicks
  ))).toEqual(['interactive-tag', 'interactive-tag']);
  await expect(button).toHaveAttribute('aria-expanded', 'false');

  await tag.evaluate(element => {
    (element as HTMLElement & { expanded: boolean }).expanded = true;
  });
  await expect(button).toHaveAttribute('aria-expanded', 'true');
});

test('disables inactive interactive Tags without changing static Tag behavior', async ({ page }) => {
  const tag = page.locator('#inactive-tag');
  const button = tag.getByRole('button');

  await expect(button).toBeDisabled();
  await expect(tag).toHaveClass(/ds-control-inactive/);
  await expect(tag).toHaveCSS('opacity', '0.5');
  await button.click({ force: true });
  await expect.poll(() => page.evaluate(() => (
    (window as Window & { tagClicks: string[] }).tagClicks
  ))).toEqual([]);
});

test('maps intent and contrast to content styling rather than interaction state', async ({ page }) => {
  const tag = page.locator('#tag');
  const intents = ['neutral', 'brand', 'ai', 'negative', 'warning', 'caution', 'positive'];
  const contrasts = ['strong', 'bold', 'medium', 'faint'];

  for (const intent of intents) {
    for (const contrast of contrasts) {
      await tag.evaluate((element, values) => {
        const target = element as HTMLElement & { intent: string; contrast: string };
        target.intent = values.intent;
        target.contrast = values.contrast;
      }, { intent, contrast });
      await expect(tag).toHaveClass(new RegExp(`tag--intent-${intent}`));
      await expect(tag).toHaveClass(new RegExp(`tag--contrast-${contrast}`));
      await expect(tag).not.toHaveAttribute('aria-selected');
      await expect(tag).not.toHaveAttribute('aria-pressed');
    }
  }
});

test('truncates one line only when constrained by maxWidth', async ({ page }) => {
  const tag = page.locator('#long-tag');
  const label = tag.locator('ds-text');

  await expect(tag).toHaveCSS('max-width', '120px');
  await expect(label).toHaveCSS('white-space', 'nowrap');
  expect(await label.locator('span').evaluate(
    element => element.scrollWidth > element.clientWidth,
  )).toBe(true);
});

test('has no detectable accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
