import '/dist/components/ds-card-chart.js';
import '/dist/components/ds-chart.js';
import '/dist/components/ds-chart-legend.js';
import { arcMark, barY, defineChart, pieLayout, polar } from '/dist/lib/utils/index.js';
import { scaleBand, scaleLinear } from 'd3-scale';

await Promise.all([
  customElements.whenDefined('ds-card-chart'),
  customElements.whenDefined('ds-chart'),
  customElements.whenDefined('ds-chart-legend'),
]);

const donutData = [
  { label: 'Online', value: 412 },
  { label: 'Offline', value: 31 },
  { label: 'Needs attention', value: 12 },
];
const donutCard = document.getElementById('donut-card');
const donutSlices = pieLayout(donutData, { value: 'value', key: 'label', label: 'label' });
donutCard.querySelector('ds-chart').definition = defineChart({
  marks: [polar({ innerRadius: 0.75, grid: 'none', marks: [arcMark(donutSlices, { id: 'status', key: 'key', theta1: 'theta1', theta2: 'theta2', z: 'label', value: 'value', label: 'label' })], center: { value: '455', caption: 'Total' } })],
  focus: 'nearest',
  tooltip: true,
});
donutCard.querySelector('ds-chart-legend').items = donutData;

const rows = [
  { id: 'jan-driving', month: 'Jan', series: 'Driving', value: 420 },
  { id: 'jan-idling', month: 'Jan', series: 'Idling', value: 95 },
  { id: 'feb-driving', month: 'Feb', series: 'Driving', value: 460 },
  { id: 'feb-idling', month: 'Feb', series: 'Idling', value: 82 },
  { id: 'mar-driving', month: 'Mar', series: 'Driving', value: 445 },
  { id: 'mar-idling', month: 'Mar', series: 'Idling', value: 88 },
];
const chartCard = document.getElementById('chart-card');
chartCard.querySelector('ds-chart').definition = defineChart({
  marks: [barY(rows, { id: 'activity', key: 'id', x: 'month', y: 'value', z: 'series', layout: 'stacked' })],
  x: { scale: scaleBand },
  y: { scale: scaleLinear, nice: true, grid: true },
  focus: 'group-x',
  tooltip: true,
});
chartCard.querySelector('ds-chart-legend').items = [
  { label: 'Driving', color: 'var(--color-data-category-1)' },
  { label: 'Idling', color: 'var(--color-data-category-2)' },
];

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
