# ds-mo Agent Contract RFC

Status: prototype  
Schema version: 1.0.0  
Owners: TokoMo, IcoMo, and CompoMo maintainers

## Problem

Agents can discover parts of ds-mo today, but the available data mixes handwritten API facts with generated source, covers only part of CompoMo, and does not reliably explain which component, token, or icon to choose. This creates drift and encourages fabricated props, invalid icon names, reference-token usage, and hand-built substitutes.

This RFC defines a platform-neutral contract for the ds-mo trilogy:

- TokoMo owns token identity and semantic token-family guidance.
- IcoMo owns icon identity, intent, relationships, and lifecycle.
- CompoMo owns component intent and cross-component patterns.
- CompoMo assembles the three package manifests for consumer-facing discovery.

## Decisions

1. Native `ds-*` custom elements are the canonical component API.
2. React wrappers and Angular proxies are equally supported generated adapters.
3. Every `ds-*` component has adjacent, schema-validated agent metadata.
4. Cross-component patterns live centrally under `agent/patterns/`.
5. Generated API facts are never copied into agent metadata.
6. Canonical metadata contains no Codex, v0, Cursor, or other platform-specific fields.
7. Committed registry artifacts stay compact and reviewable. Large source payloads are generated on demand.

## Source Ownership

| Fact | Owner | Source |
| --- | --- | --- |
| Component tag, props, defaults, events, methods, slots | CompoMo compiler | Stencil metadata |
| React and Angular bindings | CompoMo generators | Generated adapters |
| Component selection and composition intent | CompoMo component | `Component.agent.json` |
| Cross-component workflow intent | CompoMo pattern | `agent/patterns/*/pattern.agent.json` |
| Token names and resolved values | TokoMo | Published token index |
| Token-family selection guidance | TokoMo | `@ds-mo/tokens/agent` |
| Icon names and aliases | IcoMo | Published icon manifest |
| Icon intent and relationships | IcoMo | Enriched sidecars and `@ds-mo/icons/agent` |
| Package and peer versions | Each package | `package.json` |

Metadata must reference these sources by stable ID. It must not duplicate their generated fields.

## Stable IDs

- Components: `component:ds-button-filled`
- Patterns: `pattern:application-shell`
- Token families: `token-family:color.background`
- Icons: `icon:Bell`

IDs are permanent. Renames use lifecycle metadata and a replacement ID instead of silently reusing an ID.

## Lifecycle

Records use `experimental`, `stable`, `deprecated`, or `removed`. Deprecated and removed records require `replacedBy` unless no replacement exists and `replacementReason` explains why.

Schema 1.x changes are additive. Removing or redefining a field requires a new major schema version, migration notes, and a compatibility window for generated registry and MCP consumers.

## Framework Model

Component intent is written once. Framework examples are generated from the canonical custom-element model:

- Custom elements use attributes for serializable primitives, properties for arrays/objects/elements, and DOM event listeners.
- React uses generated `Ds*` wrappers and `onDs*` event props.
- Angular uses generated standalone proxies, property bindings, and event bindings.

Framework caveats may be handwritten only when behavior cannot be derived mechanically.

## Registry Migration

Registry v2 will merge compiler facts with adjacent agent metadata. During migration:

1. Existing `public/r/registry.json` and component endpoints remain available.
2. New intent fields are additive.
3. A compatibility fixture protects the existing top-level shape.
4. Full source bodies are omitted from compact committed output and served from source-aware tooling when requested.

## Validation

CI must eventually reject:

- Missing metadata for a `ds-*` component
- Unknown fields or invalid schema versions
- Component, pattern, token, or icon references that do not exist
- Duplicate stable IDs
- Invalid lifecycle replacements
- Handwritten API facts in intent metadata
- Framework examples that do not compile
- Non-deterministic generated output
- Package or peer-version drift

The prototype validators cover schema validity, stable IDs, source tag agreement, component references, pattern files, baseline compatibility, token-family patterns, icon relationships, and assembled trilogy manifests. Compiler API extraction remains a follow-up phase.

## Prototype Scope

The first contract is exercised by:

- `ds-button-filled`: selection and alternatives
- `ds-menu`: complex state, properties, events, and anchoring
- `ds-app-shell`: responsive composition and framework caveats
- `application-shell`: central cross-component pattern
- TokoMo: background color, spacing, typography, and motion token families
- IcoMo: notification, directional, and success icon families

The schema is reviewed against these cases before metadata is expanded to every component or implemented in TokoMo and IcoMo.

## Non-goals

- Copying component source into consumer applications
- Maintaining separate React, Angular, and custom-element design guidance
- Moving TokoMo or IcoMo metadata into CompoMo
- Encoding visual values that already belong to design tokens
- Making the canonical contract specific to one agent platform

## Review Gate

Before declaring schema v1 stable:

1. Validate the prototype records and all references.
2. Generate representative custom-element, React, and Angular guidance.
3. Run fixed selection and negative prompts.
4. Confirm the records contain no duplicated compiler or package facts.
5. Revise the schema once, then require versioned migrations for breaking changes.
