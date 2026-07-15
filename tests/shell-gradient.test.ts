import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildShellRadialGradient,
  shellGradientImage,
  shellGradientPositionBar,
  shellChromeSurfacePosition,
  shellGradientSize,
  readShellViewportDimensions,
} from '../src/wc/shell/shell-gradient';

describe('buildShellRadialGradient', () => {
  it('uses unified three-stop radial at top-left for neutral by default', () => {
    const g = buildShellRadialGradient();
    assert.match(g, /100% 100% at 0% 0%/);
    assert.match(g, /var\(--color-background-transparent\) 0%/);
    assert.match(g, /var\(--color-color-intent-grey-strong-background\) 100%/);
    assert.doesNotMatch(g, /50%/);
  });

  it('accepts explicit presets', () => {
    assert.match(buildShellRadialGradient('neutral'), /intent-grey-strong-background/);
    assert.match(buildShellRadialGradient('warm'), /intent-yellow-strong-background/);
  });
});

describe('shellGradientImage', () => {
  it('returns the built-in radial wash', () => {
    assert.equal(shellGradientImage(), buildShellRadialGradient());
  });
});

describe('shellGradientSize', () => {
  it('formats pixel size for viewport bounds', () => {
    assert.equal(shellGradientSize({ width: 1200.4, height: 800.6 }), '1200px 801px');
  });
});

describe('readShellViewportDimensions', () => {
  it('prefers visualViewport when present', () => {
    const win = {
      innerWidth: 1400,
      innerHeight: 900,
      visualViewport: { width: 390.4, height: 844.6 },
    } as Window;
    assert.deepEqual(readShellViewportDimensions(win), { width: 390, height: 845 });
  });

  it('falls back to innerWidth/innerHeight', () => {
    const win = { innerWidth: 1280.2, innerHeight: 720.8, visualViewport: null } as Window;
    assert.deepEqual(readShellViewportDimensions(win), { width: 1280, height: 721 });
  });
});

describe('shellGradientPositionBar', () => {
  it('offsets by panel width for L alignment', () => {
    assert.equal(shellGradientPositionBar(200), '-200px 0');
  });
});

describe('shellChromeSurfacePosition', () => {
  it('offsets by rect origin for shell-row alignment', () => {
    assert.equal(shellChromeSurfacePosition(200, 0), '-200px 0px');
    assert.equal(shellChromeSurfacePosition(1200.4, 48.6), '-1200px -49px');
  });
});
