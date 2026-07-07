import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Write package name/version for Storybook manager (runtime fetch — survives git pull without restart). */
export function writePackageVersion() {
  const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
  const staticDir = join(process.cwd(), '.storybook/static');
  mkdirSync(staticDir, { recursive: true });
  writeFileSync(
    join(staticDir, 'package-version.json'),
    `${JSON.stringify({ name: pkg.name, version: pkg.version })}\n`,
  );
}

/** Touch dist/.build-stamp so Storybook's Vite watcher full-reloads the canvas. */
export function writeBuildStamp() {
  const distDir = join(process.cwd(), 'dist');
  mkdirSync(distDir, { recursive: true });
  writeFileSync(join(distDir, '.build-stamp'), String(Date.now()));
  writePackageVersion();
}

const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  writeBuildStamp();
}
