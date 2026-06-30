import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildShellRadialGradient,
  shellGradientImageForStyle,
  shellGradientPositionBar,
  shellGradientSize,
  SHELL_GRADIENT_OPACITY,
} from '../src/wc/nav/shell-gradient';

describe('buildShellRadialGradient', () => {
  it('uses unified three-stop radial at top-left', () => {
    const g = buildShellRadialGradient();
    assert.match(g, /100% 100% at 0% 0%/);
    assert.match(g, /var\(--color-background-transparent\) 0%/);
    assert.match(g, /var\(--color-color-intent-blue-strong-background\) 100%/);
    assert.doesNotMatch(g, /50%/);
  });
});

describe('shellGradientImageForStyle', () => {
  it('returns the same built-in radial for all nav styles', () => {
    assert.equal(shellGradientImageForStyle('navigation'), buildShellRadialGradient());
    assert.equal(shellGradientImageForStyle('default'), buildShellRadialGradient());
  });
});

describe('SHELL_GRADIENT_OPACITY', () => {
  it('is 10% layer opacity', () => {
    assert.equal(SHELL_GRADIENT_OPACITY, '0.1');
  });
});

describe('shellGradientSize', () => {
  it('formats pixel size for L bounds', () => {
    assert.equal(shellGradientSize({ width: 1200.4, height: 800.6, panelWidth: 200 }), '1200px 801px');
  });
});

describe('shellGradientPositionBar', () => {
  it('offsets by panel width for L alignment', () => {
    assert.equal(shellGradientPositionBar(200), '-200px 0');
  });
});
