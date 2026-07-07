import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SHELL_GRADIENT_PRESETS,
  SHELL_GRADIENT_PRESET_LABELS,
  buildShellRadialGradientForPreset,
  DEFAULT_SHELL_GRADIENT_PRESET,
  isShellGradientPreset,
  shellGradientPresetStopToken,
} from '../src/wc/nav/shell-gradient-presets';

describe('SHELL_GRADIENT_PRESETS', () => {
  it('lists none, cool, neutral, and warm', () => {
    assert.deepEqual(SHELL_GRADIENT_PRESETS, ['none', 'cool', 'neutral', 'warm']);
  });

  it('defaults to neutral', () => {
    assert.equal(DEFAULT_SHELL_GRADIENT_PRESET, 'neutral');
  });
});

describe('buildShellRadialGradientForPreset', () => {
  it('returns none for the none preset', () => {
    assert.equal(buildShellRadialGradientForPreset('none'), 'none');
  });

  it('uses intent stop tokens per preset', () => {
    assert.match(
      buildShellRadialGradientForPreset('cool'),
      /var\(--color-color-intent-blue-strong-background\) 100%/,
    );
    assert.match(
      buildShellRadialGradientForPreset('neutral'),
      /var\(--color-color-intent-grey-strong-background\) 100%/,
    );
    assert.match(
      buildShellRadialGradientForPreset('warm'),
      /var\(--color-color-intent-yellow-strong-background\) 100%/,
    );
  });

  it('shares top-left radial geometry for wash presets', () => {
    for (const preset of SHELL_GRADIENT_PRESETS.filter(p => p !== 'none')) {
      assert.match(buildShellRadialGradientForPreset(preset), /100% 100% at 0% 0%/);
    }
  });
});

describe('isShellGradientPreset', () => {
  it('validates preset ids', () => {
    assert.equal(isShellGradientPreset('none'), true);
    assert.equal(isShellGradientPreset('cool'), true);
    assert.equal(isShellGradientPreset('neutral'), true);
    assert.equal(isShellGradientPreset('warm'), true);
    assert.equal(isShellGradientPreset('blue'), false);
  });
});

describe('SHELL_GRADIENT_PRESET_LABELS', () => {
  it('maps ids to display labels', () => {
    assert.equal(SHELL_GRADIENT_PRESET_LABELS.none, 'None');
    assert.equal(SHELL_GRADIENT_PRESET_LABELS.cool, 'Cool');
    assert.equal(SHELL_GRADIENT_PRESET_LABELS.neutral, 'Neutral');
    assert.equal(SHELL_GRADIENT_PRESET_LABELS.warm, 'Warm');
    assert.equal(shellGradientPresetStopToken('none'), null);
    assert.equal(shellGradientPresetStopToken('cool'), 'var(--color-color-intent-blue-strong-background)');
  });
});
