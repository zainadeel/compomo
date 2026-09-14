import '/dist/components/ds-button-inverted.js';

await customElements.whenDefined('ds-button-inverted');

window.__buttonClicks = 0;
window.__buttonMenuClicks = 0;
for (const button of document.querySelectorAll('ds-button-inverted')) {
  button.addEventListener('dsClick', () => {
    window.__buttonClicks += 1;
  });
  button.addEventListener('dsMenuClick', () => {
    window.__buttonMenuClicks += 1;
  });
}

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
