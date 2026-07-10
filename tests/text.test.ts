import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { textDisplayClass, textVariantClass } from '../src/wc/components/Text/text-utils';

describe('textVariantClass', () => {
  it('maps TextVariant to a ds-text--* class', () => {
    assert.equal(textVariantClass('text-body-medium'), 'ds-text--body-medium');
    assert.equal(textVariantClass('text-display-medium'), 'ds-text--display-medium');
    assert.equal(textVariantClass('text-caption'), 'ds-text--caption');
  });
});

describe('textDisplayClass', () => {
  it('uses measurable inline boxes for inline semantics', () => {
    assert.equal(textDisplayClass('span'), 'ds-text--inline-box');
    assert.equal(textDisplayClass('label'), 'ds-text--inline-box');
  });

  it('uses block boxes for paragraphs and headings', () => {
    assert.equal(textDisplayClass('p'), 'ds-text--block-box');
    assert.equal(textDisplayClass('h2'), 'ds-text--block-box');
    assert.equal(textDisplayClass('div'), 'ds-text--block-box');
  });
});
