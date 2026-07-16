import assert from 'node:assert/strict';
import test from 'node:test';

import {
  choiceListUsesIcons,
  choiceListUsesSubtext,
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

test('uses the icon row variant only when every option has an icon', () => {
  assert.equal(choiceListUsesIcons([]), false);
  assert.equal(choiceListUsesIcons(options), false);
  assert.equal(
    choiceListUsesIcons(options.map(option => ({ ...option, icon: 'Chart' }))),
    true,
  );
});

test('uses the subtext row variant when any option has supporting text', () => {
  assert.equal(choiceListUsesSubtext(options.slice(0, 2)), false);
  assert.equal(choiceListUsesSubtext(options), true);
});

test('filters labels, subtext, and section headings while removing empty sections', () => {
  const sections = [
    { header: 'Common', options: options.slice(0, 2) },
    { header: 'More', options: options.slice(2) },
  ];
  assert.deepEqual(
    filterChoiceSections(sections, 'dark').map(section => section.header),
    ['More'],
  );
  assert.equal(filterChoiceSections(sections, 'APP')[0].options[0].value, 'apple');
  assert.deepEqual(
    filterChoiceSections(sections, 'common')[0].options.map(option => option.value),
    ['apple', 'banana'],
  );
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
