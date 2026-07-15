import '/dist/components/ds-divider.js';

await customElements.whenDefined('ds-divider');
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
