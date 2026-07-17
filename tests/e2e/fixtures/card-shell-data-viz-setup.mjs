import '/dist/components/ds-card-shell-data-viz.js';
import '/dist/components/ds-card-data-viz-donut.js';

await Promise.all([
  customElements.whenDefined('ds-card-shell-data-viz'),
  customElements.whenDefined('ds-card-data-viz-donut'),
]);

document.documentElement.dataset.ready = 'true';
