// Verify the consolidated card owns every supported data-viz composition.
import '/dist/components/ds-card-data-viz.js';
import '/dist/components/ds-chart-bar.js';
import '/dist/components/ds-chart-donut.js';
import '/dist/components/ds-chart-line.js';
import '/dist/components/ds-chart-legend.js';

await Promise.all([
  customElements.whenDefined('ds-card-data-viz'),
  customElements.whenDefined('ds-chart-bar'),
  customElements.whenDefined('ds-chart-donut'),
  customElements.whenDefined('ds-chart-line'),
  customElements.whenDefined('ds-chart-legend'),
]);

const donutData = [
  { label: 'Online', value: 412 },
  { label: 'Offline', value: 31 },
  { label: 'Needs attention', value: 12 },
];
const donutCard = document.getElementById('donut-card');
donutCard.querySelector('ds-chart-donut').data = donutData;
donutCard.querySelector('ds-chart-legend').items = donutData;

const lineSeries = [
  { name: 'Fuel score', data: [72, 75, 74, 79, 81, 84] },
  { name: 'Idling %', data: [18, 16, 17, 14, 12, 11] },
];
const lineCard = document.getElementById('line-card');
lineCard.querySelector('ds-chart-line').series = lineSeries;
lineCard.querySelector('ds-chart-line').categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
lineCard.querySelector('ds-chart-legend').items = lineSeries.map(series => ({
  label: series.name,
  color: series.color,
}));

const barSeries = [
  { name: 'Driving', data: [420, 460, 445], color: 'var(--color-data-category-1)' },
  { name: 'Idling', data: [95, 82, 88], color: 'var(--color-data-category-2)' },
];
const barCard = document.getElementById('bar-card');
barCard.querySelector('ds-chart-bar').series = barSeries;
barCard.querySelector('ds-chart-bar').categories = ['Jan', 'Feb', 'Mar'];
barCard.querySelector('ds-chart-legend').items = barSeries.map(series => ({
  label: series.name,
  color: series.color,
}));

document.querySelector('#regular-bar-card ds-chart-bar').data = [
  { label: 'Mon', value: 118, color: 'var(--color-data-category-1)' },
  { label: 'Tue', value: 136, color: 'var(--color-data-category-1)' },
  { label: 'Wed', value: 124, color: 'var(--color-data-category-1)' },
  { label: 'Thu', value: 151, color: 'var(--color-data-category-1)' },
  { label: 'Fri', value: 143, color: 'var(--color-data-category-1)' },
];

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
