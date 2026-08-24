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
const stencilReactRuntime = '@stencil/react-output-target/runtime';
const stencilVueRuntime = '@stencil/vue-output-target/runtime';

const VUE_RUNTIME_DTS = `import type {
  AllowedComponentProps,
  ComponentCustomProps,
  DefineSetupFnComponent,
  VNodeProps,
} from 'vue';

export type StencilVueComponent<
  Props,
  VModelType = string | number | boolean,
> = DefineSetupFnComponent<
  Props & { modelValue?: VModelType } & VNodeProps & AllowedComponentProps & ComponentCustomProps,
  {},
  {},
  Props & { modelValue?: VModelType } & VNodeProps & AllowedComponentProps & ComponentCustomProps
>;

export declare function defineContainer<
  Props,
  VModelType = string | number | boolean,
>(
  name: string,
  defineCustomElement?: () => void,
  componentProps?: string[],
  emitProps?: string[],
  modelProp?: string,
  modelUpdateEvent?: string,
  modelUpdateEventAttribute?: string,
  transformTagFn?: (tagName: string) => string,
): StencilVueComponent<Props, VModelType>;

export declare function defineStencilSSRComponent(...args: never[]): never;
`;

function rewriteRuntimeImports(directory, stencilRuntime, localRuntime, label, skip = []) {
  const skipNames = new Set(skip);
  let rewritten = 0;
  for (const file of readdirSync(directory, { withFileTypes: true })) {
    if (!file.isFile() || !(file.name.endsWith('.js') || file.name.endsWith('.d.ts'))) continue;
    if (skipNames.has(file.name)) continue;
    const path = `${directory}/${file.name}`;
    const source = readFileSync(path, 'utf8');
    const publishSource = source.replaceAll(stencilRuntime, localRuntime);
    if (source !== publishSource) {
      rewritten += 1;
      writeFileSync(path, publishSource);
    }
  }
  if (!rewritten) {
    throw new Error(`Generated ${label} adapters did not contain the expected Stencil runtime import`);
  }
}

cleanFileProviderCollisions();

execFileSync(npx, ['tsc', '-p', 'tsconfig.react.json'], { stdio: 'inherit' });
execFileSync(npx, ['tsc', '-p', 'tsconfig.react-runtime.json'], { stdio: 'inherit' });
execFileSync(npx, ['tsc', '-p', 'tsconfig.vue.json'], { stdio: 'inherit' });
execFileSync(npx, ['ngc', '-p', 'tsconfig.angular.json'], { stdio: 'inherit' });

rewriteRuntimeImports('dist/react', stencilReactRuntime, './react-runtime.js', 'React');

execFileSync(
  npx,
  [
    'esbuild',
    'src/framework/vue-runtime.ts',
    '--bundle',
    '--format=esm',
    '--platform=neutral',
    '--outfile=dist/vue/vue-runtime.js',
    '--external:vue',
    '--external:vue/server-renderer',
  ],
  { stdio: 'inherit' },
);
writeFileSync('dist/vue/vue-runtime.d.ts', VUE_RUNTIME_DTS);
rewriteRuntimeImports('dist/vue', stencilVueRuntime, './vue-runtime.js', 'Vue', [
  'vue-runtime.js',
  'vue-runtime.d.ts',
]);
if (/(?:from|import)\s*['"]@stencil\/vue-output-target/.test(readFileSync('dist/vue/vue-runtime.js', 'utf8'))) {
  throw new Error('Bundled Vue runtime still imports @stencil/vue-output-target');
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

console.log('  Built self-contained dist/react, dist/vue, and dist/angular framework adapters');
