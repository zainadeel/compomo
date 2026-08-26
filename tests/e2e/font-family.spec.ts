import { expect, test } from '@playwright/test';

const uiFamilySurfaces = [
  { path: '/text.html', selector: '#default', label: 'ds-text' },
  { path: '/message-composer.html', selector: '#composer textarea', label: 'native textarea' },
  { path: '/chart.html', selector: '#chart .chart__tick', label: 'SVG chart text' },
  { path: '/shell-app-chrome.html', selector: '.shell-app', label: 'shell chrome' },
  { path: '/prose.html', selector: '#semantic-prose > p', label: 'semantic prose' },
] as const;

test('resolves the canonical UI family across direct rendering surfaces', async ({ page }) => {
  for (const surface of uiFamilySurfaces) {
    await page.goto(surface.path);
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');

    const families = await page
      .locator(surface.selector)
      .first()
      .evaluate(element => {
        const root = getComputedStyle(document.documentElement);
        return {
          actual: getComputedStyle(element).fontFamily,
          expected: root.getPropertyValue('--typography-font-family-ui').trim(),
          legacy: root.getPropertyValue(`--typography-font-${'family'}`).trim(),
        };
      });

    expect(families.expected, `${surface.label} canonical token`).toContain('Inter');
    expect(families.actual, `${surface.label} computed family`).toContain('Inter');
    expect(families.legacy, `${surface.label} legacy token`).toBe('');
  }
});
