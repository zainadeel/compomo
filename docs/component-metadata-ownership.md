# Component metadata ownership

CompoMo has one source-derived component inventory and two deliberately separate metadata owners. Generated API facts and curated design intent must never become competing editable records.

| Fact | Authoritative source | Registry behavior |
| --- | --- | --- |
| Component existence, tag, source path | Stencil `@Component()` source, discovered by `scripts/component-inventory.mjs` | Every discovered component produces exactly one item and detail file. |
| Props, attributes, defaults, types, events, methods, slots, dependency graph | Stencil `docs-json` at `dist/docs/components.json` | Copied mechanically into `meta.api`; never authored in agent JSON. |
| Selection, avoidance, composition, accessibility, state ownership, responsive behavior | Co-located `<Name>.agent.json` | Merged into `meta.intent`. |
| React and Angular names and package subpaths | Source-derived component name plus generated adapters | Generated in consumption examples and verified as files. |
| Package name, version ranges, required peers | `package.json` | Read at generation time. |
| Source bodies for detailed MCP context | Component source directory | Included only in individual detail endpoints, not the master registry. |

## Pipeline

1. `npm run build` asks Stencil to emit compiler documentation and framework adapters.
2. `npm run registry:build` discovers components from source and joins them to compiler metadata by tag.
3. Co-located agent intent is schema-validated and merged by stable component ID.
4. `public/r/` is cleared before generation, so renamed and deleted components cannot leave stale output.
5. The same compact registry projection becomes the published `dist/agent.json` package manifest.
6. `npm run agent:validate` verifies authored artifacts, migration state, references, adapter presence, compiler coverage, and exact registry coverage.
7. CI regenerates the registry and rejects any committed-output difference.

## Migration baseline

`agent/baseline/component-metadata-migration.json` contains only components that existed before agent intent became mandatory. New components cannot be added without metadata because they are absent from this baseline. Temporary `legacySummaries` preserve useful discovery prose without carrying any API facts. When a legacy component receives valid metadata, remove its ID and any legacy summary in the same change.

Artifact exceptions require a non-empty reason and are limited to styles or stories. Component source and agent metadata are never silently exempted.
