import { expect, test, type Locator } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/card-overview.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

const metricGeometry = (card: Locator) =>
  card.locator('.card-overview__metric').evaluateAll(elements =>
    elements.map(element => {
      const rect = element.getBoundingClientRect();
      return { top: Math.round(rect.top), width: rect.width };
    })
  );

test('keeps partial-row metrics on the same equal-width tracks', async ({ page }) => {
  for (const [id, expectedRows] of [
    ['five', [4, 1]],
    ['six', [4, 2]],
    ['wrapped-four', [3, 1]],
  ] as const) {
    const geometry = await metricGeometry(page.locator(`#${id}`));
    const widths = geometry.map(metric => metric.width);
    const rowCounts = Object.values(
      geometry.reduce<Record<number, number>>((rows, metric) => {
        rows[metric.top] = (rows[metric.top] ?? 0) + 1;
        return rows;
      }, {})
    );

    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(0.1);
    expect(rowCounts).toEqual(expectedRows);
  }
});

test('clips metric separators at the grid edges', async ({ page }) => {
  for (const id of ['five', 'six', 'wrapped-four']) {
    const metrics = page.locator(`#${id} .card-overview__metrics`);
    const cells = metrics.locator('.card-overview__metric');

    await expect(metrics).toHaveCSS('overflow', 'clip');

    const styles = await cells.evaluateAll(elements =>
      elements.map(element => {
        const style = getComputedStyle(element);
        return {
          borderBlockEndWidth: style.borderBlockEndWidth,
          borderInlineEndWidth: style.borderInlineEndWidth,
          boxShadow: style.boxShadow,
        };
      })
    );

    for (const style of styles) {
      expect(style.borderBlockEndWidth).toBe('0px');
      expect(style.borderInlineEndWidth).toBe('0px');
      expect(style.boxShadow).not.toBe('none');
    }

    const geometry = await metrics.evaluate(element => {
      const container = element.getBoundingClientRect();
      const cellRects = Array.from(element.querySelectorAll('.card-overview__metric')).map(cell =>
        cell.getBoundingClientRect()
      );

      return {
        containerBottom: container.bottom,
        containerRight: container.right,
        lastRowBottom: Math.max(...cellRects.map(rect => rect.bottom)),
        rightmostCell: Math.max(...cellRects.map(rect => rect.right)),
      };
    });

    expect(geometry.lastRowBottom).toBeCloseTo(geometry.containerBottom, 1);
    expect(geometry.rightmostCell).toBeCloseTo(geometry.containerRight, 1);
  }
});

test('groups the score, period, and filter above fully stacked metrics', async ({ page }) => {
  const card = page.locator('#stacked');
  const summary = card.locator('.card-overview__summary');
  const scoreLabel = card.locator('.card-overview__score-label');
  const scoreFigure = card.locator('.card-overview__score-figure');
  const period = card.locator('.card-overview__period');
  const filter = card.locator('[slot="filter"]');
  const metrics = card.locator('.card-overview__metric');

  const layout = await card.evaluate(element => {
    const rect = (selector: string) => element.querySelector(selector)!.getBoundingClientRect();
    const metricRects = Array.from(element.querySelectorAll('.card-overview__metric')).map(metric =>
      metric.getBoundingClientRect()
    );

    return {
      card: rect('.card-overview__summary').toJSON(),
      score: rect('.card-overview__score').toJSON(),
      scoreLabel: rect('.card-overview__score-label').toJSON(),
      scoreFigure: rect('.card-overview__score-figure').toJSON(),
      currentPeriod: rect('.card-overview__period-current').toJSON(),
      comparisonPeriod: rect('.card-overview__period-comparison').toJSON(),
      period: rect('.card-overview__period').toJSON(),
      filter: element.querySelector('[slot="filter"]')!.getBoundingClientRect().toJSON(),
      metricTops: metricRects.map(metric => Math.round(metric.top)),
      metricWidths: metricRects.map(metric => metric.width),
      metrics: rect('.card-overview__metrics').toJSON(),
    };
  });

  await expect(summary).toHaveCSS('display', 'grid');
  await expect(metrics).toHaveCount(3);
  expect(new Set(layout.metricTops).size).toBe(3);
  expect(Math.max(...layout.metricWidths) - Math.min(...layout.metricWidths)).toBeLessThan(0.1);
  expect(layout.metrics.width).toBeCloseTo(layout.card.width, 1);
  expect(layout.metricWidths[0]).toBeCloseTo(layout.card.width, 1);
  expect(layout.scoreLabel.bottom).toBeLessThanOrEqual(layout.scoreFigure.top);
  await expect(card.locator('.card-overview__score-band')).toBeHidden();
  expect(layout.currentPeriod.bottom).toBeLessThanOrEqual(layout.comparisonPeriod.top);
  expect(layout.currentPeriod.right).toBeCloseTo(layout.comparisonPeriod.right, 1);
  expect(layout.filter.top - layout.card.top).toBeCloseTo(
    layout.card.right - layout.filter.right,
    1
  );
  expect(layout.filter.left).toBeGreaterThan(layout.scoreFigure.left);
  expect(layout.currentPeriod.left).toBeGreaterThan(layout.scoreFigure.right);
  expect(layout.currentPeriod.bottom).toBeGreaterThan(layout.scoreFigure.top);
  expect(layout.currentPeriod.top).toBeLessThan(layout.scoreFigure.bottom);
  expect(layout.card.right - layout.currentPeriod.right).toBeCloseTo(
    layout.scoreLabel.left - layout.card.left,
    1
  );
  expect(layout.comparisonPeriod.bottom).toBeLessThanOrEqual(layout.score.bottom);
  expect(layout.card.bottom).toBeLessThanOrEqual(layout.metrics.top);
});

test('reserves the score value width before placing its trend', async ({ page }) => {
  const card = page.locator('#score-pressure');
  const geometry = await card.evaluate(element => {
    const value = element.querySelector('.card-overview__score-value')!.getBoundingClientRect();
    const trend = element
      .querySelector('.card-overview__score-figure .card-overview__trend')!
      .getBoundingClientRect();
    const period = element.querySelector('.card-overview__period')!.getBoundingClientRect();

    return {
      valueRight: value.right,
      trendLeft: trend.left,
      trendRight: trend.right,
      periodLeft: period.left,
    };
  });

  expect(geometry.trendLeft).toBeGreaterThan(geometry.valueRight);
  expect(geometry.trendRight).toBeLessThanOrEqual(geometry.periodLeft);
});

test('supports a page-owned stacked layout at a wide card width', async ({ page }) => {
  const card = page.locator('#forced-stacked');
  const summary = card.locator('.card-overview__summary');
  const metrics = card.locator('.card-overview__metric');
  const geometry = await metricGeometry(card);

  await expect(card).toHaveJSProperty('layout', 'stacked');
  await expect(summary).toHaveCSS('display', 'grid');
  expect(new Set(geometry.map(metric => metric.top)).size).toBe(5);
  expect(
    Math.max(...geometry.map(metric => metric.width)) -
      Math.min(...geometry.map(metric => metric.width))
  ).toBeLessThan(0.1);
});

test('renders compact summary chrome as one exact 48px bar', async ({ page }) => {
  const card = page.locator('#compact');
  const score = card.locator('.card-overview__score');
  const scoreLabel = card.locator('.card-overview__score-label');
  const scoreValue = card.locator('.card-overview__score-figure > ds-text').first();
  const trend = card.locator('.card-overview__trend');
  const period = card.locator('.card-overview__period');
  const filter = card.locator('[slot="filter"]');

  const geometry = await card.evaluate(element => {
    const bounds = (selector: string) => element.querySelector(selector)!.getBoundingClientRect();
    const cardBounds = element.getBoundingClientRect();
    const filterBounds = bounds('[slot="filter"]');

    return {
      height: cardBounds.height,
      filterTopInset: filterBounds.top - cardBounds.top,
      filterBottomInset: cardBounds.bottom - filterBounds.bottom,
      scoreBorderWidth: getComputedStyle(
        element.querySelector<HTMLElement>('.card-overview__score')!
      ).borderInlineEndWidth,
    };
  });

  expect(geometry.height).toBe(48);
  expect(geometry.filterTopInset).toBe(8);
  expect(geometry.filterBottomInset).toBe(8);
  expect(Number.parseFloat(geometry.scoreBorderWidth)).toBeGreaterThan(0);
  await expect(score).toBeVisible();
  await expect(period).toBeVisible();
  await expect(filter).toBeVisible();
  await expect(card.locator('.card-overview__metric')).toHaveCount(0);
  await expect(card.locator('.card-overview__score-band')).toHaveCount(0);
  await expect(scoreLabel).toHaveJSProperty('variant', 'text-body-medium');
  await expect(scoreLabel).toHaveJSProperty('emphasis', false);
  await expect(scoreValue).toHaveJSProperty('variant', 'text-body-medium');
  await expect(scoreValue).toHaveJSProperty('emphasis', true);
  await expect(trend).toHaveJSProperty('variant', 'text-body-medium');
  await expect(trend).toHaveJSProperty('emphasis', false);
});

test('keeps elevation fitted to the shrinking surface while preserving expanded flow', async ({
  page,
}) => {
  const card = page.locator('#scroll-collapse');
  const surface = card.locator('.card-overview__surface');
  const clip = card.locator('.card-overview__clip');
  const layout = card.locator('.card-overview__layout');
  const expandedHeight = await card.evaluate(element => element.getBoundingClientRect().height);

  await card.evaluate(element => {
    (element as HTMLElement & { scrollCollapseProgress: number }).scrollCollapseProgress = 0.5;
  });

  await expect(card).toHaveClass(/card-overview--scroll-collapsing/);
  await expect
    .poll(() => surface.evaluate(element => element.getBoundingClientRect().height))
    .toBeCloseTo((expandedHeight + 48) / 2, 1);

  const geometry = await card.evaluate(element => {
    const host = element.getBoundingClientRect();
    const surfaceElement = element.querySelector<HTMLElement>('.card-overview__surface')!;
    const clipElement = element.querySelector<HTMLElement>('.card-overview__clip')!;
    const layoutElement = element.querySelector<HTMLElement>('.card-overview__layout')!;
    const surface = surfaceElement.getBoundingClientRect();
    const layout = layoutElement.getBoundingClientRect();
    const surfaceStyle = getComputedStyle(surfaceElement);

    return {
      hostHeight: host.height,
      surfaceHeight: surface.height,
      surfaceTop: surface.top,
      hostTop: host.top,
      contentOffset: surface.top - layout.top,
      overflow: getComputedStyle(clipElement).overflow,
      shadow: surfaceStyle.boxShadow,
      highlight: getComputedStyle(surfaceElement, '::after').boxShadow,
    };
  });

  expect(geometry.hostHeight).toBeCloseTo(expandedHeight, 1);
  expect(geometry.surfaceHeight).toBeCloseTo((expandedHeight + 48) / 2, 1);
  expect(geometry.surfaceTop).toBeCloseTo(geometry.hostTop, 1);
  expect(geometry.contentOffset).toBeCloseTo(
    expandedHeight - geometry.surfaceHeight,
    1
  );
  expect(geometry.overflow).toBe('hidden');
  expect(geometry.shadow).not.toBe('none');
  expect(geometry.highlight).not.toBe('none');
  await expect(layout).toHaveCSS('will-change', 'transform');
  await expect(clip).toHaveCSS(
    'border-radius',
    await surface.evaluate(el => getComputedStyle(el).borderRadius)
  );
});

test('keeps the compact score centered while reporting copy truncates', async ({ page }) => {
  const card = page.locator('#compact');

  const measure = () =>
    card.evaluate(element => {
      const bounds = (selector: string) =>
        element.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
      const cardBounds = element.getBoundingClientRect();
      const score = bounds('.card-overview__score');
      const current = element.querySelector<HTMLElement>('.card-overview__period-current')!;
      const comparison = element.querySelector<HTMLElement>(
        '.card-overview__period-comparison'
      )!;
      const currentText = current.firstElementChild as HTMLElement | null;
      const comparisonText = comparison.firstElementChild as HTMLElement | null;

      return {
        height: cardBounds.height,
        scoreCenterOffset: (score.top + score.bottom) / 2 - (cardBounds.top + cardBounds.bottom) / 2,
        scoreRight: score.right,
        periodLeft: bounds('.card-overview__period').left,
        currentRight: current.getBoundingClientRect().right,
        comparisonLeft: comparison.getBoundingClientRect().left,
        comparisonRight: comparison.getBoundingClientRect().right,
        filterLeft: bounds('[slot="filter"]').left,
        copyIsTruncated:
          current.scrollWidth > current.clientWidth ||
          comparison.scrollWidth > comparison.clientWidth ||
          (currentText?.scrollWidth ?? 0) > (currentText?.clientWidth ?? 0) ||
          (comparisonText?.scrollWidth ?? 0) > (comparisonText?.clientWidth ?? 0),
      };
    });

  const wide = await measure();
  await card.evaluate(element => {
    element.style.width = '360px';
  });
  const narrow = await measure();

  expect(narrow.height).toBe(48);
  expect(Math.abs(narrow.scoreCenterOffset)).toBeLessThanOrEqual(1);
  expect(narrow.scoreCenterOffset).toBeCloseTo(wide.scoreCenterOffset, 1);
  expect(narrow.scoreRight).toBeLessThanOrEqual(narrow.periodLeft);
  expect(narrow.currentRight).toBeLessThanOrEqual(narrow.comparisonLeft);
  expect(narrow.comparisonRight).toBeLessThanOrEqual(narrow.filterLeft);
  expect(narrow.copyIsTruncated).toBe(true);
});

test('renders no more than six metrics', async ({ page }) => {
  await expect(page.locator('#clamped .card-overview__metric')).toHaveCount(6);
});

test('keeps the current period primary and comparison copy secondary', async ({ page }) => {
  const card = page.locator('#five');
  await expect(card.locator('.card-overview__period-current')).toHaveText(
    'Jun 29, 2026 – Jul 26, 2026'
  );
  await expect(card.locator('.card-overview__period-comparison')).toHaveText('vs Previous period');

  const colors = await card.evaluate(element => {
    const current = element.querySelector<HTMLElement>('.card-overview__period-current')!;
    const comparison = element.querySelector<HTMLElement>('.card-overview__period-comparison')!;
    return {
      current: getComputedStyle(current).color,
      comparison: getComputedStyle(comparison).color,
    };
  });
  expect(colors.current).not.toBe(colors.comparison);
});

test('follows inverted surface and foreground tokens in both themes', async ({ page }) => {
  const themeColors: string[] = [];

  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => document.documentElement.setAttribute('data-theme', value), theme);
    const colors = await page.locator('#score-pressure').evaluate(element => {
      const resolveColor = (property: string) => {
        const probe = document.createElement('span');
        probe.style.color = `var(${property})`;
        document.body.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      };
      const surface = element.querySelector<HTMLElement>('.card-overview__surface')!;
      const primary = element.querySelector<HTMLElement>('.card-overview__score-value')!;
      const secondary = element.querySelector<HTMLElement>('.card-overview__score-label')!;
      const trends = element.querySelectorAll<HTMLElement>(
        '.card-overview__metrics .card-overview__trend'
      );

      return [
        {
          actual: getComputedStyle(surface).backgroundColor,
          expected: resolveColor('--color-inverted-background'),
        },
        {
          actual: getComputedStyle(primary).color,
          expected: resolveColor('--color-inverted-foreground-primary'),
        },
        {
          actual: getComputedStyle(secondary).color,
          expected: resolveColor('--color-inverted-foreground-secondary'),
        },
        {
          actual: getComputedStyle(trends[0]).color,
          expected: resolveColor('--color-inverted-foreground-positive'),
        },
        {
          actual: getComputedStyle(trends[1]).color,
          expected: resolveColor('--color-inverted-foreground-negative'),
        },
        {
          actual: getComputedStyle(trends[2]).color,
          expected: resolveColor('--color-inverted-foreground-secondary'),
        },
      ];
    });

    for (const color of colors) {
      expect(color.actual).toBe(color.expected);
    }
    themeColors.push(colors[0].actual);
  }

  expect(themeColors[0]).not.toBe(themeColors[1]);
});
