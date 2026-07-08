# AGENTS.md

Guide for AI agents (and humans) working on **CompoMo** (`@ds-mo/ui`). Follows the [agents.md](https://agents.md) convention — tool-agnostic. `CLAUDE.md` points here.

Keep this file as the single source of truth for project conventions. Update it when you add pipelines, components, or change the release flow.

---

## What this project is

CompoMo is an npm package (`@ds-mo/ui`) that ships a **framework-agnostic web component library** authored with [Stencil.js](https://stenciljs.com/). It provides:

- Custom elements (`<ds-*>`) consumable from React 18+, Angular 12+, or plain HTML
- Per-component ESM files in `dist/components/` (tree-shakeable; auto-define on import)
- Auto-generated Angular proxy directives via `@stencil/angular-output-target` in `src/angular/`
- Auto-generated React wrappers via `@stencil/react-output-target` in `src/react/`
- TypeScript declarations at `src/wc/components.d.ts` (package `"types"` entry)
- A component registry (`public/r/`) consumed by the in-repo MCP server for AI-assisted component discovery

It's the **top layer** of the ds-mo design-system trilogy: `@ds-mo/tokens` → `@ds-mo/icons` → `@ds-mo/ui` (CompoMo). TokoMo and IcoMo ship the foundation; CompoMo composes them into reusable UI primitives.

---

## Directory map

```
src/
  wc/                   # Stencil source root (srcDir in stencil.config.ts)
    components/         # One directory per web component (PascalCase)
      ButtonFilled/
        ButtonFilled.tsx
        ButtonFilled.css
        ButtonFilled.stories.ts
      ...               # All ported components (Accordion, Badge, Banner, …)
    components.d.ts     # Auto-generated Stencil type declarations — do not edit
  angular/              # Auto-generated Angular proxies (proxies.ts, index.ts) — do not edit
  react/                # Auto-generated React wrappers — do not edit
  stories/              # Token showcase stories (Colors, Typography, Effects, …)
  docs/                 # Storybook MDX docs (ColorUsage, ElevationUsage, Introduction, …)
  global.css            # Stencil global imports (lives at src/global.css — token CSS)
.storybook/             # Storybook config
scripts/
  build-registry.mjs    # Builds public/r/ — component metadata registry
  mcp-server.mjs        # MCP server serving the registry to AI clients
public/
  r/                    # Generated registry (committed, rebuilt on dev/build)
docs/                   # Framework integration + optical-sizing reference (not Storybook source)
dist/                   # Generated — do not edit directly
  components/           # Per-component ESM files + patched index.d.ts
stencil.config.ts       # Stencil build config (output targets, namespace, srcDir)
figma.config.json       # Figma Code Connect — include globs, Dev Mode snippet label/language
tsconfig.figma.json     # TypeScript for Code Connect templates only (editor / npm run typecheck:figma)
code-connect/           # Code Connect: examples/ (unpublished) + published/*.figma.ts (published via CLI)
.github/
  workflows/
    build.yml              # PR: npm ci, build (stencil), verify dist artifacts + src unchanged
    codeql.yml             # JS/TS security scan — PR + push + weekly Sunday cron
    pr-title.yml           # Lints PR titles as conventional commits
    release-please.yml     # Opens release PRs on feat/fix; publishes to npm on merge (OIDC)
    deploy-storybook.yml   # storybook → GitHub Pages (after npm publish or manual dispatch)
  dependabot.yml           # Monthly bumps for github-actions + npm
release-please-config.json      # Release Please config (node, changelog sections)
.release-please-manifest.json   # Pinned current version
```

---

## Commands

```bash
npm run build            # Stencil compiler build → dist/
npm run test             # Node unit tests (bar-nav overflow utils, panel-nav, etc.)
npm run test:e2e         # Playwright — BarNav overflow collapse (builds first)
npm run test:e2e:install # One-time Chromium for Playwright
npm run dev              # Stencil watch using normal dist output (updates dist/ on source changes)
npm run storybook        # Stencil watch + Storybook on :6006 (auto-reloads when dist/ rebuilds)
npm run storybook:build  # Build static Storybook
npm run typecheck        # tsc --noEmit (Stencil source in src/wc)
npm run lint             # eslint src/
npm run registry:build   # Regenerate public/r/ (component registry)
npm run mcp              # Run the in-repo MCP server
npm run figma:connect:publish:dry-run # Figma Code Connect — dry-run publish (set FIGMA_ACCESS_TOKEN or --token)
npm run figma:connect:publish         # Publish Code Connect mappings to Figma
npm run typecheck:figma               # tsc for code-connect published + examples templates only
npm run clean            # Remove dist/
```

---

## Build pipeline (what `npm run build` does)

The Stencil compiler (`stencil.config.ts`) builds from `src/wc/`:

1. Transpiles every `@Component()` class in `src/wc/components/**/*.tsx` to native Custom Elements
2. Emits per-component ESM files to `dist/components/` (`dist-custom-elements` — auto-define on import)
3. Generates TypeScript declarations → `src/wc/components.d.ts` (+ `scripts/patch-index-types.mjs` augments `dist/components/index.d.ts`)
4. Runs Angular output target → regenerates `src/angular/` (commit if CI reports dirty `src/`)
5. Runs React output target → regenerates `src/react/` (commit if CI reports dirty `src/`)

There is **no** global `dist/ds-mo/ds-mo.css` bundle in the current Stencil config — styles are scoped per component.

Package `exports`:

```jsonc
{
  ".":               { "import": "./dist/components/index.js", "types": "./src/wc/components.d.ts" },
  "./angular":       { "import": "./src/angular/index.ts", "types": "./src/angular/index.ts" },
  "./react":         { "import": "./src/react/components.ts", "types": "./src/react/components.ts" },
  "./dist/components": { "import": "./dist/components/index.js", "types": "./src/wc/components.d.ts" },
  "./nav":           { "import": "./dist/lib/nav/index.js", "types": "./dist/lib/nav/index.d.ts" },
  "./utils":         { "import": "./dist/lib/utils/index.js", "types": "./dist/lib/utils/index.d.ts" },
  "./dist/components/*": "./dist/components/*"
}
```

**`/nav` and `/utils` ship compiled JS + d.ts** (`scripts/build-lib-exports.mjs`: esbuild bundle per entry + `tsc -p tsconfig.lib.json` declarations → `dist/lib/`). They previously shipped raw TS source, which made consumer type-checking depend on our devDependencies (`@stencil/core` types) and broke toolchains that don't transpile node_modules TS. `/angular` and `/react` still ship source — the Stencil output-target convention — revisit in [#257](https://github.com/zainadeel/compomo/issues/257) if it bites a consumer.

Consumers install the **ds-mo trilogy** and import the tags they render:

```bash
npm install @ds-mo/tokens @ds-mo/icons @ds-mo/ui
```

```ts
// Custom elements — import each tag you use (auto-defines)
import '@ds-mo/ui/dist/components/ds-button-filled.js';
import '@ds-mo/ui/dist/components/ds-button-unfilled-icon.js';
import '@ds-mo/tokens';

// Angular — Stencil-generated proxy directives
import { DsButtonFilled } from '@ds-mo/ui/angular';

// React — Stencil-generated wrappers
import { DsButtonFilled, DsBarNav } from '@ds-mo/ui/react';
```

**Peer dependency model:** `@ds-mo/tokens` and `@ds-mo/icons` are **required** runtime peers — same as tokens, icons are **not** inlined into `dist/`. Stencil externalizes `@ds-mo/icons`; the consumer's bundler resolves SVG exports when bundling `ds-icon`.

**`ds-icon` names:** Pass canonical IcoMo export keys only (`Bell`, `Chart`, `DeviceMobile`). IcoMo `meta.json` aliases are for discovery/docs — not runtime resolution. `prebuild` generates `system-icon-catalog.ts` / `flag-icon-catalog.ts` as **lazy loader maps** — one static-analyzable `() => import('@ds-mo/icons/svg/<Name>')` per icon, so consumer bundlers code-split a tiny chunk per icon instead of shipping the whole catalog (~340 kB raw) in the initial bundle. Glyphs cache in a global-symbol-keyed shared cache (`icon-cache.ts`) after first load.

**Icon preloading (`registerIcons`):** icons render async on first use (glyph pops into a fixed-size box — no layout shift). Apps can pre-register critical icons (nav chrome) for synchronous first paint: statically import the SVG strings from `@ds-mo/icons` and call `registerIcons` from `@ds-mo/ui/utils` before rendering. See the JSDoc in `src/wc/components/Icon/icon-cache.ts`.

**Icon resolution + injection hardening:** `ds-icon` resolves names by **exact own-key match** against canonical IcoMo export names — meta.json aliases and inherited prototype keys never resolve. Every glyph is validated at the render boundary (`icon-svg.ts`: `<svg>` root, no executable/foreign-content elements, no `on*` attributes, fragment-only `href`s) and injected as parsed DOM nodes — never `innerHTML` — so ds-icon works under a strict CSP with `require-trusted-types-for`. Invalid markup renders an empty fixed-size box.

**Framework wrappers:** Stencil emits **Angular proxy directives** (`angularOutputTarget` in `stencil.config.ts`) and **React wrappers** (`reactOutputTarget` in `stencil.config.ts`). Do not hand-maintain a parallel React component tree; generated wrappers live in `src/react/` and are recreated by `npm run build`.

---

## Component authoring workflow

**Adding a new Stencil component**

1. Create `src/wc/components/<PascalName>/`:
   - `<PascalName>.tsx` — Stencil component class (see pattern below)
   - `<PascalName>.css` — scoped styles using TokoMo CSS custom properties only
   - `<PascalName>.stories.ts` — lit-html stories (see Storybook section below)
2. Run `npm run build` — Stencil auto-discovers the new component by `@Component()` tag.
3. Verify in Storybook: `npm run storybook`.
4. Regenerate registry: `npm run registry:build` (commit `public/r/` changes).

**Stencil component skeleton**

```tsx
import { Component, Prop, Event, EventEmitter, h, Host } from '@stencil/core';

@Component({
  tag: 'ds-my-component',
  styleUrl: 'MyComponent.css',
  scoped: true,               // always scoped: true (light DOM, tokens penetrate naturally)
})
export class MyComponent {
  @Prop() label: string = '';
  @Prop({ mutable: true }) open: boolean = false;

  @Event() dsChange!: EventEmitter<string>;

  render() {
    return (
      <Host>
        <div class="my-component">
          <slot />
        </div>
      </Host>
    );
  }
}
```

**Key Stencil patterns**

| Pattern | How |
|---|---|
| Reactive prop | `@Prop() value: string = ''` |
| Mutable prop (component can self-update) | `@Prop({ mutable: true }) open = false` |
| Derived/computed | getter `private get resolved()` |
| Internal state (triggers re-render) | `@State() private foo: T` |
| Side-effect on prop change | `@Watch('propName') onPropChange(next, prev)` |
| Custom event | `@Event() dsChange: EventEmitter<T>; this.dsChange.emit(val)` |
| DOM element reference | `@Element() el: HTMLElement` |
| Lifecycle | `componentDidLoad()`, `disconnectedCallback()` |
| Cross-element keyboard | `@Listen('keydown')` |
| Children API | `<slot />` (named: `<slot name="footer" />`) |
| Polymorphic element | `const Tag = this.href ? 'a' : 'button'; return <Tag>…</Tag>` |
| Icon | `<slot name="icon" />` — consumer provides any SVG or `ds-*` element |

**Styling rules (non-negotiable)**

- **Never hardcode colors, spacing, radii, shadows, or typography values.** Always use CSS custom properties from `@ds-mo/tokens`. Hardcoded values break theming.
- Styles go in `<PascalName>.css` — one per component. Stencil scopes them automatically via `scoped: true`.
- Use `:host` for component-level styles; use class selectors for internal elements.
- Theming is driven by the `data-theme` attribute on a parent element (`@ds-mo/tokens` provides light/dark).

**Icon-only unfilled buttons**

- Use `ds-button-unfilled-icon` for unfilled square icon buttons, including nav chrome actions, overflow triggers, and tool rail actions.
- Use `isActive` for the active/selected visual state. Active state changes icon color to primary and uses the active interaction fill by default; set `activeFill={false}` only for shell chrome cases that need primary icon color without a filled active background.
- Use `hasBorder` only when the button needs the optional 1px `--color-border-tertiary` stroke.
- Do not create one-off button CSS for standard icon-only actions. Keep custom implementations only when the interaction is structurally different, such as the panel-nav M mark that swaps to a collapse/expand icon on hover.

**Focus states**

- New interactive components must use the shared focus utility in `src/wc/utils/focus-ring.css`; do not hand-roll `:focus-visible` outlines in component CSS.
- Import it from component CSS with `@import '../../utils/focus-ring.css';`.
- Prefer `ds-focus-ring-inset` for borderless controls, controls without their own stable background, chrome-aligned controls, menu items, nav items, tool rail actions, and tab-like controls. This keeps the ring tight to the visual hit target and avoids awkward outside outlines on grouped/pill surfaces.
- Use `ds-focus-ring` only when an outside ring is intentional and visually fits the component shape.
- Use `ds-focus-ring--visible` only when component-managed roving focus has confirmed keyboard modality, such as a menu opened with Enter/Space/Arrow keys or navigated with arrow keys. Do not apply it after pointer/mouse opens.
- Focus is a ring state, not hover. Keyboard/programmatic focus must not use hover or pressed fills unless the item is actually hovered or pressed.
- Set `--ds-focus-ring-color` from the surface context instead of hardcoding colors: default app surfaces use `--color-interaction-focus`, navigation chrome uses `--color-navigation-interaction-focus`, and medium/bold/strong/always-dark surfaces use their matching `*-interaction-*-focus` token.

**TypeScript**

- `strict` mode. No `any`. Export every public prop interface.
- Prefer string-union types for variant props (`type ButtonIntent = 'brand' | 'positive' | ...`).
- `@Prop()` with non-primitive types (arrays, objects) must be set via JS property (not HTML attribute). Note this in prop JSDoc.
- **Spatial and timing props** (`sideOffset`, `alignOffset`, `delay`, durations for JS timers) accept `number | string`: use a number for px/ms (backward compatible), or a TokoMo CSS value / `var(--dimension-*)` / `var(--effect-*)` string (preferred). Resolve at runtime via `src/wc/utils/resolve-css-length-px.ts` and `resolve-css-time-ms.ts` — never hardcode magic numbers that have token equivalents. Named defaults live in `src/wc/utils/token-defaults.ts` (`@ds-mo/tokens/ts` var names only — values still resolve at runtime).

**Storybook stories (Stencil pattern)**

```ts
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-my-component.js';  // import from dist

const meta: Meta = {
  title: 'Category/MyComponent',
  tags: ['autodocs'],
  argTypes: { label: { control: 'text' } },
  args: { label: 'Hello' },
};
export default meta;

export const Default: Story = {
  render: args => html`<ds-my-component label=${args['label']}></ds-my-component>`,
};
```

For components with complex JS-only props (arrays, objects), use `lit/directives/ref.js`:

```ts
import { ref } from 'lit/directives/ref.js';

render: () => html`
  <ds-table ${ref(el => {
    if (!el) return;
    (el as any).columns = columns;
    (el as any).data = data;
  })}></ds-table>
`
```

For overlay components that need `?open=${true}` in stories (no `<script>` tags — they don't execute in Storybook):

```ts
render: () => html`<ds-modal ?open=${true} heading="Title">…</ds-modal>`
```

---

## Commit & PR conventions

**Conventional Commits**, enforced by `.github/workflows/pr-title.yml`:

```
<type>(<optional-scope>): <lowercase subject>

types: feat | fix | perf | revert | docs | style | refactor | test | build | ci | chore
```

Subject must **start with a lowercase letter** (workflow enforced). Scope is optional — common ones here: component names (`Button`, `Modal`), `docs`, `build`, `storybook`.

**Version-bumping types** (trigger a release PR via release-please):
- `feat:` → minor bump
- `fix:` / `perf:` → patch bump
- `feat!:` or `BREAKING CHANGE:` footer → major bump (pre-1.0: bump minor instead)
- `ci:` / `chore:` / `build:` / `test:` / `style:` / `docs:` / `refactor:` → **do not trigger a release** (most hidden in changelog; `docs` is visible)

See `release-please-config.json` for the type → changelog section mapping.

**Branch naming:** `type/short-kebab-description` (e.g. `feat/add-toast-component`, `ci/add-release-workflow`, `docs/agent-onboarding`).

**PR flow:** always via feature branch + PR to `main`. Direct pushes to `main` are blocked.

---

## Versioning

Follow semver: breaking API changes require a **major** bump (`@ds-mo/ui` is post-1.0).

Current version lives in two places — kept in sync by release-please:
- `package.json` `"version"`
- `.release-please-manifest.json` `"."`

---

## Release flow

**Automated path (normal case):**

1. Land a `feat:` or `fix:` commit on `main` via PR.
2. `release-please.yml` fires → opens (or updates) a release PR that bumps `package.json`, updates `CHANGELOG.md`, and updates `.release-please-manifest.json`.
3. Review and merge the release PR.
4. Release Please tags `vX.Y.Z`, creates the GitHub Release, and the `publish` job in the same workflow publishes to npm with `--provenance` via **OIDC Trusted Publisher** (no long-lived `NPM_TOKEN` — configured in npm under Package Settings → Trusted Publishers).

**Auth:** `release-please.yml` uses `secrets.RELEASE_PLEASE_TOKEN` — same PAT pattern as TokoMo and IcoMo. Use a classic PAT with `repo` scope (or a fine-grained PAT with Contents + Pull requests + Issues read/write). Re-authorize SSO on the token if the `zainadeel` org requires it.

**Partial failure recovery:** If release-please creates the GitHub tag/release but the job fails on a post-release step (e.g. label cleanup → npm publish skipped), run the **Release Please** workflow manually (`workflow_dispatch`) with the existing tag (e.g. `v1.7.0`). Do **not** switch to `GITHUB_TOKEN` — keep the shared PAT pattern across ds-mo repos.

**Forcing a specific version (`Release-As:` escape hatch):**

Push an empty commit with a `Release-As: X.Y.Z` trailer in the commit message body to `main`:

```bash
git commit --allow-empty -m "chore: release as X.Y.Z

Release-As: X.Y.Z"
```

Release-please will open a release PR at that exact version. Useful when only `ci:`/`chore:` commits have accumulated and you want to cut a release.

**Merge strategy:** use "Create a merge commit" (not squash) when merging a `Release-As:` commit so the trailer survives. If squash is enforced, paste `Release-As: X.Y.Z` into the squash commit message body manually.

**Never** run `npm publish` manually for a normal release — it bypasses provenance and skips the tag/release/changelog dance.

---

## npm Trusted Publisher setup

`@ds-mo/ui` is published on npm (see `release-please.yml`). Trusted Publisher OIDC is configured on the package — **do not** run `npm publish` manually for routine releases.

---

## CI workflows

| Workflow | Trigger | Purpose |
|---|---|---|
| `build.yml` | PR to main | `npm ci` + typecheck + build + verify `dist/` artifacts + verify `src/` not mutated |
| `pr-title.yml` | PR opened/edited | Enforce conventional-commit PR titles (lowercase subject) |
| `codeql.yml` | Push/PR to main, weekly Sunday | GitHub CodeQL JS/TS security scan |
| `release-please.yml` | Push to main | Open release PR on feat/fix; publish to npm via OIDC when release PR merges |
| `deploy-storybook.yml` | After successful npm publish (release-please), manual | Build + deploy Storybook to GitHub Pages |
| `figma-code-connect.yml` | Push to `main` when `code-connect/` or figma config changes; manual | Publish Code Connect to Figma (`secrets.FIGMA_ACCESS_TOKEN`) |
| `dependabot.yml` | Monthly | Bump github-actions + npm devDependencies |

---

## Things not to do

- **Do not edit `dist/`** — it's generated by `stencil build`. Edit `src/wc/`, then run `npm run build`.
- **Do not edit `src/angular/proxies.ts` or `src/angular/index.ts`** — auto-generated by the Angular output target on every build.
- **Do not edit `src/react/`** — auto-generated by the React output target on every build.
- **Do not edit `src/wc/components.d.ts`** — auto-generated by Stencil.
- **Do not hand-add React wrapper components** — new UI goes in `src/wc/components/`; React wrappers are generated automatically.
- **Do not hardcode colors, spacing, or other design values** — always use `@ds-mo/tokens` CSS custom properties. Hardcoding breaks theming.
- **Default to `scoped: true`** in `@Component()` so token CSS variables penetrate naturally. Use `shadow: true` only where required (e.g. `ds-loader`, `ds-toggle`, `ds-skeleton`).
- **Do not name a `@Prop()` `title`** — it's a reserved HTML attribute and causes Stencil a build warning. Use `heading` or another name.
- **Do not rely on `@Watch` firing for the initial prop value** — it only fires on subsequent changes. Call the handler explicitly in `componentDidLoad()` for initial state (e.g. `if (this.open) this.onOpenChange(true)`).
- **Do not re-export service singletons from a file that has `@Component()`** — Stencil enforces one export per file. Put services in a separate `*.ts` file.
- **Do not hand-bump `package.json` version** during normal work — let release-please do it.
- **Do not `git push` to `main`** — always branch + PR.
- **Do not commit `NPM_TOKEN` or any npm auth** — publishing uses OIDC, no secrets required.
- **Do not skip `npm install -g npm@latest`** in the publish job — Trusted Publisher requires npm ≥ 11.5.1.
- **Do not set `NODE_AUTH_TOKEN`** in the publish step — OIDC handles auth; a stray token can conflict.
- **Do not add `src/wc/*` trees consumed by package `exports`** (e.g. `./nav` importing `../utils`) without listing them in `package.json` `files` — run `npm run verify:pack` before merging.

---

## Fast lookups

### Design tokens

Read `node_modules/@ds-mo/tokens/dist/tokens-index.json` — one file, no grep. It's a flat object keyed by CSS custom-property name with `{$type, $value}` entries, plus a top-level `categories` map that groups names by category:

| Category key | What's in it |
|---|---|
| `colors.reference` | Raw palette (`--color-reference-*`) |
| `colors.semantic` | Semantic surface/border/foreground colors (`--color-background-*`, `--color-border-*`, `--color-foreground-*`, etc.) |
| `colors.data` | Data-viz palettes |
| `dimensions` | Spacing, sizing, radius, stroke (`--dimension-*`) |
| `typography` | Font size, weight, line-height (`--typography-*`) |
| `effects` | Animation duration/easing, motion shorthands, blur, shadow, elevation (`--effect-*`) |

To find the right token: read the file, access the `categories.<key>` array for names, then look up the value. Single read, no grep.

**Motion tokens quick reference:**
- `--effect-motion-short-1` = 50 ms ease-in-out
- `--effect-motion-short-2` = 100 ms ease-in-out
- `--effect-motion-short-3` = 200 ms ease-in-out (default interaction speed)
- `--effect-motion-medium-1` = 300 ms ease-in-out

Use `--effect-motion-*` (duration + easing combined) in `transition:` values. If you need the duration alone for `calc()`, use `--effect-animation-duration-short-N` separately.

---

## Quick reference: where things live

| Need to change... | Edit this |
|---|---|
| A component's behavior | `src/wc/components/<Name>/<Name>.tsx` |
| A component's styling | `src/wc/components/<Name>/<Name>.css` (tokens only — no hardcoded values) |
| A component's Storybook stories | `src/wc/components/<Name>/<Name>.stories.ts` |
| Angular proxy output | Auto-generated: `src/angular/proxies.ts`, `src/angular/index.ts` — do not hand-edit |
| React wrapper output | Auto-generated: `src/react/` — do not hand-edit |
| Token-showcase stories | `src/stories/*.stories.tsx` |
| Usage docs (MDX) | `src/docs/*.mdx` |
| Component registry logic | `scripts/build-registry.mjs` |
| BarNav overflow + SPA/HMR integration | `docs/framework-integration.md` |
| BarNav overflow e2e tests | `tests/e2e/bar-nav-overflow.spec.ts` |
| MCP server | `scripts/mcp-server.mjs` |
| Stencil build config | `stencil.config.ts` |
| Release changelog sections | `release-please-config.json` |
| PR title rules | `.github/workflows/pr-title.yml` |
| Storybook deploy | `.github/workflows/deploy-storybook.yml` |
| Figma Code Connect templates | `code-connect/published/*.figma.ts`, `figma.config.json` — see README |
