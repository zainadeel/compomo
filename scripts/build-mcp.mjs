#!/usr/bin/env node

import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const mcpDir = path.join(distDir, 'mcp');
const registryOutputDir = path.join(distDir, 'mcp-data', 'registry');
const registrySourceDir = path.join(root, 'public', 'r');
const entryPoint = path.join(root, 'scripts', 'mcp-server.mjs');
const outputFile = path.join(mcpDir, 'cli.js');

for (const requiredPath of [
  path.join(registrySourceDir, 'registry.json'),
  path.join(distDir, 'agent-patterns.json'),
]) {
  if (!fs.existsSync(requiredPath)) {
    throw new Error(`Cannot build the packaged MCP server: missing ${path.relative(root, requiredPath)}`);
  }
}

fs.rmSync(mcpDir, { recursive: true, force: true });
fs.rmSync(path.dirname(registryOutputDir), { recursive: true, force: true });
fs.mkdirSync(mcpDir, { recursive: true });
fs.mkdirSync(registryOutputDir, { recursive: true });

for (const entry of fs.readdirSync(registrySourceDir, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
  fs.copyFileSync(
    path.join(registrySourceDir, entry.name),
    path.join(registryOutputDir, entry.name),
  );
}

await build({
  entryPoints: [entryPoint],
  outfile: outputFile,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  legalComments: 'none',
  sourcemap: false,
});

fs.chmodSync(outputFile, 0o755);
console.log(`  Built dist/mcp/cli.js with ${fs.readdirSync(registryOutputDir).length} registry files`);
