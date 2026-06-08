import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getTabListFromTabGroup,
  queryWithinComponentHost,
} from '../src/wc/components/BarNav/bar-nav-dom-utils';

function mockHost(options: {
  light?: HTMLElement | null;
  shadow?: HTMLElement | null;
}) {
  const lightResult = options.light ?? null;
  const shadowResult = options.shadow ?? null;
  const shadowRoot = shadowResult
    ? ({ querySelector: () => shadowResult } as unknown as ShadowRoot)
    : null;

  return {
    shadowRoot,
    querySelector: () => lightResult,
  };
}

describe('queryWithinComponentHost', () => {
  it('queries light DOM when shadowRoot is absent', () => {
    const tablist = {} as HTMLElement;
    const host = mockHost({ light: tablist });

    assert.equal(queryWithinComponentHost(host, '[role="tablist"]'), tablist);
  });

  it('queries shadowRoot when present', () => {
    const tablist = {} as HTMLElement;
    const host = mockHost({ shadow: tablist, light: null });

    assert.equal(queryWithinComponentHost(host, '[role="tablist"]'), tablist);
  });

  it('returns null for missing host or match', () => {
    assert.equal(queryWithinComponentHost(null, '[role="tablist"]'), null);
    assert.equal(queryWithinComponentHost(mockHost({}), '.missing'), null);
  });
});

describe('getTabListFromTabGroup', () => {
  it('returns the tablist element', () => {
    const tablist = {} as HTMLElement;
    const host = mockHost({ light: tablist });

    assert.equal(getTabListFromTabGroup(host), tablist);
  });
});
