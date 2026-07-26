import assert from 'node:assert/strict';
import test from 'node:test';

import { SelectController, type SelectControllerState } from '../src/wc/utils/select-controller';
import type { ChoiceOption } from '../src/wc/utils/choice-list';

const options: ChoiceOption[] = [
  { label: 'Alpha', value: 'alpha' },
  { label: 'Bravo', value: 'bravo', isInactive: true },
  { label: 'Charlie', value: 'charlie' },
];

function keyboardEvent(key: string): KeyboardEvent {
  return {
    key,
    target: null,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    preventDefault() {},
  } as KeyboardEvent;
}

function setup(preferredIndex = -1) {
  const selected: string[] = [];
  const state: SelectControllerState<ChoiceOption> = {
    host: {
      contains: () => false,
      querySelector: () => null,
    } as unknown as HTMLElement,
    generatedId: 'test-select',
    options,
    searchable: false,
    isLoading: false,
    isDisabled: false,
    preferredIndex,
    open: false,
    activeIndex: -1,
    searchTerm: '',
    focusRingVisible: false,
    position: { x: 0, y: 0 },
    positionReady: false,
    selectOption: option => selected.push(option.value),
  };
  return { controller: new SelectController(state), state, selected };
}

test('opens on the preferred enabled option for scalar Select', () => {
  const { controller, state } = setup(2);
  controller.openPopup(true);
  assert.equal(state.open, true);
  assert.equal(state.activeIndex, 2);
  assert.equal(state.focusRingVisible, true);
});

test('keyboard traversal wraps across enabled options and selects through the owner', () => {
  const { controller, state, selected } = setup();
  controller.openPopup(true, 'first');
  controller.handleListKeyDown(keyboardEvent('ArrowDown'));
  assert.equal(state.activeIndex, 2);
  controller.handleListKeyDown(keyboardEvent('ArrowDown'));
  assert.equal(state.activeIndex, 0);
  controller.handleListKeyDown(keyboardEvent('End'));
  assert.equal(state.activeIndex, 2);
  controller.handleListKeyDown(keyboardEvent('Enter'));
  assert.deepEqual(selected, ['charlie']);
});
