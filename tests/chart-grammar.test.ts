import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scaleBand, scaleLinear, scalePoint } from 'd3-scale';
import {
  arcMark,
  areaY,
  bandY,
  barY,
  binX,
  boxY,
  cell,
  channelValue,
  cumulativeBins,
  densityX,
  defineChart,
  dot,
  lineY,
  normalizeStack,
  pieLayout,
  polar,
  radialLine,
  rect,
  ruleY,
} from '../src/wc/utils/chart-grammar';
import { compileChartScene, findChartFocus, resolveDonutPadAngle } from '../src/wc/utils/chart-scene';
import { defaultChartTheme } from '../src/wc/utils/chart-theme';

describe('chart grammar', () => {
  it('resolves field and accessor channels against ordinary rows', () => {
    const rows = [{ value: 3 }, { value: 7 }];
    assert.equal(channelValue(rows[1], 1, rows, 'value'), 7);
    assert.equal(channelValue(rows[1], 1, rows, (row, index) => row.value + index), 8);
  });

  it('normalizes explicit percentage stacks without hiding the transform in a variant', () => {
    const rows = [
      { month: 'Jan', series: 'moving', value: 3 },
      { month: 'Jan', series: 'idle', value: 1 },
      { month: 'Feb', series: 'moving', value: 0 },
    ];
    const normalized = normalizeStack(rows, {
      group: 'month',
      series: 'series',
      value: 'value',
    });
    assert.deepEqual(normalized.map(row => row.proportion), [0.75, 0.25, 0]);
  });

  it('prepares stable pie fractions without introducing a chart-type component', () => {
    const rows = [
      { id: 'a', label: 'A', value: 3 },
      { id: 'b', label: 'B', value: 1 },
    ];
    const slices = pieLayout(rows, { value: 'value', key: 'id', label: 'label' });
    assert.deepEqual(slices.map(slice => [slice.key, slice.theta1, slice.theta2]), [
      ['a', 0, 0.75],
      ['b', 0.75, 1],
    ]);
  });

  it('bins raw values independently of rendered width and supports cumulative counts', () => {
    const rows = [1, 2, 2, 4, 7, 8].map((value, id) => ({ id, value }));
    const bins = binX(rows, { value: 'value', thresholds: [0, 4, 8] });
    assert.deepEqual(bins.map(bin => bin.count), [3, 2, 1]);
    assert.deepEqual(cumulativeBins(bins).map(bin => bin.cumulative), [3, 5, 6]);
  });

  it('creates finite density samples from ordinary rows', () => {
    const density = densityX([{ value: 1 }, { value: 2 }, { value: 3 }], { value: 'value', samples: 12 });
    assert.ok(density.length >= 8);
    assert.ok(density.every(point => Number.isFinite(point.x) && Number.isFinite(point.density)));
  });
});

describe('chart scene compiler', () => {
  const axes = {
    x: { scale: scalePoint },
    y: { scale: scaleLinear, nice: true, grid: true },
  };

  it('uses token-sized dot core, halo, and polar label clearance', () => {
    assert.equal(defaultChartTheme.dotRadius, 'var(--dimension-stroke-width-025)');
    assert.equal(defaultChartTheme.dotHaloWidth, 'var(--dimension-stroke-width-012)');
    assert.equal(defaultChartTheme.focusDotRadius, 'var(--dimension-stroke-width-037)');
    assert.equal(defaultChartTheme.polarLabelGap, 16);
  });

  it('preserves declaration order for layered marks', () => {
    const rows = [
      { id: 'a', x: 'A', y: 2, low: 1, high: 3 },
      { id: 'b', x: 'B', y: 4, low: 2, high: 5 },
    ];
    const scene = compileChartScene(defineChart({
      marks: [
        areaY(rows, { id: 'area', key: 'id', x: 'x', y1: 'low', y2: 'high' }),
        ruleY([3], { id: 'rule' }),
        lineY(rows, { id: 'line', key: 'id', x: 'x', y: 'y' }),
        dot(rows, { id: 'dots', key: 'id', x: 'x', y: 'y' }),
      ],
      ...axes,
    }), 480, 320);
    assert.deepEqual(scene.nodes.map(node => node.markId), ['area', 'rule', 'line', 'dots', 'dots']);
    const dotNodes = scene.nodes.filter(node => node.markId === 'dots');
    assert.ok(dotNodes.every(node => node.style.stroke === 'var(--color-background-primary)' && node.style.strokeWidth === 'var(--dimension-stroke-width-012)'));
    assert.ok(dotNodes.every(node => node.clipToPlot === false));
    assert.ok(scene.nodes.filter(node => node.markId !== 'dots').every(node => node.clipToPlot === undefined));
  });

  it('creates line gaps and omits invalid semantic points', () => {
    const rows = [
      { id: 'a', x: 'A', y: 2 },
      { id: 'b', x: 'B', y: null },
      { id: 'c', x: 'C', y: 4 },
    ];
    const scene = compileChartScene(defineChart({
      marks: [lineY(rows, { id: 'line', key: 'id', x: 'x', y: 'y' })],
      ...axes,
    }), 480, 320);
    assert.match(scene.nodes[0]?.type === 'path' ? scene.nodes[0].d : '', /M.*M/);
    assert.deepEqual(scene.points.map(point => point.key), ['a', 'c']);
  });

  it('keeps explicit datum identity stable when rows reorder', () => {
    const rows = [
      { id: 'first', x: 'A', y: 2 },
      { id: 'second', x: 'B', y: 4 },
    ];
    const make = (data: typeof rows) => compileChartScene(defineChart({
      marks: [dot(data, { id: 'dots', key: 'id', x: 'x', y: 'y' })],
      ...axes,
    }), 480, 320);
    assert.deepEqual(make(rows).points.map(point => point.sceneKey).sort(), make([...rows].reverse()).points.map(point => point.sceneKey).sort());
  });

  it('uses configured domains and inferred pixel ranges', () => {
    const scene = compileChartScene(defineChart({
      marks: [dot([{ id: 1, x: 5, y: 50 }], { key: 'id', x: 'x', y: 'y' })],
      x: { scale: scaleLinear().domain([0, 10]) },
      y: { scale: scaleLinear().domain([0, 100]) },
    }), 500, 300);
    const point = scene.points[0];
    assert.ok(point.x > scene.plot.left && point.x < scene.plot.right);
    assert.ok(point.y > scene.plot.top && point.y < scene.plot.bottom);
  });

  it('lays out grouped bars side by side and stacks positive and negative values separately', () => {
    const rows = [
      { id: 'a', category: 'A', series: 'one', value: 4 },
      { id: 'b', category: 'A', series: 'two', value: 3 },
      { id: 'c', category: 'A', series: 'three', value: -2 },
      { id: 'd', category: 'A', series: 'four', value: -1 },
    ];
    const grouped = compileChartScene(defineChart({
      marks: [barY(rows, { id: 'bars', key: 'id', x: 'category', y: 'value', z: 'series', layout: 'grouped' })],
      x: { scale: scaleBand },
      y: { scale: scaleLinear },
    }), 480, 320);
    const groupedRects = grouped.nodes.filter(node => node.type === 'rect');
    assert.equal(new Set(groupedRects.map(rect => rect.type === 'rect' ? rect.x : 0)).size, 4);

    const stacked = compileChartScene(defineChart({
      marks: [barY(rows, { id: 'bars', key: 'id', x: 'category', y: 'value', z: 'series', layout: 'stacked' })],
      x: { scale: scaleBand },
      y: { scale: scaleLinear },
    }), 480, 320);
    const rectangles = stacked.nodes.filter(node => node.type === 'rect');
    assert.equal(rectangles.length, 4);
    assert.ok(rectangles.every(rect => rect.type !== 'rect' || rect.height > 0));
    assert.equal(new Set(rectangles.map(rect => rect.type === 'rect' ? rect.x : 0)).size, 1);
    const [positiveFirst, positiveSecond, negativeFirst, negativeSecond] = rectangles;
    assert.ok(positiveFirst?.type === 'rect' && positiveSecond?.type === 'rect');
    assert.ok(negativeFirst?.type === 'rect' && negativeSecond?.type === 'rect');
    assert.equal(positiveFirst.y - (positiveSecond.y + positiveSecond.height), 1);
    assert.equal(negativeSecond.y - (negativeFirst.y + negativeFirst.height), 1);
  });

  it('re-solves plot margins and thins measured ticks for narrow surfaces', () => {
    const rows = Array.from({ length: 10 }, (_, index) => ({
      id: index,
      category: `Long category ${index + 1}`,
      value: index + 1,
    }));
    const definition = defineChart(({ width }) => ({
      marks: [barY(rows, { id: 'bars', key: 'id', x: 'category', y: 'value' })],
      x: { scale: scaleBand, axis: { label: width < 300 ? undefined : 'Category' } },
      y: { scale: scaleLinear, axis: { label: 'Value' } },
    }));
    const wide = compileChartScene(definition, 900, 320, 'en', text => ({ width: text.length * 8, height: 16 }));
    const narrow = compileChartScene(definition, 280, 220, 'en', text => ({ width: text.length * 8, height: 16 }));
    assert.ok(narrow.xAxis.ticks.filter(tick => tick.labelVisible).length < wide.xAxis.ticks.filter(tick => tick.labelVisible).length);
    assert.equal(narrow.xAxis.ticks.length, wide.xAxis.ticks.length);
    assert.ok(narrow.plot.left >= 40);
    assert.ok(narrow.plot.bottom < 220);
    assert.equal(narrow.xAxis.label, undefined);
  });

  it('uses the same semantic resolver for nearest and grouped focus', () => {
    const points = [
      { key: 'a', sceneKey: 'm:a', markId: 'm', datum: {}, datumIndex: 0, xValue: 'Jan', yValue: 2, x: 20, y: 40, color: 'red' },
      { key: 'b', sceneKey: 'm:b', markId: 'm', datum: {}, datumIndex: 1, xValue: 'Jan', yValue: 7, x: 20, y: 10, color: 'blue' },
    ];
    assert.equal(findChartFocus(points, 'nearest', 19, 12)?.primary.key, 'b');
    assert.equal(findChartFocus(points, 'group-x', 19, 12)?.points.length, 2);
  });

  it('compiles pie and donut recipes through one polar scene', () => {
    const slices = pieLayout([
      { id: 'a', label: 'A', value: 3 },
      { id: 'b', label: 'B', value: 1 },
    ], { value: 'value', key: 'id', label: 'label' });
    const definition = defineChart({
      marks: [polar({ innerRadius: 0.75, grid: 'none', marks: [arcMark(slices, { id: 'parts', key: 'key', theta1: 'theta1', theta2: 'theta2', z: 'label', value: 'value', label: 'label' })], center: { value: '4', caption: 'Total' } })],
    });
    const wide = compileChartScene(definition, 400, 320);
    const narrow = compileChartScene(definition, 280, 320);
    assert.equal(wide.coordinate, 'polar');
    assert.equal(wide.nodes.filter(node => node.type === 'path').length, 2);
    assert.deepEqual(wide.points.map(point => point.value), [3, 1]);
    assert.equal(wide.center?.value, '4');
    assert.notDeepEqual(wide.points.map(point => point.x), narrow.points.map(point => point.x));
    assert.equal(defaultChartTheme.donutGap, 1);
    assert.equal(resolveDonutPadAngle(1, 75, 100) * Math.hypot(75, 100), 1);
  });

  it('maps heatmap intensity continuously from 25 to 100 percent data-intent opacity', () => {
    const rows = [
      { id: 'low', x: 'A', y: 'One', value: 0 },
      { id: 'high', x: 'B', y: 'One', value: 100 },
    ];
    const scene = compileChartScene(defineChart({
      marks: [cell(rows, { id: 'heat', key: 'id', x: 'x', y: 'y', intensity: 'value', value: 'value', intent: 'positive' })],
      x: { scale: scaleBand },
      y: { scale: scaleBand },
    }), 480, 320);
    const cells = scene.nodes.filter(node => node.type === 'rect');
    assert.deepEqual(cells.map(node => node.style.fillOpacity), [0.25, 1]);
    assert.ok(cells.every(node => node.style.fill === 'var(--color-data-intent-positive)'));
  });

  it('composes histogram rectangles, annotation bands, and box summaries as marks', () => {
    const distribution = [
      { id: 1, group: 'A', value: 1 },
      { id: 2, group: 'A', value: 2 },
      { id: 3, group: 'A', value: 3 },
      { id: 4, group: 'A', value: 20 },
    ];
    const bins = binX(distribution, { value: 'value', thresholds: 3 });
    const scene = compileChartScene(defineChart({
      marks: [
        bandY([{ id: 'range', low: 1, high: 4 }], { id: 'range', key: 'id', y1: 'low', y2: 'high', interactive: false }),
        rect(bins, { id: 'histogram', key: 'key', x1: 'x1', x2: 'x2', y1: () => 0, y2: 'count' }),
      ],
      x: { scale: scaleLinear },
      y: { scale: scaleLinear },
    }), 480, 320);
    assert.ok(scene.nodes.some(node => node.markId === 'range' && node.type === 'rect'));
    assert.ok(scene.nodes.some(node => node.markId === 'histogram' && node.type === 'rect'));
    const boxScene = compileChartScene(defineChart({
      marks: [boxY(distribution, { id: 'box', key: 'id', x: 'group', y: 'value' })],
      x: { scale: scaleBand },
      y: { scale: scaleLinear },
    }), 480, 320);
    assert.ok(boxScene.nodes.some(node => node.markId === 'box'));
  });

  it('builds polygon radar guides and linear radial series', () => {
    const rows = [
      { id: 'a', metric: 'A', value: 2 },
      { id: 'b', metric: 'B', value: 4 },
      { id: 'c', metric: 'C', value: 3 },
    ];
    const scene = compileChartScene(defineChart({
      marks: [polar({
        grid: 'polygon',
        angle: { domain: ['A', 'B', 'C'] },
        radius: { scale: scaleLinear().domain([0, 5]) },
        marks: [radialLine(rows, { id: 'radar', key: 'id', angle: 'metric', radius: 'value' })],
      })],
    }), 400, 320);
    assert.ok(scene.guides.some(node => node.type === 'path'));
    assert.equal(scene.nodes.filter(node => node.markId === 'radar').length, 1);
    assert.equal(scene.points.length, 3);
    assert.deepEqual(
      scene.guides.filter(node => node.type === 'text').map(node => node.type === 'text' ? node.style.textAnchor : undefined),
      ['middle', 'start', 'end'],
    );
  });

  it('includes an implicit area baseline in the domain and keeps semantic points inside the plot', () => {
    const rows = [{ id: 'a', x: 40, density: 0.01 }, { id: 'b', x: 50, density: 0.04 }, { id: 'c', x: 70, density: 0.015 }];
    const scene = compileChartScene(defineChart({
      marks: [areaY(rows, { id: 'density', key: 'id', x: 'x', y: 'density' })],
      x: { scale: scaleLinear },
      y: { scale: scaleLinear, nice: true },
    }), 480, 320);
    assert.ok(scene.points.every(point => point.y >= scene.plot.top && point.y <= scene.plot.bottom));
    assert.equal(scene.clip, true);
  });

  it('keeps guide candidates separate from visible labels and axis geometry', () => {
    const scene = compileChartScene(defineChart({
      marks: [barY([{ id: 1, category: 'A', value: 4 }], { key: 'id', x: 'category', y: 'value' })],
      x: { scale: scaleBand },
      y: { scale: scaleLinear, grid: true },
    }), 320, 220);
    assert.equal(scene.xAxis.line, true);
    assert.equal(scene.xAxis.tickSize, 4);
    assert.ok(scene.yAxis.ticks.length > 0);
    assert.ok(scene.yAxis.ticks.every(tick => typeof tick.labelVisible === 'boolean'));
  });
});
