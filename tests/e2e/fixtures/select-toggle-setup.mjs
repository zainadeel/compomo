import '/dist/components/ds-select-toggle.js';
import '/dist/components/ds-icon.js';
import '/dist/components/ds-text.js';

await customElements.whenDefined('ds-select-toggle');

const toggle = document.getElementById('toggle');
toggle.options = [
  { value: 'table', label: 'Table', icon: 'Table' },
  { value: 'chart', label: 'Chart', icon: 'Chart' },
  { value: 'list', label: 'List', icon: 'List' },
];
toggle.value = 'table';
toggle.variant = 'icon-label';

window.selectToggleChanges = [];
toggle.addEventListener('dsChange', event => window.selectToggleChanges.push(event.detail));

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
