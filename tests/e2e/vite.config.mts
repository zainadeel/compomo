import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const dir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dir, '../..');

export default defineConfig({
  root: path.join(dir, 'fixtures'),
  server: {
    port: 5199,
    fs: { allow: [repoRoot] },
  },
  resolve: {
    alias: {
      '/dist': path.join(repoRoot, 'dist'),
      '/tokens': path.join(repoRoot, 'node_modules/@ds-mo/tokens/dist'),
    },
  },
});
