import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isBrowserNeutralPath,
  requiresBrowserValidation,
  requiresStorybookValidation,
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
    assert.equal(requiresStorybookValidation(paths), false);
  });

  it('runs both suites for component source, styles, dependencies, and CI changes', () => {
    const paths = [
      'src/wc/components/ButtonFilled/ButtonFilled.tsx',
      'src/wc/components/ButtonFilled/ButtonFilled.css',
      'package-lock.json',
      '.github/workflows/build.yml',
    ];

    for (const path of paths) {
      assert.equal(requiresBrowserValidation([path]), true, path);
      assert.equal(requiresStorybookValidation([path]), true, path);
    }
  });

  it('runs only the suite that consumes a test or story change', () => {
    for (const path of [
      'tests/e2e/shell-managed.spec.ts',
      'tests/e2e/fixtures/shell-managed.html',
    ]) {
      assert.equal(requiresBrowserValidation([path]), true);
      assert.equal(requiresStorybookValidation([path]), false);
    }
    for (const path of [
      'src/wc/components/ButtonFilled/ButtonFilled.stories.ts',
      '.storybook/main.ts',
    ]) {
      assert.equal(requiresBrowserValidation([path]), false);
      assert.equal(requiresStorybookValidation([path]), true);
    }
    assert.equal(requiresBrowserValidation(['tests/ci-browser-scope.test.ts']), false);
    assert.equal(requiresStorybookValidation(['tests/ci-browser-scope.test.ts']), false);
  });

  it('retains both suites for mixed changes and unknown paths', () => {
    for (const paths of [
      ['tests/e2e/shell-managed.spec.ts', 'src/wc/components/ShellApp/ShellApp.css'],
      ['scripts/new-build-step.mjs'],
    ]) {
      assert.equal(requiresBrowserValidation(paths), true);
      assert.equal(requiresStorybookValidation(paths), true);
    }
  });

  it('runs conservatively when the changed path list is unavailable', () => {
    assert.equal(requiresBrowserValidation([]), true);
    assert.equal(requiresStorybookValidation([]), true);
  });
});
