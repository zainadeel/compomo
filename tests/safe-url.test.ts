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

  it('uses parsed protocols to reject case and whitespace obfuscation', () => {
    for (const value of [
      '  JaVaScRiPt:alert(1)',
      'java\tscript:alert(1)',
      '\u0000javascript:alert(1)',
      'data:text/html,test',
      'vbscript:msgbox(1)',
    ]) {
      assert.equal(resolveSafeUrl(value, { baseUrl }), undefined);
    }
  });

  it('fails closed for non-string runtime inputs', () => {
    for (const value of [null, undefined, 42, {}, ['https://example.test']]) {
      assert.equal(resolveSafeUrl(value as unknown as string, { baseUrl }), undefined);
    }
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
