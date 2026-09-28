import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const postBuildScripts = [
  'build-component-notices.mjs',
  'verify-framework-proxies.mjs',
  'patch-index-types.mjs',
  'verify-icons-externalized.mjs',
  'build-lib-exports.mjs',
  'build-style-exports.mjs',
  'build-framework-exports.mjs',
  'build-registry.mjs',
  'build-agent-manifest.mjs',
  'build-lint.mjs',
  'build-mcp.mjs',
  'verify-framework-proxies.mjs',
  'write-build-stamp.mjs',
];

/** Finalize Stencil output in dependency order, publishing readiness only on success. */
export function finalizePackage() {
  for (const script of postBuildScripts) {
    execFileSync(process.execPath, [`scripts/${script}`], { stdio: 'inherit' });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  finalizePackage();
}
