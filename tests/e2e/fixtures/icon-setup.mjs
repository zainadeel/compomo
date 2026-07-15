import '/dist/components/ds-icon.js';

await customElements.whenDefined('ds-icon');
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
