import { expect, test } from '@playwright/test';

test.describe('BarNav actions inside gradient shell', () => {
  test('dotted actions render buttons and enable gradient badge rings', async ({ page }) => {
    await page.goto('/gradient-actions.html');
    await page.waitForFunction(() => customElements.get('ds-bar-nav-action') !== undefined);

    const actions = await page.evaluate(() =>
      [...document.querySelectorAll('.bar-nav__actions ds-bar-nav-action')].map(action => ({
        label: action.getAttribute('aria-label'),
        buttonCount: action.querySelectorAll('button').length,
        badgeGradient: action.querySelector('ds-badge')?.gradientBackground ?? null,
        badgePosition:
          action.querySelector('ds-badge')?.style.getPropertyValue('--_badge-gradient-position') ??
          '',
      })),
    );

    expect(actions).toHaveLength(5);
    expect(actions.every(action => action.buttonCount === 1)).toBe(true);

    const dotted = actions.filter(action => action.badgeGradient === true);
    expect(dotted).toHaveLength(1);
    expect(dotted[0].label).toBe('Activity');
    expect(dotted[0].badgePosition.length).toBeGreaterThan(0);
  });
});
