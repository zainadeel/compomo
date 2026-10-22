import assert from 'node:assert/strict';
import test from 'node:test';
import { labelWithVisibleText } from '../src/wc/utils/label-in-name';

test('prefixes visible text the label does not contain', () => {
  assert.equal(labelWithVisibleText('Zain Adeel', 'Account'), 'Zain Adeel, Account');
  assert.equal(
    labelWithVisibleText('5', 'California cluster, 2 drivers, 2 vehicles, 1 asset'),
    '5, California cluster, 2 drivers, 2 vehicles, 1 asset'
  );
});

test('keeps labels that already contain the visible text as contiguous words', () => {
  assert.equal(labelWithVisibleText('24', 'Zoom to 24 vehicles'), 'Zoom to 24 vehicles');
  assert.equal(labelWithVisibleText('1.5k', 'Zoom to 1.5k vehicles'), 'Zoom to 1.5k vehicles');
  assert.equal(
    labelWithVisibleText('Zain Adeel', 'Account for zain adeel'),
    'Account for zain adeel'
  );
});

test('requires whole, contiguous words rather than substrings', () => {
  assert.equal(labelWithVisibleText('2', 'Zoom to 24 vehicles'), '2, Zoom to 24 vehicles');
  assert.equal(
    labelWithVisibleText('Zain Adeel', 'Zain, Account, Adeel'),
    'Zain Adeel, Zain, Account, Adeel'
  );
});

test('falls back to whichever text is present', () => {
  assert.equal(labelWithVisibleText('', 'Account'), 'Account');
  assert.equal(labelWithVisibleText('  ', 'Account'), 'Account');
  assert.equal(labelWithVisibleText('12', ''), '12');
});
