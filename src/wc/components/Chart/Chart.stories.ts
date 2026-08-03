import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import { scaleBand, scaleLinear, scalePoint, scaleUtc } from 'd3-scale';
import '../../../../dist/components/ds-chart.js';
import '../../../../dist/components/ds-chart-legend.js';
import '../../../../dist/components/ds-text.js';
import {
  arcMark,
  areaY,
  bandY,
  barX,
  barY,
  binX,
  boxY,
  cell,
  cumulativeBins,
  densityX,
  defineChart,
  dot,
  lineY,
  normalizeStack,
  pieLayout,
  polar,
  radialArea,
  radialDot,
  radialLine,
  rect,
  ruleY,
  textMark,
} from '../../utils/chart-grammar';
import type { ChartDefinition } from '../../utils/chart-grammar';

interface TrendRow {
  id: string;
  date: Date;
  value: number | null;
  low: number;
  high: number;
  series: string;
}

const trendRows: TrendRow[] = [
  { id: 'a-jan', date: new Date('2026-01-01'), value: 52, low: 46, high: 58, series: 'Actual' },
  { id: 'a-feb', date: new Date('2026-02-01'), value: 61, low: 54, high: 67, series: 'Actual' },
  { id: 'a-mar', date: new Date('2026-03-01'), value: null, low: 55, high: 70, series: 'Actual' },
  { id: 'a-apr', date: new Date('2026-04-01'), value: 74, low: 66, high: 81, series: 'Actual' },
  { id: 'a-may', date: new Date('2026-05-01'), value: 78, low: 70, high: 84, series: 'Actual' },
];

const trendDefinition = defineChart({
  marks: [
    areaY(trendRows, { id: 'range', x: 'date', y1: 'low', y2: 'high', interactive: false }),
    ruleY([68], { id: 'target', strokeDasharray: '4 4' }),
    lineY(trendRows, { id: 'actual', key: 'id', x: 'date', y: 'value', z: 'series', interactive: false }),
    dot(trendRows, { id: 'actual-points', key: 'id', x: 'date', y: 'value', z: 'series' }),
    textMark([{ id: 'target-label', date: new Date('2026-05-01'), value: 68, label: 'Target' }], {
      id: 'annotations', key: 'id', x: 'date', y: 'value', text: 'label', textAnchor: 'end', dy: -8,
    }),
  ],
  x: { scale: scaleUtc, axis: { label: 'Month' } },
  y: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Score' } },
  focus: 'group-x',
  tooltip: true,
});

const comparisonRows = [
  { id: 'jan-current', month: 'Jan', series: 'Current year', value: 61 },
  { id: 'feb-current', month: 'Feb', series: 'Current year', value: 66 },
  { id: 'mar-current', month: 'Mar', series: 'Current year', value: 70 },
  { id: 'apr-current', month: 'Apr', series: 'Current year', value: 74 },
  { id: 'may-current', month: 'May', series: 'Current year', value: 78 },
  { id: 'jan-previous', month: 'Jan', series: 'Previous year', value: 58 },
  { id: 'feb-previous', month: 'Feb', series: 'Previous year', value: 60 },
  { id: 'mar-previous', month: 'Mar', series: 'Previous year', value: 64 },
  { id: 'apr-previous', month: 'Apr', series: 'Previous year', value: 67 },
  { id: 'may-previous', month: 'May', series: 'Previous year', value: 70 },
];

const comparisonDefinition = defineChart({
  marks: [
    lineY(comparisonRows, { id: 'score-lines', key: 'id', x: 'month', y: 'value', z: 'series', interactive: false }),
    dot(comparisonRows, { id: 'score-points', key: 'id', x: 'month', y: 'value', z: 'series' }),
  ],
  x: { scale: scalePoint, axis: { label: 'Month' } },
  y: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Fleet score' } },
  focus: 'group-x',
  tooltip: true,
});

const utilizationRows = [
  { id: 'mon', day: 'Mon', value: 64 },
  { id: 'tue', day: 'Tue', value: 72 },
  { id: 'wed', day: 'Wed', value: 68 },
  { id: 'thu', day: 'Thu', value: 81 },
  { id: 'fri', day: 'Fri', value: 76 },
  { id: 'sat', day: 'Sat', value: 52 },
  { id: 'sun', day: 'Sun', value: 45 },
];

const areaDefinition = defineChart({
  marks: [
    areaY(utilizationRows, { id: 'utilization-area', key: 'id', x: 'day', y: 'value', interactive: false }),
    lineY(utilizationRows, { id: 'utilization-line', key: 'id', x: 'day', y: 'value' }),
  ],
  x: { scale: scalePoint, axis: { label: 'Day' } },
  y: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Utilization' } },
  focus: 'nearest-x',
  tooltip: { format: point => `${point.value}%` },
});

const scatterRows = [
  { id: 'van-1', type: 'Van', distance: 38, efficiency: 86 },
  { id: 'van-2', type: 'Van', distance: 51, efficiency: 80 },
  { id: 'van-3', type: 'Van', distance: 67, efficiency: 76 },
  { id: 'truck-1', type: 'Truck', distance: 44, efficiency: 72 },
  { id: 'truck-2', type: 'Truck', distance: 62, efficiency: 66 },
  { id: 'truck-3', type: 'Truck', distance: 78, efficiency: 61 },
  { id: 'ev-1', type: 'EV', distance: 35, efficiency: 94 },
  { id: 'ev-2', type: 'EV', distance: 58, efficiency: 90 },
];

const scatterDefinition = defineChart({
  marks: [dot(scatterRows, { id: 'vehicles', key: 'id', x: 'distance', y: 'efficiency', z: 'type', r: 5 })],
  x: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Daily distance' } },
  y: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Efficiency score' } },
  focus: 'nearest',
  tooltip: true,
});

interface BarRow {
  id: string;
  month: string;
  series: string;
  value: number;
}

const barRows: BarRow[] = [
  { id: 'jan-driving', month: 'Jan', series: 'Driving', value: 420 },
  { id: 'jan-idling', month: 'Jan', series: 'Idling', value: 95 },
  { id: 'feb-driving', month: 'Feb', series: 'Driving', value: 460 },
  { id: 'feb-idling', month: 'Feb', series: 'Idling', value: 82 },
  { id: 'mar-driving', month: 'Mar', series: 'Driving', value: 445 },
  { id: 'mar-idling', month: 'Mar', series: 'Idling', value: 88 },
];

const singleBarRows = [
  { id: 'jan', month: 'Jan', value: 515 },
  { id: 'feb', month: 'Feb', value: 542 },
  { id: 'mar', month: 'Mar', value: 533 },
  { id: 'apr', month: 'Apr', value: 586 },
  { id: 'may', month: 'May', value: 612 },
];

const singleBarDefinition = defineChart({
  marks: [barY(singleBarRows, { id: 'distance', key: 'id', x: 'month', y: 'value' })],
  x: { scale: scaleBand, axis: { label: 'Month' } },
  y: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Distance' } },
  focus: 'nearest',
  tooltip: { format: point => `${new Intl.NumberFormat('en').format(Number(point.value))} km` },
});

const riskRows = [
  { id: 'speeding', label: 'Speeding', value: 38 },
  { id: 'braking', label: 'Hard braking', value: 29 },
  { id: 'acceleration', label: 'Acceleration', value: 21 },
  { id: 'cornering', label: 'Cornering', value: 14 },
];

const horizontalBarDefinition = defineChart({
  marks: [barX(riskRows, { id: 'risk-events', key: 'id', x: 'value', y: 'label' })],
  x: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Events' } },
  y: { scale: scaleBand },
  focus: 'nearest',
  tooltip: true,
});

const barDefinition = (layout: 'single' | 'grouped' | 'stacked') => defineChart({
  marks: [barY(barRows, { id: 'activity', key: 'id', x: 'month', y: 'value', z: 'series', layout })],
  x: { scale: scaleBand, axis: { label: 'Month' } },
  y: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Minutes' } },
  focus: 'group-x',
  tooltip: true,
});

const divergingRows = [
  { id: 'jan-gain', month: 'Jan', series: 'Improvement', value: 12 },
  { id: 'jan-loss', month: 'Jan', series: 'Regression', value: -5 },
  { id: 'feb-gain', month: 'Feb', series: 'Improvement', value: 9 },
  { id: 'feb-loss', month: 'Feb', series: 'Regression', value: -8 },
  { id: 'mar-gain', month: 'Mar', series: 'Improvement', value: 15 },
  { id: 'mar-loss', month: 'Mar', series: 'Regression', value: -3 },
];

const divergingDefinition = defineChart({
  marks: [barY(divergingRows, { id: 'change', key: 'id', x: 'month', y: 'value', z: 'series', layout: 'stacked' })],
  x: { scale: scaleBand, axis: { label: 'Month' } },
  y: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Score change' } },
  focus: 'group-x',
  tooltip: { format: point => `${Number(point.value) > 0 ? '+' : ''}${point.value}` },
});

const percentageRows = normalizeStack(barRows, {
  group: 'month',
  series: 'series',
  value: 'value',
});

const percentageDefinition = defineChart({
  marks: [barY(percentageRows, {
    id: 'share',
    key: row => row.data.id,
    x: 'group',
    y: 'proportion',
    z: 'series',
    layout: 'stacked',
  })],
  x: { scale: scaleBand<string>().domain(['Jan', 'Feb', 'Mar']) },
  y: {
    scale: scaleLinear().domain([0, 1]),
    grid: true,
    axis: { ticks: { format: value => `${Math.round(Number(value) * 100)}%` } },
  },
  focus: 'group-x',
  tooltip: { format: point => `${Math.round(Number(point.yValue) * 100)}%` },
});

const partRows = [
  { id: 'online', label: 'Online', value: 68 },
  { id: 'review', label: 'Needs review', value: 22 },
  { id: 'offline', label: 'Offline', value: 10 },
];
const partSlices = pieLayout(partRows, { value: 'value', key: 'id', label: 'label' });
const polarDefinition = (innerRadius: number) => defineChart({
  marks: [polar({
    innerRadius,
    grid: 'none',
    marks: [arcMark(partSlices, { id: 'status', key: 'key', theta1: 'theta1', theta2: 'theta2', z: 'label', value: 'value', label: 'label' })],
    center: innerRadius > 0 ? { value: '100', caption: 'Total devices' } : undefined,
  })],
  focus: 'nearest',
  tooltip: true,
});

const gaugeValue = 72;
const gaugeDefinition = defineChart({
  marks: [polar({
    startAngle: -Math.PI / 2,
    endAngle: Math.PI / 2,
    innerRadius: 0.75,
    grid: 'none',
    marks: [
      arcMark([{ id: 'track', theta1: 0, theta2: 1 }], { id: 'gauge-track', key: 'id', theta1: 'theta1', theta2: 'theta2', fill: 'var(--color-foreground-quaternary)', interactive: false }),
      arcMark([{ id: 'score', label: 'Score', value: gaugeValue, theta1: 0, theta2: gaugeValue / 100 }], { id: 'gauge-value', key: 'id', theta1: 'theta1', theta2: 'theta2', value: 'value', label: 'label', fill: 'var(--color-data-intent-brand)' }),
    ],
    center: { value: `${gaugeValue}%`, caption: 'Fleet score' },
  })],
  focus: 'nearest',
  tooltip: { format: point => `${point.value}%` },
});

const radarRows = [
  { id: 'safety-a', metric: 'Safety', series: 'Current', value: 82 },
  { id: 'fuel-a', metric: 'Fuel', series: 'Current', value: 64 },
  { id: 'uptime-a', metric: 'Uptime', series: 'Current', value: 90 },
  { id: 'service-a', metric: 'Service', series: 'Current', value: 72 },
  { id: 'safety-b', metric: 'Safety', series: 'Previous', value: 70 },
  { id: 'fuel-b', metric: 'Fuel', series: 'Previous', value: 74 },
  { id: 'uptime-b', metric: 'Uptime', series: 'Previous', value: 78 },
  { id: 'service-b', metric: 'Service', series: 'Previous', value: 68 },
];
const radarDefinition = defineChart({
  marks: [polar({
    grid: 'polygon',
    outerRadius: 0.86,
    angle: { domain: ['Safety', 'Fuel', 'Uptime', 'Service'], grid: true },
    radius: { scale: scaleLinear().domain([0, 100]) },
    marks: [
      radialArea(radarRows, { id: 'radar-area', key: 'id', angle: 'metric', radius: 'value', z: 'series', interactive: false }),
      radialLine(radarRows, { id: 'radar-line', key: 'id', angle: 'metric', radius: 'value', z: 'series', interactive: false }),
      radialDot(radarRows, { id: 'radar-points', key: 'id', angle: 'metric', radius: 'value', z: 'series' }),
    ],
  })],
  focus: 'nearest',
  tooltip: true,
});

const heatmapRows = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].flatMap((day, dayIndex) =>
  ['Morning', 'Afternoon', 'Evening'].map((period, periodIndex) => ({
    id: `${day}-${period}`,
    day,
    period,
    value: 12 + dayIndex * 13 + periodIndex * 9,
  })),
);
const heatmapDefinition = defineChart({
  marks: [cell(heatmapRows, { id: 'activity', key: 'id', x: 'day', y: 'period', intensity: 'value', value: 'value', intent: 'brand' })],
  x: { scale: scaleBand },
  y: { scale: scaleBand },
  focus: 'nearest',
  tooltip: true,
});

const distributionRows = [42, 45, 48, 49, 50, 51, 51, 52, 53, 54, 57, 59, 60, 63, 67, 69, 72].map((value, index) => ({ id: index, value }));
const histogramBins = binX(distributionRows, { value: 'value' });
const cumulativeHistogramBins = cumulativeBins(histogramBins);
const densityRows = densityX(distributionRows, { value: 'value' });
const histogramDefinition = (cumulative = false) => defineChart({
  marks: [rect(cumulative ? cumulativeHistogramBins : histogramBins, { id: cumulative ? 'cumulative' : 'histogram', key: 'key', x1: 'x1', x2: 'x2', y1: () => 0, y2: cumulative ? 'cumulative' : 'count', value: cumulative ? 'cumulative' : 'count' })],
  x: { scale: scaleLinear, nice: true, axis: { label: 'Value' } },
  y: { scale: scaleLinear, nice: true, grid: true, axis: { label: cumulative ? 'Cumulative count' : 'Count' } },
  focus: 'nearest',
  tooltip: true,
});
const densityDefinition = defineChart({
  marks: [
    areaY(densityRows, { id: 'density-area', key: 'key', x: 'x', y: 'density', interactive: false }),
    lineY(densityRows, { id: 'density-line', key: 'key', x: 'x', y: 'density' }),
  ],
  x: { scale: scaleLinear, nice: true, axis: { label: 'Value' } },
  y: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Density' } },
  focus: 'nearest-x',
  tooltip: true,
});
const boxRows = [
  ...[42, 45, 48, 51, 54, 60, 72].map((value, index) => ({ id: `north-${index}`, region: 'North', value })),
  ...[30, 46, 50, 52, 55, 58, 90].map((value, index) => ({ id: `south-${index}`, region: 'South', value })),
];
const boxDefinition = defineChart({
  marks: [boxY(boxRows, { id: 'distribution', key: 'id', x: 'region', y: 'value', z: 'region' })],
  x: { scale: scaleBand },
  y: { scale: scaleLinear, nice: true, grid: true },
  focus: 'nearest',
  tooltip: true,
});

const annotatedDefinition = defineChart({
  marks: [
    bandY([{ id: 'target-band', low: 65, high: 75 }], { id: 'target-band', key: 'id', y1: 'low', y2: 'high', interactive: false }),
    ruleY([70], { id: 'target', strokeDasharray: '4 4', interactive: false }),
    lineY(trendRows, { id: 'actual', key: 'id', x: 'date', y: 'value', z: 'series' }),
    textMark([{ id: 'note', date: new Date('2026-04-01'), value: 74, label: 'Target reached' }], { id: 'note', key: 'id', x: 'date', y: 'value', text: 'label', dy: -10 }),
  ],
  x: { scale: scaleUtc, axis: { label: 'Month' } },
  y: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Score' } },
  focus: 'nearest-x',
  tooltip: true,
});

interface ChartStoryOptions {
  title: string;
  description: string;
  summary: string;
  width?: string;
  height?: number;
}

const renderChart = (definition: ChartDefinition, options: ChartStoryOptions) => html`
  <section
    style=${`display:grid;gap:var(--dimension-space-200);box-sizing:border-box;width:${options.width ?? 'min(720px, 100%)'};padding:var(--dimension-space-300);border:var(--dimension-stroke-width-012) solid var(--color-border-tertiary);border-radius:var(--dimension-radius-050);background:var(--color-background-primary);`}
  >
    <header style="display:grid;gap:var(--dimension-space-050);">
      <ds-text as="h2" variant="text-title-small" emphasis color="primary">${options.title}</ds-text>
      <ds-text as="p" variant="text-body-small" color="secondary">${options.description}</ds-text>
    </header>
    <ds-chart
      ${ref(element => {
        if (element) (element as HTMLElement & { definition: unknown }).definition = definition;
      })}
      label=${options.title}
      description=${options.description}
      height=${options.height ?? 320}
    ></ds-chart>
    <ds-text as="p" variant="text-body-small" color="secondary">${options.summary}</ds-text>
  </section>
`;

const meta: Meta = {
  title: 'Charts/Chart',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

export const MultiSeriesLine: Story = { render: () => renderChart(comparisonDefinition, { title: 'Fleet score comparison', description: 'Current and previous year scores with grouped month focus.', summary: 'May: current year 78; previous year 70.' }) };
export const Area: Story = { render: () => renderChart(areaDefinition, { title: 'Weekly fleet utilization', description: 'A zero-based area with a straight-line boundary.', summary: 'Peak utilization: Thursday, 81%.' }) };
export const LayeredTimeSeries: Story = { render: () => renderChart(trendDefinition, { title: 'Fleet score with expected range', description: 'A time series with a missing observation, confidence area, target rule, and annotation.', summary: 'Latest score: 78. Target: 68.' }) };
export const Scatter: Story = { render: () => renderChart(scatterDefinition, { title: 'Distance and efficiency', description: 'Vehicle observations grouped by vehicle type.', summary: 'Highest efficiency: EV, 94 at 35 km daily distance.' }) };
export const SingleBars: Story = { render: () => renderChart(singleBarDefinition, { title: 'Monthly fleet distance', description: 'A single quantitative series across monthly categories.', summary: 'May leads with 612 km.' }) };
export const HorizontalBars: Story = { render: () => renderChart(horizontalBarDefinition, { title: 'Safety risk events', description: 'Horizontal bars keep longer category labels readable.', summary: 'Speeding is the largest category with 38 events.' }) };
export const GroupedBars: Story = { render: () => renderChart(barDefinition('grouped'), { title: 'Driving and idling time', description: 'Series are compared side by side within each month.', summary: 'March: 445 driving minutes and 88 idling minutes.' }) };
export const StackedBars: Story = { render: () => renderChart(barDefinition('stacked'), { title: 'Total activity composition', description: 'Positive series accumulate with a one-pixel internal segment gap.', summary: 'March total: 533 minutes.' }) };
export const DivergingStackedBars: Story = { render: () => renderChart(divergingDefinition, { title: 'Monthly score movement', description: 'Positive and negative stacks accumulate independently from zero.', summary: 'March: +15 improvement and −3 regression.' }) };
export const PercentageBars: Story = { render: () => renderChart(percentageDefinition, { title: 'Activity share', description: 'The explicit normalizeStack transform produces percentage composition.', summary: 'January: 82% driving and 18% idling.' }) };
export const Pie: Story = { render: () => renderChart(polarDefinition(0), { title: 'Device status share', description: 'A pie uses the same arc mark and layout transform as a donut.', summary: 'Online 68; needs review 22; offline 10.', width: '360px' }) };
export const Donut: Story = { render: () => renderChart(polarDefinition(0.75), { title: 'Device status total', description: 'A 75% inner radius and one-pixel slice gaps frame authored center content.', summary: 'Total devices: 100.', width: '360px' }) };
export const Gauge: Story = { render: () => renderChart(gaugeDefinition, { title: 'Fleet score gauge', description: 'A semicircular polar composition built from track and value arcs.', summary: 'Fleet score: 72%.', width: '400px', height: 280 }) };
export const Radar: Story = { render: () => renderChart(radarDefinition, { title: 'Fleet capability profile', description: 'Two series share measured polygon guides and directional labels.', summary: 'Current uptime is the strongest metric at 90.', width: '460px' }) };
export const Heatmap: Story = { render: () => renderChart(heatmapDefinition, { title: 'Weekly activity intensity', description: 'A brand-intent sequential scale runs continuously from 25% to 100% opacity.', summary: 'Highest activity appears Friday evening.' }) };
export const Histogram: Story = { render: () => renderChart(histogramDefinition(), { title: 'Vehicle value distribution', description: 'Stable D3 bins are rendered as quantitative rectangles.', summary: 'Most observations fall between 48 and 60.' }) };
export const CumulativeHistogram: Story = { render: () => renderChart(histogramDefinition(true), { title: 'Cumulative vehicle distribution', description: 'The same bins are transformed into running totals.', summary: `Final cumulative count: ${distributionRows.length}.` }) };
export const Density: Story = { render: () => renderChart(densityDefinition, { title: 'Smoothed value density', description: 'A zero-inclusive density area and straight line share one semantic series.', summary: 'The highest density is near 52.' }) };
export const BoxPlot: Story = { render: () => renderChart(boxDefinition, { title: 'Regional value spread', description: 'Quartiles, median, Tukey whiskers, and outliers compose one box mark.', summary: 'North median: 51. South median: 52.' }) };
export const Annotations: Story = { render: () => renderChart(annotatedDefinition, { title: 'Target attainment', description: 'A band, rule, line, and text annotation render in authored layer order.', summary: 'The score reaches the target range in April.' }) };
export const NarrowCard: Story = {
  render: () => renderChart(defineChart(({ width }) => ({
    ...barDefinition('grouped').chart as object,
    marks: width < 360
      ? [barY(barRows, { id: 'activity', key: 'id', x: 'month', y: 'value', z: 'series', layout: 'stacked' })]
      : [barY(barRows, { id: 'activity', key: 'id', x: 'month', y: 'value', z: 'series', layout: 'grouped' })],
    x: { scale: scaleBand, axis: { ticks: { count: width < 360 ? 3 : 6 } } },
    y: { scale: scaleLinear, nice: true, grid: true },
    focus: 'group-x',
    tooltip: true,
  })), { title: 'Responsive card chart', description: 'At card width the definition switches grouped bars to a stacked composition without scaling text.', summary: 'The chart remains keyboard-focusable and exact values remain available in its tooltip.', width: '280px', height: 240 }),
};
