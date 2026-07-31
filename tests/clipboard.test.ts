import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { writeClipboardText } from '../src/wc/utils/clipboard';

describe('writeClipboardText', () => {
  it('writes non-empty text through the supplied browser clipboard', async () => {
    const writes: string[] = [];
    const result = await writeClipboardText('Message content', {
      writeText: text => {
        writes.push(text);
        return Promise.resolve();
      },
    });

    assert.equal(result, true);
    assert.deepEqual(writes, ['Message content']);
  });

  it('reports unavailable, empty, and rejected writes without throwing', async () => {
    assert.equal(await writeClipboardText('Message content', undefined), false);
    assert.equal(
      await writeClipboardText('', { writeText: () => Promise.resolve() }),
      false
    );
    assert.equal(
      await writeClipboardText('Message content', {
        writeText: () => Promise.reject(new Error('Clipboard denied')),
      }),
      false
    );
  });
});
