import manifest, { type TokenAgentManifest } from '@ds-mo/tokens/agent';
import { createElement as h, type ReactNode } from 'react';

const title = (id: string) =>
  id
    .split(':')[1]
    .replace(/^color\./, '')
    .replace(/[.-]/g, ' ');
const anchor = (id: string) => id.replace(/[:.]/g, '-');
const code = (value: string) => h('code', null, value);
const paragraph = (value: string) => h('p', null, value);

function list(label: string, values?: string[]) {
  return values?.length
    ? h(
        'div',
        null,
        h('strong', null, label),
        h(
          'ul',
          null,
          values.map((value, index) => h('li', { key: index }, value))
        )
      )
    : null;
}

function table(headings: string[], rows: ReactNode[][]) {
  return h(
    'table',
    null,
    h(
      'thead',
      null,
      h(
        'tr',
        null,
        headings.map(heading => h('th', { key: heading, scope: 'col' }, heading))
      )
    ),
    h(
      'tbody',
      null,
      rows.map((row, index) =>
        h(
          'tr',
          { key: index },
          row.map((cell, column) => h('td', { key: column }, cell))
        )
      )
    )
  );
}

/** Select recipes through the contract's links, including cross-category recipes. */
export function colorGuidance(contract: TokenAgentManifest) {
  const families = contract.families.filter(family => family.category === 'color');
  if (!families.length) throw new Error('TokoMo guidance has no color families');
  const ids = new Set(families.flatMap(family => family.recipes ?? []));
  const recipes = [...ids].map(id => {
    const recipe = contract.recipes.find(entry => entry.id === id);
    if (!recipe) throw new Error(`TokoMo guidance is missing linked recipe ${id}`);
    return recipe;
  });
  return { families, recipes };
}

/** Storybook-only React renderer; no token guidance is copied into CompoMo. */
export function TokenColorGuidance({ contract = manifest }: { contract?: TokenAgentManifest }) {
  const { families, recipes } = colorGuidance(contract);
  return h(
    'section',
    { 'aria-label': 'TokoMo color guidance' },
    paragraph(`Guidance from ${contract.package} ${contract.packageVersion}.`),
    h('h2', { id: 'token-principles' }, 'Token principles'),
    h(
      'ul',
      null,
      contract.principles.map(principle => h('li', { key: principle.id }, principle.summary))
    ),
    h('h2', { id: 'color-families' }, 'Color families'),
    ...families.map(family =>
      h(
        'details',
        { key: family.id, id: anchor(family.id) },
        h('summary', null, title(family.id)),
        paragraph(family.summary),
        paragraph(
          `Status: ${family.status}. Audience: ${family.audience}. Selection role: ${family.selectionRole}.`
        ),
        h(
          'ul',
          null,
          family.tokenPatterns.map(pattern => h('li', { key: pattern }, code(pattern)))
        ),
        list('Use when', family.useWhen),
        list('Avoid when', family.avoidWhen),
        list('Constraints', family.constraints),
        list('Accessibility', family.accessibility),
        family.recipes?.length
          ? h(
              'p',
              null,
              'Recipes: ',
              family.recipes.map((id, index) =>
                h(
                  'span',
                  { key: id },
                  index ? ', ' : '',
                  h('a', { href: `#${anchor(id)}` }, title(id))
                )
              )
            )
          : null
      )
    ),
    h('h2', { id: 'color-intents' }, 'Color intents'),
    ...contract.intents.map(intent =>
      h(
        'details',
        { key: intent.id, id: anchor(intent.id) },
        h('summary', null, title(intent.id)),
        paragraph(intent.summary),
        paragraph(
          `Status: ${intent.status}. ${intent.optional ? 'Optional intent.' : 'Core intent.'}`
        ),
        list('Use when', intent.useWhen),
        list('Avoid when', intent.avoidWhen),
        list('Precedence', intent.precedence)
      )
    ),
    h('h2', { id: 'color-recipes' }, 'Color recipes'),
    ...recipes.map(recipe =>
      h(
        'section',
        { key: recipe.id, id: anchor(recipe.id) },
        h('h3', null, title(recipe.id)),
        paragraph(recipe.summary),
        paragraph(`Status: ${recipe.status}.`),
        list('Use when', recipe.useWhen),
        list('Avoid when', recipe.avoidWhen),
        list('Composition rules', recipe.compositionRules),
        list('State ownership', recipe.stateOwnership),
        list('Accessibility', recipe.accessibility),
        h(
          'details',
          null,
          h('summary', null, 'Token roles'),
          table(
            ['Role', 'Purpose', 'Tokens', 'Required'],
            recipe.tokenRoles.map(role => [
              role.id,
              role.summary,
              code(role.tokenPatterns?.join(', ') ?? (role.literal ? 'Literal value' : '—')),
              role.required ? 'Yes' : 'No',
            ])
          )
        ),
        ...recipe.variants.map(variant =>
          h(
            'details',
            { key: variant.id },
            h('summary', null, variant.label, variant.modifier ? ` — ${variant.modifier}` : ''),
            variant.when ? paragraph(variant.when) : null,
            table(
              ['Role', 'Property', 'Token or value'],
              variant.assignments.map(assignment => [
                assignment.role,
                assignment.property,
                code(assignment.token ?? assignment.tokenPattern ?? assignment.value ?? ''),
              ])
            ),
            list('Notes', variant.notes)
          )
        ),
        ...(recipe.examples ?? []).map((example, index) =>
          h(
            'details',
            { key: index },
            h('summary', null, `${example.language.toUpperCase()} example`),
            h('pre', null, code(example.content))
          )
        )
      )
    )
  );
}
