import '/dist/components/ds-bar-action.js';
import '/dist/components/ds-button-unfilled.js';

await customElements.whenDefined('ds-bar-action');
await customElements.whenDefined('ds-button-unfilled');

const bar = document.querySelector('#bar-action');

window.__barActionEvents = [];

bar.addEventListener('dsClear', () => {
  window.__barActionEvents.push({ type: 'clear' });
});

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
