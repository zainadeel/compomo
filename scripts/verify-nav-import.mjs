#!/usr/bin/env node
/**
 * Smoke-test: install the packed tarball in a temp project and import @ds-mo/ui/nav.
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
        name: 'ds-mo-nav-smoke',
        private: true,
        type: 'module',
        dependencies: {
          '@ds-mo/ui': `file:${tarballPath}`,
        },
        devDependencies: {
          tsx: '^4.20.3',
        },
      },
      null,
      2,
    ),
  );

  execSync('npm install --no-audit --no-fund', { cwd: smokeDir, stdio: 'inherit' });
  const listing = execSync(`tar -tzf "${tarballPath}"`, { encoding: 'utf8' });
  for (const suffix of [
    'package/src/wc/utils/resolve-css-length-px.ts',
    'package/src/wc/nav/shell-view-transition.ts',
  ]) {
    if (!listing.includes(suffix)) {
      throw new Error(`packed tarball missing ${suffix}`);
    }
  }

  execSync(
    `node --import tsx/esm --input-type=module -e "
      const nav = await import('@ds-mo/ui/nav');
      if (typeof nav.runShellNavStyleRevealOnReady !== 'function') {
        console.error('missing runShellNavStyleRevealOnReady');
        process.exit(1);
      }
      const utils = await import('@ds-mo/ui/utils');
      if (typeof utils.resolveCssLengthPx !== 'function') {
        console.error('missing resolveCssLengthPx');
        process.exit(1);
      }
    "`,
    { cwd: smokeDir, stdio: 'inherit' },
  );

  console.log('✅ @ds-mo/ui/nav and @ds-mo/ui/utils import from packed tarball.');
} finally {
  rmSync(packDir, { recursive: true, force: true });
  rmSync(smokeDir, { recursive: true, force: true });
}
