import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { build } from 'esbuild';
const results = [];
for (const entry of ['ds-table', 'ds-chart', 'ds-markdown', 'ds-icon']) {
  const result = await build({
    entryPoints: [`dist/components/${entry}.js`],
    bundle: true,
    splitting: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    minify: true,
    write: false,
    metafile: true,
    outdir: 'perf-bundle',
    external: ['@ds-mo/*'],
    logLevel: 'silent',
  });
  const outputs = result.metafile.outputs;
  const main = Object.keys(outputs).find(
    file => outputs[file].entryPoint === `dist/components/${entry}.js`
  );
  function closure(start, dynamic) {
    const seen = new Set();
    const visit = file => {
      if (seen.has(file)) return;
      seen.add(file);
      for (const imp of outputs[file].imports) {
        if (!imp.external && (dynamic || imp.kind !== 'dynamic-import')) visit(imp.path);
      }
    };
    visit(start);
    return seen;
  }
  const staticFiles = closure(main, false),
    allFiles = closure(main, true);
  const bytes = files =>
    result.outputFiles
      .filter(file => files.has(path.relative(process.cwd(), file.path)))
      .reduce((sum, file) => sum + gzipSync(file.contents).byteLength, 0);
  results.push({
    entry,
    staticGzipBytes: bytes(staticFiles),
    includingLazyGzipBytes: bytes(allFiles),
    peerDependenciesExcluded: true,
  });
}
console.log(JSON.stringify(results, null, 2));
