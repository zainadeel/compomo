import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import {
  isBrowserNeutralPath,
  isVersionOnlyPackageChange,
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

  it('recognizes only package version changes, retaining dependency and contract changes', () => {
    const manifest = {
      name: 'example',
      version: '1.0.0',
      dependencies: { example: '^1.0.0' },
      scripts: { build: 'build' },
    };
    const lock = {
      name: 'example',
      version: '1.0.0',
      lockfileVersion: 3,
      packages: {
        '': manifest,
        'node_modules/example': { version: '1.0.0', integrity: 'sha512-original' },
      },
    };
    const before = JSON.stringify(manifest);
    assert.equal(
      isVersionOnlyPackageChange(
        'package.json',
        before,
        JSON.stringify({ ...manifest, version: '1.1.0' })
      ),
      true
    );
    assert.equal(
      isVersionOnlyPackageChange(
        'package-lock.json',
        JSON.stringify(lock),
        JSON.stringify({
          ...lock,
          version: '1.1.0',
          packages: { ...lock.packages, '': { ...manifest, version: '1.1.0' } },
        })
      ),
      true
    );
    for (const after of [
      { ...manifest, dependencies: { example: '^2.0.0' } },
      { ...manifest, scripts: { build: 'different' } },
      { ...manifest, exports: { '.': './different.js' } },
    ])
      assert.equal(
        isVersionOnlyPackageChange('package.json', before, JSON.stringify(after)),
        false
      );
    assert.equal(
      isVersionOnlyPackageChange(
        'package-lock.json',
        JSON.stringify(lock),
        JSON.stringify({
          ...lock,
          packages: {
            ...lock.packages,
            'node_modules/example': { version: '1.0.0', integrity: 'sha512-changed' },
          },
        })
      ),
      false
    );
    for (const invalid of ['{', 'null', '[]', '{}']) {
      assert.equal(isVersionOnlyPackageChange('package.json', before, invalid), false);
      assert.equal(isVersionOnlyPackageChange('package.json', invalid, before), false);
    }
    assert.equal(isVersionOnlyPackageChange('package-lock.json', before, before), false);
    assert.equal(isVersionOnlyPackageChange('src/example.json', before, before), false);

    const versionOnlyPaths = new Set(['package.json', 'package-lock.json']);
    for (const requires of [requiresBrowserValidation, requiresStorybookValidation]) {
      assert.equal(requires([...versionOnlyPaths, 'CHANGELOG.md'], versionOnlyPaths), false);
      assert.equal(
        requires([...versionOnlyPaths, 'src/wc/components/Widget/Widget.tsx'], versionOnlyPaths),
        true
      );
      assert.equal(requires(['src/example.ts'], new Set(['src/example.ts'])), true);
      assert.equal(requires([], versionOnlyPaths), true);
    }
  });

  it('classifies committed release diffs without trusting a release-looking branch name', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'compomo-ci-scope-'));
    const script = fileURLToPath(new URL('../scripts/ci-browser-scope.mjs', import.meta.url));
    const git = (...args: string[]) =>
      execFileSync('git', args, {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim();
    const commit = (version: string, dependency: string) => {
      fs.writeFileSync(
        path.join(root, 'package.json'),
        JSON.stringify({ version, dependencies: { example: dependency } })
      );
      git('add', 'package.json');
      git(
        '-c',
        'user.name=Test',
        '-c',
        'user.email=test@example.invalid',
        '-c',
        'commit.gpgsign=false',
        'commit',
        '-m',
        'test'
      );
      return git('rev-parse', 'HEAD');
    };
    const classify = (base: string, head: string) =>
      execFileSync(process.execPath, [script], {
        cwd: root,
        input: 'package.json\0CHANGELOG.md\0',
        encoding: 'utf8',
        env: {
          ...process.env,
          BASE_SHA: base,
          HEAD_SHA: head,
          GITHUB_HEAD_REF: 'release-please--branches--main',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    try {
      git('init', '--quiet');
      const base = commit('1.0.0', '^1.0.0');
      const release = commit('1.1.0', '^1.0.0');
      assert.equal(classify(base, release), 'browser=false\nstorybook=false\n');
      const dependency = commit('1.1.0', '^2.0.0');
      assert.equal(classify(base, dependency), 'browser=true\nstorybook=true\n');
      assert.equal(classify('', release), 'browser=true\nstorybook=true\n');
      assert.equal(classify('0'.repeat(40), release), 'browser=true\nstorybook=true\n');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
