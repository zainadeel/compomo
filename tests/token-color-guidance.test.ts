import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { Ajv2020 } from 'ajv/dist/2020.js';
import manifest from '@ds-mo/tokens/agent';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { colorGuidance, TokenColorGuidance } from '../src/docs/TokenColorGuidance';

// The schema is shipped beside the public export; resolve it from that export
// rather than assuming a node_modules layout or copying TokoMo's schema here.
const schema = JSON.parse(
  readFileSync(new URL('./agent.schema.json', import.meta.resolve('@ds-mo/tokens/agent')), 'utf8')
);
const validate = new Ajv2020({ allErrors: true }).compile(schema);
const render = (contract = manifest) =>
  renderToStaticMarkup(createElement(TokenColorGuidance, { contract }));
const escape = (value: string) =>
  renderToStaticMarkup(createElement('span', null, value)).slice(6, -7);

test('installed token guidance satisfies its shipped schema and the color renderer contract', () => {
  assert.ok(validate(manifest), JSON.stringify(validate.errors));
  assert.equal(
    manifest.schemaVersion,
    '2.0.0',
    'Review the renderer when the contract schema changes'
  );
  assert.equal(manifest.package, '@ds-mo/tokens');
  assert.ok(manifest.packageVersion);
  const { families, recipes } = colorGuidance(manifest);
  assert.ok(recipes.length);
  assert.equal(
    new Set([...families, ...recipes].map(entry => entry.id)).size,
    families.length + recipes.length
  );
  const html = render();
  assert.ok(html.includes(escape(`${manifest.package} ${manifest.packageVersion}`)));
  for (const principle of manifest.principles) assert.ok(html.includes(escape(principle.summary)));
  for (const entry of [...families, ...manifest.intents, ...recipes]) {
    for (const text of [entry.summary, ...entry.useWhen, ...entry.avoidWhen])
      assert.ok(html.includes(escape(text)), text);
  }
  for (const family of families) {
    for (const text of [
      ...family.constraints,
      ...family.tokenPatterns,
      ...(family.accessibility ?? []),
    ])
      assert.ok(html.includes(escape(text)), text);
  }
  for (const recipe of recipes) {
    for (const text of [
      ...recipe.compositionRules,
      ...(recipe.stateOwnership ?? []),
      ...(recipe.accessibility ?? []),
    ])
      assert.ok(html.includes(escape(text)), text);
    for (const variant of recipe.variants) {
      assert.ok(html.includes(escape(variant.label)));
      for (const assignment of variant.assignments)
        assert.ok(
          html.includes(escape(assignment.token ?? assignment.tokenPattern ?? assignment.value!))
        );
      for (const note of variant.notes ?? []) assert.ok(html.includes(escape(note)));
    }
    for (const example of recipe.examples ?? []) assert.ok(html.includes(escape(example.content)));
  }
  assert.ok(
    !html.includes('typography-composites'),
    'Unrelated recipes stay out of the color page'
  );
});

test('updated guidance is rendered as text without a copied prose snapshot', () => {
  const updated = structuredClone(manifest);
  updated.packageVersion = '99.0.0';
  updated.families.push({
    ...updated.families[0],
    id: 'token-family:color.future',
    summary: 'Future <script>alert("x")</script> guidance',
  });
  const html = render(updated);
  assert.ok(html.includes('@ds-mo/tokens 99.0.0'));
  assert.ok(html.includes(escape(updated.families.at(-1)!.summary)));
  assert.ok(!html.includes('<script>'));
});

test('missing and malformed guidance is detected rather than silently omitted', () => {
  for (const property of ['principles', 'intents', 'families', 'recipes'] as const) {
    assert.equal(validate({ ...manifest, [property]: undefined }), false, property);
    assert.equal(validate({ ...manifest, [property]: [] }), false, property);
  }
  const malformed = structuredClone(manifest);
  malformed.recipes[0].variants[0].assignments[0].token = 42 as unknown as string;
  assert.equal(validate(malformed), false);
  assert.throws(() => render({ ...manifest, recipes: [] }), /missing linked recipe/);
  assert.throws(() => render({ ...manifest, families: [] }), /no color families/);
});
