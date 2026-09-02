import { expect, test } from '@playwright/test';
import { chromiumOnly } from './browser-tier';

test.beforeEach(async ({ page }) => {
  await page.goto('/score.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('maps score boundaries to matching semantic background and foreground pairs', async ({
  page,
}) => {
  for (const [id, level] of [
    ['fair', 'fair'],
    ['good', 'good'],
    ['excellent', 'excellent'],
  ] as const) {
    const colors = await page.locator(`#${id} .score__badge`).evaluate((element, resolvedLevel) => {
      const resolve = (property: string) => {
        const probe = document.createElement('span');
        probe.style.color = `var(${property})`;
        document.body.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      };
      const style = getComputedStyle(element);
      return {
        background: style.backgroundColor,
        color: style.color,
        expectedBackground: resolve(`--color-safety-score-background-${resolvedLevel}`),
        expectedColor: resolve(`--color-safety-score-foreground-on-${resolvedLevel}`),
      };
    }, level);

    expect(colors.background).toBe(colors.expectedBackground);
    expect(colors.color).toBe(colors.expectedColor);
  }
});

test(
  'sizes the fill to the matching control height and declared width',
  chromiumOnly(
    'layout-geometry',
    'Score densities are token-backed fill geometry; Chromium is the owner.'
  ),
  async ({ page }) => {
    await expect(page.locator('#lg ds-text.score__value')).toHaveJSProperty(
      'variant',
      'text-display-small'
    );
    await expect(page.locator('#md ds-text.score__value')).toHaveJSProperty(
      'variant',
      'text-title-large'
    );
    await expect(page.locator('#sm ds-text.score__value')).toHaveJSProperty(
      'variant',
      'text-title-small'
    );

    const geometry = await page.evaluate(() => {
      const cssPx = (value: string) => {
        const probe = document.createElement('span');
        probe.style.width = value;
        document.body.append(probe);
        const width = getComputedStyle(probe).width;
        probe.remove();
        return Number.parseFloat(width);
      };
      const box = (id: string) => {
        const bounds = document.querySelector(`#${id} .score__badge`)!.getBoundingClientRect();
        return { width: bounds.width, height: bounds.height };
      };
      return {
        sm: box('sm'),
        md: box('md'),
        lg: box('lg'),
        widthSm: cssPx('calc(var(--dimension-size-400) - var(--dimension-space-050))'),
        widthMd: cssPx('var(--dimension-size-500)'),
        widthLg: cssPx('calc(var(--dimension-size-600) + var(--dimension-space-100))'),
        heightSm: cssPx('var(--dimension-size-300)'),
        heightMd: cssPx('var(--dimension-size-400)'),
        heightLg: cssPx('var(--dimension-size-500)'),
      };
    });

    expect(geometry.sm.width).toBeCloseTo(geometry.widthSm, 1);
    expect(geometry.sm.height).toBeCloseTo(geometry.heightSm, 1);
    expect(geometry.md.width).toBeCloseTo(geometry.widthMd, 1);
    expect(geometry.md.height).toBeCloseTo(geometry.heightMd, 1);
    expect(geometry.lg.width).toBeCloseTo(geometry.widthLg, 1);
    expect(geometry.lg.height).toBeCloseTo(geometry.heightLg, 1);
  }
);

test('renders an optional trend beside the fill and skeletons it while loading', async ({
  page,
}) => {
  const trend = page.locator('#with-trend .score__trend');
  await expect(trend).toHaveText('↑ 4');
  const trendColor = await trend.evaluate(element => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-foreground-bold-positive)';
    document.body.append(probe);
    const expected = getComputedStyle(probe).color;
    probe.remove();
    return { color: getComputedStyle(element).color, expected };
  });
  expect(trendColor.color).toBe(trendColor.expected);
  await expect(page.locator('#lg .score__trend')).toHaveCount(0);
  await expect(page.locator('#loading-lg .score__badge ds-skeleton')).toHaveJSProperty(
    'background',
    'bold'
  );
  await expect(page.locator('#loading-lg .score__trend')).toHaveCount(1);
  await expect(page.locator('#loading-lg .score__trend')).not.toHaveJSProperty(
    'background',
    'bold'
  );
  await expect(page.locator('#loading-lg')).toHaveAttribute('aria-busy', 'true');
});

test(
  'keeps the figure skeleton inside the fill at every size',
  chromiumOnly(
    'layout-geometry',
    'Score loading inset is token-backed fill geometry; Chromium is the owner.'
  ),
  async ({ page }) => {
    const geometry = await page.evaluate(() =>
      (['sm', 'md', 'lg'] as const).map(size => {
        const badge = document.querySelector(`#loading-${size} .score__badge`)!;
        const skeleton = badge.querySelector('ds-skeleton')!;
        const shape = skeleton.shadowRoot!.querySelector('.skeleton__shape')!;
        const badgeBox = badge.getBoundingClientRect();
        const shapeBox = shape.getBoundingClientRect();
        return {
          size,
          top: shapeBox.top - badgeBox.top,
          right: badgeBox.right - shapeBox.right,
          bottom: badgeBox.bottom - shapeBox.bottom,
          left: shapeBox.left - badgeBox.left,
          expected: badgeBox.height / 8,
        };
      })
    );

    for (const item of geometry) {
      expect(item.left, `${item.size} start`).toBeCloseTo(item.expected, 1);
      expect(item.right, `${item.size} end`).toBeCloseTo(item.expected, 1);
      expect(item.top, `${item.size} top`).toBeCloseTo(item.expected, 1);
      expect(item.bottom, `${item.size} bottom`).toBeCloseTo(item.expected, 1);
    }

    const fillColor = await page
      .locator('#loading-md .score__badge ds-skeleton')
      .evaluate(element => {
        const shape = element.shadowRoot!.querySelector('.skeleton__shape')!;
        const resolve = (property: string) => {
          const probe = document.createElement('span');
          probe.style.color = `var(${property})`;
          document.body.append(probe);
          const color = getComputedStyle(probe).color;
          probe.remove();
          return color;
        };
        return {
          background: getComputedStyle(shape).backgroundColor,
          expected: resolve('--color-foreground-on-bold-background-quaternary'),
        };
      });
    expect(fillColor.background).toBe(fillColor.expected);
  }
);
