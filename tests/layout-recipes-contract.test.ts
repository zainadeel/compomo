import { readFileSync } from 'node:fs';
import test from 'node:test';
import { assertDeclarations, parseCss } from './helpers/css-contracts';

const styles = (path: string) =>
  parseCss(readFileSync(new URL(`../src/wc/utils/${path}.css`, import.meta.url), 'utf8'));

// Consumer geometry and behavior are covered by forms and setting-row rendered specs.
test('field flow shares one gap and insets supporting copy to the control text origin', () => {
  const css = styles('field-stack');
  assertDeclarations(css, '.ds-field-stack', {
    display: 'flex',
    'flex-direction': 'column',
    gap: 'var(--dimension-space-050)',
  });
  for (const part of ['.error-text', '.field__description', '.field__error'])
    assertDeclarations(css, `.ds-field-stack.ds-field-stack--supporting-inset ${part}`, {
      'padding-inline':
        'calc(var(--ds-control-padding-inline, var(--dimension-space-075)) + var(--ds-control-label-inset, var(--dimension-space-025)))',
    });
});

test('settings rows own the content inset and reset nested control padding', () => {
  assertDeclarations(styles('settings-row'), ':host', {
    'padding-block': 'var(--dimension-space-100)',
    'padding-inline': 'var(--dimension-space-200)',
    '--ds-settings-row-control-padding-inline': '0px',
  });
});
