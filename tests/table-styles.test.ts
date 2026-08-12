import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync('src/wc/styles/table.css', 'utf8');
const componentCss = fs.readFileSync('src/wc/components/Table/Table.css', 'utf8');
const componentTsx = fs.readFileSync('src/wc/components/Table/Table.tsx', 'utf8');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

test('publishes one renderer-neutral table recipe consumed by the component', () => {
  assert.equal(packageJson.exports['./table.css'], './dist/styles/table.css');
  assert.doesNotMatch(componentCss, /interaction-fill\.css/);
  assert.match(componentCss, /@import '\.\.\/\.\.\/styles\/table\.css'/);
  assert.match(componentTsx, /interaction-fill\.css/);
  assert.doesNotMatch(componentTsx, /scroll-edge-fade\.css/);
  assert.doesNotMatch(componentTsx, /ds-table__overflow-shadow/);
  assert.match(css, /--ds-table-sticky-start-shadow/);
  assert.match(css, /--ds-table-sticky-end-shadow/);
  assert.match(css, /--_table-sticky-start-shadow:[\s\S]*?inset var\(--dimension-space-050\) 0 var\(--dimension-space-050\)/);
  assert.match(css, /--_table-sticky-end-shadow:[\s\S]*?inset calc\(-1 \* var\(--dimension-space-050\)\) 0 var\(--dimension-space-050\)/);
  assert.doesNotMatch(css, /--effect-shadow-elevated-panel-(?:left|right)/);
  assert.match(css, /\.ds-table__frame--overflow-start \.ds-table__sticky-edge--start/);
  assert.match(css, /\.ds-table__frame--overflow-end \.ds-table__sticky-edge--end/);
  assert.match(css, /\.ds-table__sticky-edge--start/);
  assert.match(css, /\.ds-table__sticky-edge--end/);
  assert.doesNotMatch(css, /\.ds-table__overflow-shadow/);
  assert.match(css, /\.ds-table__header-cell/);
  assert.match(css, /\.ds-table__group-cell/);
  assert.doesNotMatch(css, /container-type: inline-size/);
  assert.match(componentTsx, /--ds-table-visible-inline-size/);
  assert.match(
    css,
    /\.ds-table__group-cell\)[^{]*\{[^}]*padding: 0[^}]*background: transparent/s,
  );
  assert.match(
    css,
    /\.ds-table__group-content\)[^{]*\{[^}]*position: sticky[^}]*inset-inline-start: 0[^}]*inline-size: var\(--ds-table-visible-inline-size, 100%\)[^}]*padding: var\(--dimension-space-100\)[^}]*background: var\(--_table-group-surface\)/s,
  );
  assert.match(
    css,
    /\.ds-table__table--selectable \.ds-table__group-content\)[^{]*\{[^}]*gap: 0[^}]*padding-inline-start: 0/s,
  );
  assert.match(
    css,
    /\.ds-table__group-selection\)[^{]*\{[^}]*flex: 0 0 var\(--_table-selection-column-inline-size\)[^}]*padding: var\(--dimension-space-050\)/s,
  );
  assert.match(
    css,
    /\.ds-table__table--selectable \.ds-table__group-copy\)[^{]*\{[^}]*padding-inline-start: calc\(\s*var\(--dimension-space-125\) \+ var\(--_table-cell-track-label-inset\)\s*\)/s,
  );
  assert.match(
    css,
    /\.ds-table__group-content\)[^{]*\{[^}]*gap: var\(--dimension-space-100\)/s,
  );
  assert.match(
    css,
    /\.ds-table__group-copy\)[^{]*\{[^}]*gap: var\(--dimension-space-100\)[^}]*padding-block: var\(--dimension-space-025\)[^}]*padding-inline: var\(--dimension-space-075\)/s,
  );
  assert.match(css, /\.ds-table__group-toggle\)[^{]*\{[^}]*margin-inline-start: auto/s);
  assert.doesNotMatch(
    css,
    /:where\(\.ds-table__group-content\),\s*\n:where\(\.ds-table__load-content\)/,
  );
  assert.match(
    css,
    /\.ds-table__load-content\)[^{]*\{[^}]*min-block-size: var\(--dimension-size-400\)/s,
  );
  assert.match(
    css,
    /\.ds-table__load-content--error\)[^{]*\{[^}]*gap: var\(--dimension-space-200\)/s,
  );
  assert.match(
    css,
    /\.ds-table__load-copy\)[^{]*\{[^}]*gap: var\(--dimension-space-100\)/s,
  );
  assert.match(
    css,
    /\.ds-table__group-cell--intent-negative\)[^{]*\{[^}]*--_table-group-surface: var\(--color-background-faint-negative\)/s,
  );
  assert.match(
    css,
    /\.ds-table__group-cell--intent-warning\)[^{]*\{[^}]*--_table-group-surface: var\(--color-background-faint-warning\)/s,
  );
  assert.match(
    css,
    /\.ds-table__group-cell--intent-caution\)[^{]*\{[^}]*--_table-group-surface: var\(--color-background-faint-caution\)/s,
  );
  assert.match(
    css,
    /\.ds-table__group-cell--intent-neutral\)[^{]*\{[^}]*--_table-group-surface: var\(--color-background-faint-neutral\)/s,
  );
  assert.doesNotMatch(css, /ds-table__collapse-column|ds-table__collapse-cell|--_table-collapse-column/);
  assert.match(
    css,
    /\.ds-table__selection-column\)[^{]*\{[^}]*width: var\(--_table-selection-column-inline-size\)[^}]*max-width: var\(--_table-selection-column-inline-size\)/s,
  );
  assert.match(
    css,
    /\.ds-table__action-column\)[^{]*\{[^}]*width: var\(--dimension-size-500\)/s,
  );
  assert.match(
    css,
    /\.ds-table__selection-cell\)[^{]*\{[^}]*width: var\(--_table-selection-column-inline-size\)[^}]*max-width: var\(--_table-selection-column-inline-size\)/s,
  );
  assert.match(
    css,
    /\.ds-table__sort-slot\)[^{]*\{[^}]*inline-size: var\(--dimension-size-200\)/s,
  );
  assert.match(
    css,
    /\.ds-table__collapse-slot\)[^{]*\{[^}]*inline-size: var\(--dimension-size-300\)[^}]*margin-inline-start: auto/s,
  );
  assert.match(
    css,
    /\.ds-table__sort-slot\)[^{]*\{[^}]*margin-inline-start: auto/s,
  );
  assert.match(css, /\.ds-table__caption/);
  assert.match(
    css,
    /\.ds-table__footer\)[^{]*\{[^}]*block-size: var\(--dimension-size-600\)/s,
  );
  assert.match(css, /\.ds-table__load-cell/);
});

test('keeps public table selectors override-friendly', () => {
  const selectorsOnly = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const withoutWhereClasses = selectorsOnly.replaceAll(/:where\(\.ds-table[^)]*\)/g, '');
  assert.equal(withoutWhereClasses.includes('.ds-table'), false);
  assert.equal(css.includes('!important'), false);
  assert.doesNotMatch(
    css,
    /^\s+--ds-table-[a-z-]+\s*:/m,
    'public host overrides must remain inputs, not be reassigned by the recipe root',
  );
  assert.match(css, /var\(--ds-table-header-surface, var\(--color-background-primary\)\)/);
  assert.match(css, /var\(--ds-table-border, var\(--color-border-secondary\)\)/);
  assert.match(css, /var\(--ds-table-column-border, var\(--color-border-tertiary\)\)/);
  assert.match(css, /var\(--ds-table-sticky-border, var\(--color-border-secondary\)\)/);
  assert.match(css, /var\(--ds-table-border-strong, var\(--color-border-secondary\)\)/);
  assert.match(css, /--_table-radius: var\(--ds-table-radius, var\(--dimension-radius-000\)\)/);
  assert.match(css, /user-select: none/);
  assert.match(css, /--_table-cell-track-min-block-size: calc\([\s\S]*?var\(--dimension-size-400\) - var\(--dimension-space-050\)/);
  assert.match(css, /--_table-cell-track-padding-inline: calc\([\s\S]*?var\(--dimension-space-075\) - var\(--dimension-space-025\)/);
  assert.match(css, /--ds-table-cell-padding-block,[\s\S]*?var\(--dimension-space-100\)/);
  assert.match(css, /--ds-table-cell-padding-inline,[\s\S]*?var\(--dimension-space-100\)/);
  assert.match(css, /--_table-selection-column-contribution: 0px/);
  assert.match(css, /--ds-table-row-min-block-size,[\s\S]*?var\(--dimension-size-500\)/);
  assert.doesNotMatch(css, /ds-table--sm|table-density/);
  assert.match(css, /\.ds-table__cell\)[^{]*\{[^}]*vertical-align: top/s);
  assert.match(css, /\.ds-table__cell-track--text\)[^{]*\{[^}]*padding-inline: var\(--_table-cell-track-label-inset\)/s);
  assert.match(css, /\.ds-table__cell--tag-tag-only\),[\s\S]*?\.ds-table__cell--tag-tag-with-text\)[^{]*\{[^}]*padding: var\(--dimension-space-100\)/s);
  assert.match(css, /\.ds-table__cell--tag-text-with-tag\)[^{]*\{[^}]*padding: var\(--dimension-space-125\)/s);
  assert.match(css, /\.ds-table__cell-tag-stack--tag-with-text/);
  assert.match(css, /\.ds-table__cell-tag-stack--text-with-tag/);
  assert.match(css, /\.ds-table__cell-tag-stack--tag-with-text \.ds-table__cell-tag-text\)[^{]*\{[^}]*padding-block: var\(--dimension-space-025\)[^}]*min-block-size: 0/s);
  assert.match(css, /\.ds-table__cell-tag-stack--tag-with-text\)[^{]*\{[^}]*gap: var\(--dimension-space-025\)/s);
  assert.match(css, /\.ds-table__cell-tag-stack--text-with-tag \.ds-table__cell-tag-text\)[^{]*\{[^}]*padding-inline: var\(--_table-cell-track-label-inset\)[^}]*min-block-size: 0/s);
  assert.match(css, /\.ds-table__cell-tag-stack--text-with-tag\)[^{]*\{[^}]*gap: var\(--dimension-space-050\)/s);
  assert.match(css, /\.ds-table__cell-tag-control-track\)[^{]*\{[^}]*min-block-size: var\(--_table-cell-track-min-block-size\)/s);
  assert.match(css, /\.ds-table__cell-tag-stack--text-with-tag \.ds-table__cell-tag-control-track\)[^{]*\{[^}]*min-block-size: var\(--dimension-size-250\)/s);
  assert.match(css, /\.ds-table__cell--icon\)[^{]*\{[^}]*padding: var\(--dimension-space-125\)/s);
  assert.match(css, /\.ds-table__cell--icon \.ds-table__cell-content\)[^{]*\{[^}]*justify-content: center[^}]*inline-size: 100%[^}]*min-block-size: var\(--dimension-iconography-md\)/s);
  assert.match(css, /--_table-image-block-size: calc\([\s\S]*?var\(--dimension-size-800\) - var\(--dimension-space-200\)/);
  assert.match(css, /\.ds-table__cell--image\)[^{]*\{[^}]*padding: var\(--dimension-space-100\)/s);
  assert.match(css, /\.ds-table__cell-image\)[^{]*\{[^}]*block-size: var\(--_table-image-block-size\)[^}]*aspect-ratio: 16 \/ 9[^}]*border: var\(--dimension-stroke-width-012\) solid var\(--color-border-tertiary\)[^}]*border-radius: var\(--dimension-radius-025\)/s);
  assert.match(css, /\.ds-table__cell-image-content\)[^{]*\{[^}]*object-fit: cover/s);
  assert.match(css, /\.ds-table__cell--primary-text \.ds-table__cell-secondary\)[^{]*\{[^}]*padding-block: 0/s);
  assert.match(css, /\.ds-table__cell--action\)[^{]*\{[^}]*padding: var\(--dimension-space-100\)/s);
  assert.match(css, /\.ds-table__cell--action \.ds-table__cell-content\)[^{]*\{[^}]*min-block-size: var\(--dimension-size-300\)/s);
  assert.match(css, /\.ds-table__cell\.ds-table__selection-cell\)[^{]*\{[^}]*padding: var\(--dimension-space-125\)/s);
  assert.match(css, /\.ds-table__cell\.ds-table__selection-cell \.ds-table__selection-control\)[^{]*\{[^}]*inline-size: var\(--dimension-iconography-md\)[^}]*block-size: var\(--dimension-iconography-md\)/s);
  assert.match(css, /\.ds-table__cell--text-single\),[\s\S]*?\.ds-table__cell--text-multi\),[\s\S]*?\.ds-table__cell--empty\),[\s\S]*?\.ds-table__cell--blank\)[^{]*\{[^}]*padding: var\(--dimension-space-125\)/s);
  assert.match(css, /\.ds-table__cell--text-single \.ds-table__cell-content\),[\s\S]*?\.ds-table__cell--text-multi \.ds-table__cell-content\),[\s\S]*?\.ds-table__cell--text-multi \.ds-table__cell-track\),[\s\S]*?\.ds-table__cell--empty \.ds-table__cell-track\)[^{]*\{[^}]*min-block-size: 0/s);
  assert.match(css, /\.ds-table__cell--text-multi \.ds-table__cell-copy\)[^{]*\{[^}]*gap: var\(--dimension-space-050\)/s);
  assert.match(css, /\.ds-table__cell--text-multi \.ds-table__cell-secondary\)[^{]*\{[^}]*padding-block: var\(--dimension-space-025\)/s);
  assert.match(css, /var\(--ds-table-row-selected, var\(--color-interaction-active-brand\)\)/);
  assert.doesNotMatch(css, /selection-indicator/);
  assert.match(css, /padding: var\(--dimension-space-100\)/);
  assert.match(css, /\.ds-table__header-content\)[^{]*\{[^}]*display: flex[^}]*gap: var\(--dimension-space-050\)/s);
  assert.match(css, /\.ds-table__header-label-box\)[^{]*\{[^}]*padding-inline: var\(--dimension-space-025\)/s);
  assert.match(css, /\.ds-table__header-label\)[^{]*\{[^}]*flex: 0 1 auto[^}]*inline-size: fit-content[^}]*padding-inline: var\(--dimension-space-025\)/s);
  assert.match(css, /\.ds-table__cell--align-end \.ds-table__header-labels\)[^{]*\{[^}]*margin-inline-start: auto/s);
  assert.match(css, /\.ds-table__cell--align-end \.ds-table__sort-slot/);
  assert.match(css, /\.ds-table__header-cell\)\s*::after[^{]*\{[^}]*inset-block-end: 0[^}]*z-index: 1[^}]*block-size: var\(--dimension-stroke-width-012\)[^}]*background: var\(--_table-border-strong\)/s);
  assert.match(css, /\.ds-table__header-cell \+ \.ds-table__header-cell\)\s*::before[^{]*\{[^}]*box-shadow: inset var\(--dimension-stroke-width-012\) 0 0 var\(--_table-column-border\)/s);
  assert.match(css, /\.ds-table__cell\)[^{]*\{[^}]*--ds-interaction-group-divider-width: var\(--dimension-stroke-width-012\)[^}]*--ds-interaction-group-divider-color: var\(--_table-border\)/s);
  assert.match(css, /\.ds-table__body:last-child \.ds-table__row:last-child \.ds-table__cell\)[^{]*\{[^}]*--ds-interaction-group-divider-width: 0px/s);
  assert.doesNotMatch(css, /background-image: linear-gradient\(var\(--_table-border\)/);
  assert.match(css, /\.ds-table__row--interactive:hover > \.ds-table__cell\.ds-interaction-fill\)/);
  assert.match(css, /\.ds-table__row--interactive:active > \.ds-table__cell\.ds-interaction-fill\)/);
  assert.match(css, /\.ds-table__cell--sticky-start/);
  assert.match(css, /\.ds-table__cell--sticky-end/);
  assert.match(css, /\.ds-table__document-sticky-header/);
  assert.match(css, /border: 0/);
  assert.match(css, /\.ds-table__header-label--interactive:focus-visible/);
  assert.match(css, /\.ds-table__header-label--interactive:hover\)[^{]*\{[^}]*color: var\(--color-foreground-primary\)/s);
  assert.match(css, /\.ds-table__header-label--interactive:active\)[^{]*\{[^}]*color: var\(--color-foreground-primary\)/s);
  assert.doesNotMatch(css, /\.ds-table__header-label--interactive:hover\)[^{]*\{[^}]*background/s);
});

test('exposes token-backed visual layers and responsive overflow behavior', () => {
  for (const property of [
    '--ds-table-surface',
    '--ds-table-header-surface',
    '--ds-table-group-surface',
    '--ds-table-row-selected',
    '--ds-table-border',
    '--ds-table-column-border',
    '--ds-table-sticky-border',
    '--ds-table-header-min-block-size',
    '--ds-table-row-min-block-size',
    '--ds-table-cell-padding-inline',
  ]) {
    assert.match(css, new RegExp(property));
  }
  assert.match(css, /overflow: auto/);
  assert.match(css, /overscroll-behavior-x: none/);
  assert.match(css, /overscroll-behavior-y: auto/);
  assert.match(css, /position: sticky/);
  assert.match(css, /forced-colors: active/);
});
