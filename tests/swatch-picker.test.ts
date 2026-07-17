import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  flattenSwatchPickerOptions,
  normalizeSwatchPickerOpacity,
  resolveSwatchPickerNavigationIndex,
  resolveSwatchPickerTabIndex,
  type SwatchPickerOption,
} from '../src/wc/components/SwatchPicker/swatch-picker-types';

const OPTIONS: SwatchPickerOption[] = [
  { value: 'flat', label: 'Flat', preview: { backgroundColor: 'red' } },
  { value: 'inactive', label: 'Inactive', preview: { backgroundColor: 'grey' }, isInactive: true },
  { value: 'gradient', label: 'Gradient', preview: { backgroundImage: 'linear-gradient(red, blue)' } },
];

describe('SwatchPicker option resolution', () => {
  it('uses sections when present and preserves their order', () => {
    assert.deepEqual(
      flattenSwatchPickerOptions(OPTIONS, [
        { options: [OPTIONS[2]] },
        { options: [OPTIONS[0]] },
      ]).map(option => option.value),
      ['gradient', 'flat'],
    );
  });

  it('puts the selected active option in the tab order', () => {
    assert.equal(resolveSwatchPickerTabIndex(OPTIONS, 'gradient'), 2);
  });

  it('falls back to the first active option for an absent or inactive value', () => {
    assert.equal(resolveSwatchPickerTabIndex(OPTIONS, 'missing'), 0);
    assert.equal(resolveSwatchPickerTabIndex(OPTIONS, 'inactive'), 0);
  });
});

describe('SwatchPicker keyboard navigation', () => {
  it('skips inactive options and wraps in both directions', () => {
    assert.equal(resolveSwatchPickerNavigationIndex(OPTIONS, 0, 'ArrowRight'), 2);
    assert.equal(resolveSwatchPickerNavigationIndex(OPTIONS, 2, 'ArrowRight'), 0);
    assert.equal(resolveSwatchPickerNavigationIndex(OPTIONS, 0, 'ArrowLeft'), 2);
  });

  it('supports Home and End', () => {
    assert.equal(resolveSwatchPickerNavigationIndex(OPTIONS, 2, 'Home'), 0);
    assert.equal(resolveSwatchPickerNavigationIndex(OPTIONS, 0, 'End'), 2);
  });

  it('returns null when every option is inactive', () => {
    assert.equal(resolveSwatchPickerNavigationIndex([
      { ...OPTIONS[1] },
    ], 0, 'ArrowRight'), null);
  });
});

describe('SwatchPicker preview opacity', () => {
  it('defaults invalid values and clamps finite values', () => {
    assert.equal(normalizeSwatchPickerOpacity(undefined), 1);
    assert.equal(normalizeSwatchPickerOpacity(Number.NaN), 1);
    assert.equal(normalizeSwatchPickerOpacity(-0.5), 0);
    assert.equal(normalizeSwatchPickerOpacity(0.4), 0.4);
    assert.equal(normalizeSwatchPickerOpacity(4), 1);
  });
});
