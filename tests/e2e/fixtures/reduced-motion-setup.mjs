import '/dist/components/ds-loader.js';
import '/dist/components/ds-switch.js';
import '/dist/components/ds-button-filled.js';
import '/dist/components/ds-menu.js';
import '/dist/components/ds-modal.js';
import '/dist/components/ds-toast.js';
import { createToastManager } from '/dist/lib/toast/index.js';

await Promise.all([
  customElements.whenDefined('ds-loader'),
  customElements.whenDefined('ds-switch'),
  customElements.whenDefined('ds-button-filled'),
  customElements.whenDefined('ds-menu'),
  customElements.whenDefined('ds-modal'),
  customElements.whenDefined('ds-toast'),
]);

document.getElementById('menu').items = [{ id: 'one', label: 'One' }];
const toastManager = createToastManager();
document.getElementById('toast').manager = toastManager;
window.__reducedMotionToastManager = toastManager;
window.__toastRemoved = 0;
document.getElementById('toast').addEventListener('dsToastRemove', () => {
  window.__toastRemoved += 1;
});
toastManager.add({ id: 'reduced-motion-toast', title: 'Saved', timeout: 0 });

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
