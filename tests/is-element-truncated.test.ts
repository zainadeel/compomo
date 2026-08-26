import assert from 'node:assert/strict';
import test from 'node:test';
import { isElementTruncated } from '../src/wc/utils/is-element-truncated';

function fakeElement(
  metrics: { scrollWidth: number; clientWidth: number; scrollHeight: number; clientHeight: number },
  inner?: HTMLElement | null
): HTMLElement {
  return {
    querySelector: (selector: string) =>
      selector === '.ds-text__element' ? (inner ?? null) : null,
    ...metrics,
  } as HTMLElement;
}

test('isElementTruncated reports horizontal and vertical overflow past 1px', () => {
  assert.equal(
    isElementTruncated(
      fakeElement({
        scrollWidth: 120,
        clientWidth: 80,
        scrollHeight: 20,
        clientHeight: 20,
      })
    ),
    true
  );
  assert.equal(
    isElementTruncated(
      fakeElement({
        scrollWidth: 80,
        clientWidth: 80,
        scrollHeight: 66,
        clientHeight: 44,
      })
    ),
    true
  );
  assert.equal(
    isElementTruncated(
      fakeElement({
        scrollWidth: 81,
        clientWidth: 80,
        scrollHeight: 20,
        clientHeight: 20,
      })
    ),
    false
  );
  assert.equal(
    isElementTruncated(
      fakeElement({
        scrollWidth: 80,
        clientWidth: 80,
        scrollHeight: 20,
        clientHeight: 20,
      })
    ),
    false
  );
});

test('isElementTruncated prefers the inner ds-text element when present', () => {
  const inner = fakeElement({
    scrollWidth: 160,
    clientWidth: 80,
    scrollHeight: 20,
    clientHeight: 20,
  });
  const host = fakeElement(
    {
      scrollWidth: 80,
      clientWidth: 80,
      scrollHeight: 20,
      clientHeight: 20,
    },
    inner
  );
  assert.equal(isElementTruncated(host), true);
});
