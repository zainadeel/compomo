// Exercise every public bar-chart variant through the consolidated component.
import '/dist/components/ds-chart-bar.js';

await customElements.whenDefined('ds-chart-bar');

const categories = ['Jan', 'Feb'];
const series = [
  { name: 'Driving', data: [40, 25], color: 'var(--color-data-category-1)' },
  { name: 'Idling', data: [30, 25], color: 'var(--color-data-category-2)' },
  { name: 'Stopped', data: [30, 50], color: 'var(--color-data-category-3)' },
];

for (const chart of document.querySelectorAll('ds-chart-bar')) {
  chart.categories = categories;
  chart.series = series;
}

await new Promise(requestAnimationFrame);
document.documentElement.dataset.ready = 'true';
