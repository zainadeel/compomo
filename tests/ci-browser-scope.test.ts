import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isBrowserNeutralPath,
  requiresBrowserValidation,
} from '../scripts/ci-browser-scope.mjs';

describe('CI browser scope', () => {
  it('skips documentation and generated agent metadata', () => {
    const paths = [
      'README.md',
      'docs/framework-integration.md',
      'agent/patterns/conversation/pattern.agent.json',
      'public/r/button-filled.json',
      'src/wc/components/ButtonFilled/ButtonFilled.agent.json',
    ];

    assert.equal(paths.every(isBrowserNeutralPath), true);
    assert.equal(requiresBrowserValidation(paths), false);
  });

  it('runs for component source, styles, stories, dependencies, and CI changes', () => {
    const paths = [
      'src/wc/components/ButtonFilled/ButtonFilled.tsx',
      'src/wc/components/ButtonFilled/ButtonFilled.css',
      'src/wc/components/ButtonFilled/ButtonFilled.stories.ts',
      'package-lock.json',
      '.github/workflows/build.yml',
    ];

    for (const path of paths) {
      assert.equal(requiresBrowserValidation([path]), true, path);
    }
  });

  it('runs conservatively when the changed path list is unavailable', () => {
    assert.equal(requiresBrowserValidation([]), true);
  });
});
