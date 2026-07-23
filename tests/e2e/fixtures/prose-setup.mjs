import '/dist/components/ds-button-filled.js';
import '/dist/components/ds-markdown.js';

await Promise.all([
  customElements.whenDefined('ds-button-filled'),
  customElements.whenDefined('ds-markdown'),
]);

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
