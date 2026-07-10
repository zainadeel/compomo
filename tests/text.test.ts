import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { textVariantClass } from '../src/wc/components/Text/text-utils';

describe('textVariantClass', () => {
  it('maps TextVariant to a ds-text--* class', () => {
    assert.equal(textVariantClass('text-body-medium'), 'ds-text--body-medium');
    assert.equal(textVariantClass('text-display-medium'), 'ds-text--display-medium');
    assert.equal(textVariantClass('text-caption'), 'ds-text--caption');
  });
});
