import '/dist/components/ds-select.js';

await customElements.whenDefined('ds-select');

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
