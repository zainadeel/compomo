import '/dist/components/ds-text.js';

await customElements.whenDefined('ds-text');
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
