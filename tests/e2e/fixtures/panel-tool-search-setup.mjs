import '/dist/components/ds-panel-tool-search.js';

await customElements.whenDefined('ds-panel-tool-search');
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
