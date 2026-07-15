#!/usr/bin/env node
/** Verify generated framework adapters exactly match the Stencil source inventory. */
import { discoverComponents, validateFrameworkAdapters } from './component-inventory.mjs';

const errors = validateFrameworkAdapters({ components: discoverComponents() });
if (errors.length) {
  throw new Error(`Framework proxy inventory is stale:\n${errors.map(error => `  - ${error}`).join('\n')}`);
}

console.log('✅ Angular and React proxies match the Stencil component inventory.');
