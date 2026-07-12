function exportNames(exports) {
  return Object.values(exports ?? {}).filter(Boolean);
}

function codeExample(label, value, language = 'tsx') {
  if (!value) return null;
  return `### ${label}\n\n\`\`\`${language}\n${value}\n\`\`\``;
}

export function formatComponentList(items) {
  return items.map(item => {
    const dependencies = item.dependencies?.filter(dependency => dependency !== '@ds-mo/ui') ?? [];
    const note = dependencies.length ? ` (also needs ${dependencies.join(', ')})` : '';
    return `- **${item.title}** (\`${item.name}\`)${note}\n  ${item.description}`;
  }).join('\n\n');
}

export function formatComponentDetail(component) {
  const meta = component.meta;
  const consumption = meta.consumption;
  const sections = [`# ${exportNames(meta.exports).join(', ')}\n\n${component.description}`];

  sections.push(`## Setup\n\n\`\`\`bash\n${consumption.install}\n\`\`\``);

  const imports = [
    codeExample('Design tokens (once at app entry point)', consumption.cssSetup),
    codeExample('Custom Elements', consumption.customElements?.import),
    codeExample('React', consumption.react?.import),
    codeExample('Angular', consumption.angular?.import),
  ].filter(Boolean);
  sections.push(`## Imports\n\n${imports.join('\n\n')}`);

  const examples = [
    codeExample('Custom Elements', consumption.customElements?.example, 'html'),
    codeExample('React', consumption.react?.example),
    codeExample('Angular', consumption.angular?.example, 'html'),
  ].filter(Boolean);
  if (examples.length) sections.push(`## Examples\n\n${examples.join('\n\n')}`);

  const props = meta.api?.props ?? meta.props;
  if (props && Object.keys(props).length > 0) {
    const rows = Object.entries(props).map(([name, definition]) => {
      const required = definition.required ? ' **(required)**' : '';
      const defaultValue = definition.default != null ? ` — default: \`${definition.default}\`` : '';
      const description = definition.description
        ? ` — ${definition.description.replaceAll('\n', ' ').replaceAll('|', '\\|')}`
        : '';
      const type = (definition.resolvedType ?? definition.type).replaceAll('|', '\\|');
      return `| \`${name}\` | \`${type}\` | ${required}${defaultValue}${description} |`;
    });
    sections.push(`## Props\n\n| Prop | Type | Notes |\n|------|------|-------|\n${rows.join('\n')}`);
  }

  if (component.registryDependencies?.length) {
    sections.push(`## Component Dependencies\n\n${component.registryDependencies.map(dependency => `- \`${dependency}\``).join('\n')}`);
  }

  if (consumption.peerDependencies) {
    const required = consumption.peerDependencies.required.map(dependency => `- ${dependency} (required)`);
    const optional = (consumption.peerDependencies.optional ?? []).map(dependency => `- ${dependency} (optional)`);
    sections.push(`## Peer Dependencies\n\n${[...required, ...optional].join('\n')}`);
  }

  if (meta.intent) {
    const intent = [
      `**Use when**\n${meta.intent.useWhen.map(item => `- ${item}`).join('\n')}`,
      `**Avoid when**\n${meta.intent.avoidWhen.map(item => `- ${item}`).join('\n')}`,
      `**Accessibility**\n${meta.intent.accessibility.map(item => `- ${item}`).join('\n')}`,
    ];
    sections.push(`## Design Intent\n\n${intent.join('\n\n')}`);
  } else {
    sections.push('## Design Intent\n\nSemantic guidance is migration-pending. Use the generated API and Storybook examples, and verify component choice against adjacent components.');
  }

  if (consumption.complexPropertyNote) sections.push(`## Framework Note\n\n${consumption.complexPropertyNote}`);
  if (meta.storybook) sections.push(`## Storybook\n\n${meta.storybook}`);
  return sections.join('\n\n---\n\n');
}

export function formatComponentSourceHeader(component) {
  const names = exportNames(component.meta.exports);
  return `# ${names.join(', ')} — Source Reference\n\n> This is reference code. Import from \`@ds-mo/ui\` instead of copying.\n> \`${component.meta.consumption.customElements.import}\``;
}
