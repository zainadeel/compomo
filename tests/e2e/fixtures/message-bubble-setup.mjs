import '/dist/components/ds-message-bubble.js';

await customElements.whenDefined('ds-message-bubble');
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
