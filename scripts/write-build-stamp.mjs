import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Touch dist/.build-stamp so Storybook's Vite watcher full-reloads the canvas. */
export function writeBuildStamp() {
  const distDir = join(process.cwd(), 'dist');
  mkdirSync(distDir, { recursive: true });
  writeFileSync(join(distDir, '.build-stamp'), String(Date.now()));
}

const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  writeBuildStamp();
}
