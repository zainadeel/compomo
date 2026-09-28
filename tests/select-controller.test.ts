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
      isConnected: true,
    } as unknown as HTMLElement,
    generatedId: 'test-select',
    options,
    searchable: false,
    isLoading: false,
    isDisabled: false,
    preferredIndex,
    popupAlign: 'start',
    boundary: undefined,
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

test('disconnect clears buffered typeahead before the next connection', () => {
  const { controller, state } = setup();
  try {
    for (let cycle = 0; cycle < 2; cycle++) {
      controller.handleTriggerKeyDown(keyboardEvent('a'));
      assert.equal(state.activeIndex, 0);
      controller.closePopup();
      Object.assign(state.host, { isConnected: false });
      controller.disconnect();
      Object.assign(state.host, { isConnected: true });
      controller.connect();
      controller.handleTriggerKeyDown(keyboardEvent('c'));
      assert.equal(state.activeIndex, 2);
      controller.closePopup();
      controller.disconnect();
    }
  } finally {
    controller.disconnect();
  }
});

for (const searchable of [false, true]) {
  test(`disconnect invalidates queued focus and permits new ${searchable ? 'search' : 'trigger'} focus`, () => {
    const originalFrame = globalThis.requestAnimationFrame;
    const originalCancel = globalThis.cancelAnimationFrame;
    const frames: FrameRequestCallback[] = [];
    globalThis.requestAnimationFrame = callback => frames.push(callback);
    globalThis.cancelAnimationFrame = () => {};
    const { controller, state } = setup();
    const focused: string[] = [];
    Object.assign(state, { searchable });
    controller.setTriggerElement({ focus: () => focused.push('trigger') } as HTMLButtonElement);
    controller.setSearchElement({
      setFocus: async () => {
        focused.push('search');
      },
    } as HTMLDsInputElement);
    try {
      controller.openPopup(true);
      controller.closePopup(true);
      controller.focusSearchOrTrigger();
      Object.assign(state.host, { isConnected: false });
      controller.disconnect();
      controller.focusSearchOrTrigger();
      Object.assign(state.host, { isConnected: true });
      controller.connect();
      // Already-dispatched callbacks must stay invalid after reconnection too.
      frames.splice(0).forEach(callback => callback(0));
      assert.deepEqual(focused, []);

      controller.focusSearchOrTrigger();
      frames.splice(0).forEach(callback => callback(0));
      assert.deepEqual(focused, [searchable ? 'search' : 'trigger']);

      controller.openPopup(true);
      controller.closePopup(true);
      frames.splice(0).forEach(callback => callback(0));
      assert.deepEqual(focused, [searchable ? 'search' : 'trigger', 'trigger']);
    } finally {
      controller.disconnect();
      globalThis.requestAnimationFrame = originalFrame;
      globalThis.cancelAnimationFrame = originalCancel;
    }
  });
}
