import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const authoredRoots = ['.storybook', 'agent', 'docs', 'src', 'tests'];
const textExtensions = new Set(['.css', '.html', '.json', '.md', '.mdx', '.mjs', '.ts', '.tsx']);

function authoredFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return authoredFiles(entryPath);
    return textExtensions.has(path.extname(entry.name)) ? [entryPath] : [];
  });
}

function source(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('semantic font-family contract', () => {
  it('uses only the canonical ui and code family tokens in authored files', () => {
    const legacyFamily = new RegExp(`--typography-font-${'family'}(?!-(?:ui|code))`);
    const offenders = authoredRoots
      .flatMap(directory => authoredFiles(path.join(root, directory)))
      .filter(file => legacyFamily.test(fs.readFileSync(file, 'utf8')))
      .map(file => path.relative(root, file));

    assert.deepEqual(offenders, []);
  });

  it('keeps the code family on code surfaces and off ordinary annotations', () => {
    const codeFamilyStylesheets = [
      'src/wc/components/AgentToolCall/AgentToolCall.css',
      'src/wc/components/CodeBlock/CodeBlock.css',
      'src/wc/stories/Utility/utility-demo.css',
      'src/wc/styles/prose.css',
    ];

    for (const file of codeFamilyStylesheets) {
      assert.match(source(file), /--typography-font-family-code/, file);
    }

    const actualCodeFamilyStylesheets = authoredRoots
      .flatMap(directory => authoredFiles(path.join(root, directory)))
      .filter(file => path.extname(file) === '.css')
      .filter(file => /--typography-font-family-code/.test(fs.readFileSync(file, 'utf8')))
      .map(file => path.relative(root, file))
      .sort();

    assert.deepEqual(actualCodeFamilyStylesheets, codeFamilyStylesheets.sort());

    for (const file of [
      'src/wc/components/Chip/Chip.stories.ts',
      'src/wc/components/Tag/Tag.stories.ts',
    ]) {
      assert.doesNotMatch(source(file), /--typography-font-family-code/, file);
    }
  });
});
