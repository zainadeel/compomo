# Agent metadata guidance

Applies to `agent/`, co-located component `*.agent.json`, registry generation,
and MCP composition metadata.

## Ownership

Agent JSON contains curated design intent:

- when to use or avoid a component;
- alternatives and common compositions;
- accessibility and responsive intent;
- application versus component state ownership;
- irreducible framework caveats.

Do not duplicate generated facts such as tag names, props, defaults, events,
methods, slots, package versions, adapter paths, or token values.

Every source component requires exactly one co-located agent JSON file validated
by `agent/schemas/component-agent.schema.json`.

## Patterns

Cross-component workflows live in
`agent/patterns/<name>/pattern.agent.json`. Recipes must:

- use only public package entries;
- be complete enough to paste into a consumer;
- keep product-owned routing, data, permissions, and consequences outside the
  design-system contract;
- provide only frameworks whose recipes are valid and verified;
- be updated when the composition contract changes.

Component intent references applicable pattern IDs instead of copying pattern
instructions.

## Registry and MCP

The registry joins source-derived compiler facts with authored intent. The MCP
publishes that closed-world result and executable patterns. Do not create a
parallel handwritten component catalog.

Validate changes with:

```bash
npm run build          # when component API/compiler facts changed
npm run registry:build
npm run agent:validate
```

See `docs/component-metadata-ownership.md`,
`docs/maintainers/build-and-registry.md`, and the schemas for exact contracts.
