import '/dist/components/ds-tag.js';
import '/dist/components/ds-icon.js';

await Promise.all([
  customElements.whenDefined('ds-tag'),
  customElements.whenDefined('ds-icon'),
]);
window.tagClicks = [];
for (const id of ['interactive-tag', 'inactive-tag']) {
  document.querySelector(`#${id}`).addEventListener('dsClick', () => {
    window.tagClicks.push(id);
  });
}
const matrix = document.querySelector('#matrix');
for (const intent of ['neutral', 'brand', 'ai', 'negative', 'warning', 'caution', 'positive']) {
  for (const contrast of ['strong', 'bold', 'medium', 'faint']) {
    const tag = document.createElement('ds-tag');
    tag.label = `${intent} ${contrast}`;
    tag.intent = intent;
    tag.contrast = contrast;
    matrix.append(tag);
  }
}
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
