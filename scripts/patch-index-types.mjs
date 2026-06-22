#!/usr/bin/env node
/**
 * Appends nav type re-exports to Stencil's generated dist/components/index.d.ts
 * so consumers can `import type { BarNavTab, PanelNavGroup } from '@ds-mo/ui'`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = join(root, 'dist/components/index.d.ts');

const marker = '// --- nav type re-exports (patch-index-types.mjs) ---';
const patch = `
${marker}
export type {
  NavChromeStyle,
  PanelNavRouterMode,
  PanelNavItem,
  PanelNavGroup,
} from '../types/components/PanelNav/panel-nav-types';
export type {
  BarNavTab,
  BarNavActionItem,
} from '../types/components/BarNav/bar-nav-types';
`;

const existing = readFileSync(indexPath, 'utf8');
if (existing.includes(marker)) {
  process.exit(0);
}

writeFileSync(indexPath, existing.trimEnd() + patch + '\n');
