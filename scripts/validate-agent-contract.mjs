#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  COMPILER_DOCS_PATH,
  discoverComponents,
  loadCompilerDocs,
  validateAuthoredArtifacts,
  validateRegistryCoverage,
} from './component-inventory.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COMPONENT_SCHEMA_PATH = 'agent/schemas/component-agent.schema.json';
const PATTERN_SCHEMA_PATH = 'agent/schemas/pattern.schema.json';
const TRILOGY_SCHEMA_PATH = 'agent/schemas/trilogy-manifest.schema.json';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function walk(directory, suffix) {
  const absolute = path.join(ROOT, directory);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap(entry => {
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(child, suffix);
    return entry.name.endsWith(suffix) ? [child] : [];
  }).sort();
}

function formatErrors(relativePath, errors = []) {
  return errors.map(error => `${relativePath}${error.instancePath || '/'} ${error.message}`).join('\n');
}

export function validateAgentContract() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validateComponent = ajv.compile(readJson(COMPONENT_SCHEMA_PATH));
  const validatePattern = ajv.compile(readJson(PATTERN_SCHEMA_PATH));
  ajv.compile(readJson(TRILOGY_SCHEMA_PATH));
  const inventory = discoverComponents(ROOT);
  const knownComponents = new Map(inventory.map(component => [component.id, component]));
  const errors = [];
  const ids = new Set();
  const componentDocuments = walk('src/wc/components', '.agent.json');
  const patternDocuments = walk('agent/patterns', '.agent.json');
  const patterns = new Map();

  errors.push(...validateAuthoredArtifacts({
    root: ROOT,
    components: inventory,
  }));

  for (const relativePath of componentDocuments) {
    const document = readJson(relativePath);
    if (!validateComponent(document)) errors.push(formatErrors(relativePath, validateComponent.errors));
    if (ids.has(document.id)) errors.push(`${relativePath}: duplicate id ${document.id}`);
    ids.add(document.id);

    const source = knownComponents.get(document.id);
    if (!source) errors.push(`${relativePath}: ${document.id} does not match a Stencil component`);
    else if (source.tag !== document.tag) errors.push(`${relativePath}: tag ${document.tag} does not match ${source.tag}`);
    if (document.replacedBy && !knownComponents.has(document.replacedBy)) {
      errors.push(`${relativePath}: unknown replacement ${document.replacedBy}`);
    }

    for (const alternative of document.alternatives ?? []) {
      if (!knownComponents.has(alternative.component)) {
        errors.push(`${relativePath}: unknown alternative ${alternative.component}`);
      }
    }
    for (const componentId of document.commonlyComposedWith ?? []) {
      if (!knownComponents.has(componentId)) errors.push(`${relativePath}: unknown component ${componentId}`);
    }
    for (const reference of document.references ?? []) {
      if (!fs.existsSync(path.join(ROOT, reference.path))) errors.push(`${relativePath}: missing reference ${reference.path}`);
    }
  }

  for (const relativePath of patternDocuments) {
    const document = readJson(relativePath);
    if (!validatePattern(document)) errors.push(formatErrors(relativePath, validatePattern.errors));
    if (ids.has(document.id)) errors.push(`${relativePath}: duplicate id ${document.id}`);
    ids.add(document.id);
    patterns.set(document.id, relativePath);

    for (const entry of document.components ?? []) {
      if (!knownComponents.has(entry.component)) errors.push(`${relativePath}: unknown component ${entry.component}`);
    }
    for (const implementation of Object.values(document.implementations ?? {})) {
      for (const reference of implementation.references ?? []) {
        if (!fs.existsSync(path.join(ROOT, reference))) errors.push(`${relativePath}: missing reference ${reference}`);
      }
    }
    for (const reference of document.references ?? []) {
      if (!fs.existsSync(path.join(ROOT, reference))) errors.push(`${relativePath}: missing reference ${reference}`);
    }
  }

  for (const relativePath of componentDocuments) {
    const document = readJson(relativePath);
    for (const patternId of document.patterns ?? []) {
      if (!patterns.has(patternId)) errors.push(`${relativePath}: unknown pattern ${patternId}`);
    }
  }

  const compatibility = readJson('agent/contracts/registry-compatibility.json');
  const registry = readJson(compatibility.masterPath);
  errors.push(...validateRegistryCoverage(
    inventory,
    registry,
    fs.readdirSync(path.join(ROOT, 'public/r')),
  ));
  for (const key of compatibility.requiredTopLevelKeys) {
    if (!(key in registry)) errors.push(`registry compatibility: missing top-level key ${key}`);
  }

  const compilerDocs = loadCompilerDocs(ROOT);
  if (compilerDocs) {
    for (const component of inventory) {
      const docs = compilerDocs.get(component.tag);
      if (!docs) errors.push(`${COMPILER_DOCS_PATH}: missing ${component.tag}`);
      else if (docs.filePath !== component.sourcePath) {
        errors.push(`${COMPILER_DOCS_PATH}: ${component.tag} points to ${docs.filePath}, expected ${component.sourcePath}`);
      }
    }
    for (const tag of compilerDocs.keys()) {
      if (![...inventory].some(component => component.tag === tag)) {
        errors.push(`${COMPILER_DOCS_PATH}: stale component ${tag}`);
      }
    }
  }

  if (errors.length) throw new Error(`Agent contract validation failed:\n${errors.filter(Boolean).join('\n')}`);
  return {
    sourceComponents: inventory.length,
    componentDocuments: componentDocuments.length,
    patternDocuments: patternDocuments.length,
  };
}

export function validateAgentDocument(kind, document) {
  const schemaPath = kind === 'component'
    ? COMPONENT_SCHEMA_PATH
    : kind === 'pattern'
      ? PATTERN_SCHEMA_PATH
      : null;
  if (!schemaPath) throw new Error(`Unknown agent document kind: ${kind}`);

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(readJson(schemaPath));
  return {
    valid: validate(document),
    errors: validate.errors ?? [],
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = validateAgentContract();
  console.log(`Agent contract valid: ${result.componentDocuments} component prototypes, ${result.patternDocuments} pattern, ${result.sourceComponents} source components.`);
}
