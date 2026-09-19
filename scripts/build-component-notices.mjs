import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './component-inventory.mjs';
import { writeBundleNotices } from './bundle-notices.mjs';

const output = path.join(ROOT, 'dist/components');
const maps = fs.readdirSync(output).filter(file => file.endsWith('.js.map'));
if (!maps.length) throw new Error('Component notices require Stencil source maps.');
const inputs = new Set(
  maps.flatMap(file => {
    const map = JSON.parse(fs.readFileSync(path.join(output, file), 'utf8'));
    if (!Array.isArray(map.sources)) throw new Error(`Missing component bundle inputs: ${file}`);
    return map.sources;
  })
);
writeBundleNotices({ inputs, root: ROOT, output });
