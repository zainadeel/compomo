# AGENTS.md

Guide for AI agents (and humans) working on **CompoMo** (`@ds-mo/ui`). Follows the [agents.md](https://agents.md) convention — tool-agnostic. `CLAUDE.md` points here.

Keep this file as the single source of truth for project conventions. Update it when you add pipelines, components, or change the release flow.

---

## What this project is

CompoMo is an npm package (`@ds-mo/ui`) that ships a **React component library** styled with TokoMo design tokens. It provides:

- Tree-shakeable React components authored in TypeScript
- CSS Modules compiled into a single `dist/index.css`
- TypeScript type definitions rolled up into a single `dist/index.d.ts`
- A component registry (`public/r/`) consumed by the in-repo MCP server for AI-assisted component discovery

It's the **top layer** of the ds-mo design-system trilogy: `@ds-mo/tokens` → `@ds-mo/icons` → `@ds-mo/ui` (CompoMo). TokoMo and IcoMo ship the foundation; CompoMo composes them into reusable UI primitives.

---

## Directory map

```
src/
  components/           # One directory per component (PascalCase)
    Button/
      Button.tsx          # Component
      Button.module.css   # Scoped styles (CSS Modules)
      Button.stories.tsx  # Storybook stories
      index.ts            # Re-exports
    ...                 # 37 components today (Accordion, Badge, Banner, …)
  stories/              # Token showcase stories (Colors, Typography, Effects, …)
  docs/                 # Storybook MDX docs (ColorUsage, ElevationUsage, …)
  types/                # Shared TS types
  utils/                # Shared helpers
  index.ts              # Barrel — public API surface of the package
  css-modules.d.ts      # CSS Modules ambient types
.storybook/             # Storybook config
scripts/
  build-registry.mjs    # Builds public/r/ — component metadata registry
  mcp-server.mjs        # MCP server serving the registry to AI clients
public/
  r/                    # Generated registry (committed, rebuilt on dev/build)
docs/                   # Storybook reference docs source
dist/                   # Generated — do not edit directly
.github/
  workflows/
    build.yml              # PR: npm ci, typecheck, build, verify dist + src unchanged
    codeql.yml             # JS/TS security scan — PR + push + weekly Sunday cron
    pr-title.yml           # Lints PR titles as conventional commits
    release-please.yml     # Opens release PRs on feat/fix; publishes to npm on merge (OIDC)
    deploy-storybook.yml   # Builds + deploys Storybook to GitHub Pages
  dependabot.yml           # Monthly bumps for github-actions + npm
release-please-config.json      # Release Please config (node, changelog sections)
.release-please-manifest.json   # Pinned current version
vite.config.ts         # Library build config (ES output, dts rollup, externals)
```

---

## Commands

```bash
npm run dev              # Build registry, then start Storybook on :6006
npm run build            # Vite library build → dist/
npm run storybook:build  # Build registry, then build static Storybook
npm run typecheck        # tsc --noEmit
npm run lint             # eslint src/ (⚠ see note below)
npm run registry:build   # Regenerate public/r/ (component registry)
npm run mcp              # Run the in-repo MCP server
npm run clean            # Remove dist/
```

> **Heads-up on `lint`:** the `lint` script is wired to `eslint src/` but ESLint is not installed and there is no config. Running it today fails with `eslint: command not found`. It's intentionally **not** in `build.yml`. Fix and re-enable before relying on it.

---

## Build pipeline (what `npm run build` does)

Vite builds the library from `src/index.ts`:

1. Bundle TS/TSX → single ESM `dist/index.js` with inline source map (`dist/index.js.map`)
2. Extract and concatenate every `*.module.css` and global CSS → `dist/index.css` (no code-splitting)
3. Roll up all `.d.ts` files via `vite-plugin-dts` → `dist/index.d.ts`
4. Externalize `react`, `react-dom`, `react/jsx-runtime`, `@ds-mo/tokens`, `@ds-mo/icons` (they come from the host app, not from us)

Package `exports`:

```jsonc
{
  ".":   { "import": "./dist/index.js", "types": "./dist/index.d.ts" },
  "./css": "./dist/index.css"
}
```

Consumers must import the CSS once at their app root:

```ts
import '@ds-mo/tokens';
import '@ds-mo/ui/css';
import { Button } from '@ds-mo/ui';
```

---

## Component authoring workflow

**Adding a new component**

1. Create `src/components/<PascalName>/`:
   - `<PascalName>.tsx` — the component
   - `<PascalName>.module.css` — scoped styles using TokoMo CSS custom properties only
   - `<PascalName>.stories.tsx` — at least one Storybook story per meaningful state
   - `index.ts` — re-export the component and its public types
2. Add the export to `src/index.ts` (component + each public type) so it ships in the package barrel.
3. Run `npm run dev` and verify the component in Storybook.
4. Regenerate the registry: `npm run registry:build` (committed to `public/r/`).

**Styling rules (non-negotiable)**

- **Never hardcode colors, spacing, radii, shadows, or typography values.** Always use CSS custom properties from `@ds-mo/tokens`. Hardcoded values break theming.
- Styles go in `*.module.css` — one per component. No global CSS from components.
- Icons are accepted via the typed prop pattern: `icon?: React.ComponentType<{ size?: number | string }>`.
- Theming is driven by the `data-theme` attribute on a parent element (`@ds-mo/tokens` provides light/dark) — components must not hardcode mode-specific values.

**TypeScript**

- `strict` mode. No `any`. Export every prop type that is part of the public API.
- Prefer discriminated unions for variant props (see `ButtonVariant`, `SurfaceIntent`).

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

- **Do not edit `dist/`** — it's generated. Edit `src/`, then run `npm run build`.
- **Do not hardcode colors, spacing, or other design values** — always use `@ds-mo/tokens` CSS custom properties. Hardcoding breaks theming.
- **Do not hand-bump `package.json` version** during normal work — let release-please do it.
- **Do not `git push` to `main`** — always branch + PR.
- **Do not commit `NPM_TOKEN` or any npm auth** — publishing uses OIDC, no secrets required.
- **Do not skip `npm install -g npm@latest`** in the publish job — Node 20 ships with npm 10.x which cannot complete OIDC auth; Trusted Publisher requires npm ≥ 11.5.1. (In IcoMo this cost us two failed releases — `v0.7.0` and `v0.7.1` exist as orphan GH tags for this reason.)
- **Do not set `NODE_AUTH_TOKEN`** in the publish step — OIDC handles auth; a stray token can conflict.
- **Do not add `registry-url` logic that writes an `NPM_TOKEN`-based `.npmrc`** — OIDC handles auth directly in the npm CLI.
- **Do not touch `.github/workflows/deploy-storybook.yml`** as part of CI/release changes — it already works and is out of scope for release pipeline work.
- **Do not remove a component from the public barrel (`src/index.ts`) without a `feat!:`/major-note commit** — it's a breaking change for every consumer.

---

## Quick reference: where things live

| Need to change... | Edit this |
|---|---|
| A component's behavior | `src/components/<Name>/<Name>.tsx` |
| A component's styling | `src/components/<Name>/<Name>.module.css` (tokens only — no hardcoded values) |
| A component's Storybook stories | `src/components/<Name>/<Name>.stories.tsx` |
| Public package API | `src/index.ts` |
| Token-showcase stories | `src/stories/*.stories.tsx` |
| Usage docs (MDX) | `src/docs/*.mdx` |
| Component registry logic | `scripts/build-registry.mjs` |
| MCP server | `scripts/mcp-server.mjs` |
| Library build config | `vite.config.ts` |
| Release changelog sections | `release-please-config.json` |
| PR title rules | `.github/workflows/pr-title.yml` |
| Storybook deploy | `.github/workflows/deploy-storybook.yml` |
