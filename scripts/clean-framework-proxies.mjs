#!/usr/bin/env node
/** Remove artifacts only inside build-owned output directories. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');

const FRAMEWORK_OUTPUTS = ['src/.generated/react', 'src/.generated/vue', 'src/.generated/angular'];
const COLLISION_OUTPUTS = [
  ...FRAMEWORK_OUTPUTS.map(directory => ({ directory, pattern: / \d+\.ts$/ })),
  { directory: 'public/r', pattern: / \d+\.json$/ },
  { directory: 'dist', pattern: / \d+\.[a-z0-9.]+$/i },
  { directory: 'storybook-static', pattern: / \d+\.[a-z0-9.]+$/i },
];
const AUTHORED_DIRECTORIES = ['src/wc/components', 'tests', 'src/react', 'src/vue', 'src/angular'];
const COMPONENT_PROXY_FILENAME = /^ds-[a-z0-9]+(?:-[a-z0-9]+)*(?: \d+)?\.ts$/;

// Neither an output directory nor any of its parents may redirect cleanup
// through a symlink. Nested symlinks are also excluded from traversal.
function isRealDirectory(root, relativePath) {
  let current = root;
  for (const segment of relativePath.split('/')) {
    current = path.join(current, segment);
    const stat = fs.lstatSync(current, { throwIfNoEntry: false });
    if (!stat?.isDirectory() || stat.isSymbolicLink()) return false;
  }
  return true;
}

function filesIn(root, directory, matches, recursive = true) {
  if (!isRealDirectory(root, directory)) return [];
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap(entry => {
    const relativePath = `${directory}/${entry.name}`;
    if (recursive && entry.isDirectory()) return filesIn(root, relativePath, matches);
    return entry.isFile() && matches(entry.name) ? [relativePath] : [];
  });
}

export function findAuthoredFileProviderCollisions(root = ROOT) {
  return AUTHORED_DIRECTORIES.flatMap(directory =>
    filesIn(root, directory, name => / \d+\.(?:css|html|js|json|mdx|mjs|ts|tsx)$/.test(name))
  ).sort();
}

export function reportAuthoredFileProviderCollisions(collisions) {
  if (!collisions.length) return;
  console.warn(
    'Possible File Provider copies in authored directories were preserved. Review and resolve them manually:\n' +
      collisions.map(file => `  - ${file}`).join('\n')
  );
}

export function cleanFileProviderCollisions(root = ROOT) {
  const collisions = COLLISION_OUTPUTS.flatMap(({ directory, pattern }) =>
    filesIn(root, directory, name => pattern.test(name))
  ).sort();
  for (const relativePath of collisions) fs.rmSync(path.join(root, relativePath), { force: true });
  return collisions;
}

export function listFrameworkComponentProxies(
  root = ROOT,
  { includeCollisionCopies = false } = {}
) {
  return FRAMEWORK_OUTPUTS.flatMap(directory =>
    filesIn(
      root,
      directory,
      name =>
        COMPONENT_PROXY_FILENAME.test(name) && (includeCollisionCopies || !/ \d+\.ts$/.test(name)),
      false
    )
  ).sort();
}

export function cleanFrameworkProxies(root = ROOT) {
  const generated = 'src/.generated';
  const removed = filesIn(root, generated, () => true);
  if (isRealDirectory(root, generated)) {
    fs.rmSync(path.join(root, generated), { recursive: true, force: true });
  }
  removed.push(...cleanFileProviderCollisions(root));

  // Stencil's output hashes must be invalidated when adapter files are removed.
  if (isRealDirectory(root, '.stencil')) {
    fs.rmSync(path.join(root, '.stencil'), { recursive: true, force: true });
  }
  return removed.sort();
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const removed = cleanFrameworkProxies();
  reportAuthoredFileProviderCollisions(findAuthoredFileProviderCollisions());
  console.log(`Cleaned ${removed.length} generated framework proxy artifacts.`);
}
