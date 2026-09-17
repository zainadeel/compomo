import { expect, test } from '@playwright/test';

test('BarNav overflow controls use the Chrome token context', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => typeof window.__setShellWidth === 'function');
  await expect(
    page.locator('.bar-nav__tabs-visible, .bar-nav__overflow-trigger').first()
  ).toBeVisible({ timeout: 5000 });

  const snapshot = await page.locator('.bar-nav').evaluate(element => {
    const bar = element as HTMLElement;
    const tab = bar.querySelector<HTMLElement>('.bar-nav__tab');
    const dot = bar.querySelector<HTMLElement>('.bar-nav__tab-dot');
    const read = (target: Element | null, property: string) =>
      target ? getComputedStyle(target).getPropertyValue(property).trim() : '';
    const sameToken = (target: Element | null, alias: string, token: string) =>
      Boolean(target) && read(target, alias) === read(target, token);

    return {
      background: sameToken(bar, '--_bar-nav-bg', '--color-chrome-background-theme'),
      border: sameToken(bar, '--_bar-nav-border', '--color-chrome-border-tertiary'),
      foregroundPrimary: sameToken(
        bar,
        '--_bar-nav-fg-primary',
        '--color-chrome-foreground-primary'
      ),
      foregroundSecondary: sameToken(
        bar,
        '--_bar-nav-fg-secondary',
        '--color-chrome-foreground-secondary'
      ),
      dot: sameToken(dot, '--_badge-bg', '--color-chrome-foreground-theme'),
      tabChrome: tab?.classList.contains('ds-interaction-fill--on-chrome') ?? false,
    };
  });

  expect(snapshot).toMatchObject({
    background: true,
    border: true,
    foregroundPrimary: true,
    foregroundSecondary: true,
    dot: true,
    tabChrome: true,
  });

  await page.evaluate(() => window.__setShellWidth(320));
  const trigger = page.locator('.bar-nav__overflow-trigger');
  await expect(trigger).toBeVisible({ timeout: 5000 });
  await expect(trigger.locator('.button-unfilled')).toHaveClass(
    /button-unfilled--background-chrome/
  );
  await expect(trigger.locator('.button-unfilled')).toHaveClass(
    /ds-interaction-fill--on-chrome/
  );
});
