import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/chart.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('recompiles responsive geometry without scaling visual tokens', async ({ page }) => {
  const container = page.locator('#chart-container');
  const chart = page.locator('#chart');
  const svg = chart.locator('svg');
  const before = await chart.evaluate(element => {
    const surface = element.querySelector('svg')!;
    const tick = element.querySelector<SVGTextElement>('.chart__tick')!;
    const grid = element.querySelector<SVGLineElement>('.chart__grid')!;
    const bar = element.querySelector<SVGRectElement>('.chart__mark')!;
    return {
      width: Number(surface.getAttribute('width')),
      height: Number(surface.getAttribute('height')),
      viewBox: surface.getAttribute('viewBox'),
      fontSize: getComputedStyle(tick).fontSize,
      strokeWidth: getComputedStyle(grid).strokeWidth,
      radius: getComputedStyle(bar).rx,
      barX: Number(bar.getAttribute('x')),
    };
  });

  await container.evaluate(element => { (element as HTMLElement).style.width = '280px'; });
  await expect.poll(() => svg.evaluate(element => Number(element.getAttribute('width')))).toBeCloseTo(280, 0);
  await chart.evaluate(element => { (element as HTMLElement & { height: number }).height = 220; });
  await expect.poll(() => svg.evaluate(element => Number(element.getAttribute('height')))).toBe(220);

  const after = await chart.evaluate(element => {
    const surface = element.querySelector('svg')!;
    const tick = element.querySelector<SVGTextElement>('.chart__tick')!;
    const grid = element.querySelector<SVGLineElement>('.chart__grid')!;
    const bar = element.querySelector<SVGRectElement>('.chart__mark')!;
    return {
      width: Number(surface.getAttribute('width')),
      height: Number(surface.getAttribute('height')),
      viewBox: surface.getAttribute('viewBox'),
      fontSize: getComputedStyle(tick).fontSize,
      strokeWidth: getComputedStyle(grid).strokeWidth,
      radius: getComputedStyle(bar).rx,
      barX: Number(bar.getAttribute('x')),
    };
  });
  expect(after.viewBox).toBe(`0 0 ${after.width} ${after.height}`);
  expect(after.fontSize).toBe(before.fontSize);
  expect(after.strokeWidth).toBe(before.strokeWidth);
  expect(after.radius).toBe(before.radius);
  expect(after.barX).not.toBe(before.barX);
  expect(await chart.locator('.chart__tick--x').count()).toBeLessThanOrEqual(4);
});

test('pointer and keyboard resolve grouped points through one focus model', async ({ page }) => {
  const chart = page.locator('#chart');
  const surface = chart.locator('svg');
  const firstBar = chart.locator('rect.chart__mark').first();
  const box = await firstBar.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + 2);
  await expect(chart.locator('ds-tooltip-chart')).toBeVisible();
  await expect(chart.locator('.tooltip-chart__item')).toHaveCount(2);
  const tooltipGeometry = await chart.locator('ds-tooltip-chart').evaluate(element => {
    const heading = element.querySelector<HTMLElement>('.tooltip-chart__heading')!;
    const item = element.querySelector<HTMLElement>('.tooltip-chart__item')!;
    const swatchBox = item.querySelector<HTMLElement>('.tooltip-chart__swatch-box')!;
    const label = item.querySelector<HTMLElement>('.tooltip-chart__label')!.getBoundingClientRect();
    const value = item.querySelector<HTMLElement>('.tooltip-chart__value')!.getBoundingClientRect();
    const host = getComputedStyle(element);
    return {
      hostPadding: host.padding,
      hostRadius: host.borderRadius,
      headingHeight: heading.getBoundingClientRect().height,
      itemHeight: item.getBoundingClientRect().height,
      itemRadius: getComputedStyle(item).borderRadius,
      swatchBoxWidth: swatchBox.getBoundingClientRect().width,
      labelValueGap: value.left - label.right,
    };
  });
  expect(tooltipGeometry).toEqual({
    hostPadding: '4px',
    hostRadius: '6px',
    headingHeight: 32,
    itemHeight: 32,
    itemRadius: '2px',
    swatchBoxWidth: 20,
    labelValueGap: 8,
  });
  const pointerKey = await page.evaluate(() => (window as unknown as { lastFocus: { primary: { key: string } } }).lastFocus.primary.key);

  await surface.focus();
  await surface.press('Home');
  const keyboardKey = await page.evaluate(() => (window as unknown as { lastFocus: { primary: { key: string } } }).lastFocus.primary.key);
  expect(keyboardKey).toBe(pointerKey);
  await surface.press('Escape');
  await expect(chart.locator('ds-tooltip-chart')).toHaveCount(0);
});

test('groups multi-line focus with a vertical guide and enlarged tooltip points', async ({ page }) => {
  const chart = page.locator('#multi-line-chart');
  const firstPoint = chart.locator('circle.chart__mark').first();
  const pointBox = await firstPoint.boundingBox();
  expect(pointBox).not.toBeNull();
  await page.mouse.move(
    pointBox!.x + pointBox!.width / 2,
    pointBox!.y + pointBox!.height / 2,
  );

  await expect(chart.locator('.chart__focus-guide')).toHaveCount(1);
  await expect(chart.locator('.chart__focus-point')).toHaveCount(2);
  await expect(chart.locator('.tooltip-chart__item')).toHaveCount(2);

  const geometry = await chart.evaluate(element => {
    const guide = element.querySelector('.chart__focus-guide') as SVGLineElement;
    const points = [...element.querySelectorAll<SVGCircleElement>('.chart__focus-point')];
    const first = points[0];
    const strokeWidth = Number.parseFloat(getComputedStyle(first).strokeWidth);
    return {
      pointCount: points.length,
      guideX: Number(guide.getAttribute('x1')),
      aligned: points.every(point => point.cx.baseVal.value === Number(guide.getAttribute('x1'))),
      coreDiameter: first.r.baseVal.value * 2 - strokeWidth,
      outerDiameter: first.r.baseVal.value * 2 + strokeWidth,
    };
  });

  expect(geometry.pointCount).toBe(2);
  expect(geometry.aligned).toBe(true);
  expect(geometry.guideX).toBeGreaterThan(0);
  expect(geometry.coreDiameter).toBe(6);
  expect(geometry.outerDiameter).toBe(8);
});

test('stable keyed focus survives data reorder and resize', async ({ page }) => {
  const chart = page.locator('#chart');
  const surface = chart.locator('svg');
  await surface.focus();
  await surface.press('End');
  const before = await page.evaluate(() => (window as unknown as { lastFocus: { primary: { key: string } } }).lastFocus.primary.key);
  await page.evaluate(() => (window as unknown as { reorderChart: () => void }).reorderChart());
  await page.locator('#chart-container').evaluate(element => { (element as HTMLElement).style.width = '520px'; });
  await expect.poll(() => chart.locator('.chart__focus').count()).toBe(1);
  const after = await chart.locator('.chart__focus').evaluate(element => {
    const host = element.closest('ds-chart') as HTMLElement & { definition: unknown };
    return Boolean(host.definition);
  });
  expect(after).toBe(true);
  const activeKey = await page.evaluate(() => (window as unknown as { lastFocus: { primary: { key: string } } }).lastFocus.primary.key);
  expect(activeKey).toBe(before);
});

test('has one logical keyboard entry and required accessible description', async ({ page }) => {
  const chart = page.locator('#chart');
  await expect(chart.locator('svg')).toHaveAttribute('aria-label', 'Vehicle activity by month');
  await expect(chart.locator('svg')).toHaveAttribute('aria-describedby', /ds-chart-description-/);
  await expect(chart.locator('[tabindex="0"]')).toHaveCount(1);
  await expect(chart.locator('[aria-live="polite"]')).toHaveCount(1);
});

test('polar recipes resize geometry without scaling center typography', async ({ page }) => {
  const container = page.locator('#polar-container');
  const chart = page.locator('#polar-chart');
  const paths = chart.locator('path.chart__mark');
  await expect(paths).toHaveCount(3);
  await expect(chart.locator('.chart__center-value')).toHaveText('100');
  const before = await chart.evaluate(element => ({
    path: element.querySelector('path.chart__mark')?.getAttribute('d'),
    fontSize: getComputedStyle(element.querySelector('.chart__center-value') as Element).fontSize,
  }));
  await container.evaluate(element => { (element as HTMLElement).style.width = '280px'; });
  await expect.poll(() => chart.locator('svg').evaluate(element => Number(element.getAttribute('width')))).toBe(280);
  const after = await chart.evaluate(element => ({
    path: element.querySelector('path.chart__mark')?.getAttribute('d'),
    fontSize: getComputedStyle(element.querySelector('.chart__center-value') as Element).fontSize,
  }));
  expect(after.path).not.toBe(before.path);
  expect(after.fontSize).toBe(before.fontSize);
  await chart.locator('svg').focus();
  await chart.locator('svg').press('Home');
  await expect(chart.locator('ds-tooltip-chart')).toBeVisible();
});

test('resolves donut hover from slice containment instead of centroid distance', async ({ page }) => {
  const chart = page.locator('#polar-chart');
  const hoverPoints = await chart.evaluate(element => {
    const path = element.querySelector<SVGPathElement>('path.chart__mark')!;
    const box = path.getBBox();
    const contains = (x: number, y: number) => path.isPointInFill(new DOMPoint(x, y));
    const points: Array<{ x: number; y: number }> = [];
    for (let y = box.y; y <= box.y + box.height; y += 4) {
      for (let x = box.x; x <= box.x + box.width; x += 4) {
        if (
          contains(x, y) &&
          contains(x - 2, y) &&
          contains(x + 2, y) &&
          contains(x, y - 2) &&
          contains(x, y + 2)
        ) {
          const screen = new DOMPoint(x, y).matrixTransform(path.getScreenCTM()!);
          points.push({ x: screen.x, y: screen.y });
        }
      }
    }
    if (points.length < 2) throw new Error('Not enough interior points found for the first donut slice.');
    const center = new DOMPoint(0, 0).matrixTransform(path.getScreenCTM()!);
    return { first: points[0], last: points[points.length - 1], center: { x: center.x, y: center.y } };
  });

  await page.mouse.move(hoverPoints.first.x, hoverPoints.first.y);
  await expect(chart.locator('ds-tooltip-chart')).toContainText('Online');
  const firstAnchor = await chart.locator('ds-tooltip-chart').evaluate(element => ({
    x: (element as HTMLElement & { x: number }).x,
    y: (element as HTMLElement & { y: number }).y,
  }));
  await page.mouse.move(hoverPoints.last.x, hoverPoints.last.y);
  await expect.poll(() => chart.locator('ds-tooltip-chart').evaluate(element => ({
    x: (element as HTMLElement & { x: number }).x,
    y: (element as HTMLElement & { y: number }).y,
  }))).not.toEqual(firstAnchor);
  await page.mouse.move(hoverPoints.center.x, hoverPoints.center.y);
  await expect(chart.locator('ds-tooltip-chart')).toHaveCount(0);
});

test('heatmap uses continuous 25 to 100 percent data-intent opacity', async ({ page }) => {
  const chart = page.locator('#heatmap-chart');
  const cells = chart.locator('rect.chart__mark');
  await expect(cells).toHaveCount(3);
  const opacities = await cells.evaluateAll(elements => elements.map(element => getComputedStyle(element).fillOpacity));
  expect(opacities).toEqual(['0.25', '0.625', '1']);
  await expect(cells.first()).toHaveCSS('fill', /.+/);
});

test('renders axis baselines and outward tick stubs independently from grids and labels', async ({ page }) => {
  const chart = page.locator('#chart');
  await expect(chart.locator('.chart__axis-line:not(.chart__tick-stub)')).toHaveCount(2);
  await expect(chart.locator('.chart__tick-stub')).not.toHaveCount(0);
  const xStub = chart.locator('.chart__tick--x').first().locator('xpath=preceding-sibling::*[1]');
  await expect(xStub).toHaveClass(/chart__tick-stub/);
  const extendsOutward = await xStub.evaluate(element => Number(element.getAttribute('y2')) > Number(element.getAttribute('y1')));
  expect(extendsOutward).toBe(true);
});

test('frames the plot while keeping six-pixel haloed edge dots visible', async ({ page }) => {
  const chart = page.locator('#density-chart');
  const boundaries = chart.locator('.chart__plot-boundary');
  const dots = chart.locator('circle.chart__mark');
  await expect(boundaries).toHaveCount(2);
  await expect(dots).toHaveCount(5);

  const geometry = await chart.evaluate(element => {
    const clip = element.querySelector('clipPath rect') as SVGRectElement;
    const top = element.querySelector('.chart__plot-boundary--top') as SVGLineElement;
    const right = element.querySelector('.chart__plot-boundary--right') as SVGLineElement;
    const circles = [...element.querySelectorAll<SVGCircleElement>('circle.chart__mark')];
    const middle = circles[2];
    const last = circles.at(-1)!;
    const clipRight = Number(clip.getAttribute('x')) + Number(clip.getAttribute('width'));
    return {
      circleRadius: middle.r.baseVal.value,
      dotStroke: getComputedStyle(middle).stroke,
      dotStrokeWidth: Number.parseFloat(getComputedStyle(middle).strokeWidth),
      lastCenter: last.cx.baseVal.value,
      lastLayerClipPath: last.parentElement?.getAttribute('clip-path'),
      clipRight,
      topY: Number(top.getAttribute('y1')),
      clipTop: Number(clip.getAttribute('y')),
      rightX: Number(right.getAttribute('x1')),
      boundaryStroke: getComputedStyle(top).stroke,
      expectedStroke: getComputedStyle(element.querySelector('.chart__grid') as SVGLineElement).stroke,
    };
  });

  expect(geometry.circleRadius * 2 - geometry.dotStrokeWidth).toBe(4);
  expect(geometry.circleRadius * 2 + geometry.dotStrokeWidth).toBe(6);
  expect(geometry.dotStroke).not.toBe('none');
  expect(geometry.dotStrokeWidth).toBe(1);
  expect(geometry.lastCenter).toBeCloseTo(geometry.clipRight, 4);
  expect(geometry.lastLayerClipPath).toBeNull();
  expect(geometry.topY).toBeCloseTo(geometry.clipTop, 4);
  expect(geometry.rightX).toBeCloseTo(geometry.clipRight, 4);
  expect(geometry.boundaryStroke).toBe(geometry.expectedStroke);
});

test('clips density marks to a zero-inclusive solved plot at wide and card widths', async ({ page }) => {
  const container = page.locator('#density-container');
  const chart = page.locator('#density-chart');
  for (const width of [720, 280]) {
    await container.evaluate((element, nextWidth) => { (element as HTMLElement).style.width = `${nextWidth}px`; }, width);
    await expect.poll(() => chart.locator('svg').evaluate(element => Number(element.getAttribute('width')))).toBe(width);
    const geometry = await chart.evaluate(element => {
      const clip = element.querySelector('clipPath rect') as SVGRectElement;
      const area = element.querySelector('path.chart__mark') as SVGPathElement;
      const marks = element.querySelector('.chart__marks') as SVGGElement;
      const box = area.getBBox();
      return {
        clipBottom: Number(clip.getAttribute('y')) + Number(clip.getAttribute('height')),
        areaBottom: box.y + box.height,
        clipPath: marks.getAttribute('clip-path'),
      };
    });
    expect(geometry.clipPath).toMatch(/^url\(#ds-chart-clip-/);
    expect(geometry.areaBottom).toBeLessThanOrEqual(geometry.clipBottom + 0.5);
  }
});

test('measures directional radar labels inside the surface without covering data marks', async ({ page }) => {
  const container = page.locator('#radar-container');
  const chart = page.locator('#radar-chart');
  for (const width of [420, 280]) {
    await container.evaluate((element, nextWidth) => { (element as HTMLElement).style.width = `${nextWidth}px`; }, width);
    await expect.poll(() => chart.locator('svg').evaluate(element => Number(element.getAttribute('width')))).toBe(width);
    const result = await chart.evaluate(element => {
      const svg = element.querySelector('svg') as SVGSVGElement;
      const labels = [...element.querySelectorAll<SVGTextElement>('.chart__polar-label')];
      const marks = [...element.querySelectorAll<SVGGraphicsElement>('.chart__mark')];
      const markBounds = marks.map(mark => mark.getBoundingClientRect());
      const surface = svg.getBoundingClientRect();
      return labels.map(label => {
        const box = label.getBoundingClientRect();
        const overlapsMark = markBounds.some(mark => box.left < mark.right && box.right > mark.left && box.top < mark.bottom && box.bottom > mark.top);
        return {
          contained: box.left >= surface.left - 0.5 && box.right <= surface.right + 0.5 && box.top >= surface.top - 0.5 && box.bottom <= surface.bottom + 0.5,
          overlapsMark,
          anchor: label.getAttribute('text-anchor'),
        };
      });
    });
    expect(result.length).toBe(4);
    expect(result.every(item => item.contained), JSON.stringify(result)).toBe(true);
    expect(result.every(item => !item.overlapsMark), JSON.stringify(result)).toBe(true);
    expect(result.map(item => item.anchor)).toEqual(['middle', 'start', 'middle', 'end']);
  }
});
