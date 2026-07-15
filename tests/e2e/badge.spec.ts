import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/badge.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('compacts overflow counts and hides non-positive counters', async ({ page }) => {
  const counter = page.locator('#counter');

  await expect(counter.locator('ds-text')).toHaveText('9+');
  await expect(page.getByRole('button')).toHaveAccessibleName('Inbox 10 unread notifications');
  await expect(page.locator('#zero')).toBeHidden();
  await expect(page.locator('#negative')).toBeHidden();
});

test('requires contextual dot text or owner-provided hidden semantics', async ({ page }) => {
  await expect(page.locator('#dot')).not.toHaveAttribute('aria-label');
  await expect(page.locator('#dot')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#labelled-dot')).not.toHaveAttribute('aria-label');
  await expect(page.locator('#labelled-dot .badge__a11y')).toHaveText('New activity');
});

test('maps every immediate backing surface and allows a direct ring override', async ({ page }) => {
  const badge = page.locator('#labelled-dot');
  const surfaces = {
    primary: 'var(--color-background-primary)',
    secondary: 'var(--color-background-secondary)',
    faint: 'var(--color-background-faint-neutral)',
    medium: 'var(--color-background-medium-neutral)',
    bold: 'var(--color-background-bold-neutral)',
    strong: 'var(--color-background-strong-neutral)',
    translucent: 'var(--color-translucent-translucent)',
    inverted: 'var(--color-inverted-background)',
    media: 'var(--color-media-background)',
    navigation: 'var(--color-navigation-background)',
    'always-dark': 'var(--color-always-dark-background)',
  } as const;

  for (const [surface, ring] of Object.entries(surfaces)) {
    await badge.evaluate((element, value) => {
      (element as HTMLElement & { surface: string }).surface = value;
    }, surface);
    await expect.poll(() => badge.evaluate(element => (
      element.style.getPropertyValue('--_badge-ring')
    ))).toBe(ring);
  }

  await badge.evaluate(element => {
    (element as HTMLElement & { background: string }).background = 'hotpink';
  });
  await expect.poll(() => badge.evaluate(element => (
    element.style.getPropertyValue('--_badge-ring')
  ))).toBe('hotpink');
});

test('remains non-interactive and has no detectable accessibility violations', async ({ page }) => {
  await expect(page.locator('#counter')).toHaveCSS('pointer-events', 'none');
  await expect(page.locator('ds-badge button')).toHaveCount(0);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
