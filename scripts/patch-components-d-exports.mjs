#!/usr/bin/env node
/**
 * Appends menu placement re-exports to Stencil's generated src/wc/components.d.ts
 * so consumers can `import { PANEL_NAV_USER_MENU_PLACEMENT } from '@ds-mo/ui'`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const typesPath = join(root, 'src/wc/components.d.ts');

const marker = '// --- menu placement re-exports (patch-components-d-exports.mjs) ---';
const patch = `
${marker}
export { PANEL_NAV_USER_MENU_PLACEMENT, type MenuPlacement } from "./components/Menu/menu-types";
`;

const existing = readFileSync(typesPath, 'utf8');
if (existing.includes(marker)) {
  process.exit(0);
}

writeFileSync(typesPath, existing.trimEnd() + patch + '\n');
