# CompoMo — `@ds-mo/ui`

[![npm version](https://img.shields.io/npm/v/@ds-mo/ui.svg)](https://www.npmjs.com/package/@ds-mo/ui)

Composable web UI components (Stencil custom elements) styled with [TokoMo](https://github.com/zainadeel/TokoMo) design tokens. Works in any framework — ships Angular proxies out of the box.

## Install

```bash
npm install @ds-mo/ui @ds-mo/tokens @ds-mo/icons
```

**Required peer dependencies:**

- **`@ds-mo/tokens`** — CSS custom properties (colors, dimensions, typography, effects). Components will not render correctly without it.
- **`@ds-mo/icons`** — SVG sources for `<ds-icon>` and built-in icon props. Resolved at **your app bundle time** from your installed IcoMo version (not baked into `@ds-mo/ui`).

## Setup

Import TokoMo tokens globally (once, at your app root):

```tsx
import '@ds-mo/tokens';        // all tokens (colors, dimensions, typography, effects)
import '@ds-mo/tokens/reset';   // CSS reset
import '@ds-mo/tokens/globals'; // global styles
```

Register custom elements once at app boot:

```ts
import { defineCustomElements } from '@ds-mo/ui/loader';
import '@ds-mo/tokens/css';
import '@ds-mo/ui/css';

defineCustomElements();
```

Your app bundler (Vite, Webpack, esbuild, etc.) must be able to resolve `@ds-mo/icons` when it bundles `ds-icon` — install `@ds-mo/icons` alongside `@ds-mo/ui`.

Then use `<ds-*>` tags in templates. **Angular** can import Stencil-generated proxy directives from `@ds-mo/ui/angular`. **React** uses the custom elements directly (no parallel React component layer) with `CUSTOM_ELEMENTS_SCHEMA` and imperative JS properties where needed.

**SPA hosts (Angular / React):** `ds-panel-nav` and `ds-bar-nav` need a [first-paint integration contract](docs/framework-integration.md) on hard reload — set a document variant hint or element attributes before the custom element upgrades.

## Components

### Primitives
- **Text** — typography with variant system, semantic colors, truncation, wrap modes
- **Surface** — container with backgrounds, elevation, edges, radius, interactive states
- **Card** — elevated content container with header/footer slots
- **Input** — text input field
- **Slider** — range slider
- **Field** — label + input wrapper
- **Divider** — horizontal or vertical rule

### Actions
- **Button** — primary/secondary/tertiary with intents, sizes, icon support
- **ButtonGroup** — grouped button row with shared borders
- **ToggleButton** — two-state selectable button
- **ToggleButtonGroup** — radio-style group of toggle buttons

### Controls
- **Toggle** — on/off switch
- **Checkbox** — with label and indeterminate state
- **Radio** — single-select radio input

### Data display
- **Tag** — static metadata label with intent coloring
- **Chip** — interactive or removable metadata chip
- **Badge** — compact counter or notification dot
- **Table** — sortable, paginated data table
- **Accordion** — collapsible content sections
- **Pagination** — page navigation control

### Overlays
- **Modal** — dialog with title, subtitle, footer slots
- **Menu** — dropdown with sections, selection, positioning
- **Tooltip** — hover tooltip with shortcut key support
- **Select** — dropdown select
- **Toast** — transient notification
- **Banner** — notification bar with intents, toast mode

### Navigation
- **Tab** — tab button with selection state
- **TabGroup** — grouped tabs with shared selection
- **Breadcrumb** — path navigation

### Status
- **EmptyState** — placeholder states
- **Loader** — loading indicator
- **Skeleton** — content placeholder

### Layout
- **Header** — page header with left/center/right slots
- **Sidebar** — collapsible, resizable navigation with sections and items

### Utility
- **Fade** — gradient overlay
- **Scrollbar** — custom scrollbar
- **ErrorBoundary** — error catch with fallback

## Token dependency

All styling uses TokoMo CSS custom properties. No hardcoded colors, sizes, or shadows — everything maps to the token system. Components will render unstyled if `@ds-mo/tokens` is not imported.

## Icon pattern

Components that accept icons use named slots:

```html
<ds-button>
  <ds-icon-arrow-right slot="icon"></ds-icon-arrow-right>
  Save
</ds-button>
```

Pass any element into `slot="icon"`. Works with `@ds-mo/icons` or any custom SVG element.

## Figma Code Connect

This repo includes [Figma Code Connect](https://developers.figma.com/docs/code-connect/) templates under `code-connect/` so Dev Mode can show curated snippets (e.g. React wrappers from `@ds-mo/ui/react`).

**Prerequisites**

- Node 18+ (same as the rest of the project).
- A Figma **personal access token** with **Code Connect (Write)** and **File content (Read)**. Set it locally only — never commit it:
  - `export FIGMA_ACCESS_TOKEN='…'`, or
  - pass `--token` / `-t` when publishing.

**CLI**

The [`@figma/code-connect`](https://www.npmjs.com/package/@figma/code-connect) package is a devDependency. Use `npx` from the repo root (or install `@figma/code-connect` globally and run `figma connect …`):

```bash
npx figma connect --help
```

You should see subcommands including `publish`, `unpublish`, `create`, and `preview`.

**Config**

- `figma.config.json` — include glob `code-connect/**/*.figma.ts`, snippet label `React`, language `jsx`.
- `tsconfig.figma.json` — optional; point your editor at it for `figma` template typings (`types: ["@figma/code-connect/figma-types"]`).

**Scripts**

```bash
npm run figma:connect:publish:dry-run   # hits Figma API; needs FIGMA_ACCESS_TOKEN or --token
npm run figma:connect:publish           # publish mappings (same token requirement)
npm run figma:connect:preview           # local preview of snippets from templates
npm run typecheck:figma                 # typecheck template files only
```

**First publish**

1. In Figma, open your library component (e.g. Icon), **Copy link to selection**, and set the `// url=…` line at the top of `code-connect/DsIcon.figma.ts` to that URL (see `code-connect/README.md`).
2. Ensure Figma’s GitHub / Code Connect integration points at **this** `compomo` repo and branch.
3. Run `npm run figma:connect:publish:dry-run`, then `npm run figma:connect:publish`.

Each contributor can use their own `FIGMA_ACCESS_TOKEN` in a local shell or `.env.local` (gitignored); do not commit tokens.

### Dev Mode vs “the template” (why mapping exists)

- **The canvas** is whatever designers built (variant names like `Type = Main`, nested structure, etc.). Code Connect does **not** rewrite your Figma file.
- **Dev Mode** can show a **link to your repo file** (e.g. `Icon.tsx`) when you connect the repo — that answers “where is this implemented?”
- The **Code Connect snippet** is the **copy-paste example** Figma shows in Inspect. That text comes from **your published templates** (or from other Figma features like MCP context), not from magically knowing your Stencil prop names.

So: if Figma props already match your API (`intent`, `appearance`), your template can be a thin wrapper and life is easy. If they **do not** match (legacy `Type` vs real `intent`), the template is where you **translate** so the snippet still shows **canonical** usage. You are not making Dev Mode “look like Figma internals” — you are choosing what **engineers should copy** when names diverge.

### GitHub Actions — auto-publish on `main` (optional)

This repo includes [`.github/workflows/figma-code-connect.yml`](.github/workflows/figma-code-connect.yml). It runs `npm run figma:connect:publish` when **`main`** changes under `code-connect/`, `figma.config.json`, or `tsconfig.figma.json`, and on **manual** “Run workflow”.

**1. Create a Figma personal access token**

1. Figma → **Settings** (avatar) → **Security** (or **Personal access tokens** depending on UI).
2. **Generate new token** with at least **File content (Read)** and **Code Connect (Write)** (same scopes as local publish).
3. Copy the token once; you will not see it again.

**2. Add it as a GitHub Actions secret**

1. Open the repo on GitHub: `https://github.com/zainadeel/compomo` (or your fork’s **Settings** if you only care about that fork).
2. **Settings** → **Secrets and variables** → **Actions**.
3. **New repository secret**
   - **Name:** `FIGMA_ACCESS_TOKEN` (must match the workflow exactly).
   - **Secret:** paste the token → **Add secret**.

**3. Confirm the workflow**

- **Actions** tab → **Figma Code Connect** → run **workflow_dispatch** once to verify green, then merge a small change under `code-connect/` to test the `push` path.

If the secret is missing, the publish step fails with Figma’s “no access token” style error until you add it.

### Icon batch files — CompoMo vs IcoMo

**Publish from CompoMo.** The batch JSON and `.figma.batch.ts` live in **this** repo (next to `figma.config.json`), and `figma connect publish` runs here. The **snippet** should show how apps use **`@ds-mo/ui`** (e.g. `<ds-icon name="Bell" />` or `<DsIcon name="Bell" />`). **`name`** values must match **IcoMo** export keys, but the **mapping files and CI job** belong to **CompoMo** because that is the package that owns `<ds-icon>` and the Dev Mode story for product engineers.
