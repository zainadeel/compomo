#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { ROOT, readJson } from './component-inventory.mjs';

const packageJson = readJson(ROOT, 'package.json');
const registry = readJson(ROOT, 'public/r/registry.json');
const outputPath = path.join(ROOT, 'dist/agent.json');

const manifest = {
  schemaVersion: '1.0.0',
  package: packageJson.name,
  packageVersion: packageJson.version,
  kind: 'components',
  entries: registry.items.map(item => ({
    id: `component:ds-${item.name}`,
    tag: `ds-${item.name}`,
    name: item.name,
    title: item.title,
    summary: item.description,
    intentStatus: item.meta.intentStatus,
    intent: item.meta.intent,
    api: {
      props: item.meta.props,
      events: item.meta.events,
      slots: item.meta.slots,
    },
    exports: item.meta.exports,
    dependencies: item.dependencies,
    componentDependencies: item.registryDependencies,
  })),
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`  Built dist/agent.json (${manifest.entries.length} components)`);
