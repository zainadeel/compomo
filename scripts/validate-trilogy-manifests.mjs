#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'agent/schemas/trilogy-manifest.schema.json'), 'utf8'));
const manifestPaths = process.argv.slice(2);

if (manifestPaths.length === 0) {
  throw new Error('Pass one or more generated trilogy agent manifest paths.');
}

const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
const ids = new Set();

for (const manifestPath of manifestPaths) {
  const absolutePath = path.resolve(ROOT, manifestPath);
  const manifest = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  if (!validate(manifest)) {
    const errors = validate.errors.map(error => `${error.instancePath || '/'} ${error.message}`).join('\n');
    throw new Error(`${manifestPath} is invalid:\n${errors}`);
  }
  for (const entry of manifest.entries) {
    const id = entry.id ?? `icon:${entry.name}`;
    if (ids.has(id)) throw new Error(`Duplicate trilogy entry id: ${id}`);
    ids.add(id);
  }
  const label = manifest.kind === 'tokens' ? 'token-family' : manifest.kind.slice(0, -1);
  console.log(`${manifest.package}@${manifest.packageVersion}: ${manifest.entries.length} ${label} entries valid.`);
}
