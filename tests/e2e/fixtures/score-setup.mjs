import '/dist/components/ds-score.js';

await customElements.whenDefined('ds-score');

const withTrend = document.getElementById('with-trend');
if (withTrend) {
  withTrend.trend = { direction: 'up', value: '4', tone: 'positive' };
}

for (const id of ['loading-sm', 'loading-md', 'loading-lg']) {
  const loading = document.getElementById(id);
  if (loading) {
    loading.trend = { direction: 'up', value: '4', tone: 'positive' };
  }
}

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
