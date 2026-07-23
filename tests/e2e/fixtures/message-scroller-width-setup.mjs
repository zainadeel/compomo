import '/dist/components/ds-message-scroller.js';

await customElements.whenDefined('ds-message-scroller');
await new Promise(requestAnimationFrame);
document.documentElement.dataset.ready = 'true';
