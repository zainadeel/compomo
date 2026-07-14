import '/dist/components/ds-loader.js';
import '/dist/components/ds-switch.js';
import '/dist/components/ds-button-filled.js';
import '/dist/components/ds-menu.js';
import '/dist/components/ds-modal.js';
import '/dist/components/ds-banner.js';

await Promise.all([
  customElements.whenDefined('ds-loader'),
  customElements.whenDefined('ds-switch'),
  customElements.whenDefined('ds-button-filled'),
  customElements.whenDefined('ds-menu'),
  customElements.whenDefined('ds-modal'),
  customElements.whenDefined('ds-banner'),
]);

document.getElementById('menu').items = [{ id: 'one', label: 'One' }];
window.__bannerDismissed = 0;
document.getElementById('banner').addEventListener('dsDismiss', () => {
  window.__bannerDismissed += 1;
});

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
