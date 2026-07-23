import '/dist/components/ds-card-shell-data-viz.js';
import '/dist/components/ds-card-data-viz-bar.js';
import '/dist/components/ds-card-data-viz-donut.js';
import '/dist/components/ds-card-data-viz-line.js';
import '/dist/components/ds-chart-bar-stacked.js';
import '/dist/components/ds-chart-line.js';
import '/dist/components/ds-chart-legend.js';

await Promise.all([
  customElements.whenDefined('ds-card-shell-data-viz'),
  customElements.whenDefined('ds-card-data-viz-bar'),
  customElements.whenDefined('ds-card-data-viz-donut'),
  customElements.whenDefined('ds-card-data-viz-line'),
  customElements.whenDefined('ds-chart-bar-stacked'),
  customElements.whenDefined('ds-chart-line'),
  customElements.whenDefined('ds-chart-legend'),
]);

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
barCard.querySelector('ds-chart-bar-stacked').series = barSeries;
barCard.querySelector('ds-chart-bar-stacked').categories = ['Jan', 'Feb', 'Mar'];
barCard.querySelector('ds-chart-legend').items = barSeries.map(series => ({
  label: series.name,
  color: series.color,
}));

await new Promise(requestAnimationFrame);
document.documentElement.dataset.ready = 'true';
