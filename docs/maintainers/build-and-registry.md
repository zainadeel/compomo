# Build and registry

## Build ownership

`npm run build`:

1. Cleans generated framework proxy sources.
2. Builds Stencil custom elements and compiler metadata.
3. Generates and verifies Angular and React adapters.
4. Compiles public `/angular`, `/shell`, `/toast`, and `/utils` entries.
5. Copies public CSS surfaces.
6. Regenerates registry and agent manifests.
7. Bundles the published MCP executable and registry snapshot.
8. Atomically writes `dist/.package-ready.json` after the publish-shaped output
   is complete.

The implementation is authoritative in `stencil.config.ts` and `scripts/`.
Update this summary only when ownership changes.

## Generated boundaries

Never hand-edit:

- `dist/`
- ignored `src/.generated/`
- `src/wc/components.d.ts`
- registry JSON under `public/r/`

Edit source, then regenerate.

`npm run dev` finalizes the same coherent package output after each Stencil
watch build. Storybook uses `npm run dev:components`, a component-only output
profile with its own `dist/.storybook-ready` reload boundary.

## Registry ownership

- Component existence: Stencil component source.
- API facts: `dist/docs/components.json`.
- Design intent: co-located `<Name>.agent.json`.
- Framework names and paths: generated adapters and package exports.
- Package facts: `package.json`.
- Cross-component compositions: `agent/patterns/`.

Commands:

```bash
npm run build
npm run registry:build
npm run agent:validate
npm run verify:pack
```

Run a full build before registry generation when compiler metadata or component
API changed. `agent:validate` checks source inventory, intent, adapters,
patterns, references, and committed registry output.

See `docs/component-metadata-ownership.md` for the detailed merge contract and
`agent/AGENTS.md` for authoring rules.
