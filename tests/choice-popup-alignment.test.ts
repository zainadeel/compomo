import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  choicePopupMinWidth,
  resolveChoicePopupAlignOffset,
} from '../src/wc/utils/choice-popup-alignment';

describe('choice-popup alignment', () => {
  it('aligns start and end choice-cell edges through the section inset', () => {
    assert.equal(resolveChoicePopupAlignOffset({
      align: 'start',
      alignOffsetPx: 0,
      sectionInsetPx: 4,
    }), -4);
    assert.equal(resolveChoicePopupAlignOffset({
      align: 'end',
      alignOffsetPx: 0,
      sectionInsetPx: 4,
    }), 4);
  });

  it('keeps center and explicit popup-frame alignment unchanged', () => {
    assert.equal(resolveChoicePopupAlignOffset({
      align: 'center',
      alignOffsetPx: 3,
      sectionInsetPx: 4,
    }), 3);
    assert.equal(resolveChoicePopupAlignOffset({
      align: 'start',
      alignOffsetPx: 3,
      sectionInsetPx: 4,
      anchorAlignment: 'popup-frame',
    }), 3);
  });

  it('keeps an authored offset additive to the shared alignment', () => {
    assert.equal(resolveChoicePopupAlignOffset({
      align: 'start',
      alignOffsetPx: 2,
      sectionInsetPx: 4,
    }), -2);
    assert.equal(resolveChoicePopupAlignOffset({
      align: 'end',
      alignOffsetPx: -2,
      sectionInsetPx: 4,
    }), 2);
  });

  it('includes both section insets in the minimum popup width', () => {
    assert.equal(choicePopupMinWidth(189.25, 4), 197.25);
  });
});
