#!/usr/bin/env node
/** Compile generated framework adapters to publishable JavaScript and declarations. */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { cleanFileProviderCollisions } from './clean-framework-proxies.mjs';

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

cleanFileProviderCollisions();

execFileSync(npx, ['tsc', '-p', 'tsconfig.react.json'], { stdio: 'inherit' });
execFileSync(npx, ['ngc', '-p', 'tsconfig.angular.json'], { stdio: 'inherit' });

for (const dir of ['dist/angular', 'dist/framework']) {
  for (const file of readdirSync(dir).filter(name => name.endsWith('.js'))) {
    const path = `${dir}/${file}`;
    const source = readFileSync(path, 'utf8');
    const withExtensions = source.replace(
      /(from\s+['"])(\.\.?\/[^'"]+?)(['"])/g,
      (match, start, specifier, end) => /\.[a-z]+$/i.test(specifier) ? match : `${start}${specifier}.js${end}`,
    );
    writeFileSync(path, withExtensions);
  }
}

console.log('  Built dist/react and dist/angular framework adapters');
