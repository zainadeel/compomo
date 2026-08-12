import '/dist/components/ds-tooltip-chart.js';

await customElements.whenDefined('ds-tooltip-chart');

document.getElementById('grouped-tooltip').items = [
  { label: 'Driving', value: '4:45 min', color: 'var(--color-data-category-1)' },
  { label: 'Idling', value: '88 min', color: 'var(--color-data-category-2)' },
];

document.getElementById('mixed-tooltip').items = [
  { label: 'Driving', value: '4:45 min', color: 'var(--color-data-category-1)' },
  { label: 'Total activity', value: '6:13 min' },
  { label: 'Idling', value: '88 min', color: 'var(--color-data-category-2)' },
];

document.getElementById('long-tooltip').items = [
  {
    label: 'Average engine-on time for long-haul vehicles',
    value: '1,248 hours',
    color: 'var(--color-data-category-1)',
  },
  {
    label: 'Average scheduled service duration',
    value: '184 hours',
    color: 'var(--color-data-category-2)',
  },
];

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
