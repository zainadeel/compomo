import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../src/wc/utils/radius.css', import.meta.url), 'utf8');

const ROLES = [
  ['--ds-radius-control', '--dimension-radius-025'],
  ['--ds-radius-card', '--dimension-radius-050'],
  ['--ds-radius-modal', '--dimension-radius-050'],
  ['--ds-radius-menu', '--dimension-radius-075'],
  ['--ds-radius-tooltip-control', '--dimension-radius-025'],
  ['--ds-radius-tooltip-menu', '--dimension-radius-075'],
  ['--ds-radius-table', '--dimension-radius-050'],
] as const;

test('radius recipe maps each role to one TokoMo token', () => {
  for (const [role, token] of ROLES) {
    assert.match(css, new RegExp(`${role}: var\\(${token}\\)`));
  }
  assert.match(css, /:host/);
  assert.match(css, /:where\(\.ds-table\)/);
  assert.match(css, /:where\(\.tooltip-popup\)/);
  assert.match(css, /:where\(\.ds-radius\)/);
});

test('surfaces consume named radius roles instead of raw tokens', () => {
  const table = readFileSync(new URL('../src/wc/styles/table.css', import.meta.url), 'utf8');
  const choicePopup = readFileSync(
    new URL('../src/wc/utils/choice-popup.css', import.meta.url),
    'utf8'
  );
  const density = readFileSync(
    new URL('../src/wc/utils/control-density.css', import.meta.url),
    'utf8'
  );
  assert.match(
    table,
    /--_table-radius: var\(--ds-table-radius, var\(--ds-radius-table, var\(--dimension-radius-050\)\)\)/
  );
  assert.match(choicePopup, /border-radius: var\(--ds-radius-menu\)/);
  assert.match(density, /--ds-control-radius:\s*var\(--ds-radius-control\)/);
  const selectTrigger = readFileSync(
    new URL('../src/wc/utils/select-trigger.css', import.meta.url),
    'utf8'
  );
  const buttonBase = readFileSync(
    new URL('../src/wc/utils/button-base.css', import.meta.url),
    'utf8'
  );
  assert.match(
    selectTrigger,
    /\.trigger--rounded\s*\{\s*--ds-control-radius:\s*var\(--dimension-radius-half\)/
  );
  assert.match(
    buttonBase,
    /\.ds-button--rounded\s*\{\s*--ds-control-radius:\s*var\(--dimension-radius-half\)/
  );
});
