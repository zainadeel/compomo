import assert from 'node:assert/strict';
import test from 'node:test';

import {
  enabledChoiceIndexes,
  filterChoiceSections,
  findChoiceTypeaheadMatch,
  flattenChoiceSections,
  moveChoiceIndex,
  resolveChoiceSections,
  type ChoiceOption,
} from '../src/wc/utils/choice-list';

const options: ChoiceOption[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana', isInactive: true },
  { label: 'Cherry', value: 'cherry', subtext: 'Dark red fruit' },
];

test('normalizes flat options and flattens grouped sections', () => {
  const flat = resolveChoiceSections(options, []);
  assert.equal(flat.length, 1);
  assert.deepEqual(flattenChoiceSections(flat), options);

  const grouped = resolveChoiceSections([], [
    { header: 'First', options: options.slice(0, 1) },
    { header: 'Second', options: options.slice(1) },
  ]);
  assert.deepEqual(flattenChoiceSections(grouped), options);
});

test('filters labels and subtext while removing empty sections', () => {
  const sections = [
    { header: 'A', options: options.slice(0, 2) },
    { header: 'B', options: options.slice(2) },
  ];
  assert.deepEqual(
    filterChoiceSections(sections, 'dark').map(section => section.header),
    ['B'],
  );
  assert.equal(filterChoiceSections(sections, 'APP')[0].options[0].value, 'apple');
});

test('moves and wraps across enabled options only', () => {
  assert.deepEqual(enabledChoiceIndexes(options), [0, 2]);
  assert.equal(moveChoiceIndex(options, 0, 1), 2);
  assert.equal(moveChoiceIndex(options, 2, 1), 0);
  assert.equal(moveChoiceIndex(options, 0, -1), 2);
});

test('typeahead skips inactive options and starts after the current choice', () => {
  assert.equal(findChoiceTypeaheadMatch(options, 'b', 0), -1);
  assert.equal(findChoiceTypeaheadMatch(options, 'c', 0), 2);
  assert.equal(findChoiceTypeaheadMatch(options, 'a', 2), 0);
});
