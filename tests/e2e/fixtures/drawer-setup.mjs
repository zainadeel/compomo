import '/dist/components/ds-drawer.js';
import '/dist/components/ds-button-filled.js';

await customElements.whenDefined('ds-drawer');

const details = document.getElementById('details');
const settings = document.getElementById('settings');
const rows = [...document.querySelectorAll('.row')];
const log = (window.drawerEvents = []);
let selected = -1;

const select = index => {
  selected = index;
  rows.forEach((row, rowIndex) => row.toggleAttribute('aria-current', rowIndex === index));
  document.getElementById('details-text').textContent = `Details for ${rows[index].textContent}`;
  details.previousAvailable = index > 0;
  details.nextAvailable = index < rows.length - 1;
};

rows.forEach((row, index) =>
  row.addEventListener('click', () => {
    select(index);
    details.open = true;
  })
);

for (const name of ['dsClose', 'dsAfterClose', 'dsPrevious', 'dsNext']) {
  details.addEventListener(name, event =>
    log.push({ drawer: 'details', name, detail: event.detail })
  );
  settings.addEventListener(name, event =>
    log.push({ drawer: 'settings', name, detail: event.detail })
  );
}

details.addEventListener('dsPrevious', () => select(selected - 1));
details.addEventListener('dsNext', () => select(selected + 1));
details.addEventListener('dsClose', () => (details.open = false));
// The owner knows which row matches the record that was showing when the drawer closed.
details.addEventListener('dsAfterClose', event => {
  if (event.detail.restoreFocus) rows[selected]?.focus();
});

document.getElementById('modal-trigger').addEventListener('click', () => (settings.open = true));
settings.addEventListener('dsClose', () => (settings.open = false));

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
