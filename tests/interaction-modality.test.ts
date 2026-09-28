import { readFileSync } from 'node:fs';
import test from 'node:test';
import { assertDeclarations, parseCss } from './helpers/css-contracts';

const styles = (name: string) => parseCss(readFileSync(`src/wc/utils/${name}.css`, 'utf8'));

test('shared focus targets suppress touch chrome and retain keyboard focus', () => {
  const css = styles('focus-ring');
  for (const selector of [':host(.ds-focus-ring)', '.ds-focus-ring', '.ds-focus-ring-inset'])
    assertDeclarations(css, selector, {
      outline: 'none',
      '-webkit-tap-highlight-color': 'transparent',
      'touch-action': 'manipulation',
    });
  for (const selector of [
    ':host(.ds-focus-ring:focus-visible)',
    ':host(.ds-focus-ring-inset:focus-visible)::after',
  ])
    assertDeclarations(css, selector, {
      outline: 'var(--ds-focus-ring-width) solid var(--ds-focus-ring-color)',
    });
});

test('shared interaction wash distinguishes fine-pointer hover from press', () => {
  const css = styles('interaction-fill');
  assertDeclarations(
    css,
    ':host(.ds-interaction-fill:hover:not(:disabled))::after',
    {
      background: 'var(--ds-interaction-hover)',
    },
    ['@media (hover: hover) and (pointer: fine)']
  );
  assertDeclarations(css, ':host(.ds-interaction-fill:active:not(:disabled))::after', {
    background: 'var(--ds-interaction-pressed)',
  });
});
