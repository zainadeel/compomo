import '/dist/components/ds-select.js';
import '/dist/components/ds-filter-menu.js';

await Promise.all([
  customElements.whenDefined('ds-select'),
  customElements.whenDefined('ds-filter-menu'),
]);

const options = [
  { label: 'Apple', value: 'apple', icon: 'Chart' },
  { label: 'Banana', value: 'banana', icon: 'Bell', isInactive: true },
  { label: 'Cherry', value: 'cherry', icon: 'Bell', subtext: 'Dark red fruit' },
  { label: 'Date', value: 'date', icon: 'Chart' },
];
const sections = [
  { header: 'Common', divider: true, options: options.slice(0, 2) },
  { header: 'More', options: options.slice(2) },
];

for (const id of [
  'single',
  'searchable',
  'loading',
  'surface',
  'borderless-error',
  'required-single',
  'contained-single',
]) {
  document.getElementById(id).options = options;
}
for (const id of ['multi', 'multi-search', 'required-multi', 'contained-multi']) {
  document.getElementById(id).sections = sections;
}

document.getElementById('single').value = 'cherry';
document.getElementById('borderless-error').hasBorder = false;
document.getElementById('multi').value = ['apple', 'cherry'];

const filterMenu = document.getElementById('filters');
filterMenu.filters = [
  {
    id: 'severity',
    label: 'Severity',
    kind: 'multiple',
    options: [
      { label: 'Low', value: 'low' },
      { label: 'Critical', value: 'critical' },
    ],
  },
  {
    id: 'status',
    label: 'Status',
    kind: 'multiple',
    options: [
      { label: 'Pending review', value: 'pending' },
      { label: 'Coached', value: 'coached' },
    ],
  },
];
filterMenu.values = { severity: ['low'], status: [] };
filterMenu.activeFilterId = 'severity';
filterMenu.addEventListener('dsActiveFilterChange', event => {
  filterMenu.activeFilterId = event.detail;
});

window.__selectChanges = [];
window.__selectClears = [];
document.addEventListener('dsChange', event => {
  if (event.target.matches('ds-select')) {
    window.__selectChanges.push({ id: event.target.id, detail: event.detail });
  }
});
document.addEventListener('dsClear', event => {
  window.__selectClears.push(event.target.id);
});

window.__formEntries = null;
document.getElementById('selection-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  window.__formEntries = {
    fruit: data.get('fruit'),
    groups: data.getAll('group'),
  };
});

document.documentElement.dataset.ready = 'true';
