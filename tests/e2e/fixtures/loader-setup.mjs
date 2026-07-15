import '/dist/components/ds-loader.js';

await customElements.whenDefined('ds-loader');
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
