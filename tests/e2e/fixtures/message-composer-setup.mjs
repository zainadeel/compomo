import '/dist/components/ds-message-composer.js';

await customElements.whenDefined('ds-message-composer');
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
