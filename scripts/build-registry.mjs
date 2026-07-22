#!/usr/bin/env node

/** Build the public registry from Stencil compiler facts plus co-located intent. */

import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT,
  COMPILER_DOCS_PATH,
  componentSourceFiles,
  discoverComponents,
  loadCompilerDocs,
  readJson,
} from './component-inventory.mjs';

const OUT = path.join(ROOT, 'public/r');
const PACKAGE_JSON = readJson(ROOT, 'package.json');
const PACKAGE_NAME = PACKAGE_JSON.name;
const STORYBOOK_URL = 'https://zainadeel.github.io/compomo/';
const TOKENS_PEER = PACKAGE_JSON.peerDependencies['@ds-mo/tokens'];
const ICONS_PEER = PACKAGE_JSON.peerDependencies['@ds-mo/icons'];
const FRAMEWORKS = 'Custom Elements; React 18/19 wrappers; Angular 19-22 standalone adapters.';

function readIntent(component) {
  return readJson(ROOT, component.agentPath);
}

function apiProps(docs) {
  return Object.fromEntries((docs.props ?? []).map(prop => [prop.name, {
    type: prop.complexType?.original ?? prop.type,
    resolvedType: prop.type,
    attribute: prop.attr,
    default: prop.default,
    required: prop.required ?? false,
    mutable: prop.mutable ?? false,
    description: prop.docs || undefined,
  }]));
}

function apiEvents(docs) {
  return (docs.events ?? []).map(event => ({
    name: event.event,
    detail: event.complexType?.original ?? event.detail,
    bubbles: event.bubbles,
    cancelable: event.cancelable,
    composed: event.composed,
    description: event.docs || undefined,
  }));
}

function apiMethods(docs) {
  return (docs.methods ?? []).map(method => ({
    name: method.name,
    signature: method.signature,
    description: method.docs || undefined,
  }));
}

function apiSlots(docs) {
  return (docs.slots ?? []).map(slot => ({
    name: slot.name,
    description: slot.docs || undefined,
  }));
}

function compactIntent(intent) {
  const {
    $schema: _schema,
    schemaVersion: _schemaVersion,
    id: _id,
    kind: _kind,
    package: _package,
    tag: _tag,
    ...semanticIntent
  } = intent;
  return semanticIntent;
}

function sourceFiles(component) {
  return componentSourceFiles(component).map(relativePath => ({
    path: relativePath,
    content: fs.readFileSync(path.join(ROOT, relativePath), 'utf8'),
    type: 'registry:ui',
  }));
}

function usage(component, docs) {
  const complexProps = (docs.props ?? [])
    .filter(prop => prop.attr == null)
    .map(prop => prop.name);
  return {
    install: `npm install ${PACKAGE_NAME} @ds-mo/tokens @ds-mo/icons`,
    cssSetup: "import '@ds-mo/tokens';\nimport '@ds-mo/tokens/reset';\nimport '@ds-mo/tokens/globals';",
    customElements: {
      import: `import '@ds-mo/ui/dist/components/${component.tag}.js';`,
      example: `<${component.tag}></${component.tag}>`,
    },
    react: {
      import: `import { Ds${component.title} } from '@ds-mo/ui/react';`,
      example: `<Ds${component.title} />`,
    },
    angular: {
      import: `import { Ds${component.title} } from '@ds-mo/ui/angular/${component.tag}';`,
      example: `<${component.tag}></${component.tag}>`,
    },
    complexPropertyNote: complexProps.length
      ? `Assign these non-primitive values as JavaScript properties: ${complexProps.join(', ')}.`
      : undefined,
    peerDependencies: {
      required: [`@ds-mo/tokens ${TOKENS_PEER}`, `@ds-mo/icons ${ICONS_PEER}`],
      frameworks: FRAMEWORKS,
    },
  };
}

function cleanOutput() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const filename of fs.readdirSync(OUT)) {
    // public/r is fully generated. Remove every JSON artifact, including Apple
    // File Provider collision copies such as `button-filled 2.json`, so stale
    // registry entries cannot leak into the packaged MCP snapshot.
    if (filename.endsWith('.json')) {
      fs.rmSync(path.join(OUT, filename));
    }
  }
}

const components = discoverComponents();
const compilerDocs = loadCompilerDocs();
if (!compilerDocs) {
  throw new Error(`Missing ${COMPILER_DOCS_PATH}. Run npm run build before npm run registry:build.`);
}

const sourceTags = new Set(components.map(component => component.tag));
const docsTags = new Set(compilerDocs.keys());
const missingDocs = [...sourceTags].filter(tag => !docsTags.has(tag));
const staleDocs = [...docsTags].filter(tag => !sourceTags.has(tag));
if (missingDocs.length || staleDocs.length) {
  throw new Error(`Stencil metadata mismatch. Missing: ${missingDocs.join(', ') || 'none'}. Stale: ${staleDocs.join(', ') || 'none'}.`);
}

cleanOutput();
const registryItems = [];

for (const component of components) {
  const docs = compilerDocs.get(component.tag);
  const intent = readIntent(component);

  const props = apiProps(docs);
  const events = apiEvents(docs);
  const methods = apiMethods(docs);
  const slots = apiSlots(docs);
  const internalDependencies = [...new Set(docs.dependencies ?? [])].sort();
  const usesIcons = component.tag === 'ds-icon' || internalDependencies.includes('ds-icon');
  const description = intent.summary;
  const frameworkExports = {
    customElement: component.tag,
    react: `Ds${component.title}`,
    angular: `Ds${component.title}`,
  };

  const item = {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: component.name,
    title: component.title,
    description,
    type: 'registry:ui',
    meta: {
      library: PACKAGE_NAME,
      distribution: 'npm',
      storybook: `${STORYBOOK_URL}?path=/story/${component.name}`,
      source: component.sourcePath,
      intentStatus: 'complete',
      intent: compactIntent(intent),
      api: { props, events, methods, slots },
      props,
      events,
      methods,
      slots,
      exports: frameworkExports,
      consumption: usage(component, docs),
    },
    dependencies: [
      PACKAGE_NAME,
      '@ds-mo/tokens',
      ...(usesIcons ? ['@ds-mo/icons'] : []),
    ],
    registryDependencies: internalDependencies.map(tag => tag.replace(/^ds-/, '')),
    files: sourceFiles(component),
  };

  fs.writeFileSync(path.join(OUT, `${component.name}.json`), `${JSON.stringify(item, null, 2)}\n`);
  registryItems.push({
    name: item.name,
    title: item.title,
    description: item.description,
    type: item.type,
    meta: {
      library: PACKAGE_NAME,
      distribution: 'npm',
      storybook: item.meta.storybook,
      source: item.meta.source,
      intentStatus: item.meta.intentStatus,
      intent: item.meta.intent,
      props: Object.fromEntries(Object.entries(props).map(([name, prop]) => [name, {
        type: prop.type,
        required: prop.required,
      }])),
      events: events.map(event => ({ name: event.name, detail: event.detail })),
      slots: slots.map(slot => slot.name),
      exports: frameworkExports,
    },
    dependencies: item.dependencies,
    registryDependencies: item.registryDependencies,
  });
  console.log(`  ✓ ${component.name}.json (${Object.keys(props).length} props, ${intent ? 'intent' : 'migration pending'})`);
}

const registry = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'compomo',
  homepage: STORYBOOK_URL,
  description: `CompoMo (${PACKAGE_NAME}) — framework-agnostic Stencil web components. ${FRAMEWORKS}`,
  meta: {
    distribution: 'npm',
    generatedFrom: COMPILER_DOCS_PATH,
    install: `npm install ${PACKAGE_NAME} @ds-mo/tokens @ds-mo/icons`,
    register: "import '@ds-mo/ui/dist/components/ds-button-filled.js';",
    cssSetup: "import '@ds-mo/tokens';\nimport '@ds-mo/tokens/reset';\nimport '@ds-mo/tokens/globals';",
    themeSetup: 'Set data-theme="dark" on <html> for dark mode. Light is default.',
    peerDependencies: {
      required: [`@ds-mo/tokens ${TOKENS_PEER}`, `@ds-mo/icons ${ICONS_PEER}`],
      optional: [],
      frameworks: 'None required for Custom Elements; generated React and Angular adapters are included.',
    },
  },
  items: registryItems,
};

fs.writeFileSync(path.join(OUT, 'registry.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(`\n  ✓ registry.json (${registryItems.length} components)`);
