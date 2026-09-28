#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { finalizePackage } from './finalize-package.mjs';

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
let stopped = false;
let stdoutBuffer = '';

function runCoherentPackagePipeline() {
  process.stdout.write('[package-dev] Finalizing publish-shaped package output…\n');
  finalizePackage();
  process.stdout.write(
    '[package-dev] Package output is coherent; dist/.package-ready.json updated.\n'
  );
}

const watcher = spawn(npx, ['stencil', 'build', '--watch'], {
  stdio: ['inherit', 'pipe', 'inherit'],
});

watcher.stdout.setEncoding('utf8');
watcher.stdout.on('data', chunk => {
  process.stdout.write(chunk);
  stdoutBuffer += chunk;
  const lines = stdoutBuffer.split(/\r?\n/);
  stdoutBuffer = lines.pop() ?? '';
  for (const line of lines) {
    if (line.includes('build finished')) runCoherentPackagePipeline();
  }
});

watcher.on('exit', code => {
  if (!stopped) process.exit(code ?? 1);
});

const shutdown = signal => {
  if (stopped) return;
  stopped = true;
  watcher.kill(signal);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
