#!/usr/bin/env node
/**
 * Smoke-test: install the packed tarball in a temp project and import @ds-mo/ui/shell.
 */
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const packDir = mkdtempSync(join(tmpdir(), 'ds-mo-pack-'));
const smokeDir = mkdtempSync(join(tmpdir(), 'ds-mo-smoke-'));

try {
  const packLog = execSync(`npm pack --pack-destination "${packDir}"`, {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const tarball = packLog
    .trim()
    .split('\n')
    .map(line => line.trim())
    .find(line => line.endsWith('.tgz'));
  if (!tarball) {
    throw new Error(`Could not find .tgz name in npm pack output:\n${packLog}`);
  }

  const tarballPath = join(packDir, tarball);
  writeFileSync(
    join(smokeDir, 'package.json'),
    JSON.stringify(
      {
        name: 'ds-mo-shell-smoke',
        private: true,
        type: 'module',
        dependencies: {
          '@ds-mo/ui': `file:${tarballPath}`,
        },
      },
      null,
      2,
    ),
  );

  execSync('npm install --no-audit --no-fund', { cwd: smokeDir, stdio: 'inherit' });
  const listing = execSync(`tar -tzf "${tarballPath}"`, { encoding: 'utf8' });
  for (const suffix of [
    'package/dist/lib/shell/index.js',
    'package/dist/lib/shell/index.d.ts',
    'package/dist/lib/utils/index.js',
    'package/dist/lib/utils/index.d.ts',
  ]) {
    if (!listing.includes(suffix)) {
      throw new Error(`packed tarball missing ${suffix}`);
    }
  }

  // Plain node — no TS loader. Proves the subpaths ship runnable compiled JS
  // (consumer toolchains no longer need to transpile our source or carry
  // @stencil/core types). See compomo#257.
  execSync(
    `node --input-type=module -e "
      const shell = await import('@ds-mo/ui/shell');
      for (const name of ['runShellNavStyleRevealOnReady', 'normalizeShellGradientPreset']) {
        if (typeof shell[name] !== 'function') {
          console.error('missing ' + name);
          process.exit(1);
        }
      }
      if (shell.DEFAULT_SHELL_GRADIENT_PRESET !== 'neutral') {
        console.error('unexpected DEFAULT_SHELL_GRADIENT_PRESET');
        process.exit(1);
      }
      if (!shell.PANEL_NAV_USER_MENU_PLACEMENT || shell.PANEL_NAV_USER_MENU_PLACEMENT.side !== 'right') {
        console.error('missing or unexpected PANEL_NAV_USER_MENU_PLACEMENT');
        process.exit(1);
      }
      const utils = await import('@ds-mo/ui/utils');
      for (const name of ['resolveCssLengthPx', 'registerIcons']) {
        if (typeof utils[name] !== 'function') {
          console.error('missing ' + name);
          process.exit(1);
        }
      }
    "`,
    { cwd: smokeDir, stdio: 'inherit' },
  );

  console.log('✅ @ds-mo/ui/shell and @ds-mo/ui/utils import from packed tarball with plain node.');
} finally {
  rmSync(packDir, { recursive: true, force: true });
  rmSync(smokeDir, { recursive: true, force: true });
}
