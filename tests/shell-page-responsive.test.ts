import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveShellPageHeaderVariant } from '../src/wc/components/ShellPage/shell-page-responsive';

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
