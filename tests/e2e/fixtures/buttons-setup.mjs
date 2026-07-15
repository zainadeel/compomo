import '/dist/components/ds-button-filled.js';
import '/dist/components/ds-button-unfilled.js';

await Promise.all([
  customElements.whenDefined('ds-button-filled'),
  customElements.whenDefined('ds-button-unfilled'),
]);

window.__buttonClicks = 0;
window.__buttonChanges = [];
for (const button of document.querySelectorAll('ds-button-filled, ds-button-unfilled')) {
  button.addEventListener('dsClick', () => {
    window.__buttonClicks += 1;
  });
  button.addEventListener('dsChange', event => {
    window.__buttonChanges.push({ id: button.id, detail: event.detail });
  });
}

window.__formSubmits = 0;
window.__formResets = 0;
const form = document.querySelector('#button-form');
form.addEventListener('submit', event => {
  event.preventDefault();
  window.__formSubmits += 1;
});
form.addEventListener('reset', () => {
  window.__formResets += 1;
});

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
