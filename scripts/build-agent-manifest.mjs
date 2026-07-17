#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { ROOT, readJson } from './component-inventory.mjs';

const packageJson = readJson(ROOT, 'package.json');
const registry = readJson(ROOT, 'public/r/registry.json');
const outputPath = path.join(ROOT, 'dist/agent.json');
const patternsOutputPath = path.join(ROOT, 'dist/agent-patterns.json');

function walkPatterns(directory = path.join(ROOT, 'agent', 'patterns')) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkPatterns(child);
    return entry.name.endsWith('.agent.json') ? [child] : [];
  }).sort();
}

function compactPattern(patternPath) {
  const pattern = JSON.parse(fs.readFileSync(patternPath, 'utf8'));
  const {
    $schema: _schema,
    schemaVersion: _schemaVersion,
    kind: _kind,
    ...entry
  } = pattern;
  return entry;
}

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

const patternsManifest = {
  schemaVersion: '1.0.0',
  package: packageJson.name,
  packageVersion: packageJson.version,
  kind: 'patterns',
  entries: walkPatterns().map(compactPattern),
};

fs.writeFileSync(patternsOutputPath, `${JSON.stringify(patternsManifest, null, 2)}\n`);
console.log(`  Built dist/agent-patterns.json (${patternsManifest.entries.length} patterns)`);
