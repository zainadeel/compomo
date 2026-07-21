import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('isolates every open Modal docs example in its own iframe', () => {
  const docs = read('src/wc/components/Modal/Modal.docs.mdx');
  const stories = read('src/wc/components/Modal/Modal.stories.ts');
  const exports = ['Playground', 'DeleteConfirmation', 'LeaveConfirmation', 'WithoutFooter'];

  assert.doesNotMatch(stories, /tags:\s*\[['"]autodocs['"]\]/);
  for (const story of exports) {
    assert.match(docs, new RegExp(`of=\\{ModalStories\\.${story}\\}`));
  }
  assert.equal(
    docs.match(/story=\{\{\s*inline:\s*false,\s*height:\s*'360px'\s*\}\}/g)?.length,
    exports.length,
  );
});
