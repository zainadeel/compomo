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
  const pointerKey = await page.evaluate(() => (window as unknown as { lastFocus: { primary: { key: string } } }).lastFocus.primary.key);

  await surface.focus();
  await surface.press('Home');
  const keyboardKey = await page.evaluate(() => (window as unknown as { lastFocus: { primary: { key: string } } }).lastFocus.primary.key);
  expect(keyboardKey).toBe(pointerKey);
  await surface.press('Escape');
  await expect(chart.locator('ds-tooltip-chart')).toHaveCount(0);
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

test('frames the plot with light top and right boundaries and clips three-pixel edge dots intentionally', async ({ page }) => {
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
      dotRadius: middle.r.baseVal.value,
      dotStroke: getComputedStyle(middle).stroke,
      dotStrokeWidth: middle.getAttribute('stroke-width'),
      lastCenter: last.cx.baseVal.value,
      clipRight,
      topY: Number(top.getAttribute('y1')),
      clipTop: Number(clip.getAttribute('y')),
      rightX: Number(right.getAttribute('x1')),
      boundaryStroke: getComputedStyle(top).stroke,
      expectedStroke: getComputedStyle(element.querySelector('.chart__grid') as SVGLineElement).stroke,
    };
  });

  expect(geometry.dotRadius).toBe(3);
  expect(geometry.dotStroke).toBe('none');
  expect(geometry.dotStrokeWidth).toBe('0');
  expect(geometry.lastCenter).toBeCloseTo(geometry.clipRight, 4);
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
