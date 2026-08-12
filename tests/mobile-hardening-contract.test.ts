import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

function filesBelow(relativeDirectory: string, extension: string): string[] {
  const absoluteDirectory = path.join(root, relativeDirectory);
  return fs.readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap(entry => {
    const relativePath = path.join(relativeDirectory, entry.name);
    return entry.isDirectory()
      ? filesBelow(relativePath, extension)
      : entry.isFile() && entry.name.endsWith(extension)
        ? [relativePath]
        : [];
  });
}

function fineHoverMediaRanges(css: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const media = /@media[^{}]*\(hover: hover\)[^{}]*\(pointer: fine\)[^{}]*{/g;
  for (const match of css.matchAll(media)) {
    const start = match.index;
    const open = start + match[0].lastIndexOf('{');
    let depth = 1;
    let cursor = open + 1;
    while (cursor < css.length && depth > 0) {
      if (css[cursor] === '{') depth += 1;
      if (css[cursor] === '}') depth -= 1;
      cursor += 1;
    }
    assert.equal(depth, 0, `Unbalanced fine-hover media query near offset ${start}`);
    ranges.push([open + 1, cursor - 1]);
  }
  return ranges;
}

test('every authored hover selector is limited to a hover-capable fine pointer', () => {
  for (const file of filesBelow('src/wc', '.css')) {
    const css = read(file).replace(/\/\*[\s\S]*?\*\//g, '');
    const ranges = fineHoverMediaRanges(css);
    for (const match of css.matchAll(/:hover\b/g)) {
      const offset = match.index;
      assert.ok(
        ranges.some(([start, end]) => offset >= start && offset < end),
        `${file}:${css.slice(0, offset).split('\n').length} has an unguarded :hover selector`,
      );
    }
  }

  const interactionFill = read('src/wc/utils/interaction-fill.css');
  assert.match(
    interactionFill,
    /:host\(\.ds-interaction-fill:active:not\(:disabled\)\)::after,[\s\S]*?background: var\(--ds-interaction-pressed\);/,
  );
  const conversationItem = read(
    'src/wc/components/ConversationListItem/ConversationListItem.css',
  );
  assert.match(
    conversationItem,
    /:host\(\.conversation-list-item--actions-open\) \.conversation-list-item__actions[\s\S]*?opacity: 1;[\s\S]*?pointer-events: auto;/,
  );
  assert.match(
    conversationItem,
    /\.conversation-list-item__row:has\(:focus-visible\) \.conversation-list-item__actions/,
  );
});

test('mobile host guidance and executable shell fixture share one ownership contract', () => {
  const guide = read('docs/framework-integration.md');
  for (const fragment of [
    'viewport-fit=cover',
    '100dvh',
    '100vh',
    'overscroll-behavior: none',
    'theme-color',
    'ShellApp consumes the shared top inset once',
    'MobileBarNav consumes the persistent bottom inset',
    're-synchronizes only the wash bitmap',
  ]) {
    assert.ok(guide.includes(fragment), `framework guide must include ${fragment}`);
  }
  assert.doesNotMatch(
    guide,
    /html, body, app-root, shell host \{ height: 100% \}/,
  );

  const fixture = read('tests/e2e/fixtures/shell-mobile.html');
  assert.match(
    fixture,
    /content="width=device-width, initial-scale=1, viewport-fit=cover"/,
  );
  assert.match(fixture, /@supports \(height: 100dvh\)/);
  assert.match(fixture, /#app-root\s*{[\s\S]*?height: 100dvh;/);
  assert.match(
    fixture,
    /html,[\s\S]*?body\s*{[\s\S]*?overflow: hidden;[\s\S]*?overscroll-behavior: none;/,
  );

  const pattern = read('agent/patterns/application-shell/pattern.agent.json');
  assert.match(pattern, /application owns viewport and theme-color metadata/);
  assert.match(pattern, /ShellApp consumes the shared top safe-area inset once/);
  assert.match(pattern, /MobileBarNav consumes the persistent bottom inset/);
});
