#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const lockPath = path.join(repoRoot, 'package-lock.json');

if (!fs.existsSync(lockPath)) {
  console.error('Run this command from the CompoMo repository root.');
  process.exit(1);
}

const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
const playwrightVersion = lock.packages?.['node_modules/@playwright/test']?.version;

if (!playwrightVersion) {
  console.error('Could not resolve @playwright/test from package-lock.json.');
  process.exit(1);
}

const image = `mcr.microsoft.com/playwright:v${playwrightVersion}-noble`;
const dependencyVolume = `compomo-playwright-${playwrightVersion.replaceAll('.', '-')}-node-modules`;
const dockerBase = [
  'run',
  '--rm',
  '--ipc=host',
  '--volume',
  `${repoRoot}:/work`,
  '--volume',
  `${dependencyVolume}:/work/node_modules`,
  '--workdir',
  '/work',
  image,
];

function runDocker(args, stdio = 'inherit') {
  return spawnSync('docker', [...dockerBase, ...args], {
    cwd: repoRoot,
    stdio,
  });
}

const dockerInfo = spawnSync('docker', ['info'], { stdio: 'ignore' });
if (dockerInfo.error?.code === 'ENOENT') {
  console.error('Docker CLI is required. On macOS: brew install colima docker');
  process.exit(1);
}
if (dockerInfo.status !== 0) {
  console.error('Docker is not running. On macOS: colima start --cpu 4 --memory 8');
  process.exit(1);
}

const mountProbe = runDocker(['test', '-f', '/work/package-lock.json'], 'ignore');
if (mountProbe.status !== 0) {
  console.error(`Docker cannot read this worktree: ${repoRoot}`);
  console.error('For an isolated macOS worktree, restart Colima with that exact path mounted:');
  console.error('  colima stop');
  console.error(`  colima start --cpu 4 --memory 8 --mount ${JSON.stringify(`${repoRoot}:w`)}`);
  process.exit(1);
}

const install = runDocker(['npm', 'ci', '--ignore-scripts', '--no-audit', '--no-fund']);
if (install.status !== 0) process.exit(install.status ?? 1);

const test = runDocker([
  'npx',
  'playwright',
  'test',
  '--project=firefox',
  ...process.argv.slice(2),
]);
process.exit(test.status ?? 1);
