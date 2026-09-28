# Build and registry

## Build ownership

`npm run build`:

1. Cleans generated framework proxy sources.
2. Builds Stencil custom elements and compiler metadata.
3. Generates and verifies Angular, React, and Vue adapters.
4. Compiles public `/angular`, `/react`, `/vue`, `/shell`, `/toast`, and `/utils` entries.
5. Copies public CSS surfaces.
6. Regenerates registry and agent manifests, then compiles the optional Node lint entry with validated styling contracts.
7. Bundles the published MCP executable and registry snapshot.
8. Atomically writes `dist/.package-ready.json` after the publish-shaped output
   is complete.

`stencil.config.ts` owns the compiler output. `scripts/finalize-package.mjs`
owns the ordered post-build steps shared by `npm run build` and `npm run dev`.
Update this summary only when ownership changes.

## Generated boundaries

Never hand-edit:

- `dist/`
- ignored `src/.generated/`
- `src/wc/components.d.ts`
- registry JSON under `public/r/`

Edit source, then regenerate.

Cleanup removes files only from build-owned output and cache directories. The
File Provider collision sweep reports numbered copies in authored component,
test, and legacy framework directories for manual review; it never deletes
them. Cleanup does not follow directory symlinks.

`npm run dev` finalizes the same coherent package output after each Stencil
watch build. Storybook uses `npm run dev:components`, a component-only output
profile with its own `dist/.storybook-ready` reload boundary.

## Token guidance in Storybook

Color Usage directly renders the installed `@ds-mo/tokens/agent` export through
`src/docs/TokenColorGuidance.ts`. Direct rendering keeps development and static
Storybook builds on the same package contract without a generated Markdown file
or an extra generation step. Color families select their recipes through the
contract's recipe links, including recipes shared with other token categories.

Keep token-selection prose in TokoMo. `src/docs/ColorUsage.mdx` owns only CompoMo
setup, component integration, documented component exceptions, forced-colors
behavior, and links to component guidance. The renderer uses native disclosure
elements to keep the full contract browsable without hiding its constraints or
accessibility rules behind a separately maintained summary.

`tests/token-color-guidance.test.ts` validates the installed contract against
its shipped schema and renders it to check content, recipe links, malformed
data, and dependency updates. Run it with the normal unit suite, plus
`npm run typecheck:storybook` and `npm run storybook:build` when changing this
integration. A schema-version change requires reviewing renderer compatibility.

## Bundled dependency licenses

Component, Vue runtime, lint, and MCP bundles emit `THIRD-PARTY-NOTICES` and a
`bundled-dependencies.json` inventory beside their JavaScript. The build derives
these from Stencil source maps or esbuild inputs, including nested dependency
versions, and preserves complete license and notice files. Missing license
files fail the build. Update the shared notice generator when adding a new
bundling path; do not maintain a separate package list by hand.

`npm run verify:pack` requires these artifacts in the published tarball. Root
`NOTICE` also identifies the locally adapted Stylelint code, whose license is
preserved separately from third-party bundle discovery.

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

## MCP compatibility

The packaged `compomo-mcp` binary is a read-only stdio server. Its server
factory is served through the stable v2 SDK in dual-era mode:

- modern clients discover and negotiate `2026-07-28`;
- legacy clients retain the initialize flow through `2025-11-25`;
- both eras expose the same six tools and compatible text and structured
  responses.

`npm run verify:pack` exercises the packed binary once through modern automatic
negotiation and once through the legacy client default. Do not remove the
legacy path in a minor release; it requires a major release and evidence that
the supported MCP host matrix no longer contains initialize-only clients.

See `docs/component-metadata-ownership.md` for the detailed merge contract and
`agent/AGENTS.md` for authoring rules.
