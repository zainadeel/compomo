import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_REQUIRED_MESSAGE, setRequiredValidity } from '../src/wc/utils/required-validity';

function fakeInternals() {
  const calls: Array<[ValidityStateFlags, string]> = [];
  return {
    internals: {
      setValidity(flags: ValidityStateFlags, message: string) {
        calls.push([flags, message]);
      },
    } as unknown as ElementInternals,
    calls,
  };
}

describe('setRequiredValidity', () => {
  it('sets valueMissing with the given message when missing', () => {
    const { internals, calls } = fakeInternals();
    setRequiredValidity(internals, true, 'Custom message');
    assert.deepEqual(calls, [[{ valueMissing: true }, 'Custom message']]);
  });

  it('clears validity with an empty message when not missing', () => {
    const { internals, calls } = fakeInternals();
    setRequiredValidity(internals, false, 'Custom message');
    assert.deepEqual(calls, [[{}, '']]);
  });

  it('exposes a shared default message', () => {
    assert.equal(DEFAULT_REQUIRED_MESSAGE, 'This field is required.');
  });
});
