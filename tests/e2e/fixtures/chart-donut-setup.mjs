import '/dist/components/ds-chart-donut.js';
import '/dist/components/ds-chart-legend.js';
import '/dist/components/ds-card-data-viz-donut.js';
import '/dist/components/ds-tooltip-data-viz.js';

await Promise.all([
  customElements.whenDefined('ds-chart-donut'),
  customElements.whenDefined('ds-chart-legend'),
  customElements.whenDefined('ds-card-data-viz-donut'),
  customElements.whenDefined('ds-tooltip-data-viz'),
]);

const data = [
  { label: 'Passed', value: 68 },
  { label: 'Needs review', value: 22 },
  { label: 'Failed', value: 10 },
];

for (const chart of document.querySelectorAll('ds-chart-donut')) {
  chart.data = data;
}

document.querySelector('#tooltip-disabled').showTooltip = false;
document.querySelector('#card-with-legend ds-chart-legend').items = data;

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
