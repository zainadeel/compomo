import '/dist/components/ds-chart-legend.js';

await customElements.whenDefined('ds-chart-legend');

const items = [
  { label: 'Miles driven', value: 1_000 },
  { label: 'Fuel spend', value: 1_500 },
  { label: 'Idle minutes', value: 10_100 },
  { label: 'Total miles', value: 110_100 },
  { label: 'Odometer total', value: 1_000_000 },
];

document.getElementById('legend-one').items = items;
document.getElementById('legend-two').items = items;
const staticLegend = document.getElementById('legend-static');
staticLegend.items = items;
window.staticLegendHoverCount = 0;
staticLegend.addEventListener('dsItemHover', () => {
  window.staticLegendHoverCount += 1;
});
document.documentElement.dataset.ready = 'true';
