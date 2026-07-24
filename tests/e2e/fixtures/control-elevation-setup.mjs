import '/dist/components/ds-button-filled.js';
import '/dist/components/ds-button-unfilled.js';
import '/dist/components/ds-input.js';

await Promise.all([
  'ds-button-filled',
  'ds-button-unfilled',
  'ds-input',
].map(tag => customElements.whenDefined(tag)));

document.getElementById('opaque-control').hasBorder = false;
document.getElementById('blur-control').hasBorder = false;
document.getElementById('input-rest').hasBorder = false;
document.getElementById('input-focus').hasBorder = false;
document.getElementById('input-error').hasBorder = false;
document.getElementById('input-error').error = true;

window.__opaqueClicks = 0;
document.getElementById('opaque-control').addEventListener('dsClick', () => {
  window.__opaqueClicks += 1;
});

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
