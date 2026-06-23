#!/usr/bin/env node
/**
 * Ensures npm pack includes every source tree reachable from package exports
 * (e.g. @ds-mo/ui/nav → src/wc/utils). Run after `npm run build`.
 */
import { execSync } from 'node:child_process';

const REQUIRED_PATHS = [
  'src/wc/utils/index.ts',
  'src/wc/utils/resolve-css-length-px.ts',
  'src/wc/utils/resolve-css-time-ms.ts',
  'src/wc/utils/token-defaults.ts',
  'src/wc/nav/index.ts',
  'src/wc/nav/shell-view-transition.ts',
  'src/wc/nav/nav-chrome.ts',
  'src/wc/nav/shell-gradient.ts',
];

const output = execSync('npm pack --dry-run 2>&1', { encoding: 'utf8' });

const packed = new Set();
for (const line of output.split('\n')) {
  const match = line.match(/\ssrc\/wc\/\S+/);
  if (match) packed.add(match[0].trim());
}

const missing = REQUIRED_PATHS.filter(path => !packed.has(path));
if (missing.length > 0) {
  console.error('❌ npm pack is missing paths required by @ds-mo/ui/nav and @ds-mo/ui/utils:\n');
  for (const path of missing) console.error(`  - ${path}`);
  console.error('\nAdd missing trees to package.json "files" and re-run.');
  process.exit(1);
}

console.log('✅ npm pack includes nav + utils source trees.');
