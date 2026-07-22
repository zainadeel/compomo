#!/usr/bin/env node
/** Remove only Stencil-generated React and Angular source adapters. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');

const FRAMEWORK_OUTPUTS = [
  { directory: 'src/react', barrels: ['components.ts'] },
  { directory: 'src/angular', barrels: ['proxies.ts', 'index.ts'] },
];

const FILE_PROVIDER_COLLISION_OUTPUTS = [
  { directory: 'src/react', pattern: / \d+\.ts$/ },
  { directory: 'src/angular', pattern: / \d+\.ts$/ },
  { directory: 'public/r', pattern: / \d+\.json$/ },
  { directory: 'src/wc/components', pattern: / \d+\.(?:css|json|mdx|ts|tsx)$/ },
  { directory: 'tests', pattern: / \d+\.(?:html|mjs|ts)$/ },
  { directory: 'dist', pattern: / \d+\.[a-z0-9.]+$/i },
  { directory: 'storybook-static', pattern: / \d+\.[a-z0-9.]+$/i },
];

// Include Apple File Provider collision copies such as `ds-toggle 2.ts`: they
// are still generated proxy artifacts and TypeScript includes them in builds.
const COMPONENT_PROXY_FILENAME = /^ds-[a-z0-9]+(?:-[a-z0-9]+)*(?: \d+)?\.ts$/;

function isGeneratedBarrel(filename, barrels) {
  return barrels.some(barrel => {
    const stem = barrel.slice(0, -3);
    return filename === barrel || new RegExp(`^${stem} \\d+\\.ts$`).test(filename);
  });
}

function posix(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function listFileProviderCollisions(directory, root, pattern, collisions) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      listFileProviderCollisions(absolutePath, root, pattern, collisions);
    } else if (entry.isFile() && pattern.test(entry.name)) {
      collisions.push(posix(path.relative(root, absolutePath)));
    }
  }
}

export function cleanFileProviderCollisions(root = ROOT) {
  const collisions = [];
  for (const { directory, pattern } of FILE_PROVIDER_COLLISION_OUTPUTS) {
    listFileProviderCollisions(path.join(root, directory), root, pattern, collisions);
  }
  for (const relativePath of collisions) {
    fs.rmSync(path.join(root, relativePath), { force: true });
  }
  return collisions.sort();
}

export function listFrameworkComponentProxies(
  root = ROOT,
  { includeCollisionCopies = false } = {}
) {
  const proxies = [];
  for (const { directory } of FRAMEWORK_OUTPUTS) {
    const absoluteDirectory = path.join(root, directory);
    if (!fs.existsSync(absoluteDirectory)) continue;
    for (const entry of fs.readdirSync(absoluteDirectory, { withFileTypes: true })) {
      if (
        entry.isFile() &&
        COMPONENT_PROXY_FILENAME.test(entry.name) &&
        (includeCollisionCopies || !/ \d+\.ts$/.test(entry.name))
      ) {
        proxies.push(posix(path.join(directory, entry.name)));
      }
    }
  }
  return proxies.sort();
}

export function cleanFrameworkProxies(root = ROOT) {
  const generatedArtifacts = [
    ...listFrameworkComponentProxies(root, { includeCollisionCopies: true }),
    ...cleanFileProviderCollisions(root),
  ];
  for (const { directory, barrels } of FRAMEWORK_OUTPUTS) {
    const absoluteDirectory = path.join(root, directory);
    if (!fs.existsSync(absoluteDirectory)) continue;
    for (const entry of fs.readdirSync(absoluteDirectory, { withFileTypes: true })) {
      if (entry.isFile() && isGeneratedBarrel(entry.name, barrels)) {
        generatedArtifacts.push(posix(path.join(directory, entry.name)));
      }
    }
  }

  const removed = [...new Set(generatedArtifacts)].sort();
  for (const relativePath of removed) fs.rmSync(path.join(root, relativePath), { force: true });

  // Stencil caches output hashes independently from the generated source files.
  // Clear that derived cache with the proxies so a clean build/watch cannot skip
  // recreating an unchanged adapter that was just removed above.
  fs.rmSync(path.join(root, '.stencil'), { recursive: true, force: true });

  return removed;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const removed = cleanFrameworkProxies();
  console.log(
    `Cleaned ${removed.length} generated framework proxy artifact${
      removed.length === 1 ? '' : 's'
    }.`
  );
}
