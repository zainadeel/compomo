#!/usr/bin/env node
import { execFileSync, spawn } from 'node:child_process';

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const node = process.execPath;
const postBuildScripts = [
  'verify-framework-proxies.mjs',
  'patch-index-types.mjs',
  'verify-icons-externalized.mjs',
  'build-lib-exports.mjs',
  'build-style-exports.mjs',
  'build-framework-exports.mjs',
  'build-registry.mjs',
  'build-agent-manifest.mjs',
  'build-mcp.mjs',
  'verify-framework-proxies.mjs',
  'write-build-stamp.mjs',
];

let pipelineRunning = false;
let pipelinePending = false;
let stopped = false;
let stdoutBuffer = '';

function runCoherentPackagePipeline() {
  if (pipelineRunning) {
    pipelinePending = true;
    return;
  }
  pipelineRunning = true;
  do {
    pipelinePending = false;
    process.stdout.write('[package-dev] Finalizing publish-shaped package output…\n');
    for (const script of postBuildScripts) {
      execFileSync(node, [`scripts/${script}`], { stdio: 'inherit' });
    }
    process.stdout.write(
      '[package-dev] Package output is coherent; dist/.package-ready.json updated.\n'
    );
  } while (pipelinePending && !stopped);
  pipelineRunning = false;
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
