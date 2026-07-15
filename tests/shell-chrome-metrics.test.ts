import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  barGradientPositionFromPanelWidth,
  panelWidthPxFromTokens,
} from '../src/wc/shell/shell-chrome-metrics';

describe('panelWidthPxFromTokens', () => {
  it('returns expanded width when not collapsed', () => {
    const tokens = { expandedPx: 240, collapsedPx: 48 };
    assert.equal(panelWidthPxFromTokens(tokens, false), 240);
  });

  it('returns collapsed width when collapsed', () => {
    const tokens = { expandedPx: 240, collapsedPx: 48 };
    assert.equal(panelWidthPxFromTokens(tokens, true), 48);
  });
});

describe('barGradientPositionFromPanelWidth', () => {
  it('delegates to shellGradientPositionBar', () => {
    assert.equal(barGradientPositionFromPanelWidth(200), '-200px 0');
  });
});
