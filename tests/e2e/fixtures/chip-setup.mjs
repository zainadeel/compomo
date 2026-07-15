import '/dist/components/ds-chip.js';

await customElements.whenDefined('ds-chip');

const chip = document.getElementById('chip');
const inactiveChip = document.getElementById('inactive-chip');
const longChip = document.getElementById('long-chip');

window.__chipRemovals = [];

for (const element of [chip, inactiveChip]) {
  element.addEventListener('dsRemove', event => {
    window.__chipRemovals.push({
      id: element.id,
      hasNoDetail: event.detail == null,
    });
  });
}

longChip.maxWidth = 120;

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
