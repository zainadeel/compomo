import '/dist/components/ds-chart-bar.js';

await customElements.whenDefined('ds-chart-bar');

document.getElementById('chart').data = [
  { label: 'Hard brake', value: 14 },
  { label: 'Speeding', value: 22 },
  { label: 'Distraction', value: 9 },
  { label: 'Seatbelt', value: 4 },
];

await new Promise(requestAnimationFrame);
document.documentElement.dataset.ready = 'true';
