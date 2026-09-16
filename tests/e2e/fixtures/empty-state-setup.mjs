import '/dist/components/ds-empty-state.js';
import '/dist/components/ds-button-unfilled.js';

await customElements.whenDefined('ds-empty-state');
document.documentElement.dataset.ready = 'true';
