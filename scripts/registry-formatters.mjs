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
    if (meta.intent.patterns?.length) {
      sections.push(`## Composition Patterns\n\n${meta.intent.patterns.map(pattern => `- \`${pattern}\` — retrieve it with \`get_pattern\` for executable framework recipes.`).join('\n')}`);
    }
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

export function formatPatternList(patterns) {
  return patterns.map(pattern => {
    const recipeCount = Object.values(pattern.implementations ?? {})
      .flatMap(implementation => implementation.recipes ?? []).length;
    return `- **${pattern.id.replace(/^pattern:/, '')}** (\`${pattern.id}\`) — ${recipeCount} framework recipe${recipeCount === 1 ? '' : 's'}\n  ${pattern.summary}`;
  }).join('\n\n');
}

function formatGuidance(title, guidance = []) {
  return guidance.length ? `## ${title}\n\n${guidance.map(item => `- ${item}`).join('\n')}` : null;
}

export function formatPatternDetail(pattern, requestedFramework) {
  const sections = [`# ${pattern.id}\n\n${pattern.summary}`];
  sections.push(formatGuidance('Use When', pattern.useWhen));
  sections.push(formatGuidance('Avoid When', pattern.avoidWhen));
  sections.push(`## Components\n\n${pattern.components.map(entry => `- \`${entry.component}\` (${entry.required ? 'required' : 'optional'}): ${entry.role}`).join('\n')}`);
  sections.push(formatGuidance('State Ownership', pattern.stateOwnership));
  sections.push(formatGuidance('Accessibility', pattern.accessibility));
  sections.push(formatGuidance('Responsive Behavior', pattern.responsiveBehavior));

  const implementations = Object.entries(pattern.implementations)
    .filter(([framework]) => !requestedFramework || framework === requestedFramework);
  for (const [framework, implementation] of implementations) {
    const recipes = implementation.recipes ?? [];
    if (!recipes.length) continue;
    const recipeSections = recipes.map(recipe => {
      const files = recipe.files.map(file => `### ${file.path}\n\n\`\`\`${file.language}\n${file.content}\n\`\`\``).join('\n\n');
      const notes = recipe.notes?.length
        ? `\n\n**Notes**\n\n${recipe.notes.map(note => `- ${note}`).join('\n')}`
        : '';
      return `## ${framework}: ${recipe.title}\n\n${recipe.summary}\n\n${files}${notes}`;
    });
    sections.push(...recipeSections);
  }

  return sections.filter(Boolean).join('\n\n---\n\n');
}
