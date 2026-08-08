import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync('src/wc/styles/table.css', 'utf8');
const componentCss = fs.readFileSync('src/wc/components/Table/Table.css', 'utf8');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

test('publishes one renderer-neutral table recipe consumed by the component', () => {
  assert.equal(packageJson.exports['./table.css'], './dist/styles/table.css');
  assert.match(componentCss, /@import '\.\.\/\.\.\/styles\/table\.css'/);
  assert.match(css, /\.ds-table__header-cell/);
  assert.match(css, /\.ds-table__group-cell/);
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
  assert.match(css, /var\(--ds-table-header-surface, var\(--color-background-secondary\)\)/);
});

test('exposes token-backed visual layers and responsive overflow behavior', () => {
  for (const property of [
    '--ds-table-surface',
    '--ds-table-header-surface',
    '--ds-table-group-surface',
    '--ds-table-row-selected',
    '--ds-table-border',
    '--ds-table-header-min-block-size',
    '--ds-table-row-min-block-size',
    '--ds-table-cell-padding-inline',
  ]) {
    assert.match(css, new RegExp(property));
  }
  assert.match(css, /overflow: auto/);
  assert.match(css, /position: sticky/);
  assert.match(css, /forced-colors: active/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
