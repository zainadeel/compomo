import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isTableCaptionCompact,
  TABLE_CAPTION_COMPACT_MAX_PX,
} from '../src/wc/utils/table-caption-compact';

test('treats table caption chrome as compact at and below 899px', () => {
  assert.equal(TABLE_CAPTION_COMPACT_MAX_PX, 899);
  assert.equal(isTableCaptionCompact(0), false);
  assert.equal(isTableCaptionCompact(899), true);
  assert.equal(isTableCaptionCompact(900), false);
});
