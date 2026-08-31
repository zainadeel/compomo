import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isMessageScrollerTranscriptReset,
  pruneMessageScrollerTranscriptSet,
} from '../src/wc/components/MessageScroller/message-scroller-transcript';

describe('message scroller transcript tracking', () => {
  const first = { id: 'first' };
  const second = { id: 'second' };
  const third = { id: 'third' };

  it('recognizes clear and disjoint replacements without treating append or prepend as resets', () => {
    assert.equal(isMessageScrollerTranscriptReset([first, second], []), true);
    assert.equal(isMessageScrollerTranscriptReset([first, second], [third]), true);
    assert.equal(isMessageScrollerTranscriptReset([first, second], [first, second, third]), false);
    assert.equal(isMessageScrollerTranscriptReset([first, second], [third, first, second]), false);
    assert.equal(isMessageScrollerTranscriptReset([], [first]), false);
  });

  it('keeps only identities that survive in the current transcript', () => {
    const known = new Set([first, second, third]);

    pruneMessageScrollerTranscriptSet(known, [second, third]);

    assert.deepEqual([...known], [second, third]);
  });
});
