import '/dist/components/ds-card-setting.js';

await customElements.whenDefined('ds-card-setting');

window.__cardSettingActions = [];

const cards = Array.from(document.querySelectorAll('ds-card-setting'));
for (const card of cards) {
  card.addEventListener('dsAction', event => {
    window.__cardSettingActions.push({
      action: event.detail.action,
      hasOriginalEvent: event.detail.originalEvent instanceof MouseEvent,
    });

    if (event.detail.action === 'edit') {
      for (const candidate of cards) candidate.editing = candidate === card;
    } else {
      card.editing = false;
    }
  });
}

document.documentElement.dataset.ready = 'true';
