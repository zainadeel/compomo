import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/card-overview.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('renders the safety score as the first equal-track, nonselectable grid cell', async ({
  page,
}) => {
  const card = page.locator('#default');
  const cells = card.locator('.card-overview__score, .card-overview__metric');
  const widths = await cells.evaluateAll(elements =>
    elements.map(element => element.getBoundingClientRect().width)
  );

  expect(widths).toHaveLength(6);
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(0.1);
  await expect(cells.first()).toHaveClass(/card-overview__score/);
  await expect(card.locator('.card-overview__score [role="button"]')).toHaveCount(0);
  await expect(card.locator('.card-overview__score [tabindex]')).toHaveCount(0);
  await expect(card.locator('.card-overview__score-band')).toHaveCount(0);
  await expect(card.locator('.card-overview__score-label-spacer')).toBeHidden();
});

test('prefers equal rows, falling back to a short final row when none divide', async ({ page }) => {
  const card = page.locator('#default');
  const columnCount = () =>
    card
      .locator('.card-overview__metrics')
      .evaluate(
        element => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length
      );
  const setMetricCount = (count: number) =>
    card.evaluate((element, nextCount) => {
      const host = element as HTMLElement & {
        metrics: Array<{ id: string; label: string; value: number }>;
      };
      host.metrics = Array.from({ length: nextCount }, (_, index) => ({
        id: `layout-${index + 1}`,
        label: `Layout ${index + 1}`,
        value: index + 1,
      }));
    }, count);

  await expect.poll(columnCount).toBe(3); // 6 cells: 3 + 3

  await setMetricCount(7);
  await expect.poll(columnCount).toBe(4); // 8 cells: 4 + 4

  await setMetricCount(3);
  await expect.poll(columnCount).toBe(4); // 4 cells: one complete row
  await card.evaluate(element => {
    element.style.width = '540px';
  });
  await expect.poll(columnCount).toBe(2); // 4 cells: 2 + 2

  await setMetricCount(6);
  await card.evaluate(element => {
    element.style.width = '960px';
  });
  await expect.poll(columnCount).toBe(4); // 7 cells: 4 + 3
  await card.evaluate(element => {
    element.style.width = '540px';
  });
  await expect.poll(columnCount).toBe(3); // 7 cells: 3 + 3 + 1
});

test('maps score boundaries to matching semantic background and foreground pairs', async ({
  page,
}) => {
  for (const [id, level] of [
    ['fair', 'fair'],
    ['good', 'good'],
    ['excellent', 'excellent'],
  ] as const) {
    const colors = await page
      .locator(`#${id} ds-score .score__badge`)
      .evaluate((element, resolvedLevel) => {
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

test('keeps equal-height cell content with the inset, content, and text balance padding', async ({
  page,
}) => {
  const card = page.locator('#default');
  const cell = page.locator('#default .card-overview__metric').first();
  const action = cell.locator('.card-overview__metric-action');
  const geometry = await card.evaluate(element => {
    const cells = Array.from(
      element.querySelectorAll<HTMLElement>('.card-overview__score, .card-overview__metric')
    );
    const metric = cells[1];
    const metricBounds = metric.getBoundingClientRect();
    const action = metric.firstElementChild as HTMLElement;
    const actionBounds = action.getBoundingClientRect();
    const actionStyle = getComputedStyle(action);
    const scoreValueStyle = getComputedStyle(
      element.querySelector<HTMLElement>('ds-score .score__value')!
    );
    const scoreTrend = element.querySelector<HTMLElement>(
      '.card-overview__score .card-overview__trend'
    )!;
    const metricTrend = element.querySelector<HTMLElement>(
      '.card-overview__metric .card-overview__trend'
    )!;
    const metricFigure = element.querySelector<HTMLElement>('.card-overview__metric-figure')!;
    const balancedText = [
      '.card-overview__score-label-spacer',
      'ds-score .score__value',
      '.card-overview__metric-label',
      '.card-overview__metric-value',
      '.card-overview__trend',
    ].map(selector => {
      const style = getComputedStyle(element.querySelector<HTMLElement>(selector)!);
      return {
        top: style.paddingTop,
        right: style.paddingRight,
        bottom: style.paddingBottom,
        left: style.paddingLeft,
      };
    });
    const surfaceStyle = getComputedStyle(
      element.querySelector<HTMLElement>('.card-overview__surface')!
    );
    return {
      inlineInset: actionBounds.left - metricBounds.left,
      blockInset: actionBounds.top - metricBounds.top,
      innerPadding: {
        top: actionStyle.paddingTop,
        right: actionStyle.paddingRight,
        bottom: actionStyle.paddingBottom,
        left: actionStyle.paddingLeft,
      },
      cellHeights: cells.map(item => item.getBoundingClientRect().height),
      scoreValueMarginTop: scoreValueStyle.marginTop,
      scoreValueMarginBottom: scoreValueStyle.marginBottom,
      scoreTrendTop: scoreTrend.getBoundingClientRect().top,
      metricTrendTop: metricTrend.getBoundingClientRect().top,
      metricFigureGap: getComputedStyle(metricFigure).columnGap,
      balancedText,
      divider: getComputedStyle(metric).boxShadow,
      actionRadius: actionStyle.borderRadius,
      scoreRadius: getComputedStyle(element.querySelector<HTMLElement>('ds-score .score__badge')!)
        .borderRadius,
      surfaceRadius: surfaceStyle.borderRadius,
    };
  });

  expect(geometry.inlineInset).toBe(8);
  expect(geometry.blockInset).toBe(8);
  expect(geometry.innerPadding).toEqual({ top: '6px', right: '6px', bottom: '6px', left: '6px' });
  expect(geometry.balancedText).toEqual(
    Array.from({ length: 5 }, () => ({ top: '0px', right: '2px', bottom: '0px', left: '2px' }))
  );
  expect(Math.max(...geometry.cellHeights) - Math.min(...geometry.cellHeights)).toBeLessThan(0.1);
  expect(geometry.scoreValueMarginTop).toBe('0px');
  expect(geometry.scoreValueMarginBottom).toBe('0px');
  expect(geometry.scoreTrendTop).toBeCloseTo(geometry.metricTrendTop, 1);
  expect(geometry.metricFigureGap).toBe('4px');
  expect(geometry.divider).not.toBe('none');
  expect(geometry.actionRadius).toBe('2px');
  expect(geometry.scoreRadius).toBe('2px');
  expect(geometry.surfaceRadius).toBe('10px');

  await action.hover();
  const hoverFill = await action.evaluate(
    element => getComputedStyle(element, '::after').backgroundColor
  );
  expect(hoverFill).not.toBe('rgba(0, 0, 0, 0)');
});

test('keeps loading placeholders in the resolved content geometry', async ({ page }) => {
  const card = page.locator('#loading-overview');
  const scoreContent = card.locator('.card-overview__score-content');
  const metricAction = card.locator('.card-overview__metric-action').first();
  const metricContent = metricAction.locator('.card-overview__metric-content');

  await expect(card.locator('.card-overview__header')).toContainText('Jul 27');
  await expect(card.locator('.card-overview__header')).toContainText('Previous 4 periods');
  await expect(card.locator('.card-overview__metric-content')).toHaveCount(5);

  const geometry = await card.evaluate(element => {
    const score = element.querySelector<HTMLElement>('.card-overview__score-content')!;
    // The figure placeholder now sits inside the level fill, which owns the crop.
    const scoreFigure = element.querySelector<HTMLElement>('ds-score .score__badge ds-skeleton')!;
    const metricAction = element.querySelector<HTMLElement>('.card-overview__metric-action')!;
    const metricContent = element.querySelector<HTMLElement>('.card-overview__metric-content')!;
    return {
      scoreHeight: score.getBoundingClientRect().height,
      scoreFigureMarginTop: getComputedStyle(scoreFigure).marginTop,
      scoreFigureMarginBottom: getComputedStyle(scoreFigure).marginBottom,
      metricActionWidth: metricAction.getBoundingClientRect().width,
      metricContentWidth: metricContent.getBoundingClientRect().width,
    };
  });

  expect(geometry.scoreHeight).toBeGreaterThan(0);
  expect(geometry.scoreFigureMarginTop).toBe('0px');
  expect(geometry.scoreFigureMarginBottom).toBe('0px');
  expect(geometry.metricContentWidth).toBe(geometry.metricActionWidth - 12);
  await expect(scoreContent).toBeVisible();
  await expect(metricContent).toBeVisible();

  const metricSkeletonWidths = await metricContent
    .locator('ds-skeleton')
    .evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
  expect(metricSkeletonWidths[0]).toBeCloseTo(geometry.metricContentWidth * 0.35, 1);
  expect(metricSkeletonWidths.slice(1)).toEqual([40, 28]);
});

test('preserves an authored metric count without leaking resolved data while loading', async ({
  page,
}) => {
  const card = page.locator('#loading-with-metrics');

  await expect(card.locator('.card-overview__metric')).toHaveCount(3);
  await expect(card.locator('.card-overview__metric ds-skeleton')).toHaveCount(9);
  await expect(card).not.toContainText('Metric 1');
});

test('supports fixed-date and selectable-range period compositions', async ({ page }) => {
  const date = page.locator('#default .card-overview__header');
  const range = page.locator('#range .card-overview__header');

  await expect(date).toContainText('Jul 27');
  await expect(date).toContainText('vs.');
  await expect(date).toContainText('Previous 4 periods');
  await expect(range.locator('[slot="period"]')).toHaveText('Jun 30–Jul 27');
  await expect(range).toContainText('vs.');
  await expect(range.locator('[slot="filter"]')).toHaveText('Previous 4 periods');

  for (const selector of ['#default-filter', '#range-period', '#range-filter']) {
    const select = page.locator(selector);
    const trigger = select.getByRole('combobox');
    await expect(select).toHaveJSProperty('allowClear', false);
    await trigger.click();
    await expect(select.getByRole('listbox')).toBeVisible();
    await expect(select.locator('.ds-choice-footer')).toHaveCount(0);
    await expect(select.getByRole('button', { name: 'Clear' })).toHaveCount(0);
    await trigger.press('Escape');
  }

  const geometry = await page.evaluate(() => {
    const measure = (cardId: string, selector: string) => {
      const card = document.querySelector<HTMLElement>(cardId)!;
      const header = card.querySelector<HTMLElement>('.card-overview__header')!;
      const element = card.querySelector<HTMLElement>(selector)!;
      const headerBounds = header.getBoundingClientRect();
      const bounds = element.getBoundingClientRect();
      return {
        left: bounds.left - headerBounds.left,
        top: bounds.top - headerBounds.top,
        bottom: headerBounds.bottom - bounds.bottom,
        height: bounds.height,
      };
    };
    const dateCard = document.querySelector<HTMLElement>('#default')!;
    const fixedFrame = dateCard.querySelector<HTMLElement>('.card-overview__period-fixed')!;
    const fixedText = fixedFrame.querySelector<HTMLElement>('ds-text')!;
    const fixedGlyphBox = fixedText.firstElementChild as HTMLElement;
    const fixedBounds = fixedFrame.getBoundingClientRect();
    const dateSelect = dateCard.querySelector<HTMLElement>('[slot="filter"]')!;
    const dateTrigger = dateSelect.querySelector<HTMLElement>('.trigger')!;
    const dateLabel = dateTrigger.querySelector<HTMLElement>('.trigger__label')!;
    const dateLabelGlyphBox = dateLabel.firstElementChild as HTMLElement;
    const triggerBounds = dateTrigger.getBoundingClientRect();

    return {
      fixedFrame: measure('#default', '.card-overview__period-fixed'),
      rangeSelect: measure('#range', '[slot="period"]'),
      fixedTextInset: fixedGlyphBox.getBoundingClientRect().left - fixedBounds.left,
      selectTextInset: dateLabelGlyphBox.getBoundingClientRect().left - triggerBounds.left,
      headerGap: getComputedStyle(
        document.querySelector<HTMLElement>('#range .card-overview__header')!
      ).gap,
      periodGap: getComputedStyle(
        document.querySelector<HTMLElement>('#range .card-overview__period')!
      ).gap,
      borderless: ['#default-filter', '#range-period', '#range-filter'].map(id => {
        const select = document.querySelector<HTMLElement>(id)!;
        const trigger = select.querySelector<HTMLElement>('.trigger')!;
        return {
          hasBorder: (select as HTMLElement & { hasBorder: boolean }).hasBorder,
          borderWidth: getComputedStyle(trigger)
            .getPropertyValue('--ds-interaction-border-width')
            .trim(),
        };
      }),
    };
  });

  expect(geometry.fixedFrame).toEqual({ left: 8, top: 8, bottom: 8, height: 32 });
  expect(geometry.rangeSelect).toEqual({ left: 8, top: 8, bottom: 8, height: 32 });
  expect(geometry.fixedTextInset).toBe(geometry.selectTextInset);
  expect(geometry.fixedTextInset).toBe(8);
  expect(geometry.headerGap).toBe('0px');
  expect(geometry.periodGap).toBe('0px');
  expect(geometry.borderless).toEqual([
    { hasBorder: false, borderWidth: '0px' },
    { hasBorder: false, borderWidth: '0px' },
    { hasBorder: false, borderWidth: '0px' },
  ]);
});

test('compact renders exactly the period-only 48px bar', async ({ page }) => {
  const card = page.locator('#compact');
  await expect(card).toHaveJSProperty('offsetHeight', 48);
  await expect(card.locator('.card-overview__header')).toBeVisible();
  await expect(card.locator('.card-overview__score')).toHaveCount(0);
  await expect(card.locator('.card-overview__metric')).toHaveCount(0);
});

test('keeps the period bar stationary while the grid moves and clips during collapse', async ({
  page,
}) => {
  const card = page.locator('#scroll-collapse');
  const expandedHeight = await card.evaluate(element => element.getBoundingClientRect().height);
  const initial = await card.evaluate(element => ({
    headerTop: element.querySelector('.card-overview__header')!.getBoundingClientRect().top,
    bodyTop: element.querySelector('.card-overview__body')!.getBoundingClientRect().top,
  }));

  await card.evaluate(element => {
    element.scrollCollapseProgress = 0.5;
  });
  await expect
    .poll(() =>
      card.locator('.card-overview__body').evaluate(element => element.getBoundingClientRect().top)
    )
    .toBeLessThan(initial.bodyTop);
  const middle = await card.evaluate(element => ({
    headerTop: element.querySelector('.card-overview__header')!.getBoundingClientRect().top,
    bodyTop: element.querySelector('.card-overview__body')!.getBoundingClientRect().top,
    hostHeight: element.getBoundingClientRect().height,
    surfaceHeight: element.querySelector('.card-overview__surface')!.getBoundingClientRect().height,
  }));

  expect(middle.headerTop).toBeCloseTo(initial.headerTop, 1);
  expect(middle.bodyTop).toBeLessThan(initial.bodyTop);
  expect(middle.hostHeight).toBeCloseTo(expandedHeight, 1);
  expect(middle.surfaceHeight).toBeCloseTo((expandedHeight + 48) / 2, 1);

  await card.evaluate(element => {
    element.scrollCollapseProgress = 1;
  });
  await expect
    .poll(() =>
      card
        .locator('.card-overview__surface')
        .evaluate(element => element.getBoundingClientRect().height)
    )
    .toBeCloseTo(48, 1);

  await card.evaluate(element => {
    element.scrollCollapseProgress = 0;
  });
  await expect
    .poll(() =>
      card.locator('.card-overview__body').evaluate(element => element.getBoundingClientRect().top)
    )
    .toBeCloseTo(initial.bodyTop, 1);
});

test('covers missing score, missing trend, error, wrapping, and forced stacking', async ({
  page,
}) => {
  const unavailable = page.locator('#no-score .card-overview__score-content--error');
  await expect(unavailable).toHaveText('Score unavailable');
  await expect(unavailable.locator('ds-icon')).toHaveCount(0);
  const unavailablePresentation = await unavailable.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const textBounds = element.firstElementChild!.getBoundingClientRect();
    const style = getComputedStyle(element);
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-always-dark-border-tertiary)';
    document.body.append(probe);
    const expectedBorderColor = getComputedStyle(probe).color;
    probe.remove();
    return {
      centerOffsetX: textBounds.left + textBounds.width / 2 - (bounds.left + bounds.width / 2),
      centerOffsetY: textBounds.top + textBounds.height / 2 - (bounds.top + bounds.height / 2),
      background: style.backgroundColor,
      borderColor: style.borderTopColor,
      expectedBorderColor,
    };
  });
  expect(unavailablePresentation.centerOffsetX).toBeCloseTo(0, 1);
  expect(unavailablePresentation.centerOffsetY).toBeCloseTo(0, 1);
  expect(unavailablePresentation.background).toBe('rgba(0, 0, 0, 0)');
  expect(unavailablePresentation.borderColor).toBe(unavailablePresentation.expectedBorderColor);
  await expect(page.locator('#no-trend .card-overview__trend')).toHaveCount(0);
  await expect(page.locator('#score-error [role="alert"]')).toHaveText('Score unavailable');

  const wrappedRows = await page
    .locator('#wrapped .card-overview__score, #wrapped .card-overview__metric')
    .evaluateAll(
      elements =>
        new Set(elements.map(element => Math.round(element.getBoundingClientRect().top))).size
    );
  const stackedRows = await page
    .locator('#stacked .card-overview__score, #stacked .card-overview__metric')
    .evaluateAll(
      elements =>
        new Set(elements.map(element => Math.round(element.getBoundingClientRect().top))).size
    );
  expect(wrappedRows).toBeGreaterThan(1);
  expect(stackedRows).toBe(6);
});
