import '/dist/components/ds-message-composer.js';
import '/dist/components/ds-button-unfilled.js';

await Promise.all([
  customElements.whenDefined('ds-message-composer'),
  customElements.whenDefined('ds-button-unfilled'),
]);
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
