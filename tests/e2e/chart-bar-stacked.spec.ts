import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/chart-bar-stacked.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('stacks raw series contiguously with only the visible top rounded', async ({ page }) => {
  const chart = page.locator('#stacked');
  const stacks = chart.locator('.chart-bar-stacked__stack');

  await expect(stacks).toHaveCount(2);
  await expect(chart.locator('.chart-bar-stacked__segment-shape')).toHaveCount(6);
  await expect(chart.locator('.chart-bar-stacked__segment-shape--rounded')).toHaveCount(2);
  await expect(chart.locator('.chart-bar-stacked__segment-separator')).toHaveCount(4);

  const stackGeometry = await stacks.evaluateAll(elements =>
    elements.map(stack =>
      Array.from(stack.querySelectorAll<SVGRectElement>('.chart-bar-stacked__segment-shape'))
        .map(segment => ({
          y: Number(segment.getAttribute('y')),
          height: Number(segment.getAttribute('height')),
          radius: getComputedStyle(segment).rx,
        }))
    )
  );

  for (const segments of stackGeometry) {
    for (let index = 1; index < segments.length; index += 1) {
      expect(segments[index].y + segments[index].height).toBeCloseTo(
        segments[index - 1].y,
        5
      );
    }
    expect(segments.at(-1)?.radius).toBe('2px');
    expect(segments.slice(0, -1).every(segment => segment.radius === 'auto')).toBe(true);
  }
});

test('normalizes every non-empty time bucket to a fixed 0–100% stack', async ({ page }) => {
  const chart = page.locator('#percentage');
  const axisLabels = chart.locator('.chart-bar-stacked__axis-label');
  const stacks = chart.locator('.chart-bar-stacked__stack');
  const segments = chart.locator('.chart-bar-stacked__segment-shape');
  const separators = chart.locator('.chart-bar-stacked__segment-separator');

  const axisText = (await axisLabels.allTextContents()).map(label => label.trim());
  expect(axisText.filter(label => label === '0%')).toHaveLength(1);
  expect(axisText.filter(label => label === '100%')).toHaveLength(1);
  await expect(chart.locator('.chart-bar-stacked__segment-shape--rounded')).toHaveCount(0);
  await expect(chart.locator('.chart-bar-stacked__segment-square-base')).toHaveCount(0);
  await expect(separators).toHaveCount(4);
  await expect(separators.first()).toHaveCSS('stroke-width', '1px');

  const radii = await segments.evaluateAll(elements =>
    elements.map(segment => getComputedStyle(segment).rx)
  );
  expect(radii.every(radius => radius === 'auto')).toBe(true);

  const normalizedGeometry = await stacks.evaluateAll(elements =>
    elements.map(stack => {
      const segments = Array.from(
        stack.querySelectorAll<SVGRectElement>('.chart-bar-stacked__segment-shape')
      );
      return {
        top: Math.min(...segments.map(segment => Number(segment.getAttribute('y')))),
        bottom: Math.max(
          ...segments.map(
            segment =>
              Number(segment.getAttribute('y')) + Number(segment.getAttribute('height'))
          )
        ),
      };
    })
  );

  for (const stack of normalizedGeometry) {
    expect(stack.top).toBeCloseTo(0, 5);
    expect(stack.bottom).toBeCloseTo(200, 5);
  }

  await expect(chart.locator('svg')).toHaveAttribute(
    'aria-label',
    /Jan: Driving: 40\.0%, Idling: 30\.0%, Stopped: 30\.0%/
  );
});
