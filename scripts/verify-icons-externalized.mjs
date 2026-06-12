#!/usr/bin/env node
/**
 * CI guard: @ds-mo/icons must stay external — never inlined into dist/components/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist', 'components');

if (!fs.existsSync(DIST)) {
  console.error('❌ dist/components/ missing — run npm run build first');
  process.exit(1);
}

const jsFiles = fs.readdirSync(DIST).filter(name => name.endsWith('.js'));
const hasExternalImport = jsFiles.some(name => {
  const content = fs.readFileSync(path.join(DIST, name), 'utf8');
  return /from\s*['"]@ds-mo\/icons/.test(content) || /import\s*['"]@ds-mo\/icons/.test(content);
});

if (!hasExternalImport) {
  console.error('❌ dist/components/ must retain bare @ds-mo/icons imports (icons were likely bundled)');
  process.exit(1);
}

const sharedChunks = fs
  .readdirSync(DIST)
  .filter(name => name.startsWith('p-') && name.endsWith('.js'));

let failed = false;

for (const chunk of sharedChunks) {
  const filePath = path.join(DIST, chunk);
  const content = fs.readFileSync(filePath, 'utf8');
  const size = fs.statSync(filePath).size;
  const viewBoxCount = (content.match(/viewBox/g) ?? []).length;

  // Inlined IcoMo catalog is ~360KB+ with hundreds of SVG strings.
  if (size > 100_000 && viewBoxCount > 20) {
    console.error(
      `❌ ${chunk} (${size} bytes, ${viewBoxCount} viewBox hits) looks like an inlined IcoMo catalog`,
    );
    failed = true;
  }
}

if (failed) process.exit(1);

console.log('✅ @ds-mo/icons is externalized — no inlined icon catalog in dist/components/');
