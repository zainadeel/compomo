import { expect, test } from '@playwright/test';

const LOCKED_METRICS = {
  'text-display-small': { fontSize: '36px', lineHeight: '48px' },
  'text-title-medium': { fontSize: '17px', lineHeight: '24px' },
  'text-body-large': { fontSize: '17px', lineHeight: '24px' },
} as const;

test.describe('Foundation typography style specs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/typography-styles.html');
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  });

  test('displayed specifications match rendered ds-text metrics', async ({ page }) => {
    const rows = await page.locator('[data-typography-row]').evaluateAll(elements =>
      elements.map(element => {
        const node = element as HTMLElement;
        const text = node.querySelector('ds-text') as HTMLElement;
        const style = getComputedStyle(text);
        return {
          variant: node.dataset.variant!,
          emphasis: node.dataset.emphasis === 'true',
          spec: node.querySelector('[data-spec]')?.textContent?.trim() ?? '',
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          fontWeight: style.fontWeight,
        };
      }),
    );

    expect(rows).toHaveLength(18);

    for (const row of rows) {
      expect(row.spec, `${row.variant} ${row.emphasis}`).toContain(
        `${row.fontSize} / ${row.lineHeight}`,
      );
    }

    for (const [variant, metrics] of Object.entries(LOCKED_METRICS)) {
      const matches = rows.filter(row => row.variant === variant);
      expect(matches, variant).toHaveLength(2);
      for (const row of matches) {
        expect(row.fontSize, `${variant} size`).toBe(metrics.fontSize);
        expect(row.lineHeight, `${variant} leading`).toBe(metrics.lineHeight);
        expect(row.spec, `${variant} spec`).toContain(
          `${metrics.fontSize} / ${metrics.lineHeight}`,
        );
      }
    }
  });
});
