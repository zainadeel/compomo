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

export function isBrowserNeutralPath(filePath) {
  return browserNeutralPaths.some((pattern) => pattern.test(filePath));
}

export function requiresBrowserValidation(filePaths) {
  return filePaths.length === 0 || filePaths.some((filePath) => !isBrowserNeutralPath(filePath));
}

async function run() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const filePaths = Buffer.concat(chunks)
    .toString('utf8')
    .split('\0')
    .filter(Boolean);
  const browser = requiresBrowserValidation(filePaths);

  process.stdout.write(`browser=${browser}\n`);
  process.stderr.write(
    `${browser ? 'Running' : 'Skipping'} browser validation for ${filePaths.length} changed path(s).\n`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await run();
}
