# AGENTS.md

Repository-wide guidance for **CompoMo** (`@ds-mo/ui`), the Stencil component
layer of the ds-mo design system.

Keep this file short. It is the always-loaded router, not the complete
component handbook. Read only the scoped guidance relevant to the files being
changed.

## Read this when

| Task | Guidance |
| --- | --- |
| Set up or consume the package | [README](README.md), [Storybook introduction](src/docs/Introduction.mdx) |
| Add or change a component | [Web component guidance](src/wc/AGENTS.md), [component authoring](docs/maintainers/component-authoring.md), then the component's source, story, and agent JSON |
| Change shared component composition | Applicable pattern under [agent/patterns](agent/patterns/) |
| Change agent metadata, patterns, registry, or MCP | [Agent guidance](agent/AGENTS.md), [build and registry](docs/maintainers/build-and-registry.md) |
| Change framework integration or package exports | [Framework integration](docs/framework-integration.md), [build and registry](docs/maintainers/build-and-registry.md) |
| Choose verification | [Testing strategy](docs/maintainers/testing.md) |
| Change CI, release, or publishing | [CI guidance](.github/AGENTS.md), [releasing](docs/maintainers/releasing.md) |
| Find other documentation | [Documentation index](docs/index.md) |

## Architecture

CompoMo ships framework-neutral `<ds-*>` custom elements plus generated Angular
and React adapters:

```text
@ds-mo/tokens → @ds-mo/icons → @ds-mo/ui → applications
```

- Source components: `src/wc/components/`
- Shared component utilities: `src/wc/utils/`
- Generated framework source: ignored `src/.generated/{angular,react}/`
- Storybook usage documentation: `src/docs/`
- Agent intent and compositions: co-located `*.agent.json` and `agent/patterns/`
- Generated registry: `public/r/`

## Commands

```bash
npm run build
npm run test
npm run test:e2e
npm run typecheck
npm run lint
npm run lint:css
npm run storybook
npm run storybook:build
npm run storybook:test:a11y
npm run registry:build
npm run agent:validate
npm run verify:pack
```

Use Node from `.nvmrc`.

## Repository-wide invariants

- Use TokoMo custom properties for colors, spacing, dimensions, radii,
  typography, motion, and effects. Do not hardcode design values.
- Author behavior once in Stencil. Do not create hand-maintained Angular or
  React implementations.
- Default components to `scoped: true`; use shadow DOM only when isolation is
  required by the implementation.
- Components are authored for left-to-right interfaces. Do not add RTL-only
  branches or stories.
- Use `ds-text` and `ds-icon` instead of recreating typography or SVG
  primitives. Follow lint output and justify intentional exceptions locally.
- Component API facts come from Stencil source and compiler metadata. Design
  intent comes from co-located agent JSON. Do not duplicate either in general
  prose.
- Exact layout and interaction geometry belongs in source and rendered tests.
  Documentation should explain ownership and intent, not mirror CSS.
- Preserve unrelated user changes in a dirty worktree.

## Generated files

Do not hand-edit:

- `dist/`
- `src/.generated/`
- `src/wc/components.d.ts`
- generated registry content in `public/r/`

Edit the owning source and run the appropriate build or registry command.
Public non-component APIs belong in compiled `/shell`, `/toast`, or `/utils`
entries, never in generated component declarations.

## Component changes

Every component requires:

- `<Name>.tsx`
- `<Name>.css`
- `<Name>.stories.ts`
- `<Name>.agent.json`

Before changing a component contract, inspect those four files and any pattern
referenced by its agent JSON. Update the smallest authoritative source:

- props/events/slots/behavior → Stencil source;
- visual recipes → component or shared utility CSS;
- selection/composition intent → agent JSON or executable pattern;
- consumer explanation → Storybook MDX or story;
- regression protection → focused unit/rendered test.

Do not add component-specific rules to this root file.

## Verification

Choose checks in proportion to the change using the
[testing strategy](docs/maintainers/testing.md).

At minimum:

- documentation only: links/format plus any documentation generator involved;
- agent metadata or patterns: `npm run agent:validate`;
- TypeScript behavior: focused tests and `npm run typecheck`;
- CSS/layout: CSS lint plus a focused rendered test;
- component API/build output: `npm run build`;
- package exports: `npm run verify:pack`.

Run broader suites when shared utilities, shell behavior, forms, overlays, or
cross-browser behavior are affected.

## Git and releases

- Use conventional commits with lowercase subjects.
- Work through a feature branch and PR; do not push directly to `main`.
- Do not hand-bump package versions or publish manually.
- Release Please owns versioning, changelog, tags, GitHub releases, and npm OIDC
  publishing.

See [releasing](docs/maintainers/releasing.md) for exceptional recovery paths.

## Documentation policy

- `README.md`: consumer quick start.
- `src/docs/`: consumer-facing Storybook guidance.
- `docs/maintainers/`: task-oriented maintainer workflows.
- nested `AGENTS.md`: directory-scoped rules.
- `*.agent.json` and patterns: machine-readable design intent.
- source, schemas, package manifests, and generated registries: exact facts.
- `CHANGELOG.md` and Git history: historical record.

Do not add session logs, manually maintained inventories, duplicated package
versions, or resolved troubleshooting notes to active instructions.
