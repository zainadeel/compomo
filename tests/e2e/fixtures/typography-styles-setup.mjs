import '/dist/components/ds-text.js';
import {
  TYPOGRAPHY_STYLE_ROWS,
  formatTypographySpec,
} from '../../../src/wc/stories/Foundation/typography-styles.ts';

await customElements.whenDefined('ds-text');

const root = document.getElementById('typography-styles');
for (const row of TYPOGRAPHY_STYLE_ROWS) {
  const item = document.createElement('div');
  item.dataset.typographyRow = '';
  item.dataset.variant = row.variant;
  item.dataset.emphasis = String(row.emphasis);

  const spec = document.createElement('span');
  spec.dataset.spec = '';
  spec.textContent = formatTypographySpec(row);

  const text = document.createElement('ds-text');
  text.as = 'span';
  text.variant = row.variant;
  text.emphasis = row.emphasis;
  text.color = 'primary';
  text.textContent = row.sample;

  item.append(spec, text);
  root.append(item);
}

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';
