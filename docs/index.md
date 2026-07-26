# Documentation index

Use the narrowest document that answers the task. Exact API and inventory facts
live in source, package manifests, compiler output, and generated registries.

## Consumers

| Need | Read |
| --- | --- |
| Install and first component | [README](../README.md), [Storybook introduction](../src/docs/Introduction.mdx) |
| Angular, React, routing, forms, or first paint | [Framework integration](framework-integration.md) |
| Color | [Color usage](../src/docs/ColorUsage.mdx) |
| Typography | [Typography usage](../src/docs/TypographyUsage.mdx) |
| Elevation | [Elevation usage](../src/docs/ElevationUsage.mdx) |
| Shared layout recipes | [Layout recipes](../src/docs/LayoutRecipes.mdx) |
| Selection composition | [Selection patterns](../src/docs/SelectionPatterns.mdx) |
| Semantic prose | [Prose foundation](prose-foundation.md) |

Component props, events, methods, slots, stories, and intent are discoverable
from Storybook and `public/r/`.

## Maintainers

| Task | Read |
| --- | --- |
| Author a component | [Component authoring](maintainers/component-authoring.md), [web component guidance](../src/wc/AGENTS.md) |
| Build, exports, registry, adapters, or MCP | [Build and registry](maintainers/build-and-registry.md), [agent guidance](../agent/AGENTS.md) |
| Select tests | [Testing strategy](maintainers/testing.md) |
| Release or publish | [Releasing](maintainers/releasing.md), [CI guidance](../.github/AGENTS.md) |
| Agent metadata ownership | [Component metadata ownership](component-metadata-ownership.md) |
| Agent contract design | [Agent contract RFC](agent-contract-rfc.md) |
| Control press policy | [Control press policy](control-press-policy.md) |
| Internal layout recipe ownership | [Layout recipe foundation](layout-recipe-foundation.md) |

## Documentation ownership

- Consumer concepts belong in Storybook MDX.
- Maintainer workflows belong in `docs/maintainers/`.
- Directory rules belong in nested `AGENTS.md`.
- Component intent belongs beside the component in `*.agent.json`.
- Cross-component recipes belong in `agent/patterns/`.
- Historical changes belong in `CHANGELOG.md` and Git history.

Delete stale guidance instead of labeling it “legacy” indefinitely.
