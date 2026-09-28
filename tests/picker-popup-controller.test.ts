import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PickerPopupController,
  type PickerPopupPhase,
} from '../src/wc/utils/picker-popup-controller';

function setup() {
  const state = {
    phase: 'closed' as PickerPopupPhase,
    tracking: false,
    listening: false,
    popoverOpen: false,
  };
  const controller = new PickerPopupController({
    position: {
      observe: () => {
        state.tracking = true;
      },
      unobserve: () => {
        state.tracking = false;
      },
      schedule: () => {
        state.popoverOpen = true;
      },
    },
    interaction: {
      connect: () => {
        state.listening = true;
      },
      disconnect: () => {
        state.listening = false;
      },
    },
    getPopup: () =>
      ({
        matches: () => state.popoverOpen,
        hidePopover: () => {
          state.popoverOpen = false;
        },
      }) as unknown as HTMLElement,
    onPhaseChange: phase => {
      state.phase = phase;
    },
  });
  return { controller, state };
}

test('closing stops popup tracking, restores focus once, and retains presence through exit', context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const { controller, state } = setup();
  let focusReturns = 0;
  controller.open();
  controller.close(() => focusReturns++);
  controller.close(() => focusReturns++);
  assert.equal(focusReturns, 1);
  assert.deepEqual(state, {
    phase: 'closing',
    tracking: false,
    listening: false,
    popoverOpen: true,
  });
  context.mock.timers.runAll();
  assert.equal(state.phase, 'closed');
  assert.equal(state.popoverOpen, false);
});

for (const disconnect of [false, true]) {
  test(`${disconnect ? 'disconnecting and reopening' : 'reopening'} cancels an obsolete popup exit`, context => {
    context.mock.timers.enable({ apis: ['setTimeout'] });
    const { controller, state } = setup();
    for (let cycle = 0; cycle < 2; cycle++) {
      controller.open();
      controller.close();
      if (disconnect) {
        controller.disconnect();
        assert.equal(state.phase, 'closed');
      }
      controller.open();
      context.mock.timers.runAll();
      assert.deepEqual(state, {
        phase: 'open',
        tracking: true,
        listening: true,
        popoverOpen: true,
      });
    }
    controller.disconnect();
    assert.equal(state.phase, 'closed');
    assert.equal(state.tracking, false);
    assert.equal(state.listening, false);
  });
}

test('reduced motion closes the popup immediately', context => {
  const originalWindow = globalThis.window;
  globalThis.window = {
    matchMedia: () => ({ matches: true }),
  } as Window & typeof globalThis;
  context.after(() => {
    if (originalWindow === undefined) {
      // @ts-expect-error restore the non-DOM test environment
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  });
  const { controller, state } = setup();
  controller.open();
  controller.close();
  assert.equal(state.phase, 'closed');
  assert.equal(state.popoverOpen, false);
});
