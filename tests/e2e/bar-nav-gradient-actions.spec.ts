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
      })),
    );

    expect(actions).toHaveLength(3);
    expect(actions.every(action => action.buttonCount === 1)).toBe(true);

    const dotted = actions.filter(action => action.label !== 'Search');
    expect(dotted.every(action => action.badgeGradient === true)).toBe(true);
  });
});
