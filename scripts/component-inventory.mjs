import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const COMPONENT_ROOT = 'src/wc/components';
export const COMPILER_DOCS_PATH = 'dist/docs/components.json';

function posix(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function componentTagFromSource(sourcePath, source) {
  const file = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let tag;

  function visit(node) {
    if (ts.isClassDeclaration(node)) {
      const decorators = ts.canHaveDecorators(node) ? (ts.getDecorators(node) ?? []) : [];
      for (const decorator of decorators) {
        const expression = decorator.expression;
        if (!ts.isCallExpression(expression) || !ts.isIdentifier(expression.expression)) continue;
        if (expression.expression.text !== 'Component') continue;
        const options = expression.arguments[0];
        if (!options || !ts.isObjectLiteralExpression(options)) continue;
        for (const property of options.properties) {
          if (!ts.isPropertyAssignment(property)) continue;
          const name = property.name;
          const isTag = (ts.isIdentifier(name) || ts.isStringLiteral(name)) && name.text === 'tag';
          if (isTag && ts.isStringLiteralLike(property.initializer)) tag = property.initializer.text;
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(file);
  return tag;
}

export function discoverComponents(root = ROOT) {
  const absoluteRoot = path.join(root, COMPONENT_ROOT);
  const components = [];
  for (const entry of fs.readdirSync(absoluteRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const directory = entry.name;
    const relativeDirectory = `${COMPONENT_ROOT}/${directory}`;
    const sourcePath = `${relativeDirectory}/${directory}.tsx`;
    const absoluteSource = path.join(root, sourcePath);
    if (!fs.existsSync(absoluteSource)) continue;
    const tag = componentTagFromSource(sourcePath, fs.readFileSync(absoluteSource, 'utf8'));
    if (!tag) continue;
    const name = tag.replace(/^ds-/, '');
    components.push({
      id: `component:${tag}`,
      tag,
      name,
      title: directory,
      directory,
      relativeDirectory,
      sourcePath,
      stylePath: `${relativeDirectory}/${directory}.css`,
      storyPath: `${relativeDirectory}/${directory}.stories.ts`,
      agentPath: `${relativeDirectory}/${directory}.agent.json`,
      angularPath: `src/angular/ds-${name}.ts`,
      reactPath: `src/react/ds-${name}.ts`,
    });
  }
  return components.sort((a, b) => a.tag.localeCompare(b.tag));
}

export function loadCompilerDocs(root = ROOT, relativePath = COMPILER_DOCS_PATH) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  const document = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  return new Map((document.components ?? []).map(component => [component.tag, component]));
}

export function componentSourceFiles(component, root = ROOT) {
  const absoluteDirectory = path.join(root, component.relativeDirectory);
  return fs.readdirSync(absoluteDirectory)
    .filter(filename =>
      (filename.endsWith('.tsx') || filename.endsWith('.ts') || filename.endsWith('.css')) &&
      // Apple File Provider/iCloud collision copies use names such as
      // `Component.stories 2.ts`. They are not authored component artifacts.
      !/ \d+\.(?:tsx?|css)$/.test(filename) &&
      !filename.endsWith('.stories.ts') &&
      !filename.endsWith('.stories.tsx') &&
      filename !== 'index.ts'
    )
    .sort()
    .map(filename => posix(path.join(component.relativeDirectory, filename)));
}

export function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

export function validateAuthoredArtifacts({
  root = ROOT,
  components,
  migrationIds = new Set(),
  artifactExceptions = {},
  checkAdapters = true,
}) {
  const errors = [];
  const componentIds = new Set(components.map(component => component.id));
  for (const component of components) {
    const exceptions = artifactExceptions[component.id] ?? {};
    const required = [
      ['source', component.sourcePath],
      ['style', component.stylePath],
      ['story', component.storyPath],
    ];
    for (const [kind, requiredPath] of required) {
      if (fs.existsSync(path.join(root, requiredPath))) continue;
      if (kind !== 'source' && typeof exceptions[kind] === 'string' && exceptions[kind]) continue;
      errors.push(`${component.tag}: missing required authored artifact ${requiredPath}`);
    }
    const hasAgent = fs.existsSync(path.join(root, component.agentPath));
    if (!hasAgent && !migrationIds.has(component.id)) {
      errors.push(`${component.tag}: missing ${component.agentPath}; new components require co-located agent metadata`);
    }
    if (hasAgent && migrationIds.has(component.id)) {
      errors.push(`remove completed ${component.id} from missingAgentMetadata`);
    }
    if (checkAdapters) {
      for (const generatedPath of [component.angularPath, component.reactPath]) {
        if (!fs.existsSync(path.join(root, generatedPath))) {
          errors.push(`${component.tag}: missing generated framework adapter ${generatedPath}; run npm run build`);
        }
      }
    }
  }
  for (const id of migrationIds) {
    if (!componentIds.has(id)) errors.push(`stale or unknown migration component ${id}`);
  }
  for (const id of Object.keys(artifactExceptions)) {
    if (!componentIds.has(id)) errors.push(`stale or unknown artifact exception ${id}`);
  }
  return errors;
}

export function validateRegistryCoverage(components, registry, detailFilenames) {
  const errors = [];
  const inventoryNames = new Set(components.map(component => component.name));
  const registryNames = new Set((registry.items ?? []).map(item => item.name));
  const detailNames = new Set(detailFilenames
    .filter(filename => /^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(filename) && filename !== 'registry.json')
    .map(filename => filename.slice(0, -5)));
  if ((registry.items ?? []).length !== components.length) {
    errors.push(`registry coverage: expected ${components.length} source components, found ${(registry.items ?? []).length} items`);
  }
  for (const name of inventoryNames) {
    if (!registryNames.has(name)) errors.push(`registry coverage: missing ${name}`);
    if (!detailNames.has(name)) errors.push(`registry coverage: missing public/r/${name}.json`);
  }
  for (const name of registryNames) {
    if (!inventoryNames.has(name)) errors.push(`registry coverage: stale item ${name}`);
  }
  for (const name of detailNames) {
    if (!inventoryNames.has(name)) errors.push(`registry coverage: stale file public/r/${name}.json`);
  }
  return errors;
}
