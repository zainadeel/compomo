#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
import { ROOT } from './component-inventory.mjs';
import { createLintContracts } from './lint-contracts.mjs';
import { writeBundleNotices } from './bundle-notices.mjs';

const contracts = createLintContracts({ requireCompiler: true });
const output = path.join(ROOT, 'dist/lint');
fs.mkdirSync(output, { recursive: true });
const result = await build({
  absWorkingDir: ROOT,
  entryPoints: ['lint/index.js'],
  outfile: 'dist/lint/index.js',
  bundle: true,
  // The CJS distribution statically imports CSS grammar JSON, so esbuild can
  // include it instead of leaving createRequire(import.meta.url) data reads.
  alias: { 'css-tree': path.join(ROOT, 'node_modules/css-tree/cjs/index.cjs') },
  platform: 'node',
  format: 'esm',
  target: 'node20.19',
  external: ['eslint', '@eslint/css'],
  metafile: true,
  banner: {
    js: 'import { createRequire as __lintCreateRequire } from "node:module";\nconst require = __lintCreateRequire(import.meta.url);',
  },
  plugins: [
    {
      name: 'published-contracts',
      setup(builder) {
        builder.onResolve({ filter: /^\.\/contracts\.js$/ }, args =>
          args.importer.endsWith('/lint/index.js')
            ? { path: 'contracts', namespace: 'lint-contracts' }
            : undefined
        );
        builder.onLoad({ filter: /.*/, namespace: 'lint-contracts' }, () => ({
          contents: 'export default ' + JSON.stringify(contracts),
          loader: 'js',
        }));
      },
    },
  ],
});
if (
  Object.keys(result.metafile.inputs).some(
    name => name.includes('node_modules/stylelint/') || name.startsWith('scripts/')
  )
)
  throw new Error('Lint package contains an engine or repository-only dependency.');
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.lint.json'], {
  cwd: ROOT,
  stdio: 'inherit',
});
for (const [source, target] of [
  ['public-api.d.ts', 'index.d.ts'],
  ['types.d.ts', 'types.d.ts'],
])
  fs.copyFileSync(path.join(ROOT, 'dist/lint-types', source), path.join(output, target));
fs.rmSync(path.join(ROOT, 'dist/lint-types'), { recursive: true, force: true });
fs.copyFileSync(path.join(ROOT, 'lint/css/LICENSE'), path.join(output, 'STYLELINT-LICENSE'));
writeBundleNotices({
  inputs: Object.keys(result.metafile.inputs),
  root: ROOT,
  output,
  preamble: fs.readFileSync(path.join(ROOT, 'lint/css/LICENSE'), 'utf8'),
});
console.log(
  `  Built optional lint entry with ${Object.keys(contracts).length} validated component contracts`
);
