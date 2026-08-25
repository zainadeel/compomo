import '/dist/components/ds-menu.js';
import '/dist/components/ds-modal.js';
import '/dist/components/ds-button-filled.js';
import '/dist/components/ds-button-unfilled.js';
import '/dist/components/ds-swatch-picker.js';
import '/dist/components/ds-switch.js';
import '/dist/components/ds-icon.js';

await Promise.all([
  customElements.whenDefined('ds-menu'),
  customElements.whenDefined('ds-modal'),
  customElements.whenDefined('ds-button-filled'),
  customElements.whenDefined('ds-button-unfilled'),
  customElements.whenDefined('ds-swatch-picker'),
  customElements.whenDefined('ds-switch'),
  customElements.whenDefined('ds-icon'),
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

const filterAnchor = document.getElementById('filter-anchor');
const filterMenu = document.getElementById('filter-menu');
filterMenu.selectionMode = 'single';
filterMenu.items = [
  { label: 'All chats', value: 'all', isSelected: true },
  { label: 'Unread', value: 'unread', isSelected: false },
];
filterAnchor.addEventListener('click', () => {
  filterMenu.open = true;
  filterAnchor.setAttribute('aria-expanded', 'true');
});
filterMenu.addEventListener('dsClose', () => filterAnchor.setAttribute('aria-expanded', 'false'));

const switchAnchor = document.getElementById('switch-anchor');
const switchMenu = document.getElementById('switch-menu');
switchMenu.items = [
  { label: 'Vehicle ID / Make · Model · Year', value: 'vehicle', showSwitch: true, switchValue: true },
];
switchAnchor.addEventListener('click', () => {
  switchMenu.open = true;
  switchAnchor.setAttribute('aria-expanded', 'true');
});
switchMenu.addEventListener('dsClose', () => switchAnchor.setAttribute('aria-expanded', 'false'));

const prefixAnchor = document.getElementById('prefix-anchor');
const prefixMenu = document.getElementById('prefix-menu');
prefixMenu.items = [
  { label: 'Edit', value: 'edit', icon: 'Pencil' },
  { label: 'Copy', value: 'copy', icon: 'Copy' },
  { label: 'Share', value: 'share' },
];
prefixAnchor.addEventListener('click', () => {
  prefixMenu.open = true;
  prefixAnchor.setAttribute('aria-expanded', 'true');
});
prefixMenu.addEventListener('dsClose', () => prefixAnchor.setAttribute('aria-expanded', 'false'));

const reorderAnchor = document.getElementById('reorder-anchor');
const reorderMenu = document.getElementById('reorder-menu');
reorderMenu.items = [
  { label: 'Driver', value: 'driver', showSwitch: true, switchValue: true, reorderable: true },
  { label: 'Status', value: 'status', showSwitch: true, switchValue: true, reorderable: true },
  { label: 'Vehicle', value: 'vehicle', showSwitch: true, switchValue: true, reorderable: true },
  { label: 'Action', value: 'action', showSwitch: true, switchValue: true, isInactive: true },
];
reorderAnchor.addEventListener('click', () => {
  reorderMenu.open = true;
  reorderAnchor.setAttribute('aria-expanded', 'true');
});
reorderMenu.addEventListener('dsClose', () => reorderAnchor.setAttribute('aria-expanded', 'false'));
reorderMenu.addEventListener('dsReorder', event => {
  reorderMenu.items = event.detail.items;
});
reorderMenu.addEventListener('dsSelect', event => {
  const value = event.detail.value;
  reorderMenu.items = reorderMenu.items.map(item =>
    item.value === value && !item.isInactive
      ? { ...item, switchValue: !item.switchValue }
      : item,
  );
});

const richAnchor = document.getElementById('rich-anchor');
const richMenu = document.getElementById('rich-menu');
richMenu.sections = [
  {
    header: 'Theme',
    variant: 'swatch-picker',
    value: 'neutral',
    groupLabel: 'Shell gradient theme',
    options: [
      { value: 'none', label: 'None', preview: { kind: 'color', color: 'var(--color-background-secondary)' } },
      { value: 'neutral', label: 'Neutral', preview: { kind: 'color', color: 'var(--color-brand-primary)' } },
    ],
  },
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

const collisionAnchor = document.getElementById('collision-anchor');
const collisionMenu = document.getElementById('collision-menu');
collisionMenu.items = [
  { label: 'View details', value: 'details' },
  { label: 'Duplicate', value: 'duplicate' },
  { label: 'Archive', value: 'archive' },
];
collisionAnchor.addEventListener('click', () => {
  collisionMenu.open = true;
  collisionAnchor.setAttribute('aria-expanded', 'true');
});
collisionMenu.addEventListener('dsClose', () => collisionAnchor.setAttribute('aria-expanded', 'false'));

const scrollAnchor = document.getElementById('scroll-anchor');
const scrollMenu = document.getElementById('scroll-menu');
scrollMenu.items = Array.from({ length: 30 }, (_, index) => ({
  label: `Action ${index + 1}`,
  value: `action-${index + 1}`,
}));
scrollAnchor.addEventListener('click', () => {
  scrollMenu.open = true;
  scrollAnchor.setAttribute('aria-expanded', 'true');
});
scrollMenu.addEventListener('dsClose', () => scrollAnchor.setAttribute('aria-expanded', 'false'));

const modalTrigger = document.getElementById('modal-trigger');
const modal = document.getElementById('modal');
window.__modalCloseReasons = [];
window.__modalAfterClose = 0;
modal.addEventListener('dsClose', event => {
  window.__modalCloseReasons.push(event.detail.reason);
});
modal.addEventListener('dsAfterClose', () => {
  window.__modalAfterClose += 1;
});
modalTrigger.addEventListener('click', () => {
  modal.open = true;
});

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
