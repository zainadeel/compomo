import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSafeUrl } from '../src/wc/utils/safe-url';

const baseUrl = 'https://app.example.test/dashboard/';

describe('resolveSafeUrl', () => {
  it('resolves allowed absolute and relative URLs', () => {
    assert.equal(resolveSafeUrl('../reports', { baseUrl }), 'https://app.example.test/reports');
    assert.equal(
      resolveSafeUrl('https://docs.example.test/guide'),
      'https://docs.example.test/guide'
    );
  });

  it('rejects executable and malformed URLs', () => {
    assert.equal(resolveSafeUrl('javascript:alert(1)', { baseUrl }), undefined);
    assert.equal(resolveSafeUrl('http://['), undefined);
  });

  it('requires consumers to explicitly allow non-web protocols', () => {
    assert.equal(resolveSafeUrl('mailto:team@example.test'), undefined);
    assert.equal(
      resolveSafeUrl('mailto:team@example.test', {
        protocols: ['http:', 'https:', 'mailto:'],
      }),
      'mailto:team@example.test'
    );
  });
});
