import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import prettier from 'prettier';
import { ROOT, COMPONENT_ROOT, discoverComponents } from './component-inventory.mjs';

/** Create authored files only. Design intent is deliberately left for its owner. */
export async function createComponent({ name, summary, storyTitle, dryRun = false, root = ROOT }) {
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name ?? ''))
    throw new Error('Use a PascalCase component name, such as StatusNote.');
  if (['Component', 'Host'].includes(name))
    throw new Error(
      `${name} conflicts with a Stencil import; choose a more specific component name.`
    );
  if (!summary?.trim()) throw new Error('Provide --summary with the component purpose.');
  if (!storyTitle?.trim())
    throw new Error('Provide --story-title with its Storybook category and name.');
  const kebab = name
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
  const tag = `ds-${kebab}`;
  const componentRoot = path.join(root, COMPONENT_ROOT);
  const directory = path.join(componentRoot, name);
  if (
    fs.readdirSync(componentRoot).some(entry => entry.toLowerCase() === name.toLowerCase()) ||
    discoverComponents(root).some(component => component.tag === tag)
  ) {
    throw new Error(`Component directory or tag already exists: ${name} / ${tag}`);
  }
  const metadata = {
    $schema: '../../../../agent/schemas/component-agent.schema.json',
    schemaVersion: '1.0.0',
    id: `component:${tag}`,
    kind: 'component',
    package: '@ds-mo/ui',
    tag,
    audience: 'general',
    status: 'experimental',
    summary: summary.trim(),
    useWhen: ['[AUTHOR: describe the user need that selects this component]'],
    avoidWhen: [
      '[AUTHOR: explain when an existing component or application-owned composition fits better]',
    ],
    accessibility: [
      '[AUTHOR: describe semantics, naming, keyboard and focus ownership as applicable]',
    ],
    states: [
      '[AUTHOR: define application-owned inputs and internal state; remove if truly stateless]',
    ],
    responsiveBehavior: ['[AUTHOR: explain responsive ownership]'],
    styling: {
      rationale:
        '[AUTHOR: explain which recipes the component owns and what applications may customize]',
      protected: [],
      customProperties: [],
    },
  };
  const sources = {
    [`${name}.tsx`]: `import { Component, h, Host } from '@stencil/core';
@Component({ tag: '${tag}', styleUrl: '${name}.css', scoped: true })
export class ${name} {
  render() { return <Host><slot /></Host>; }
}
`,
    [`${name}.css`]: ':host { display: block; box-sizing: border-box; }\n',
    [`${name}.stories.ts`]: `import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/${tag}.js';
import '../../../../dist/components/ds-text.js';

export default { title: ${JSON.stringify(storyTitle.trim())}, tags: ['autodocs'] } satisfies Meta;
type Story = StoryObj;
export const Default: Story = {
  render: () => html\`<${tag}><ds-text variant="text-body-medium">Component content</ds-text></${tag}>\`,
};
`,
    [`${name}.agent.json`]: JSON.stringify(metadata, null, 2),
  };
  const config = await prettier.resolveConfig(path.join(ROOT, 'package.json'));
  const formatted = await Promise.all(
    Object.entries(sources).map(async ([filename, source]) => [
      filename,
      await prettier.format(source, { ...config, filepath: filename }),
    ])
  );
  if (!dryRun) {
    fs.mkdirSync(directory);
    const written = [];
    try {
      for (const [filename, source] of formatted) {
        fs.writeFileSync(path.join(directory, filename), source, { flag: 'wx' });
        written.push(filename);
      }
    } catch (error) {
      // This command created the directory; preserve any unexpected extra files.
      for (const filename of written) fs.rmSync(path.join(directory, filename), { force: true });
      try {
        fs.rmdirSync(directory);
      } catch {
        /* leave unexpected content intact */
      }
      throw error;
    }
  }
  return { tag, files: formatted.map(([filename]) => `${COMPONENT_ROOT}/${name}/${filename}`) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { values, positionals } = parseArgs({
      allowPositionals: true,
      options: {
        summary: { type: 'string' },
        'story-title': { type: 'string' },
        'dry-run': { type: 'boolean' },
      },
    });
    if (positionals.length !== 1)
      throw new Error(
        'Usage: npm run component:new -- Name --summary "Purpose" --story-title "Category/Name" [--dry-run]'
      );
    const result = await createComponent({
      name: positionals[0],
      summary: values.summary,
      storyTitle: values['story-title'],
      dryRun: values['dry-run'],
    });
    console.log(
      `${values['dry-run'] ? 'Would create' : 'Created'} ${result.tag}:\n${result.files.join('\n')}`
    );
    console.log(
      'Complete the [AUTHOR: ...] guidance and component behavior, then run npm run verify:authoring.'
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
