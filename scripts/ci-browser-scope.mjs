import { execFileSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';
import { pathToFileURL } from 'node:url';

const browserNeutralPaths = [
  /^(?:AGENTS|CHANGELOG|README)\.md$/,
  /^\.release-please-manifest\.json$/,
  /^release-please-config\.json$/,
  /^agent\//,
  /^docs\//,
  /^public\/r\//,
  /^src\/docs\//,
  /^src\/wc\/components\/[^/]+\/[^/]+\.agent\.json$/,
];

const packagePaths = new Set(['package.json', 'package-lock.json']);

export function isVersionOnlyPackageChange(filePath, before, after) {
  if (!packagePaths.has(filePath)) return false;
  try {
    const normalize = source => {
      const value = JSON.parse(source);
      if (!value || Array.isArray(value) || typeof value.version !== 'string') {
        throw new Error('Missing package version');
      }
      delete value.version;
      if (filePath === 'package-lock.json') {
        const rootPackage = value.packages?.[''];
        if (!rootPackage || typeof rootPackage.version !== 'string') {
          throw new Error('Missing root lockfile package');
        }
        delete rootPackage.version;
      }
      return value;
    };
    return isDeepStrictEqual(normalize(before), normalize(after));
  } catch {
    return false;
  }
}

export function isBrowserNeutralPath(filePath) {
  return browserNeutralPaths.some(pattern => pattern.test(filePath));
}

function isNeutral(filePath, versionOnlyPaths) {
  return (
    isBrowserNeutralPath(filePath) || (packagePaths.has(filePath) && versionOnlyPaths.has(filePath))
  );
}

export function requiresBrowserValidation(filePaths, versionOnlyPaths = new Set()) {
  return (
    filePaths.length === 0 ||
    filePaths.some(
      filePath =>
        !isNeutral(filePath, versionOnlyPaths) &&
        !/^tests\/[^/]+\.test\.ts$/.test(filePath) &&
        !/\.stories\.ts$/.test(filePath) &&
        !filePath.startsWith('.storybook/')
    )
  );
}

export function requiresStorybookValidation(filePaths, versionOnlyPaths = new Set()) {
  return (
    filePaths.length === 0 ||
    filePaths.some(
      filePath =>
        !isNeutral(filePath, versionOnlyPaths) &&
        !filePath.startsWith('tests/e2e/') &&
        !/^tests\/[^/]+\.test\.ts$/.test(filePath)
    )
  );
}

async function run() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const filePaths = Buffer.concat(chunks).toString('utf8').split('\0').filter(Boolean);
  const versionOnlyPaths = new Set();
  const { BASE_SHA: base, HEAD_SHA: head } = process.env;
  if ([base, head].every(sha => /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(sha ?? ''))) {
    for (const filePath of filePaths.filter(file => packagePaths.has(file))) {
      try {
        const before = execFileSync('git', ['show', `${base}:${filePath}`], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        const after = execFileSync('git', ['show', `${head}:${filePath}`], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        if (isVersionOnlyPackageChange(filePath, before, after)) versionOnlyPaths.add(filePath);
      } catch {
        // Missing revisions/files are unknown changes: retain both suites.
      }
    }
  }
  const browser = requiresBrowserValidation(filePaths, versionOnlyPaths);
  const storybook = requiresStorybookValidation(filePaths, versionOnlyPaths);

  process.stdout.write(`browser=${browser}\n`);
  process.stdout.write(`storybook=${storybook}\n`);
  process.stderr.write(
    `${browser ? 'Running' : 'Skipping'} browser validation for ${filePaths.length} changed path(s).\n`
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await run();
}
