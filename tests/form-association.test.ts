import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  restoreNumberArrayFormState,
  restoreStringArrayFormState,
  setFormControlValue,
  setRepeatedFormControlValue,
  type FormControlState,
} from '../src/wc/utils/form-association';

type FormValue = File | FormData | string | null;

function fakeInternals() {
  const calls: Array<[FormValue, FormControlState | undefined]> = [];
  return {
    internals: {
      setFormValue(value: FormValue, state?: FormControlState) {
        calls.push([value, state]);
      },
    } as unknown as ElementInternals,
    calls,
  };
}

describe('form association utilities', () => {
  it('omits inactive scalar controls while retaining explicit restoration state', () => {
    const { internals, calls } = fakeInternals();
    setFormControlValue(internals, 'on', { inactive: true, state: 'checked' });
    assert.deepEqual(calls, [[null, 'checked']]);
  });

  it('retains scalar state when inactive without requiring a separate state argument', () => {
    const { internals, calls } = fakeInternals();
    setFormControlValue(internals, 'saved value', { inactive: true });
    assert.deepEqual(calls, [[null, 'saved value']]);
  });

  it('retains repeated state for inactive, unnamed and empty controls', () => {
    const { internals, calls } = fakeInternals();
    setRepeatedFormControlValue(internals, 'filters', ['safety'], { inactive: true });
    setRepeatedFormControlValue(internals, undefined, ['speed']);
    setRepeatedFormControlValue(internals, 'filters', []);
    assert.deepEqual(calls, [
      [null, '["safety"]'],
      [null, '["speed"]'],
      [null, '[]'],
    ]);
  });

  it('honors an explicit null restoration state for both scalar and repeated values', () => {
    const { internals, calls } = fakeInternals();
    setFormControlValue(internals, 'value', { state: null });
    setRepeatedFormControlValue(internals, 'filters', ['safety'], { state: null });
    setRepeatedFormControlValue(internals, 'filters', [], { state: null });
    assert.deepEqual(
      calls.map(([, state]) => state),
      [null, null, null]
    );
  });

  it('submits repeated values under one field name', () => {
    const { internals, calls } = fakeInternals();
    setRepeatedFormControlValue(internals, 'filters', ['safety', 'speed']);

    const [data, state] = calls[0];
    assert.ok(data instanceof FormData);
    assert.deepEqual(data.getAll('filters'), ['safety', 'speed']);
    assert.equal(state, '["safety","speed"]');
  });

  it('restores only valid scalar arrays', () => {
    assert.deepEqual(restoreStringArrayFormState('["safety",4,"speed"]'), ['safety', 'speed']);
    assert.deepEqual(restoreNumberArrayFormState('["10",20,"nope",30]', 2), [10, 20]);
  });

  it('does not turn malformed number state into zero or one', () => {
    assert.deepEqual(
      restoreNumberArrayFormState('[null,true,false,""," ",[],{},"10",20]'),
      [10, 20]
    );
    assert.deepEqual(restoreNumberArrayFormState('["Infinity","NaN",0]'), [0]);
    assert.deepEqual(restoreNumberArrayFormState('not json'), []);
  });
});
