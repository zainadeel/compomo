import { readFileSync } from 'node:fs';
import test from 'node:test';
import { assertDeclarations, parseCss } from './helpers/css-contracts';

const css = parseCss(readFileSync(new URL('../src/wc/utils/radius.css', import.meta.url), 'utf8'));

test('radius recipe maps each role to one TokoMo token for hosts and public surfaces', () => {
  const roles = {
    '--ds-radius-control': 'var(--dimension-radius-025)',
    '--ds-radius-card': 'var(--dimension-radius-050)',
    '--ds-radius-modal': 'var(--dimension-radius-050)',
    '--ds-radius-menu': 'var(--dimension-radius-075)',
    '--ds-radius-tooltip-control': 'var(--dimension-radius-025)',
    '--ds-radius-tooltip-menu': 'var(--dimension-radius-075)',
    '--ds-radius-table': 'var(--dimension-radius-050)',
  };
  for (const selector of [
    ':host',
    ':where(.ds-table)',
    ':where(.tooltip-popup)',
    ':where(.ds-radius)',
  ])
    assertDeclarations(css, selector, roles);
});
