import '/dist/components/ds-card-overview.js';
import '/dist/components/ds-select.js';

await Promise.all([
  customElements.whenDefined('ds-card-overview'),
  customElements.whenDefined('ds-select'),
]);

const comparisonOptions = [
  { label: 'Previous 1 period', value: '1w' },
  { label: 'Previous 2 periods', value: '2w' },
  { label: 'Previous 4 periods', value: '4w' },
];
const rangeOptions = [
  { label: 'Jun 30–Jul 27', value: 'current-4w' },
  { label: 'Jun 2–Jun 29', value: 'previous-4w' },
];

for (const id of ['default-filter', 'range-filter', 'compact-filter', 'loading-filter']) {
  const select = document.getElementById(id);
  select.options = comparisonOptions;
  select.value = '4w';
  select.background = 'always-dark';
  select.activeFill = false;
  select.hasBorder = false;
  select.allowClear = false;
}

const rangeSelect = document.getElementById('range-period');
rangeSelect.options = rangeOptions;
rangeSelect.value = 'current-4w';
rangeSelect.background = 'always-dark';
rangeSelect.activeFill = false;
rangeSelect.hasBorder = false;
rangeSelect.allowClear = false;

const metrics = Array.from({ length: 7 }, (_, index) => ({
  id: `metric-${index + 1}`,
  label: `Metric ${index + 1}`,
  value: index + 1,
  trend:
    index === 3
      ? undefined
      : {
          direction: index % 2 === 0 ? 'up' : 'down',
          value: '1',
          tone: ['positive', 'negative', 'neutral'][index % 3],
        },
}));

const score = value => ({
  value,
  trend: { direction: 'up', value: '4', tone: 'positive' },
});

for (const id of ['default', 'range', 'wrapped', 'stacked', 'scroll-collapse']) {
  const card = document.getElementById(id);
  card.metricMinWidth = '180px';
  card.score = score(87);
  card.metrics = metrics.slice(0, id === 'wrapped' ? 4 : 5);
}

document.getElementById('compact').score = score(87);
document.getElementById('compact').metrics = metrics.slice(0, 5);
document.getElementById('fair').score = score(50);
document.getElementById('good').score = score(80);
document.getElementById('excellent').score = score(81);
document.getElementById('no-score').metrics = metrics.slice(0, 2);
document.getElementById('no-trend').score = { value: 87 };
document.getElementById('score-error').metrics = metrics.slice(0, 2);
document.getElementById('loading-with-metrics').metrics = metrics.slice(0, 3);

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
