import {
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
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

const PACKAGE_ARTIFACTS = [
  'dist/components/index.js',
  'dist/types/components.d.ts',
  'dist/react/components.js',
  'dist/framework/angular.js',
  'dist/agent.json',
];

/** Atomically publish a stamp only after every package artifact is coherent. */
export function writeBuildStamp() {
  const distDir = join(process.cwd(), 'dist');
  mkdirSync(distDir, { recursive: true });
  const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
  const registry = JSON.parse(
    readFileSync(join(process.cwd(), 'public/r/registry.json'), 'utf8')
  );
  const digest = createHash('sha256');
  for (const artifact of PACKAGE_ARTIFACTS) {
    digest.update(artifact);
    digest.update(readFileSync(join(process.cwd(), artifact)));
  }
  const payload = {
    schemaVersion: 1,
    package: pkg.name,
    version: pkg.version,
    components: registry.items?.length ?? 0,
    digest: digest.digest('hex'),
    completedAt: new Date().toISOString(),
  };
  const temporaryPath = join(distDir, '.package-ready.tmp');
  writeFileSync(temporaryPath, `${JSON.stringify(payload)}\n`);
  renameSync(temporaryPath, join(distDir, '.package-ready.json'));
  writePackageVersion();
}

/** Storybook's component-only watcher uses a distinct completion boundary. */
export function writeStorybookStamp() {
  const distDir = join(process.cwd(), 'dist');
  mkdirSync(distDir, { recursive: true });
  const temporaryPath = join(distDir, '.storybook-ready.tmp');
  writeFileSync(temporaryPath, String(Date.now()));
  renameSync(temporaryPath, join(distDir, '.storybook-ready'));
  writePackageVersion();
}

const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  if (process.argv.includes('--storybook')) writeStorybookStamp();
  else writeBuildStamp();
}
