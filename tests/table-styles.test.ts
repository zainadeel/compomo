import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync('src/wc/styles/table.css', 'utf8');
const componentCss = fs.readFileSync('src/wc/components/Table/Table.css', 'utf8');
const componentTsx = fs.readFileSync('src/wc/components/Table/Table.tsx', 'utf8');
const layoutController = fs.readFileSync(
  'src/wc/components/Table/table-layout-controller.ts',
  'utf8',
);
const viewportFitController = fs.readFileSync(
  'src/wc/components/Table/table-viewport-fit-controller.ts',
  'utf8',
);
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

test('publishes one renderer-neutral table recipe consumed by the component', () => {
  assert.equal(packageJson.exports['./table.css'], './dist/styles/table.css');
  assert.match(componentCss, /@import '\.\.\/\.\.\/styles\/table\.css'/);
  assert.match(componentCss, /@import '\.\.\/\.\.\/styles\/control-elevation\.css'/);
  assert.match(componentCss, /@import '\.\.\/\.\.\/utils\/text-decoration\.css'/);
  assert.match(componentTsx, /focus-ring\.css/);
  assert.match(componentTsx, /interaction-fill\.css/);
  assert.match(componentTsx, /TableLayoutController/);
  assert.doesNotMatch(componentTsx, /TableStickyGroupController/);
  assert.match(componentTsx, /TableViewportFitController/);
  assert.match(componentTsx, /TableLoadController/);
  assert.match(componentTsx, /TableGroupLoadController/);
  assert.match(componentTsx, /createTableRenderModel/);
  assert.match(componentTsx, /resolveTableCellPresentation/);
  assert.match(layoutController, /--ds-table-visible-inline-size/);
  assert.doesNotMatch(layoutController, /elements\.table|observe\(table\)/);
  assert.match(componentTsx, /ds-table__table--native-group-sticky/);
  assert.match(viewportFitController, /--_table-viewport-fit-reserved-block-size/);
  assert.doesNotMatch(componentTsx, /scroll-edge-fade\.css|ds-table__overflow-shadow/);
  assert.match(componentTsx, /ds-table__selection-control ds-focus-ring/);
  assert.match(componentTsx, /ds-table__header-label--interactive ds-focus-ring/);
  assert.match(componentTsx, /'ds-focus-ring': !!row\.interactive && !row\.disabled/);
  assert.match(componentTsx, /'ds-focus-ring': this\.scrollable/);
  assert.match(componentTsx, /<slot\s+name="header"/);
  assert.doesNotMatch(componentTsx, /<slot\s+name="header-leading"/);
  assert.doesNotMatch(componentTsx, /<slot\s+name="header-trailing"/);
  assert.match(componentTsx, /<slot name="footer"/);
  assert.match(componentTsx, /<slot name="footer-leading"/);
  assert.match(componentTsx, /<slot name="footer-trailing"/);
  assert.match(componentTsx, /variant === 'text-with-tag' \? 'sm' : 'md'/);
  assert.match(componentTsx, /variant === 'text-with-tag' \? 'single' : 'double'/);
  assert.match(componentTsx, /'ds-table--caption-visible'/);
  assert.match(css, /\.ds-table__caption-content/);
  assert.match(css, /\.ds-table__bar-copy > slot/);
  assert.match(css, /\.ds-table__bar-status/);
  assert.match(css, /\.ds-table__footer-summary/);
  assert.match(css, /ds-table--document-sticky-header\.ds-table--caption-visible/);
  assert.match(css, /\.ds-table__sticky-group/);
  assert.match(css, /\.ds-table__table--native-group-sticky/);
  assert.match(css, /grid-template-columns: var\(--_table-grid-template-columns\)/);
  assert.match(css, /\.ds-table__group-row--native-sticky/);
  assert.doesNotMatch(css, /ds-table__group-cell--sticky-backstop/);
  assert.match(css, /\.ds-table--contained-scroll \.ds-table__frame\)[\s\S]*?overflow: clip/);

  for (const selector of [
    'ds-table__header-cell',
    'ds-table__caption-bar',
    'ds-table__cell',
    'ds-table__cell-link',
    'ds-table__cell-tertiary',
    'ds-table__cell-track--runs',
    'ds-table__group-content',
    'ds-table__collapse-all-overlay',
    'ds-table__sticky-edge',
    'ds-table__skeleton-row',
    'ds-table__load-cell',
    'ds-table__footer',
  ]) {
    assert.match(css, new RegExp(`\\.${selector}`));
  }

  assert.match(css, /--_table-cell-track-min-block-size: var\(--dimension-size-300\)/);
  assert.match(css, /\.ds-table__cell-image[\s\S]*?aspect-ratio: 16 \/ 9/);
  assert.match(css, /--_table-image-block-size: var\(--_table-cell-track-min-block-size\)/);
  assert.match(css, /\.ds-table__cell--image-multi \.ds-table__cell-image\)[\s\S]*?--_table-image-block-size-multi/);
  assert.match(css, /\.ds-table__cell--image-triple \.ds-table__cell-image\)[\s\S]*?--_table-image-block-size-triple/);
  assert.match(css, /\.ds-table__cell-track--text[\s\S]*?padding-inline: var\(--_table-cell-track-padding-inline\)/);
  assert.match(css, /\.ds-table__cell-primary[\s\S]*?padding-block: var\(--dimension-space-025\)/);
  assert.match(
    css,
    /\.ds-table__cell--text-multi \.ds-table__cell-copy\)[\s\S]*?gap: var\(--dimension-space-025\)/,
  );
  assert.match(
    componentCss,
    /ds-text\.ds-table__cell-track--text[\s\S]*?padding-inline: var\(--_table-cell-track-padding-inline\)/,
  );
  assert.match(
    css,
    /\.ds-table__cell\.ds-table__selection-cell\)[\s\S]*?--_table-cell-padding-block/,
  );
});

test('keeps public table selectors and custom properties override-friendly', () => {
  const selectorsOnly = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const withoutWhereClasses = selectorsOnly.replaceAll(/:where\(\.ds-table[^)]*\)/g, '');
  assert.equal(withoutWhereClasses.includes('.ds-table'), false);
  assert.equal(css.includes('!important'), false);
  assert.doesNotMatch(
    css,
    /^\s+--ds-table-[a-z-]+\s*:/m,
    'public host overrides must remain inputs, not be reassigned by the recipe root',
  );

  for (const property of [
    '--ds-table-surface',
    '--ds-table-header-surface',
    '--ds-table-group-surface',
    '--ds-table-row-selected',
    '--ds-table-border',
    '--ds-table-column-border',
    '--ds-table-sticky-border',
    '--ds-table-sticky-start-shadow',
    '--ds-table-sticky-end-shadow',
    '--ds-table-header-min-block-size',
    '--ds-table-row-min-block-size',
    '--ds-table-cell-padding-block',
    '--ds-table-cell-padding-inline',
  ]) {
    assert.match(css, new RegExp(property));
  }

  assert.match(
    css,
    /--_table-sticky-border: var\(--ds-table-sticky-border, var\(--color-border-tertiary\)\)/,
  );
});

test('retains the structural and accessibility fallbacks rendered tests depend on', () => {
  assert.match(css, /overflow: auto/);
  assert.match(css, /position: sticky/);
  assert.match(css, /forced-colors: active/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /\.ds-table__header-label--interactive:focus-visible/);
  assert.match(css, /\.ds-table__selection-control:focus-visible/);
  assert.match(css, /\.ds-visually-hidden/);
  assert.doesNotMatch(css, /container-type: inline-size/);
  assert.doesNotMatch(css, /--effect-shadow-elevated-panel-(?:left|right)/);
  assert.doesNotMatch(css, /ds-table__collapse-column|ds-table__collapse-cell/);
  assert.match(
    css,
    /\.ds-table__load-body \.ds-table__load-row:last-child \.ds-table__load-cell/,
  );
  assert.doesNotMatch(css, /:where\(\.ds-table__load-row:last-child \.ds-table__load-cell\)/);
  assert.match(
    css,
    /\.ds-table__group:last-child > \.ds-table__group-row:last-child[\s\S]*?\.ds-table__group-content/,
  );
  assert.match(
    css,
    /\.ds-table__group:last-child > \.ds-table__group-load-row:last-child[\s\S]*?\.ds-table__load-cell/,
  );
});
