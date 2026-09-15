import fs from 'node:fs';
import path from 'node:path';
import { discoverComponents, loadCompilerDocs, ROOT } from './component-inventory.mjs';
import { lexer } from 'css-tree';

export function createLintContracts({ root = ROOT, requireCompiler = false } = {}) {
  const docs = loadCompilerDocs(root);
  if (requireCompiler && !docs)
    throw new Error('Build Stencil compiler metadata before packaging lint contracts.');
  const result = {};
  for (const component of discoverComponents(root)) {
    const intent = JSON.parse(fs.readFileSync(path.join(root, component.agentPath), 'utf8'));
    if (intent.audience === 'internal' || intent.status === 'removed') continue;
    const styling = intent.styling;
    if (
      !styling?.rationale?.trim() ||
      !Array.isArray(styling.protected) ||
      !Array.isArray(styling.customProperties)
    )
      throw new Error(`${component.tag}: missing styling contract`);
    const api = docs?.get(component.tag);
    if (requireCompiler && !api) throw new Error(`${component.tag}: missing compiler metadata`);
    const props = Object.fromEntries(
      (api?.props ?? []).map(prop => [
        prop.name,
        { values: (prop.values ?? []).map(v => v.value).filter(v => v !== undefined) },
      ])
    );
    for (const group of styling.protected) {
      if (!group.reason.trim() || !group.properties.length)
        throw new Error(`${component.tag}: empty styling restriction`);
      for (const property of group.properties)
        if (!property.startsWith('--') && !lexer.getProperty(property))
          throw new Error(`${component.tag}: unknown protected property ${property}`);
      for (const name of group.props)
        if (requireCompiler && api && !props[name])
          throw new Error(`${component.tag}: styling references missing prop ${name}`);
    }
    const seen = new Set();
    for (const hook of styling.customProperties) {
      if (seen.has(hook.name))
        throw new Error(`${component.tag}: duplicate customization hook ${hook.name}`);
      seen.add(hook.name);
      if (!hook.name.startsWith('--') || !hook.reason.trim())
        throw new Error(`${component.tag}: invalid customization hook`);
      const filename = path.resolve(root, hook.source);
      if (!filename.startsWith(path.resolve(root, 'src/wc') + path.sep) || !fs.existsSync(filename))
        throw new Error(`${component.tag}: invalid hook source ${hook.source}`);
      const content = fs.readFileSync(filename, 'utf8');
      if (
        !content.includes(`var(${hook.name},`) &&
        !content.includes(`var(${hook.name})`) &&
        !new RegExp(`var\\(\\s*${hook.name.replaceAll('-', '\\-')}\\s*[,)]`).test(content)
      )
        throw new Error(`${component.tag}: hook ${hook.name} is not consumed by ${hook.source}`);
    }
    result[component.tag] = {
      tag: component.tag,
      reactName: `Ds${component.title}`,
      props,
      styling,
    };
  }
  return result;
}
