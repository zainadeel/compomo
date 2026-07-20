#!/usr/bin/env node
/**
 * Compile the /shell, /toast, and /utils subpath exports to dist/lib (bundled ESM + d.ts).
 *
 * These subpaths used to ship raw TypeScript source, which made consumer
 * type-checking depend on OUR devDependencies (@stencil/core types) and broke
 * toolchains that don't transpile node_modules TS (Angular karma builder
 * resolved named exports to undefined; Next.js needs transpilePackages).
 * See https://github.com/zainadeel/compomo/issues/257.
 *
 * Each entry is bundled to a single ESM file (no extensionless relative
 * imports — plain Node can import them) with @ds-mo/* peers kept external.
 * Declarations are emitted per-module by tsc (tsconfig.lib.json) so types
 * resolve through the d.ts graph.
 */
import { execSync } from 'node:child_process';
import { build } from 'esbuild';

await build({
  entryPoints: [
    'src/wc/shell/index.ts',
    'src/wc/toast/index.ts',
    'src/wc/utils/index.ts',
  ],
  outdir: 'dist/lib',
  outbase: 'src/wc',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  external: ['@ds-mo/*'],
  sourcemap: true,
});

execSync('npx tsc -p tsconfig.lib.json', { stdio: 'inherit' });

console.log('  Built dist/lib exports (shell, toast, utils): bundled ESM + declarations');
