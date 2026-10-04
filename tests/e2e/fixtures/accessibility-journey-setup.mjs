import '/dist/components/ds-text.js';
import '/dist/components/ds-input.js';
import '/dist/components/ds-select.js';
import '/dist/components/ds-modal.js';
import '/dist/components/ds-button-filled.js';
import '/dist/components/ds-button-unfilled.js';

const form = document.querySelector('#settings');
const modal = document.querySelector('#review-dialog');
const delivery = document.querySelector('#delivery');
delivery.options = [
  { value: 'daily', label: 'Daily summary' },
  { value: 'weekly', label: 'Weekly summary' },
];
form.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  document.querySelector('#summary').textContent = `${data.get('name')}: ${data.get('delivery')}`;
  modal.open = true;
});
document.querySelector('#cancel').addEventListener('click', () => { modal.open = false; });
document.querySelector('#save').addEventListener('click', () => {
  modal.open = false;
  document.querySelector('#status').textContent = 'Notification settings saved.';
});
await document.fonts.ready;
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
