import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const docsCss = fs.readFileSync(path.join(root, '.storybook/docs.css'), 'utf8');

test('docs markdown table styles exclude ds-table light-DOM markup', () => {
  assert.match(docsCss, /\.sbdocs-content table:not\(\.ds-table__table\)/);
  assert.match(
    docsCss,
    /\.sbdocs-content table:not\(\.ds-table__table\) th,\s*\n\.sbdocs-content table:not\(\.ds-table__table\) td/,
  );
  assert.doesNotMatch(docsCss, /\.sbdocs-content th,\s*\n\.sbdocs-content td/);
  assert.doesNotMatch(docsCss, /^\.sbdocs-content table \{/m);
});

test('docs pages opt out of the canvas height:100% chain', () => {
  assert.match(docsCss, /html:has\(\.sbdocs\)/);
  assert.match(docsCss, /height:\s*auto/);
});
