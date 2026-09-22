import { expect, test } from '@playwright/test';
import { expectDefiniteBounds } from './rendered-geometry';

test.beforeEach(async ({ page }) => {
  await page.goto('/navigation-tab-group.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('uses full control-height tabs with four-pixel padding and gaps', async ({ page }) => {
  const host = page.locator('#navigation-tabs');
  const track = host.locator('.tab-list');
  const selected = host.locator('.tab--selected');

  for (const density of [
    { size: 'sm', shell: 32, tab: 24 },
    { size: 'md', shell: 40, tab: 32 },
    { size: 'lg', shell: 48, tab: 40 },
  ] as const) {
    await host.evaluate((element, size) => {
      (element as HTMLElement & { size: string }).size = size;
    }, density.size);

    await expectDefiniteBounds(track, {
      label: `${density.size} navigation shell`,
      height: density.shell,
    });
    await expectDefiniteBounds(selected, {
      label: `${density.size} selected tab`,
      height: density.tab,
    });
    await expect(selected).not.toHaveClass(/ds-control--inset/);
    const geometry = await track.evaluate(element => {
      const shell = element.getBoundingClientRect();
      const tab = element.querySelector('.tab--selected')!.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        top: tab.top - shell.top,
        left: tab.left - shell.left,
        bottom: shell.bottom - tab.bottom,
        padding: style.padding,
        gap: style.gap,
      };
    });
    expect(geometry).toEqual({ top: 4, left: 4, bottom: 4, padding: '4px', gap: '4px' });
  }
});

test('uses a primary selected surface and medium elevation on basic backgrounds', async ({
  page,
}) => {
  const selected = page.locator('#navigation-tabs .tab--selected');
  const track = page.locator('#navigation-tabs .tab-list');

  for (const theme of ['light', 'dark']) {
    await page.locator('html').evaluate((element, nextTheme) => {
      element.dataset.theme = nextTheme;
    }, theme);

    const styles = await selected.evaluate(element => {
      const probe = document.createElement('div');
      probe.style.backgroundColor = 'var(--color-background-primary)';
      probe.style.boxShadow = 'var(--effect-elevation-elevated-md)';
      document.body.append(probe);
      const actual = getComputedStyle(element);
      const expected = getComputedStyle(probe);
      const result = {
        background: actual.backgroundColor,
        expectedBackground: expected.backgroundColor,
        shadow: actual.boxShadow,
        expectedShadow: expected.boxShadow,
      };
      probe.remove();
      return result;
    });
    expect(styles.background).toBe(styles.expectedBackground);
    expect(styles.shadow).toBe(styles.expectedShadow);
    await expect(track).toHaveCSS('border-top-width', '0px');
    await expect(track).toHaveCSS('border-radius', '9999px');
  }
});

test('emphasizes only the selected navigation tab label', async ({ page }) => {
  const host = page.locator('#navigation-tabs');
  const overviewLabel = host.getByRole('tab', { name: 'Overview' }).locator('ds-text');
  const activityTab = host.getByRole('tab', { name: 'Activity' });
  const activityLabel = activityTab.locator('ds-text');

  await expect(overviewLabel).toHaveJSProperty('emphasis', true);
  await expect(activityLabel).toHaveJSProperty('emphasis', false);
  await activityTab.click();
  await expect(overviewLabel).toHaveJSProperty('emphasis', false);
  await expect(activityLabel).toHaveJSProperty('emphasis', true);
});

test('delegates keyboard selection and emits one change per activation', async ({ page }) => {
  const host = page.locator('#navigation-tabs');
  const list = host.getByRole('tablist', { name: 'Workspace panels' });
  const overview = list.getByRole('tab', { name: 'Overview' });
  const activity = list.getByRole('tab', { name: 'Activity' });
  const settings = list.getByRole('tab', { name: 'Settings' });

  await expect(overview).toHaveAttribute('aria-selected', 'true');
  await expect(settings).toHaveAttribute('aria-disabled', 'true');
  await overview.focus();
  await page.keyboard.press('ArrowRight');
  await expect(activity).toBeFocused();
  await expect(activity).toHaveAttribute('aria-selected', 'true');
  await expect(host).toHaveJSProperty('value', 'activity');
  await expect(page.locator('#panel-activity')).toBeVisible();
  await expect(page.locator('#panel-overview')).toBeHidden();
  await page.keyboard.press('ArrowRight');
  await expect(overview).toBeFocused();
  await expect(host).toHaveJSProperty('value', 'overview');
  await expect(page.locator('#panel-overview')).toBeVisible();
  expect(await page.evaluate(() => (window as any).navigationChangeEvents)).toEqual([
    'activity',
    'overview',
  ]);
});

test('preserves a visible selected boundary in forced colors', async ({ page, browserName }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const supported = await page.evaluate(
    () =>
      window.matchMedia('(forced-colors: active)').matches &&
      CSS.supports('forced-color-adjust', 'auto')
  );
  test.skip(!supported, `${browserName} does not implement forced-colors CSS emulation`);

  const selected = page.locator('#navigation-tabs .tab--selected');
  const track = page.locator('#navigation-tabs .tab-list');
  await expect(selected).toHaveCSS('box-shadow', 'none');
  await expect(selected).toHaveCSS('outline-style', 'solid');
  await expect(track).toHaveCSS('outline-style', 'solid');
});
