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

## Components

All tags are `ds-*` custom elements. Grouped by role (see Storybook for props and stories):

### Primitives
- **Text**, **Icon**, **Divider**, **Loader**, **Skeleton**
- **ButtonFilled** — filled button; `variant` (label / icon / icon-label) + `size` + intent×contrast
- **ButtonUnfilled** — unfilled button; same variants/sizes; surface-aware chrome through `background`
- **Tag** (static metadata or compact menu trigger), **Chip** (removable metadata on primary surfaces), **Badge**

### Controls
- **Toggle**, **Checkbox**, **Radio**, **Input**, **Slider**, **Field**

### Data display
- **Table**, **Pagination**

### Overlays
- **Modal**, **Menu**, **Tooltip**, **Select**, **Banner**

### Navigation
- **TabGroup** (horizontal local views), **PanelSubNav** (vertical local views)
- **AppShell**, **PanelNav**, **BarNav**, **PanelTools**

### Status & layout
- **EmptyState**, **Loader**, **Skeleton**, **Card** (shared chrome), **CardSetting**, **CardDataVizDonut**

## Token dependency

All styling uses TokoMo CSS custom properties. No hardcoded colors, sizes, or shadows — everything maps to the token system. Components will render unstyled if `@ds-mo/tokens` is not imported.

## Icon pattern

Components that accept icons use a named `icon` slot:

```html
<ds-button-filled variant="icon" icon="Check" intent="brand" aria-label="Save"></ds-button-filled>
<ds-button-unfilled variant="icon" icon="Pencil" aria-label="Edit"></ds-button-unfilled>
<ds-button-filled label="Save" intent="brand"></ds-button-filled>
```

`icon` / `name` must be a canonical IcoMo export key (`ArrowRight`, `Bell`, …).

## Figma Code Connect

This repo includes [Figma Code Connect](https://developers.figma.com/docs/code-connect/) templates under `code-connect/` so Dev Mode can show curated snippets (e.g. React wrappers from `@ds-mo/ui/react`).

**Prerequisites**

- Node **20.19+** or **22.12+** (see `package.json` `engines` and `.nvmrc`).
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

- `figma.config.json` — include glob `code-connect/published/**/*.figma.ts`, snippet label `React`, language `jsx`.
- `tsconfig.figma.json` — optional; point your editor at it for `figma` template typings (`types: ["@figma/code-connect/figma-types"]`).

**Scripts**

```bash
npm run figma:connect:publish:dry-run   # hits Figma API; needs FIGMA_ACCESS_TOKEN or --token
npm run figma:connect:publish           # publish mappings (same token requirement)
npm run figma:connect:preview           # local preview of snippets from templates
npm run typecheck:figma                 # typecheck template files only
```

**First publish**

1. Copy `code-connect/examples/ds-icon.figma.ts` to `code-connect/published/DsIcon.figma.ts`, then set the `// url=…` line from Figma → **Copy link to selection** (see `code-connect/README.md`).
2. Ensure Figma’s GitHub / Code Connect integration points at **this** `compomo` repo and branch.
3. Run `npm run figma:connect:publish:dry-run`, then `npm run figma:connect:publish`.

Each contributor can use their own `FIGMA_ACCESS_TOKEN` in a local shell or `.env.local` (gitignored); do not commit tokens.

### Dev Mode vs “the template” (why mapping exists)

- **The canvas** is whatever designers built (variant names like `Type = Main`, nested structure, etc.). Code Connect does **not** rewrite your Figma file.
- **Dev Mode** can show a **link to your repo file** (e.g. `src/wc/components/Icon/Icon.tsx`) when you connect the repo — that answers “where is this implemented?”
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

**Publish from CompoMo.** Code Connect templates live under `code-connect/published/` (see `code-connect/examples/` for starters). `figma connect publish` runs from this repo. Snippets should show **`@ds-mo/ui`** usage (e.g. `<ds-icon name="Bell" />` or `<DsIcon name="Bell" />` from `@ds-mo/ui/react`). **`name`** values must match **IcoMo** export keys.
