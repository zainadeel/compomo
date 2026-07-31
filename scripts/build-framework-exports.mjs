#!/usr/bin/env node
/** Compile generated framework adapters to publishable JavaScript and declarations. */
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { cleanFileProviderCollisions } from './clean-framework-proxies.mjs';

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

cleanFileProviderCollisions();

execFileSync(npx, ['tsc', '-p', 'tsconfig.react.json'], { stdio: 'inherit' });
execFileSync(npx, ['tsc', '-p', 'tsconfig.react-runtime.json'], { stdio: 'inherit' });
execFileSync(npx, ['ngc', '-p', 'tsconfig.angular.json'], { stdio: 'inherit' });

const stencilReactRuntime = '@stencil/react-output-target/runtime';
let rewrittenReactRuntimeImports = 0;
for (const file of readdirSync('dist/react').filter(
  name => name.endsWith('.js') || name.endsWith('.d.ts')
)) {
  const path = `dist/react/${file}`;
  const source = readFileSync(path, 'utf8');
  const publishSource = source.replaceAll(stencilReactRuntime, './react-runtime.js');
  if (source !== publishSource) {
    rewrittenReactRuntimeImports += 1;
    writeFileSync(path, publishSource);
  }
}
if (!rewrittenReactRuntimeImports) {
  throw new Error('Generated React adapters did not contain the expected Stencil runtime import');
}

const generatedAngularOutput = 'dist/.generated/angular';
if (!existsSync(generatedAngularOutput)) {
  throw new Error(`Missing compiled Angular proxy directory: ${generatedAngularOutput}`);
}
cpSync(generatedAngularOutput, 'dist/angular', { recursive: true });
rmSync('dist/.generated', { recursive: true, force: true });

for (const dir of ['dist/angular', 'dist/framework']) {
  for (const file of readdirSync(dir).filter(
    name => name.endsWith('.js') || name.endsWith('.d.ts')
  )) {
    const path = `${dir}/${file}`;
    const source = readFileSync(path, 'utf8');
    const publicPaths = source.replace(
      /\.\.\/\.generated\/angular\//g,
      '../angular/'
    );
    const publishSource = file.endsWith('.js')
      ? publicPaths.replace(
          /(from\s+['"])(\.\.?\/[^'"]+?)(['"])/g,
          (match, start, specifier, end) =>
            /\.[a-z]+$/i.test(specifier)
              ? match
              : `${start}${specifier}.js${end}`,
        )
      : publicPaths;
    writeFileSync(path, publishSource);
  }
}

console.log('  Built self-contained dist/react and dist/angular framework adapters');
