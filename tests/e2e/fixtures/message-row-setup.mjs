import '/dist/components/ds-message.js';
import '/dist/components/ds-message-actions.js';
import '/dist/components/ds-message-bubble.js';
import '/dist/components/ds-button-unfilled.js';
import '/dist/components/ds-tooltip.js';

await Promise.all([
  customElements.whenDefined('ds-message'),
  customElements.whenDefined('ds-message-actions'),
  customElements.whenDefined('ds-message-bubble'),
  customElements.whenDefined('ds-button-unfilled'),
  customElements.whenDefined('ds-tooltip'),
]);
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
