import '/dist/components/ds-conversation-list-item.js';
import '/dist/components/ds-button-unfilled.js';

await Promise.all([
  customElements.whenDefined('ds-conversation-list-item'),
  customElements.whenDefined('ds-button-unfilled'),
]);
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
