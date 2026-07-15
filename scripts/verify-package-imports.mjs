#!/usr/bin/env node
/** Install the packed tarball and load every supported public runtime surface. */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const pkg = JSON.parse(execFileSync('node', ['-e', "process.stdout.write(require('fs').readFileSync('package.json'))"], {
  cwd: repoRoot,
  encoding: 'utf8',
}));
const packDir = mkdtempSync(join(tmpdir(), 'ds-mo-pack-'));
const smokeDir = mkdtempSync(join(tmpdir(), 'ds-mo-consumer-'));
const npmEnv = { ...process.env, npm_config_cache: join(tmpdir(), 'ds-mo-npm-cache') };

try {
  const packOutput = execFileSync('npm', ['pack', '--pack-destination', packDir, '--json'], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: npmEnv,
  });
  const [{ filename }] = JSON.parse(packOutput);
  const tarballPath = join(packDir, filename);
  writeFileSync(join(smokeDir, 'package.json'), JSON.stringify({
    name: 'ds-mo-package-smoke',
    private: true,
    type: 'module',
    dependencies: {
      '@angular/compiler': pkg.devDependencies['@angular/compiler'],
      '@angular/core': pkg.devDependencies['@angular/core'],
      '@angular/forms': pkg.devDependencies['@angular/forms'],
      '@ds-mo/icons': pkg.devDependencies['@ds-mo/icons'],
      '@ds-mo/tokens': pkg.devDependencies['@ds-mo/tokens'],
      '@ds-mo/ui': `file:${tarballPath}`,
      react: pkg.devDependencies.react,
      'react-dom': pkg.devDependencies['react-dom'],
    },
  }, null, 2));
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'], {
    cwd: smokeDir,
    stdio: 'inherit',
    env: npmEnv,
  });

  const smokeSource = `
    globalThis.HTMLElement = class HTMLElement {};
    globalThis.customElements = { get() {}, define() {} };
    await import('@angular/compiler');
    const native = await import('@ds-mo/ui/components/ds-button-filled.js');
    const angular = await import('@ds-mo/ui/angular');
    const angularComponent = await import('@ds-mo/ui/angular/ds-button-filled');
    const react = await import('@ds-mo/ui/react');
    const shell = await import('@ds-mo/ui/shell');
    const utils = await import('@ds-mo/ui/utils');
    const agent = await import('@ds-mo/ui/agent', { with: { type: 'json' } });
    for (const [surface, value] of [
      ['native', native.DsButtonFilled],
      ['angular', angular.DsButtonFilled],
      ['angular component subpath', angularComponent.DsButtonFilled],
      ['angular forms', angular.TextValueAccessor],
      ['react', react.DsButtonFilled],
      ['shell', shell.normalizeShellGradientPreset],
      ['utils', utils.resolveCssLengthPx],
      ['agent manifest', agent.default?.entries?.length],
    ]) {
      if (value == null) throw new Error('Missing ' + surface + ' export');
    }
  `;
  execFileSync('node', ['--input-type=module', '--eval', smokeSource], {
    cwd: smokeDir,
    stdio: 'inherit',
  });
  console.log('✅ Packed native, Angular, React, shell, utils, and agent entry points load successfully.');
} finally {
  rmSync(packDir, { recursive: true, force: true });
  rmSync(smokeDir, { recursive: true, force: true });
}
