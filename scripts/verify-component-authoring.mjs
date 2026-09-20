import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import Ajv2020 from 'ajv/dist/2020.js';
import { pathToFileURL } from 'node:url';
import {
  ROOT,
  COMPONENT_ROOT,
  discoverComponents,
  validateAuthoredArtifacts,
} from './component-inventory.mjs';

const validateMetadata = new Ajv2020({ allErrors: true, strict: true }).compile(
  JSON.parse(fs.readFileSync(path.join(ROOT, 'agent/schemas/component-agent.schema.json'), 'utf8'))
);

function containsComponent(filename, source) {
  const file = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  let found = false;
  const visit = node => {
    if (
      ts.isDecorator(node) &&
      ts.isCallExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'Component'
    )
      found = true;
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}

/** Source-only checks: no build, generated adapters, or registry required. */
export function verifyComponentAuthoring(root = ROOT) {
  const components = discoverComponents(root);
  const errors = validateAuthoredArtifacts({ root, components, checkAdapters: false });
  const tags = new Set();
  const sources = new Set(components.map(component => component.sourcePath));
  const componentRoot = path.join(root, COMPONENT_ROOT);
  for (const entry of fs.readdirSync(componentRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const directory = path.join(componentRoot, entry.name);
    for (const name of fs.readdirSync(directory)) {
      const relative = `${COMPONENT_ROOT}/${entry.name}/${name}`;
      if (
        name.endsWith('.tsx') &&
        !/ \d+\.tsx$/.test(name) &&
        containsComponent(relative, fs.readFileSync(path.join(directory, name), 'utf8')) &&
        !sources.has(relative)
      ) {
        errors.push(
          `${relative}: component source must match its directory name and declare a literal tag`
        );
      }
      if (
        name.endsWith('.agent.json') &&
        !components.some(component => component.agentPath === relative)
      ) {
        errors.push(`${relative}: metadata must belong to its co-located Stencil component`);
      }
    }
  }
  for (const component of components) {
    if (tags.has(component.tag))
      errors.push(`${component.sourcePath}: duplicate tag ${component.tag}`);
    tags.add(component.tag);
    const filename = path.join(root, component.agentPath);
    if (!fs.existsSync(filename)) continue;
    try {
      const metadata = JSON.parse(fs.readFileSync(filename, 'utf8'));
      if (!validateMetadata(metadata)) {
        for (const error of validateMetadata.errors ?? []) {
          errors.push(`${component.agentPath}${error.instancePath}: ${error.message}`);
        }
      }
      if (metadata.id !== component.id || metadata.tag !== component.tag) {
        errors.push(`${component.agentPath}: id and tag must match ${component.tag}`);
      }
      const inspect = (value, location) => {
        if (typeof value === 'string' && (!value.trim() || value.includes('[AUTHOR:'))) {
          errors.push(`${component.agentPath}${location}: replace unfinished authoring guidance`);
        } else if (value && typeof value === 'object') {
          for (const [key, child] of Object.entries(value)) inspect(child, `${location}/${key}`);
        }
      };
      inspect(metadata, '');
    } catch (error) {
      errors.push(`${component.agentPath}: ${error.message}`);
    }
  }
  return { components: components.length, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = verifyComponentAuthoring();
  if (result.errors.length) {
    console.error(result.errors.join('\n'));
    process.exitCode = 1;
  } else console.log(`Authoring contract valid: ${result.components} components.`);
}
