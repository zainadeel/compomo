import '/dist/components/ds-input.js';
import '/dist/components/ds-checkbox.js';
import '/dist/components/ds-select.js';
import '/dist/components/ds-radio-group.js';
import '/dist/components/ds-switch.js';
import '/dist/components/ds-pagination.js';

await Promise.all([
  'ds-input', 'ds-checkbox', 'ds-select', 'ds-radio-group', 'ds-switch', 'ds-pagination',
].map(tag => customElements.whenDefined(tag)));

document.getElementById('region').name = 'region';
document.getElementById('region').options = [
  { label: 'Canada', value: 'ca' },
  { label: 'United States', value: 'us' },
];
document.getElementById('tier').options = [
  { label: 'Standard', value: 'standard' },
  { label: 'Premium', value: 'premium' },
];
const pagination = document.getElementById('pagination');
pagination.paginationLabel = 'Paginación';
pagination.previousPageLabel = 'Página anterior';
pagination.nextPageLabel = 'Página siguiente';

document.getElementById('profile').addEventListener('submit', event => {
  event.preventDefault();
  window.__submitted = Object.fromEntries(new FormData(event.currentTarget));
});
document.documentElement.dataset.ready = 'true';
