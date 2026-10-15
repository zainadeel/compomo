import '/dist/components/ds-disclosure.js';

await customElements.whenDefined('ds-disclosure');

window.disclosureToggles = [];
window.ownerClicks = 0;
document
  .getElementById('snapshot')
  .addEventListener('dsToggle', event => window.disclosureToggles.push(event.detail));
document.getElementById('owner').addEventListener('dsClick', () => window.ownerClicks++);

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
