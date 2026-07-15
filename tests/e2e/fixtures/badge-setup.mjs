import '/dist/components/ds-badge.js';

await customElements.whenDefined('ds-badge');
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
