import '/dist/components/ds-message.js';
import '/dist/components/ds-message-bubble.js';

await Promise.all([
  customElements.whenDefined('ds-message'),
  customElements.whenDefined('ds-message-bubble'),
]);
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
