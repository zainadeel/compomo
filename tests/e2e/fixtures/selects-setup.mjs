import '/dist/components/ds-select.js';
import '/dist/components/ds-select-multi.js';

await Promise.all(['ds-select', 'ds-select-multi'].map(tag => customElements.whenDefined(tag)));

const options = [
  { label: 'Apple', value: 'apple', icon: 'Chart' },
  { label: 'Banana', value: 'banana', isInactive: true },
  { label: 'Cherry', value: 'cherry', subtext: 'Dark red fruit' },
  { label: 'Date', value: 'date' },
];
const sections = [
  { header: 'Common', divider: true, options: options.slice(0, 2) },
  { header: 'More', options: options.slice(2) },
];

for (const id of ['single', 'searchable', 'loading', 'surface', 'required-single']) {
  document.getElementById(id).options = options;
}
for (const id of ['multi', 'multi-search', 'required-multi']) {
  document.getElementById(id).sections = sections;
}

document.getElementById('single').value = 'cherry';
document.getElementById('multi').values = ['apple', 'cherry'];

window.__selectChanges = [];
window.__selectClears = [];
document.addEventListener('dsChange', event => {
  if (event.target.matches('ds-select, ds-select-multi')) {
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
