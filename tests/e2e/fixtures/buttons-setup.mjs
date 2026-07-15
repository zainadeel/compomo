import '/dist/components/ds-button-filled.js';
import '/dist/components/ds-button-unfilled.js';

await Promise.all([
  customElements.whenDefined('ds-button-filled'),
  customElements.whenDefined('ds-button-unfilled'),
]);

window.__buttonClicks = 0;
for (const button of document.querySelectorAll('ds-button-filled, ds-button-unfilled')) {
  button.addEventListener('dsClick', () => {
    window.__buttonClicks += 1;
  });
}

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
