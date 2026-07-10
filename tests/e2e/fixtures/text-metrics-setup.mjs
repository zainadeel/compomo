import '/dist/components/ds-text.js';
import '/dist/components/ds-button-filled.js';
import '/dist/components/ds-button-unfilled.js';
import '/dist/components/ds-tag.js';
import '/dist/components/ds-select.js';
import '/dist/components/ds-tooltip.js';

await Promise.all([
  customElements.whenDefined('ds-text'),
  customElements.whenDefined('ds-button-filled'),
  customElements.whenDefined('ds-button-unfilled'),
  customElements.whenDefined('ds-tag'),
  customElements.whenDefined('ds-select'),
  customElements.whenDefined('ds-tooltip'),
]);

const variants = [
  'text-display-medium',
  'text-display-small',
  'text-title-large',
  'text-title-medium',
  'text-title-small',
  'text-body-large',
  'text-body-medium',
  'text-body-small',
  'text-caption',
];

const metrics = document.getElementById('metrics');
for (const variant of variants) {
  for (const lines of [1, 2, 3]) {
    const text = document.createElement('ds-text');
    text.className = 'metric';
    text.as = 'span';
    text.variant = variant;
    text.dataset.metric = '';
    text.dataset.variant = variant;
    text.dataset.lines = String(lines);
    text.replaceChildren(
      ...Array.from({ length: lines }, (_, index) => {
        const fragment = document.createDocumentFragment();
        if (index > 0) fragment.append(document.createElement('br'));
        fragment.append(`Line ${index + 1}`);
        return fragment;
      }),
    );
    metrics.append(text);
  }
}

document.getElementById('select-xs').options = [
  { value: 'one', label: 'Option one' },
  { value: 'two', label: 'Option two' },
];
document.getElementById('button-borderless-md').hasBorder = false;

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
