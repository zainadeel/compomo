import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/tab-group-backgrounds.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('keeps default styling and uses surface borders with active selected fills elsewhere', async ({ page }) => {
  const host = page.locator('#tabs');
  const track = host.locator('.tab-list');
  const selected = host.locator('.tab--selected');
  const idle = host.getByRole('tab', { name: 'Activity' });
  const dot = selected.locator('ds-badge');

  const resolveColor = (token: string) => page.evaluate(cssToken => {
    const probe = document.createElement('div');
    probe.style.backgroundColor = `var(${cssToken})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  }, token);

  await expect(track).toHaveCSS('background-color', await resolveColor('--color-background-secondary'));
  await expect(track).toHaveCSS('border-top-color', await resolveColor('--color-border-tertiary'));
  await expect(selected).toHaveCSS('background-color', await resolveColor('--color-background-primary'));
  await expect(dot).toHaveCSS('--_badge-ring-width', '0');
  await expect(dot.locator('.badge__mark')).toHaveCSS(
    'box-shadow',
    /0px 0px 0px 0px/,
  );
  const defaultWeights = await Promise.all([
    selected.locator('ds-text').evaluate(element => getComputedStyle(element).fontWeight),
    idle.locator('ds-text').evaluate(element => getComputedStyle(element).fontWeight),
  ]);
  expect(defaultWeights[0]).not.toBe(defaultWeights[1]);

  const surfaces = [
    {
      value: 'faint',
      active: '--color-interaction-active',
      border: '--color-border-tertiary',
    },
    {
      value: 'medium',
      active: '--color-interaction-on-medium-background-active',
      border: '--color-border-on-medium-background-tertiary',
    },
    {
      value: 'bold',
      active: '--color-interaction-on-bold-background-active',
      border: '--color-border-on-bold-background-tertiary',
    },
    {
      value: 'strong',
      active: '--color-interaction-on-strong-background-active',
      border: '--color-border-on-strong-background-tertiary',
    },
    {
      value: 'translucent',
      active: '--color-translucent-interaction-active',
      border: '--color-translucent-border-tertiary',
    },
    {
      value: 'inverted',
      active: '--color-inverted-interaction-active',
      border: '--color-inverted-border-tertiary',
    },
    {
      value: 'media',
      active: '--color-media-interaction-active',
      border: '--color-media-border-tertiary',
    },
    {
      value: 'always-dark',
      active: '--color-always-dark-interaction-active',
      border: '--color-always-dark-border-tertiary',
    },
  ] as const;

  for (const surface of surfaces) {
    await host.evaluate((element, background) => {
      (element as HTMLElement & { background: string }).background = background;
    }, surface.value);

    await expect(host).toHaveClass(new RegExp(`tab-group-host--on-${surface.value}`));
    await expect(track).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

    const borderColor = await resolveColor(surface.border);
    await expect(track).toHaveCSS('border-top-color', borderColor);
    await expect(selected).toHaveCSS('background-color', await resolveColor(surface.active));
    await expect.poll(() => Promise.all([
      selected.locator('ds-text').evaluate(element => getComputedStyle(element).fontWeight),
      idle.locator('ds-text').evaluate(element => getComputedStyle(element).fontWeight),
    ])).toEqual([defaultWeights[1], defaultWeights[1]]);
    await expect.poll(() => selected.evaluate(element => (
      getComputedStyle(element, '::after').boxShadow
    ))).toContain(borderColor);
  }
});

test('renders one accessible label, icon, or icon-label variant across the group', async ({ page }) => {
  const host = page.locator('#tabs');
  const tabs = page.getByRole('tab');

  const setVariant = (variant: 'label' | 'icon' | 'icon-label') => host.evaluate(
    (element, nextVariant) => {
      (element as HTMLElement & { tabs: unknown[] }).tabs = [
        { id: 'overview', label: 'Overview', icon: 'Bookmark', variant: nextVariant, dot: true },
        { id: 'activity', label: 'Activity', icon: 'Bolt', variant: nextVariant },
        { id: 'settings', label: 'Settings', icon: 'Bell', variant: nextVariant },
      ];
    },
    variant,
  );

  await setVariant('icon');
  await expect(tabs).toHaveCount(3);
  await expect(tabs.nth(0)).toHaveAccessibleName('Overview');
  await expect(host.locator('.tab__icon')).toHaveCount(3);
  await expect(host.locator('.tab__label')).toHaveCount(0);
  await expect(host.locator('ds-badge')).toHaveCount(1);

  await setVariant('icon-label');
  await expect(tabs.nth(0)).toHaveAccessibleName('Overview');
  await expect(host.locator('.tab__icon')).toHaveCount(3);
  await expect(host.locator('.tab__label')).toHaveCount(3);

  await setVariant('label');
  await expect(host.locator('.tab__icon')).toHaveCount(0);
  await expect(host.locator('.tab__label')).toHaveCount(3);
});

test('keeps one enabled tab reachable when value is missing or points to an inactive tab', async ({ page }) => {
  const host = page.locator('#tabs');
  await host.evaluate(element => {
    const group = element as HTMLElement & { value: string; tabs: unknown[] };
    group.tabs = [
      { id: 'overview', label: 'Overview' },
      { id: 'activity', label: 'Activity', isInactive: true },
      { id: 'settings', label: 'Settings' },
    ];
    group.value = 'activity';
  });

  await expect(page.getByRole('tab', { name: 'Overview' })).toHaveAttribute('tabindex', '0');
  await expect(page.getByRole('tab', { name: 'Activity' })).toHaveAttribute('tabindex', '-1');

  await host.evaluate(element => {
    (element as HTMLElement & { value: string }).value = 'missing';
  });
  await expect(page.getByRole('tab', { name: 'Overview' })).toHaveAttribute('tabindex', '0');
});
