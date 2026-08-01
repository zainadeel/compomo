import '/dist/components/ds-banner.js';
import '/dist/components/ds-button-unfilled.js';
import '/dist/components/ds-shell-app.js';
import '/dist/components/ds-text.js';
import '/dist/components/ds-tooltip.js';

await Promise.all([
  customElements.whenDefined('ds-banner'),
  customElements.whenDefined('ds-button-unfilled'),
  customElements.whenDefined('ds-shell-app'),
]);

window.bannerEvents = { close: 0, afterClose: 0 };
const controlled = document.querySelector('#controlled');
controlled.addEventListener('dsClose', () => {
  window.bannerEvents.close += 1;
  controlled.open = false;
});
controlled.addEventListener('dsAfterClose', () => {
  window.bannerEvents.afterClose += 1;
});

const intents = ['neutral', 'brand', 'positive', 'warning', 'caution', 'negative'];
const contrasts = ['faint', 'medium', 'strong', 'bold'];
const matrix = document.querySelector('#matrix');
for (const intent of intents) {
  for (const contrast of contrasts) {
    const banner = document.createElement('ds-banner');
    banner.id = `matrix-${intent}-${contrast}`;
    banner.heading = intent;
    banner.description = `${contrast} contrast`;
    banner.intent = intent;
    banner.contrast = contrast;
    matrix.append(banner);
  }
}

document.querySelector('#shell-content').identityMarker = 'stable';
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
