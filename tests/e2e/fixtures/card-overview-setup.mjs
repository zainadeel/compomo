import '/dist/components/ds-card-overview.js';

await customElements.whenDefined('ds-card-overview');

const metrics = Array.from({ length: 7 }, (_, index) => ({
  id: `metric-${index + 1}`,
  label: `Metric ${index + 1}`,
  value: index + 1,
  trend: {
    direction: index % 2 === 0 ? 'up' : 'down',
    value: '1',
    tone: ['positive', 'negative', 'neutral'][index % 3],
  },
}));

for (const [id, count] of [
  ['five', 5],
  ['six', 6],
  ['clamped', 7],
  ['wrapped-four', 4],
  ['stacked', 3],
  ['score-pressure', 5],
  ['forced-stacked', 5],
  ['scroll-collapse', 5],
]) {
  const card = document.getElementById(id);
  card.metricMinWidth = id === 'stacked' ? '200px' : '180px';
  card.metrics = metrics.slice(0, count);
}

const score = {
  label: 'Score',
  value: 81,
  trend: {
    direction: 'down',
    value: '1',
    tone: 'negative',
  },
  band: 'Good (67–83)',
};

document.getElementById('stacked').score = score;
document.getElementById('score-pressure').score = score;
document.getElementById('forced-stacked').score = score;
document.getElementById('scroll-collapse').score = score;

const compact = document.getElementById('compact');
compact.score = score;
compact.metrics = metrics.slice(0, 5);

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
