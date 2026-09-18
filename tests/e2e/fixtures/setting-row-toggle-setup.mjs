import '/dist/components/ds-setting-row-toggle.js';

await customElements.whenDefined('ds-setting-row-toggle');
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
