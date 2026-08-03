import '/dist/components/ds-chart.js';
import { arcMark, areaY, barY, cell, defineChart, lineY, pieLayout, polar, radialArea, radialDot, radialLine } from '/dist/lib/utils/index.js';
import { scaleBand, scaleLinear } from 'd3-scale';

await customElements.whenDefined('ds-chart');

let rows = [
  { id: 'jan-driving', month: 'January', series: 'Driving', value: 420 },
  { id: 'jan-idling', month: 'January', series: 'Idling', value: 95 },
  { id: 'feb-driving', month: 'February', series: 'Driving', value: 460 },
  { id: 'feb-idling', month: 'February', series: 'Idling', value: 82 },
  { id: 'mar-driving', month: 'March', series: 'Driving', value: 445 },
  { id: 'mar-idling', month: 'March', series: 'Idling', value: 88 },
  { id: 'apr-driving', month: 'April', series: 'Driving', value: 510 },
  { id: 'apr-idling', month: 'April', series: 'Idling', value: 76 },
];

const chart = document.getElementById('chart');
const buildDefinition = () => defineChart({
  marks: [barY(rows, {
    id: 'activity',
    key: 'id',
    x: 'month',
    y: 'value',
    z: 'series',
    layout: 'grouped',
  })],
  x: { scale: scaleBand, axis: { label: 'Month' } },
  y: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Minutes' } },
  focus: 'group-x',
  tooltip: true,
});

chart.definition = buildDefinition();
chart.addEventListener('dsChartFocusChange', event => {
  if (event.detail.primary) window.lastFocus = event.detail;
});
window.reorderChart = () => {
  rows = [...rows].reverse();
  chart.definition = buildDefinition();
};

const polarRows = [
  { id: 'online', label: 'Online', value: 68 },
  { id: 'review', label: 'Needs review', value: 22 },
  { id: 'offline', label: 'Offline', value: 10 },
];
const polarSlices = pieLayout(polarRows, { value: 'value', key: 'id', label: 'label' });
document.getElementById('polar-chart').definition = defineChart({
  marks: [polar({ innerRadius: 0.75, grid: 'none', marks: [arcMark(polarSlices, { id: 'status', key: 'key', theta1: 'theta1', theta2: 'theta2', z: 'label', value: 'value', label: 'label' })], center: { value: '100', caption: 'Total devices' } })],
  focus: 'nearest',
  tooltip: true,
});

const heatmapRows = [
  { id: 'low', day: 'Mon', period: 'AM', value: 0 },
  { id: 'middle', day: 'Tue', period: 'AM', value: 50 },
  { id: 'high', day: 'Wed', period: 'AM', value: 100 },
];
document.getElementById('heatmap-chart').definition = defineChart({
  marks: [cell(heatmapRows, { id: 'activity', key: 'id', x: 'day', y: 'period', intensity: 'value', value: 'value', intent: 'brand' })],
  x: { scale: scaleBand },
  y: { scale: scaleBand },
  focus: 'nearest',
  tooltip: true,
});

const densityRows = [
  { id: 'a', x: 42, density: 0.018 },
  { id: 'b', x: 50, density: 0.041 },
  { id: 'c', x: 56, density: 0.034 },
  { id: 'd', x: 64, density: 0.022 },
  { id: 'e', x: 72, density: 0.013 },
];
document.getElementById('density-chart').definition = defineChart({
  marks: [
    areaY(densityRows, { id: 'density-area', key: 'id', x: 'x', y: 'density', interactive: false }),
    lineY(densityRows, { id: 'density-line', key: 'id', x: 'x', y: 'density' }),
  ],
  x: { scale: scaleLinear, nice: true, axis: { label: 'Value' } },
  y: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Density' } },
});

const radarRows = [
  { id: 'safety', metric: 'Safety', value: 82 },
  { id: 'fuel', metric: 'Fuel efficiency', value: 64 },
  { id: 'uptime', metric: 'Uptime', value: 90 },
  { id: 'service', metric: 'Service readiness', value: 72 },
];
document.getElementById('radar-chart').definition = defineChart({
  marks: [polar({
    grid: 'polygon',
    outerRadius: 0.82,
    angle: { domain: radarRows.map(row => row.metric) },
    radius: { scale: scaleLinear().domain([0, 100]) },
    marks: [
      radialArea(radarRows, { id: 'radar-area', key: 'id', angle: 'metric', radius: 'value', interactive: false }),
      radialLine(radarRows, { id: 'radar-line', key: 'id', angle: 'metric', radius: 'value', interactive: false }),
      radialDot(radarRows, { id: 'radar-dots', key: 'id', angle: 'metric', radius: 'value' }),
    ],
  })],
});

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
