import '/dist/components/ds-typing-indicator.js';

await customElements.whenDefined('ds-typing-indicator');
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
