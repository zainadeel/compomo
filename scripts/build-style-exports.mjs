#!/usr/bin/env node
/** Copy public, renderer-neutral CSS surfaces into the publish artifact. */
import { copyFile, mkdir } from 'node:fs/promises';

await mkdir('dist/styles', { recursive: true });
await copyFile('src/wc/styles/prose.css', 'dist/styles/prose.css');

console.log('  Built dist/styles exports (prose.css)');
