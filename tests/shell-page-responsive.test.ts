import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  resolveShellPageCapacity,
  resolveShellPageHeaderVariant,
} from '../src/wc/components/ShellPage/shell-page-responsive';

const thresholds = {
  compactAt: 800,
  constrainedAt: 600,
  hysteresis: 8,
};

describe('resolveShellPageCapacity', () => {
  it('classifies the initial inline size at the component capacity boundaries', () => {
    assert.equal(
      resolveShellPageCapacity({ inlineSize: 801, previous: null, ...thresholds }),
      'roomy'
    );
    assert.equal(
      resolveShellPageCapacity({ inlineSize: 800, previous: null, ...thresholds }),
      'compact'
    );
    assert.equal(
      resolveShellPageCapacity({ inlineSize: 600, previous: null, ...thresholds }),
      'constrained'
    );
  });

  it('uses hysteresis when leaving compact and constrained capacity', () => {
    assert.equal(
      resolveShellPageCapacity({ inlineSize: 805, previous: 'compact', ...thresholds }),
      'compact'
    );
    assert.equal(
      resolveShellPageCapacity({ inlineSize: 809, previous: 'compact', ...thresholds }),
      'roomy'
    );
    assert.equal(
      resolveShellPageCapacity({ inlineSize: 607, previous: 'constrained', ...thresholds }),
      'constrained'
    );
    assert.equal(
      resolveShellPageCapacity({ inlineSize: 609, previous: 'constrained', ...thresholds }),
      'compact'
    );
  });
});

describe('resolveShellPageHeaderVariant', () => {
  it('maps automatic scroll and capacity state to explicit header variants', () => {
    assert.equal(resolveShellPageHeaderVariant('auto', 'roomy', true), 'expanded');
    assert.equal(resolveShellPageHeaderVariant('auto', 'roomy', false), 'compact');
    assert.equal(resolveShellPageHeaderVariant('auto', 'compact', true), 'compact');
    assert.equal(resolveShellPageHeaderVariant('auto', 'constrained', true), 'constrained');
  });

  it('honors explicit presentation overrides', () => {
    assert.equal(resolveShellPageHeaderVariant('expanded', 'constrained', false), 'expanded');
    assert.equal(resolveShellPageHeaderVariant('compact', 'roomy', true), 'compact');
    assert.equal(resolveShellPageHeaderVariant('constrained', 'roomy', true), 'constrained');
  });
});
