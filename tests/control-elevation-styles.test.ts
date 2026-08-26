import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync('src/wc/styles/control-elevation.css', 'utf8');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const buildScript = fs.readFileSync('scripts/build-style-exports.mjs', 'utf8');
const packVerification = fs.readFileSync('scripts/verify-npm-pack.mjs', 'utf8');

const migratedSources = [
  'src/wc/components/ConversationList/ConversationList.css',
  'src/wc/components/ConversationList/ConversationList.tsx',
  'src/wc/components/MessageScroller/MessageScroller.css',
  'src/wc/components/MessageScroller/MessageScroller.tsx',
  'src/wc/components/ConversationListItem/ConversationListItem.css',
  'src/wc/components/ConversationListItem/ConversationListItem.tsx',
].map(path => fs.readFileSync(path, 'utf8'));

describe('public control elevation style contract', () => {
  it('publishes the stylesheet from compiled package output', () => {
    assert.equal(
      packageJson.exports['./control-elevation.css'],
      './dist/styles/control-elevation.css'
    );
    assert.match(buildScript, /dist\/styles\/control-elevation\.css/);
    assert.match(packVerification, /dist\/styles\/control-elevation\.css/);
    assert.ok(packageJson.sideEffects.includes('**/*.css'));
  });

  it('splits every supported level into one outer shadow and one top highlight', () => {
    const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const level of ['sm', 'md', 'floating']) {
      assert.match(
        declarations,
        new RegExp(
          `ds-control-elevation--${level}[\\s\\S]*?` +
            `--ds-control-elevation-shadow: var\\(--effect-shadow-elevated-${level}\\);[\\s\\S]*?` +
            `--ds-control-elevation-highlight: var\\(--effect-highlight-elevated-${level}\\);`
        )
      );
    }
    assert.doesNotMatch(declarations, /--effect-elevation-/);
  });

  it('keeps the highlight above children without changing compositing or input behavior', () => {
    assert.match(css, /\.ds-control-elevation::after/);
    assert.match(css, /z-index: 4/);
    assert.match(css, /border-radius: inherit/);
    assert.match(css, /pointer-events: none/);
    assert.doesNotMatch(css, /\b(?:mask|filter|backdrop-filter|animation):/);
  });

  it('transfers approved button press scale to the complete elevated wrapper', () => {
    assert.match(
      css,
      /\.ds-control-elevation--press-scale\s*{[\s\S]*?--ds-control-press-active-scale: var\(--dimension-scale-default\);[\s\S]*?transition: scale var\(--effect-motion-short-2\);/
    );
    assert.doesNotMatch(
      css,
      /\.ds-control-elevation--press-scale\s*{[^}]*\n\s*scale\s*:/,
      'resting wrappers must not create a transformed containing block'
    );
    assert.match(
      css,
      /\.ds-control-elevation--press-scale\[data-ds-press-active\]\s*{[\s\S]*?scale: var\(--dimension-scale-subtle\);/
    );
    assert.match(
      css,
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.ds-control-elevation--press-scale\[data-ds-press-active\][\s\S]*?scale: none;[\s\S]*?transition: none;/
    );
  });

  it('migrates the three wrapper controls without double-painting elevation', () => {
    for (const source of migratedSources) {
      assert.doesNotMatch(source, /--effect-elevation-/);
      assert.match(source, /control-elevation\.css|ds-control-elevation--md/);
    }
    for (const source of migratedSources.filter(source =>
      source.includes('ds-control-elevation--md')
    )) {
      assert.match(source, /ds-control-elevation--press-scale/);
    }
  });
});
