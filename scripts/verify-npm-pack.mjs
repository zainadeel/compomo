#!/usr/bin/env node
/** Verify the publish artifact is compiled, complete, and free of stale component trees. */
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REQUIRED_PATHS = [
  'dist/components/index.js',
  'dist/types/components.d.ts',
  'dist/lib/shell/index.js',
  'dist/lib/shell/index.d.ts',
  'dist/lib/toast/index.js',
  'dist/lib/toast/index.d.ts',
  'dist/lib/utils/index.js',
  'dist/lib/utils/index.d.ts',
  'dist/styles/control-elevation.css',
  'dist/styles/prose.css',
  'dist/react/components.js',
  'dist/react/components.d.ts',
  'dist/framework/angular.js',
  'dist/framework/angular.d.ts',
  'dist/agent.json',
  'dist/agent-patterns.json',
  'dist/mcp/cli.js',
  'dist/mcp-data/registry/registry.json',
  'dist/mcp-data/registry/menu.json',
];

const npmEnv = { ...process.env, npm_config_cache: join(tmpdir(), 'ds-mo-npm-cache') };
const pack = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json'], {
  encoding: 'utf8',
  env: npmEnv,
}));
const packed = new Set(pack[0].files.map(file => file.path));
const missing = REQUIRED_PATHS.filter(path => !packed.has(path));
if (missing.length) {
  throw new Error(`npm pack is missing required compiled files:\n${missing.map(path => `  - ${path}`).join('\n')}`);
}

const sourceFiles = [...packed].filter(path => path.startsWith('src/') && /\.(?:ts|tsx)$/.test(path));
if (sourceFiles.length) {
  throw new Error(`npm pack contains source TypeScript:\n${sourceFiles.map(path => `  - ${path}`).join('\n')}`);
}

const sourceComponents = new Set(
  readdirSync('src/wc/components', { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name),
);
const emittedComponents = readdirSync('dist/types/components', { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name);
const staleComponents = emittedComponents.filter(name => !sourceComponents.has(name));
if (staleComponents.length) {
  throw new Error(`dist contains stale component declarations: ${staleComponents.join(', ')}`);
}

console.log('✅ npm pack contains compiled public surfaces with no source TypeScript or stale components.');
