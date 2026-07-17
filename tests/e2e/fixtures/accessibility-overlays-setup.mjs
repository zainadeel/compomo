import '/dist/components/ds-menu.js';
import '/dist/components/ds-modal.js';
import '/dist/components/ds-shell-gradient-picker.js';

await Promise.all([
  customElements.whenDefined('ds-menu'),
  customElements.whenDefined('ds-modal'),
  customElements.whenDefined('ds-shell-gradient-picker'),
]);

const actionAnchor = document.getElementById('menu-anchor');
const actionMenu = document.getElementById('action-menu');
actionMenu.items = [
  { label: 'Edit', value: 'edit' },
  { label: 'Delete', value: 'delete' },
];
actionAnchor.addEventListener('click', () => {
  actionMenu.open = true;
  actionAnchor.setAttribute('aria-expanded', 'true');
});
actionMenu.addEventListener('dsClose', () => actionAnchor.setAttribute('aria-expanded', 'false'));

const richAnchor = document.getElementById('rich-anchor');
const richMenu = document.getElementById('rich-menu');
richMenu.sections = [
  { header: 'Theme', variant: 'gradient-picker', value: 'neutral' },
  { header: 'Appearance', items: [
    { label: 'System', value: 'system' },
    { label: 'Dark', value: 'dark', isSelected: true },
  ] },
];
richAnchor.addEventListener('click', () => {
  richMenu.open = true;
  richAnchor.setAttribute('aria-expanded', 'true');
});
richMenu.addEventListener('dsClose', () => richAnchor.setAttribute('aria-expanded', 'false'));

const modalTrigger = document.getElementById('modal-trigger');
const modal = document.getElementById('modal');
modalTrigger.addEventListener('click', () => {
  modal.open = true;
});

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
