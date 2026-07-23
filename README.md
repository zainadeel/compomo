# CompoMo — `@ds-mo/ui`

[![npm version](https://img.shields.io/npm/v/@ds-mo/ui.svg)](https://www.npmjs.com/package/@ds-mo/ui)

Composable web UI components (Stencil custom elements) styled with [TokoMo](https://github.com/zainadeel/TokoMo) design tokens. Works in any framework — ships **Stencil-generated** Angular proxies and React wrappers alongside the `<ds-*>` custom elements.

## Install

```bash
npm install @ds-mo/ui @ds-mo/tokens @ds-mo/icons
```

**Required peer dependencies:**

- **`@ds-mo/tokens`** — CSS custom properties (colors, dimensions, typography, effects). Components will not render correctly without it.
- **`@ds-mo/icons`** — SVG sources for `<ds-icon>` and built-in icon props. Resolved at **your app bundle time** from your installed IcoMo version (not baked into `@ds-mo/ui`).

## Setup

Import TokoMo tokens globally (once, at your app root):

```ts
import '@ds-mo/tokens';
import '@ds-mo/tokens/reset';
import '@ds-mo/tokens/globals';
```

Register the custom elements you render (each import auto-defines its tag):

```ts
import '@ds-mo/ui/dist/components/ds-button-filled.js';
import '@ds-mo/ui/dist/components/ds-button-unfilled.js';
import '@ds-mo/ui/dist/components/ds-bar-nav.js';
// …import only the <ds-*> tags your app uses
```

Your app bundler must resolve `@ds-mo/icons` when it bundles `ds-icon` — install `@ds-mo/icons` alongside `@ds-mo/ui`.

### Framework wrappers (optional)

| Host | Import | Usage |
| --- | --- | --- |
| **Angular** | `@ds-mo/ui/angular` | Stencil proxy directives — property/event bindings in templates |
| **React** | `@ds-mo/ui/react` | `DsButtonFilled`, `DsBarNav`, … — thin wrappers around the same custom elements |
| **Any** | `@ds-mo/ui/dist/components/ds-*.js` | Use `<ds-*>` directly (motive-webapp-lab pattern) |

There is **no** published `@ds-mo/ui/loader` or global `@ds-mo/ui/css` bundle — styles ship scoped inside each custom-element module.

**SPA hosts (Angular / React):** `ds-panel-nav` and `ds-bar-nav` need a [first-paint integration contract](docs/framework-integration.md) on hard reload — seed bar-nav state and stamp `data-nav-style` before custom elements upgrade.

## Agent recipes through MCP

The package includes a local stdio MCP server that exposes component metadata and
executable Custom Elements, React, and Angular composition recipes. It runs on the
developer's machine; no hosted MCP service or API key is required.

When `@ds-mo/ui` is installed in the consuming project, point Codex at the package binary:

```toml
# .codex/config.toml
[mcp_servers.compomo]
command = "./node_modules/.bin/compomo-mcp"
```

Or let npm obtain the latest public package when the MCP client starts:

```toml
[mcp_servers.compomo]
command = "npx"
args = ["-y", "--package", "@ds-mo/ui@latest", "compomo-mcp"]
```

The server provides `list_components`, `get_component`, `get_setup_guide`,
`get_component_source`, `list_patterns`, and `get_pattern`. Add a repository
instruction telling agents to retrieve the applicable pattern before composing
multiple design-system components; connecting the MCP makes recipes available,
while the instruction makes their use consistent.

Registry-oriented tools return both readable Markdown and schema-validated
`structuredContent`. Compatible MCP clients can consume the generated component
API, authored design intent, dependencies, and executable pattern recipes as JSON
without reparsing prose; text content remains available for older clients. Every
tool is annotated as read-only, idempotent, and closed-world.

## Components

All tags are `ds-*` custom elements. Grouped by role (see Storybook for props and stories):

### Primitives
- **Text**, **Icon**, **Divider**, **Loader**, **Skeleton**
- **ButtonFilled** — filled button; `variant` (label / icon / icon-label) + `size` + intent×contrast
- **ButtonUnfilled** — unfilled button; same variants/sizes; surface-aware chrome through `background`
- **Tag** (static metadata or compact menu trigger), **Chip** (removable metadata on primary surfaces), **Badge**

### Controls
- **Toggle**, **Checkbox**, **Radio**, **Input**, **Slider**, **Field**

### Overlays
- **Modal**, **Menu**, **Tooltip**, **Select**, **Toast**

### Navigation
- **Breadcrumb** (hierarchical page ancestors), **TabGroup** (horizontal local views), **PanelSubNav** (vertical local views)
- **ShellApp**, **ShellPage**, **PanelNav**, **BarNav**, **BarTitle**, **BarWorkflow**, **PanelTools**

### Status & layout
- **EmptyState**, **Loader**, **Skeleton**, **CardSetting**, **CardDataVizDonut**, **CardDataVizLine**

## Token dependency

All styling uses TokoMo CSS custom properties. No hardcoded colors, sizes, or shadows — everything maps to the token system. Components will render unstyled if `@ds-mo/tokens` is not imported.

## Semantic prose

Safe semantic DOM produced by Markdown, CMS, or documentation renderers can use the renderer-neutral prose stylesheet:

```css
@import '@ds-mo/ui/prose.css';
```

```html
<article class="ds-prose">
  <h2>Summary</h2>
  <p>Renderer-owned semantic content.</p>
</article>
```

The application remains responsible for parsing and content safety. Use `data-ds-prose="off"` on embedded product UI, and wrap wide tables in `.ds-prose__table-scroll`. See the [prose foundation decision](docs/prose-foundation.md).

## Icon pattern

Components that accept icons use a named `icon` slot:

```html
<ds-button-filled variant="icon" icon="Check" intent="brand" aria-label="Save"></ds-button-filled>
<ds-button-unfilled variant="icon" icon="Pencil" aria-label="Edit"></ds-button-unfilled>
<ds-button-filled label="Save" intent="brand"></ds-button-filled>
```

`icon` / `name` must be a canonical IcoMo export key (`ArrowRight`, `Bell`, …).
