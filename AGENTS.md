# AGENTS.md

Guide for AI agents (and humans) working on **CompoMo** (`@ds-mo/ui`). Follows the [agents.md](https://agents.md) convention — tool-agnostic. `CLAUDE.md` points here.

Keep this file as the single source of truth for project conventions. Update it when you add pipelines, components, or change the release flow.

---

## What this project is

CompoMo is an npm package (`@ds-mo/ui`) that ships a **framework-agnostic web component library** authored with [Stencil.js](https://stenciljs.com/). It provides:

- Custom elements (`<ds-*>`) consumable from React 19, Angular 12+, or plain HTML without framework wrappers
- Per-component ESM files in `dist/components/` (tree-shakeable)
- Auto-generated Angular proxy directives via `@stencil/angular-output-target` in `src/angular/`
- A global CSS bundle at `dist/ds-mo/ds-mo.css` (token-driven, no hardcoded values)
- TypeScript definitions at `dist/components/index.d.ts`
- A component registry (`public/r/`) consumed by the in-repo MCP server for AI-assisted component discovery

It's the **top layer** of the ds-mo design-system trilogy: `@ds-mo/tokens` → `@ds-mo/icons` → `@ds-mo/ui` (CompoMo). TokoMo and IcoMo ship the foundation; CompoMo composes them into reusable UI primitives.

---

## Directory map

```
src/
  wc/                   # Stencil source root (srcDir in stencil.config.ts)
    components/         # One directory per web component (PascalCase)
      Button/
        Button.tsx        # Stencil component class (@Component, @Prop, @Event, …)
        Button.css        # Scoped styles — token custom properties only (no CSS Modules)
        Button.stories.ts # Storybook stories using lit-html html`` tags
      ...               # All ported components (Accordion, Badge, Banner, …)
    components.d.ts     # Auto-generated Stencil type declarations — do not edit
  angular/              # Auto-generated Angular proxies (proxies.ts, index.ts) — do not edit
  stories/              # Token showcase stories (Colors, Typography, Effects, …)
  docs/                 # Storybook MDX docs (ColorUsage, ElevationUsage, …)
  global.css            # Global CSS: @import '@ds-mo/tokens/css'
.storybook/             # Storybook config
scripts/
  build-registry.mjs    # Builds public/r/ — component metadata registry
  mcp-server.mjs        # MCP server serving the registry to AI clients
public/
  r/                    # Generated registry (committed, rebuilt on dev/build)
docs/                   # Storybook reference docs source
dist/                   # Generated — do not edit directly
  components/           # Per-component ESM files + type definitions
  ds-mo/                # Global CSS bundle (ds-mo.css)
stencil.config.ts       # Stencil build config (output targets, namespace, srcDir)
.github/
  workflows/
    build.yml              # PR: npm ci, build (stencil), verify dist artifacts + src unchanged
    codeql.yml             # JS/TS security scan — PR + push + weekly Sunday cron
    pr-title.yml           # Lints PR titles as conventional commits
    release-please.yml     # Opens release PRs on feat/fix; publishes to npm on merge (OIDC)
    deploy-storybook.yml   # stencil build → storybook build → deploy to GitHub Pages
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
npm run dev              # Stencil build then Storybook dev server on :6006
npm run storybook:build  # Build static Storybook
npm run typecheck        # tsc --noEmit (Stencil source in src/wc)
npm run lint             # eslint src/
npm run registry:build   # Regenerate public/r/ (component registry)
npm run mcp              # Run the in-repo MCP server
npm run clean            # Remove dist/
```

---

## Build pipeline (what `npm run build` does)

The Stencil compiler (`stencil.config.ts`) builds from `src/wc/`:

1. Transpiles every `@Component()` class in `src/wc/components/**/*.tsx` to native Custom Elements
2. Emits per-component ESM files to `dist/components/` (auto-define mode — `customElementsExportBehavior: 'auto-define-custom-elements'`)
3. Bundles global CSS (token imports + component styles) → `dist/ds-mo/ds-mo.css`
4. Generates TypeScript declarations → `dist/components/index.d.ts`
5. Runs Angular output target → regenerates `src/angular/proxies.ts` and `src/angular/index.ts`

Package `exports`:

```jsonc
{
  ".":          { "import": "./dist/components/index.js", "types": "./dist/components/index.d.ts" },
  "./angular":  { "import": "./src/angular/index.ts" },
  "./css":      "./dist/ds-mo/ds-mo.css"
}
```

Consumers install the **ds-mo trilogy** and register custom elements once at app boot:

```bash
npm install @ds-mo/tokens @ds-mo/icons @ds-mo/ui
```

```ts
// React / plain HTML — use <ds-*> tags + JS properties (no React wrapper layer)
import { defineCustomElements } from '@ds-mo/ui/loader';
import '@ds-mo/tokens/css';
import '@ds-mo/ui/css';
defineCustomElements();

// Angular — Stencil-generated proxy directives from '@ds-mo/ui/angular'
```

**Peer dependency model:** `@ds-mo/tokens` and `@ds-mo/icons` are **required** runtime peers — same as tokens, icons are **not** inlined into `dist/`. Stencil externalizes `@ds-mo/icons`; the consumer's bundler resolves SVG exports when bundling `ds-icon`.

**`ds-icon` names:** Pass canonical IcoMo export keys only (`Bell`, `Chart`, `DeviceMobile`). IcoMo `meta.json` aliases are for discovery/docs — not runtime resolution. `prebuild` generates `system-icon-catalog.ts` / `flag-icon-catalog.ts` with **named imports** per icon so production app bundles retain the full peer catalog (dynamic `icons[name]` alone is tree-shaken).

**Framework wrappers:** Stencil emits **Angular proxy directives** only (`angularOutputTarget` in `stencil.config.ts`). There is **no** Stencil React output target — React hosts use native custom elements (`CUSTOM_ELEMENTS_SCHEMA` + imperative props). Do not maintain a parallel React component tree in this repo.

---

## Component authoring workflow

**Adding a new Stencil component**

1. Create `src/wc/components/<PascalName>/`:
   - `<PascalName>.tsx` — Stencil component class (see pattern below)
   - `<PascalName>.css` — scoped styles using TokoMo CSS custom properties only
   - `<PascalName>.stories.ts` — lit-html stories (see Storybook section below)
2. Run `npm run build` — Stencil auto-discovers the new component by `@Component()` tag.
3. Verify in Storybook: `npm run dev`.
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

**TypeScript**

- `strict` mode. No `any`. Export every public prop interface.
- Prefer string-union types for variant props (`type ButtonIntent = 'brand' | 'positive' | ...`).
- `@Prop()` with non-primitive types (arrays, objects) must be set via JS property (not HTML attribute). Note this in prop JSDoc.

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

Pre-1.0: breaking renames / prop removals ship as **minor** bumps. Once we hit `1.0.0`, breaking changes go behind majors.

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

Must be done manually by the package owner once. Because `@ds-mo/ui` has never been published, an initial manual publish is required first (Trusted Publisher can only be configured on an existing package):

1. **Initial manual publish (first-time only):** `npm publish --access public` from a clean checkout at the current `package.json` version (this is the one and only manual publish ever).
2. Go to https://www.npmjs.com/package/@ds-mo/ui/access
3. Scroll to **Trusted Publishers** → **Add a publisher**
4. Publisher: `GitHub Actions`
5. GitHub org/user: `zainadeel`
6. Repository: `compomo`
7. Workflow filename: `release-please.yml` (no path prefix)
8. Environment: _(leave blank)_
9. Click **Save** and reload to confirm.
10. Bump via `Release-As:` (pick a version higher than the manual publish, e.g. `0.2.0`) to drive the first automated release.

---

## CI workflows

| Workflow | Trigger | Purpose |
|---|---|---|
| `build.yml` | PR to main | `npm ci` + typecheck + build + verify `dist/` artifacts + verify `src/` not mutated |
| `pr-title.yml` | PR opened/edited | Enforce conventional-commit PR titles (lowercase subject) |
| `codeql.yml` | Push/PR to main, weekly Sunday | GitHub CodeQL JS/TS security scan |
| `release-please.yml` | Push to main | Open release PR on feat/fix; publish to npm via OIDC when release PR merges |
| `deploy-storybook.yml` | Push to main, manual | Build + deploy Storybook to GitHub Pages |
| `dependabot.yml` | Monthly | Bump github-actions + npm devDependencies |

---

## Things not to do

- **Do not edit `dist/`** — it's generated by `stencil build`. Edit `src/wc/`, then run `npm run build`.
- **Do not edit `src/angular/proxies.ts` or `src/angular/index.ts`** — auto-generated by the Angular output target on every build.
- **Do not edit `src/wc/components.d.ts`** — auto-generated by Stencil.
- **Do not add React wrapper components** — new UI goes in `src/wc/components/` as Stencil custom elements; Angular proxies are generated automatically.
- **Do not hardcode colors, spacing, or other design values** — always use `@ds-mo/tokens` CSS custom properties. Hardcoding breaks theming.
- **Do not use `shadow: true`** in `@Component()` — all components use `scoped: true` (light DOM) so token CSS variables penetrate naturally without piercing selectors.
- **Do not name a `@Prop()` `title`** — it's a reserved HTML attribute and causes Stencil a build warning. Use `heading` or another name.
- **Do not rely on `@Watch` firing for the initial prop value** — it only fires on subsequent changes. Call the handler explicitly in `componentDidLoad()` for initial state (e.g. `if (this.open) this.onOpenChange(true)`).
- **Do not re-export service singletons from a file that has `@Component()`** — Stencil enforces one export per file. Put services in a separate `*.ts` file.
- **Do not hand-bump `package.json` version** during normal work — let release-please do it.
- **Do not `git push` to `main`** — always branch + PR.
- **Do not commit `NPM_TOKEN` or any npm auth** — publishing uses OIDC, no secrets required.
- **Do not skip `npm install -g npm@latest`** in the publish job — Trusted Publisher requires npm ≥ 11.5.1.
- **Do not set `NODE_AUTH_TOKEN`** in the publish step — OIDC handles auth; a stray token can conflict.

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
