import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveIconName } from '../src/wc/components/Icon/icon-resolve.ts';

describe('resolveIconName', () => {
  it('returns canonical PascalCase names unchanged', () => {
    assert.equal(resolveIconName('Gear'), 'Gear');
    assert.equal(resolveIconName('DeviceMobile'), 'DeviceMobile');
    assert.equal(resolveIconName('FlagFrance', 'flag'), 'FlagFrance');
  });

  it('resolves kebab-case and lowercase aliases from IcoMo meta', () => {
    assert.equal(resolveIconName('device-mobile'), 'DeviceMobile');
    assert.equal(resolveIconName('mobile'), 'DeviceMobile');
    assert.equal(resolveIconName('Mobile'), 'DeviceMobile');
  });

  it('returns the input when no alias matches', () => {
    assert.equal(resolveIconName('NotAnIcon'), 'NotAnIcon');
    assert.equal(resolveIconName(''), '');
  });
});
