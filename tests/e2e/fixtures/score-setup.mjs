import '/dist/components/ds-score.js';

await customElements.whenDefined('ds-score');

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
