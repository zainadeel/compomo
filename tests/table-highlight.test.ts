import assert from 'node:assert/strict';
import test from 'node:test';
import { createTableHighlightMatcher } from '../src/wc/components/Table/table-highlight';

test('matches literal terms case-insensitively while preserving visible copy', () => {
  const match = createTableHighlightMatcher(['avery', 'V-20']);
  const segments = match('Avery Chen · V-2048');

  assert.deepEqual(segments, [
    { text: 'Avery', match: true },
    { text: ' Chen · ', match: false },
    { text: 'V-20', match: true },
    { text: '48', match: false },
  ]);
  assert.equal(segments.map(segment => segment.text).join(''), 'Avery Chen · V-2048');
});

test('treats regular-expression syntax as literal search text', () => {
  assert.deepEqual(createTableHighlightMatcher(['(2048)+'])(`Vehicle (2048)+ ready`), [
    { text: 'Vehicle ', match: false },
    { text: '(2048)+', match: true },
    { text: ' ready', match: false },
  ]);
});

test('ignores empty and duplicate terms and prioritizes longer overlaps', () => {
  const segments = createTableHighlightMatcher(['', ' ave ', 'Avery', 'AVERY'])('Avery Ave');

  assert.deepEqual(segments, [
    { text: 'Avery', match: true },
    { text: ' ', match: false },
    { text: 'Ave', match: true },
  ]);
});

test('returns one unmatched segment when no term applies', () => {
  assert.deepEqual(createTableHighlightMatcher([])(2048), [{ text: '2048', match: false }]);
  assert.deepEqual(createTableHighlightMatcher(['driver'])('Vehicle'), [
    { text: 'Vehicle', match: false },
  ]);
});
