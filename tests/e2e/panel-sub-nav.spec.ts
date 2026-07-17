import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.goto('/panel-sub-nav.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('exposes vertical tab semantics and panel relationships', async ({ page }) => {
  const tablist = page.getByRole('tablist', { name: 'Settings sections' });
  await expect(tablist).toHaveAttribute('aria-orientation', 'vertical');

  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(3);
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.nth(0)).toHaveAttribute('aria-controls', 'overview-panel');
  await expect(tabs.nth(1)).toBeDisabled();
  await expect(tabs.nth(1)).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('#overview-panel')).toBeVisible();
  await expect(page.locator('#settings-panel')).toBeHidden();
});

test('arrow navigation skips inactive items, activates panels, and emits change', async ({ page }) => {
  const overview = page.getByRole('tab', { name: 'Overview' });
  const settings = page.getByRole('tab', { name: 'Settings' });

  await overview.focus();
  await overview.press('ArrowDown');

  await expect(settings).toBeFocused();
  await expect(settings).toHaveAttribute('aria-selected', 'true');
  await expect(overview).toHaveAttribute('aria-selected', 'false');
  await expect(page.locator('#settings-panel')).toBeVisible();
  await expect(page.locator('#overview-panel')).toBeHidden();
  await expect.poll(() => page.evaluate(() => (
    window as typeof window & { __panelSubNavChange?: string }
  ).__panelSubNavChange)).toBe('settings-tab');

  await settings.press('Home');
  await expect(overview).toBeFocused();
  await expect(overview).toHaveAttribute('aria-selected', 'true');

  await overview.press('End');
  await expect(settings).toBeFocused();
});

test('keeps an enabled tab reachable when value points to an inactive item', async ({ page }) => {
  const host = page.locator('#sub-nav');
  await host.evaluate(element => {
    (element as HTMLElement & { value: string }).value = 'activity-tab';
  });

  const overview = page.getByRole('tab', { name: 'Overview' });
  const activity = page.getByRole('tab', { name: 'Activity' });
  await expect(overview).toHaveAttribute('tabindex', '0');
  await expect(activity).toHaveAttribute('tabindex', '-1');
  await overview.focus();
  await overview.press('ArrowDown');
  await expect(page.getByRole('tab', { name: 'Settings' })).toBeFocused();
});

test('selected fill does not change label weight', async ({ page }) => {
  const overview = page.getByRole('tab', { name: 'Overview' });
  const settings = page.getByRole('tab', { name: 'Settings' });

  await expect(overview).toHaveClass(/ds-interaction-fill--selected/);
  await expect(settings).not.toHaveClass(/ds-interaction-fill--selected/);

  const weights = await page.evaluate(() => {
    const selected = document.querySelector('#overview-tab ds-text') as HTMLElement;
    const idle = document.querySelector('#settings-tab ds-text') as HTMLElement;
    const selectedRow = document.getElementById('overview-tab') as HTMLElement;
    const idleRow = document.getElementById('settings-tab') as HTMLElement;
    const probe = document.createElement('div');
    probe.style.backgroundColor = 'var(--color-interaction-active-brand)';
    document.body.append(probe);
    const defaultActive = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return {
      selected: getComputedStyle(selected).fontWeight,
      idle: getComputedStyle(idle).fontWeight,
      selectedFill: getComputedStyle(selectedRow, '::before').backgroundColor,
      idleFill: getComputedStyle(idleRow, '::before').backgroundColor,
      defaultActive,
    };
  });

  expect(weights.selected).toBe(weights.idle);
  expect(weights.selectedFill).toBe(weights.defaultActive);
  expect(weights.selectedFill).not.toBe(weights.idleFill);
});

test('uses surface-aware interaction fills and foregrounds', async ({ page }) => {
  const host = page.locator('#sub-nav');
  const selected = page.getByRole('tab', { name: 'Overview' });

  const resolveColor = (token: string) => page.evaluate(cssToken => {
    const probe = document.createElement('div');
    probe.style.backgroundColor = `var(${cssToken})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  }, token);

  const surfaces = [
    {
      value: 'faint',
      active: '--color-interaction-active',
      foreground: '--color-foreground-primary',
    },
    {
      value: 'medium',
      active: '--color-interaction-on-medium-background-active',
      foreground: '--color-foreground-on-medium-background-primary',
    },
    {
      value: 'bold',
      active: '--color-interaction-on-bold-background-active',
      foreground: '--color-foreground-on-bold-background-primary',
    },
    {
      value: 'strong',
      active: '--color-interaction-on-strong-background-active',
      foreground: '--color-foreground-on-strong-background-primary',
    },
    {
      value: 'translucent',
      active: '--color-translucent-interaction-active',
      foreground: '--color-translucent-foreground-primary',
    },
    {
      value: 'inverted',
      active: '--color-inverted-interaction-active',
      foreground: '--color-inverted-foreground-primary',
    },
    {
      value: 'media',
      active: '--color-media-interaction-active',
      foreground: '--color-media-foreground-primary',
    },
    {
      value: 'always-dark',
      active: '--color-always-dark-interaction-active',
      foreground: '--color-always-dark-foreground-primary',
    },
  ] as const;

  for (const surface of surfaces) {
    await host.evaluate((element, background) => {
      (element as HTMLElement & { background: string }).background = background;
    }, surface.value);

    await expect(selected).toHaveClass(
      new RegExp(`panel-sub-nav__item--on-${surface.value}`),
    );
    await expect(selected).toHaveCSS('color', await resolveColor(surface.foreground));
    await expect.poll(() => selected.evaluate(element => (
      getComputedStyle(element, '::before').backgroundColor
    ))).toBe(await resolveColor(surface.active));
  }
});

test('has no detectable accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
