# AGENTS.md

Guide for AI agents (and humans) working on **CompoMo** (`@ds-mo/ui`). Follows the [agents.md](https://agents.md) convention — tool-agnostic. `CLAUDE.md` points here.

Keep this file as the single source of truth for project conventions. Update it when you add pipelines, components, or change the release flow.

---

## What this project is

CompoMo is an npm package (`@ds-mo/ui`) that ships a **framework-agnostic web component library** authored with [Stencil.js](https://stenciljs.com/). It provides:

- Custom elements (`<ds-*>`) consumable from React 18+, Angular 19-22, or plain HTML
- Per-component ESM files in `dist/components/` (tree-shakeable; auto-define on import)
- Auto-generated Angular proxy directives via `@stencil/angular-output-target` in `src/angular/`
- Auto-generated React wrappers via `@stencil/react-output-target` in `src/react/`
- Compiled Angular and React adapters in `dist/angular/`, `dist/framework/`, and `dist/react/`
- TypeScript declarations in `dist/types/` (package `"types"` entry)
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
      ...               # All ported components (Badge, Toast, …)
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
agent/
  schemas/              # Versioned platform-neutral agent metadata contracts
  contracts/            # Stable compatibility contracts consumed by validation
  patterns/             # Cross-component workflow guidance
docs/                   # Framework integration reference (not Storybook source)
dist/                   # Generated — do not edit directly
  components/           # Per-component ESM files + patched index.d.ts
stencil.config.ts       # Stencil build config (output targets, namespace, srcDir)
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
npm run clean:framework-proxies # Remove generated Angular/React source proxies + barrels only
npm run test             # Node unit tests (bar-nav overflow utils, panel-nav, etc.)
npm run test:e2e         # Playwright — BarNav overflow collapse (builds first)
npm run test:e2e:install # One-time Chromium, Firefox, and WebKit install for Playwright
npm run dev              # Stencil watch using normal dist output (updates dist/ on source changes)
npm run storybook        # Stencil watch + Storybook on :6006 (auto-reloads when dist/ rebuilds)
npm run storybook:build  # Build static Storybook
npm run storybook:test:a11y # Vitest browser stories + component-scoped Axe gate in light/dark themes
npm run typecheck        # tsc --noEmit (Stencil source in src/wc)
npm run lint             # eslint src/ + stylelint component/utils CSS (warnings)
npm run lint:css         # stylelint TokoMo token category + disallow rules (warnings)
npm run registry:build   # Regenerate public/r/ (component registry)
npm run agent:validate   # Validate agent schemas, component intent, patterns, and references
npm run agent:validate:trilogy -- <tokens-agent.json> <icons-agent.json> # Validate assembled package manifests
npm run mcp              # Run the in-repo MCP server
npm run clean            # Remove dist/
```

`registry:build` requires compiler metadata from `npm run build`. The registry is generated from the source-derived component inventory plus `dist/docs/components.json`; never add a handwritten component catalog entry. Every component requires co-located agent intent. `agent:validate` rejects missing artifacts or intent, stale adapters, compiler drift, and stale registry output.

---

## Build pipeline (what `npm run build` does)

The Stencil compiler (`stencil.config.ts`) builds from `src/wc/`:

1. Removes generated Angular/React proxies and barrels via `scripts/clean-framework-proxies.mjs`; hand-maintained Angular support files are preserved. Build, docs build, and watch startup share this cleanup path.
2. Transpiles every `@Component()` class in `src/wc/components/**/*.tsx` to native Custom Elements
3. Emits per-component ESM files to `dist/components/` (`dist-custom-elements` — auto-define on import)
4. Generates TypeScript declarations → `src/wc/components.d.ts` (+ `scripts/patch-index-types.mjs` augments `dist/components/index.d.ts` only — never patch `components.d.ts`; Stencil rewrites it on every build/watch)
5. Runs Angular output target → regenerates `src/angular/`, verifies the proxy inventory, and compiles it to `dist/angular/`
6. Runs React output target → regenerates `src/react/`, verifies the proxy inventory, and compiles it to `dist/react/`; the inventory is verified again at the end of the build
7. Compiles `src/framework/angular.ts` to the public Angular barrel in `dist/framework/`
8. Compiles the framework-neutral toast manager from `src/wc/toast/` to the public `@ds-mo/ui/toast` subpath
9. Copies renderer-neutral public CSS surfaces from `src/wc/styles/` to `dist/styles/`; `@ds-mo/ui/prose.css` is the safe-semantic-DOM prose recipe
10. Regenerates `public/r/` from compiler facts + component intent and emits component and executable-pattern manifests at `dist/agent.json` and `dist/agent-patterns.json`
11. Bundles the local stdio MCP executable and its generated registry snapshot into `dist/mcp/` and `dist/mcp-data/`; consumers run it through the published `compomo-mcp` binary

There is **no** global `dist/ds-mo/ds-mo.css` bundle in the current Stencil config — styles are scoped per component.

Package `exports`:

```jsonc
{
  ".": { "import": "./dist/components/index.js", "types": "./dist/types/components.d.ts" },
  "./angular": {
    "import": "./dist/framework/angular.js",
    "types": "./dist/framework/angular.d.ts"
  },
  "./angular/*": { "import": "./dist/angular/*.js", "types": "./dist/angular/*.d.ts" },
  "./react": { "import": "./dist/react/components.js", "types": "./dist/react/components.d.ts" },
  "./agent": "./dist/agent.json",
  "./agent/patterns": "./dist/agent-patterns.json",
  "./dist/components": {
    "import": "./dist/components/index.js",
    "types": "./dist/types/components.d.ts"
  },
  "./shell": { "import": "./dist/lib/shell/index.js", "types": "./dist/lib/shell/index.d.ts" },
 "./toast": { "import": "./dist/lib/toast/index.js", "types": "./dist/lib/toast/index.d.ts" },
 "./prose.css": "./dist/styles/prose.css",
 "./utils": { "import": "./dist/lib/utils/index.js", "types": "./dist/lib/utils/index.d.ts" },
  "./dist/components/*": "./dist/components/*"
}
```

**`/shell` and `/utils` ship compiled JS + d.ts** (`scripts/build-lib-exports.mjs`: esbuild bundle per entry + `tsc -p tsconfig.lib.json` declarations → `dist/lib/`). They previously shipped raw TS source, which made consumer type-checking depend on our devDependencies (`@stencil/core` types) and broke toolchains that don't transpile node_modules TS. `/angular` and `/react` still ship source — the Stencil output-target convention — revisit in [#257](https://github.com/zainadeel/compomo/issues/257) if it bites a consumer.

Consumers install the **ds-mo trilogy** and import the tags they render:

```bash
npm install @ds-mo/tokens @ds-mo/icons @ds-mo/ui
```

```ts
// Custom elements — import each tag you use (auto-defines)
import '@ds-mo/ui/dist/components/ds-button-filled.js';
import '@ds-mo/ui/dist/components/ds-button-unfilled.js';
import '@ds-mo/tokens';

// Angular — Stencil-generated standalone adapter (per-component for tree shaking)
import { DsButtonFilled } from '@ds-mo/ui/angular/ds-button-filled';

// React — Stencil-generated wrappers
import { DsButtonFilled, DsBarNav } from '@ds-mo/ui/react';
```

**Peer dependency model:** `@ds-mo/tokens` and `@ds-mo/icons` are **required** runtime peers — same as tokens, icons are **not** inlined into `dist/`. Stencil externalizes `@ds-mo/icons`; the consumer's bundler resolves SVG exports when bundling `ds-icon`.

**`ds-icon` names:** Pass canonical IcoMo export keys only (`Bell`, `Chart`, `DeviceMobile`, `FlagUnitedStates`). `Flag*` names select the flag catalog automatically; there is no separate flag prop. IcoMo `meta.json` aliases are for discovery/docs — not runtime resolution. `prebuild` generates `system-icon-catalog.ts` / `flag-icon-catalog.ts` as **lazy loader maps** — one static-analyzable `() => import('@ds-mo/icons/svg/<Name>')` per icon, so consumer bundlers code-split a tiny chunk per icon instead of shipping the whole catalog (~340 kB raw) in the initial bundle. Glyphs cache in a global-symbol-keyed shared cache (`icon-cache.ts`) after first load.

**Icon preloading (`registerIcons`):** icons render async on first use (glyph pops into a fixed-size box — no layout shift). Apps can pre-register critical icons (nav chrome) for synchronous first paint: statically import the SVG strings from `@ds-mo/icons` and call `registerIcons` from `@ds-mo/ui/utils` before rendering. See the JSDoc in `src/wc/components/Icon/icon-cache.ts`.

**Icon resolution + injection hardening:** `ds-icon` resolves names by **exact own-key match** against canonical IcoMo export names — meta.json aliases and inherited prototype keys never resolve. Every glyph is validated at the render boundary (`icon-svg.ts`: `<svg>` root, no executable/foreign-content elements, no `on*` attributes, fragment-only `href`s) and injected as parsed DOM nodes — never `innerHTML` — so ds-icon works under a strict CSP with `require-trusted-types-for`. Invalid markup renders an empty fixed-size box.

**Framework wrappers:** Stencil emits **Angular standalone adapters** and **React wrappers**. They are compiled before publishing, so consumers never transpile package TypeScript. Angular apps should prefer per-component imports such as `@ds-mo/ui/angular/ds-button-filled`. Do not hand-maintain parallel framework implementations.

Angular forms import the matching generated value accessor from `@ds-mo/ui/angular` alongside the per-component adapter (for example `DsInput` plus `TextValueAccessor`). Native form submission/reset/required behavior lives in the web component itself; the value accessor connects that contract to Angular Forms.

---

## Component authoring workflow

**Adding a new Stencil component**

1. Create `src/wc/components/<PascalName>/`:
   - `<PascalName>.tsx` — Stencil component class (see pattern below)
   - `<PascalName>.css` — scoped styles using TokoMo CSS custom properties only
   - `<PascalName>.stories.ts` — lit-html stories (see Storybook section below)
   - `<PascalName>.agent.json` — selection/composition intent validated by `agent/schemas/component-agent.schema.json`
2. Run `npm run build` — Stencil auto-discovers the new component by `@Component()` tag.
3. Verify in Storybook: `npm run storybook`.
4. Regenerate registry: `npm run registry:build` (commit `public/r/` changes).
5. Validate agent metadata: `npm run agent:validate`.

Agent metadata is mandatory and contains design intent only: when to use or avoid a component,
alternatives, compositions, accessibility, state ownership, responsive behavior,
and irreducible framework caveats. Do not duplicate tags, props, defaults, events,
methods, slots, package versions, token values, or framework bindings; those are
generated from Stencil and package sources.

Cross-component compositions live in `agent/patterns/<name>/pattern.agent.json`.
Patterns may include validated, executable Custom Elements, React, and Angular
recipes. Keep recipes complete enough to paste into a consumer, reference only
public package entry points, and update them whenever the composition contract
changes. The MCP `list_patterns` and `get_pattern` tools are the agent-facing
discovery surface; component intent should reference applicable pattern IDs.

**Stencil component skeleton**

```tsx
import { Component, Prop, Event, EventEmitter, h, Host } from '@stencil/core';

@Component({
  tag: 'ds-my-component',
  styleUrl: 'MyComponent.css',
  scoped: true, // always scoped: true (light DOM, tokens penetrate naturally)
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

| Pattern                                  | How                                                                  |
| ---------------------------------------- | -------------------------------------------------------------------- |
| Reactive prop                            | `@Prop() value: string = ''`                                         |
| Mutable prop (component can self-update) | `@Prop({ mutable: true }) open = false`                              |
| Derived/computed                         | getter `private get resolved()`                                      |
| Internal state (triggers re-render)      | `@State() private foo: T`                                            |
| Side-effect on prop change               | `@Watch('propName') onPropChange(next, prev)`                        |
| Custom event                             | `@Event() dsChange: EventEmitter<T>; this.dsChange.emit(val)`        |
| DOM element reference                    | `@Element() el: HTMLElement`                                         |
| Lifecycle                                | `componentDidLoad()`, `disconnectedCallback()`                       |
| Cross-element keyboard                   | `@Listen('keydown')`                                                 |
| Children API                             | `<slot />` (named: `<slot name="footer" />`)                         |
| Polymorphic element                      | `const Tag = this.href ? 'a' : 'button'; return <Tag>…</Tag>`        |
| Icon                                     | `<slot name="icon" />` — consumer provides any SVG or `ds-*` element |

**Styling rules (non-negotiable)**

- **Never hardcode colors, spacing, radii, shadows, or typography values.** Always use CSS custom properties from `@ds-mo/tokens`. Hardcoded values break theming.
- Components are authored for left-to-right interfaces. Do not add RTL-only selectors, direction branches, or RTL review stories.
- Styles go in `<PascalName>.css` — one per component. Stencil scopes them automatically via `scoped: true`.
- Use `:host` for component-level styles; use class selectors for internal elements.
- Theming is driven by the `data-theme` attribute on a parent element (`@ds-mo/tokens` provides light/dark).

**CSS lint (`npm run lint:css`)**

- Stylelint warns (does not fail CI) when component/styles/utils CSS uses raw lengths/times/colors where TokoMo tokens belong, or uses a `*-width` component token as `height` / `min-height` / `max-height`.
- `local/no-ds-text-metric-overrides` warns when consuming component CSS targets `ds-text` and sets `font`, `font-size`, `font-weight`, `letter-spacing`, or `line-height`. Select the complete `variant` / `emphasis` recipe instead; consumers may still control layout, spacing, truncation, positioning, and contextual color on the `ds-text` host.
- Token families by property category: `--color-*` (color/fill/stroke), `--dimension-space-*` (margin/padding/gap/inset), `--dimension-size-*` / `--dimension-iconography-*` / component width tokens (width/height), `--dimension-radius-*`, `--dimension-stroke-width-*`, `--typography-*`, `--effect-*` / `--dimension-z-index-*`.
- Justify unavoidable exceptions with `/* stylelint-disable-next-line <rule> -- reason */`.

**Primitive lint (ESLint, warn-only)**

- `local/prefer-ds-text` — flag TokoMo typography utility classes (`text-body-*`, `text-caption*`, …) in `class` / `className`. Use `<ds-text variant="…" emphasis>`. Allowlisted: `Text/`, `control-text.ts`, Typography stories.
- `local/prefer-ds-icon` — flag raw `<svg>` / `createElement('svg')` and `@ds-mo/icons` imports in components. Use `<ds-icon name="…">`. Allowlisted: `Icon/`, `Loader/`, chart components, PanelNav M-mark, Icons stories.
- `local/prefer-direct-ds-text` — flag neutral `<span>`/`<div>` elements whose only child is `<ds-text>`. Move layout classes to the `ds-text` host; keep wrappers only for real structural behavior or mixed content.
- `local/no-selected-fill-emphasis-change` — flag dynamic `ds-text` emphasis inside a `.ds-interaction-fill--selected` target. The active fill owns selected state; keep the base text weight stable and promote foreground color instead. Always-emphasis base control recipes remain valid.
- Disable with `// eslint-disable-next-line local/prefer-ds-text -- reason` (same pattern for the other local rules) when an exception is intentional.

**Text metric-box contract**

- `ds-text` owns a real, measurable box — never `display: contents`. `span`/`label` use an inline box; paragraphs, divs, and headings use a block box.
- A variant is atomic: its font-size, line-height, weight, and letter-spacing come from the shared typography recipe. Parent controls/density classes must never override text line-height.
- One rendered line is exactly one variant line-height; N lines are N × that token. Width constraints determine wrapping.
- Put layout classes (padding, flex/grid participation, truncation width, z-index) directly on `ds-text`. Do not add a wrapper whose only purpose is layout.
- Choose `as` from native document semantics and heading hierarchy independently from visual `variant`. Omitted color inherits `currentColor`.
- `tertiary` and `quaternary` are restricted to text inside genuinely inactive/disabled UI or to purely decorative content whose removal changes no meaning, status, hierarchy, or task understanding. Quaternary is the fainter tier. Prefer the owning component's `isInactive` or native `disabled` state; `aria-hidden` alone does not exempt meaningful visible text from contrast requirements.
- Links are underlined by default. Underline strokes use tertiary foreground independently from the text foreground. Brand-blue link text may omit the resting underline when color already provides the link affordance; an underline on hover remains appropriate. Dotted underline is required for hidden or supplemental interaction such as a tooltip, and the owning trigger supplies focus, keyboard behavior, and accessible semantics.
- Slotted text can update/stream without remounting; the host grows in whole line-height increments. Markdown/rich content and `aria-live` belong to the prose/application-renderer boundary, not `ds-text`.

**Prose styling contract**

- `@ds-mo/ui/prose.css` is the renderer-neutral styling surface for safe semantic DOM. Apply `.ds-prose` to a consumer-owned `article`, `section`, or other meaningful container; do not add a `<ds-prose>` component merely to register styles.
- Prose owns token-driven document typography, one-directional block flow, low-specificity defaults, and overflow containment. It never parses Markdown, sanitizes HTML, owns streaming state, or maps product components.
- All prose selectors stay at zero specificity with `:where()` so ordinary consumer CSS can override them without `!important`.
- New blocks own `margin-block-start`; do not use `:last-child`, `:empty`, or forward-looking `:has()` rules that restyle prior streamed content.
- `data-ds-prose="off"` opts an embedded product-UI subtree out of prose element rules. The opt-out does not implicitly restart inside nested prose.
- Wrap wide native tables in `.ds-prose__table-scroll`. The wrapper owns horizontal overflow; the table keeps native semantics. Renderers must make genuinely scrollable table wrappers and native `pre` blocks keyboard-focusable and add contextual labelling when surrounding content does not identify the region.
- `ds-markdown` is an optional safe renderer and consumes the shared prose source. Its parser and node mapping are not part of the prose CSS contract.
- The initial recipe is compact conversation prose. Do not add documentation/CMS density variants without a concrete consumer. Distribution evidence and framework implications live in `docs/prose-foundation.md`.
- Native form values cannot contain a custom element. Native inputs use the internal `typography.css` recipe as the explicit exception.

**Buttons (filled / unfilled)**

- Both support `variant`: `'label'` (default) | `'icon'` | `'icon-label'`, and `size`: `'md'` | `'sm'` | `'xs'` via control-density. Label text uses the **emphasis** type scale at every size (unlike Tag/Chip).
- Both support `rounded` for the half-radius treatment. Rounded changes shape only; it does not alter hierarchy, intent, size, or interaction semantics.
- Icon-only chrome (nav, tool rails, overflow) must pass `variant="icon"` plus `icon` / `aria-label`.
- `isLoading` blocks activation without applying inactive opacity or dropping current keyboard focus, and exposes busy plus disabled semantics. Icon and icon-label variants replace the icon with an inherited-color loader; label-only variants center the loader while preserving the label's measured width.
- Keep the action's accessible name while loading. The owning workflow announces broader progress when needed.
- For forms, use `type="submit"` and handle native form submission; reserve `dsClick` for non-submit commands.
- Use only one filled action in a local decision area. Secondary actions use `ds-button-unfilled`; filled semantic intent must describe the action's consequence rather than decorate a surface.
- ButtonFilled's optional `hasBorder` inset stroke is off by default. Its `background` prop describes the actual parent surface only to select that stroke's secondary border color; it never remaps the button fill, foreground, hover, pressed, or focus treatment. `contrast` remains the sole owner of those filled-button treatments. Omit `background` on primary and secondary surfaces, pass `faint` explicitly on faint surfaces, and use the matching medium, bold, strong, translucent, inverted, media, or always-dark context elsewhere.
- Use `ds-button-unfilled` (not a separate icon-only tag) for unfilled actions.
- **Breaking rename:** `ds-button-unfilled-icon` → `ds-button-unfilled` (React `DsButtonUnfilled`, Angular `DsButtonUnfilled`). Update imports from `…/ds-button-unfilled-icon.js` and pass `variant="icon"` at former icon-only call sites (default is now `label`).
- ButtonUnfilled's omitted `background` is the shared default treatment for primary and secondary parent surfaces and uses the brand-active selected fill. Pass `faint` explicitly on faint surfaces to use the neutral active fill; use the other matching surface context on medium, bold, strong, translucent, inverted, media, or always-dark surfaces. Do not use surface context to make an action artificially louder or quieter.
- Use `isActive` for the active/selected visual state on unfilled. Active always promotes foreground to **primary** (toggle mode) — not brand tint.
- An unfilled popup trigger with `expanded=true` automatically promotes its foreground to primary and paints the pressed interaction overlay, including when shell chrome passes `activeFill=false`. Popup-open is transient pressed state, not selected state. Keep `expanded` active through the popup's rendered exit lifecycle and clear it from `dsAfterClose`.
- **`activeFill` recipe:** default `true` for general UI (toolbars, content actions) — selected shows the interaction fill. Shell chrome (PanelNav, PanelTools, BarNav overflow, etc.) must pass `activeFill={false}` so selection is foreground-only (primary color, no fill).
- ButtonUnfilled's optional `hasBorder` inset stroke defaults **on** for general UI; shell chrome (PanelNav, PanelTools, BarNav) should pass `hasBorder={false}`.
- Do not create one-off button CSS for standard icon-only actions. Keep custom implementations only when the interaction is structurally different, such as the panel-nav M mark that swaps to a collapse/expand icon on hover.

**BarWorkflow**

- Use `ds-bar-workflow` for create and edit flows; keep routed list/detail identity and page actions in `ds-bar-title`.
- BarWorkflow is always compact 48px bold-brand chrome. It has no expanded, constrained, or responsive `variant`, and ShellPage must not assign one.
- Omitting `steps` is the default single-step flow: render the plain heading, omit Previous and Next, and keep the Check Save/Submit action visible.
- A multi-step owner passes ordered `{ id, label }` steps plus controlled `value`. BarWorkflow appends `· X/N` to the h1, omits Previous on step one, shows Previous and Next on intermediate steps, and replaces Next with Check on the last step.
- `dsStepChange` reports the target step id without mutating `value`. The application owns validation and updates the controlled step; use `isNextInactive` to keep a blocked Next visible.
- The final `submitAction` owns label, native button type, inactive state, and loading state. Prefer `type="submit"` inside a form; `dsSubmit` reports supplemental product intent.

**ShellPage header capacity**

- The application shell owns responsive policy and passes `headerCapacity="roomy | compact | constrained"` to every routed `ds-shell-page` before paint. ShellPage must not infer why its width changed from container or viewport measurements.
- With `headerPresentation="auto"`, roomy capacity expands at the page top and snaps compact after the title/action row reaches its compact position; compact and constrained capacities remain in their corresponding stable variants.
- A ShellPage-managed BarTitle conceals its first render until `headerCapacity` is available and the child has rendered the resolved variant. Do not bypass this handshake with application-level visibility timers or duplicate responsive CSS.
- Update `headerCapacity` from the same state that owns viewport breakpoints and persistent shell chrome so opening or closing a tool panel changes the page header synchronously.
- `headerPresentation="expanded | compact | constrained"` remains an explicit presentation override for exceptional layouts and deterministic examples; it does not replace application capacity policy.

**Breadcrumb and BarTitle**

- `ds-breadcrumb` renders a named navigation landmark and ordered hierarchical path. Items with `href` are native anchors; items without `href` are buttons for application-owned navigation through `dsSelect`; `isCurrent` produces static `aria-current="page"` text.
- Breadcrumb labels use regular caption text and secondary foreground. Slash separators use tertiary foreground because they are decorative. Interactive labels have no resting underline and add a solid underline on hover; keyboard focus uses the shared focus ring.
- In expanded `ds-bar-title`, the breadcrumb occupies its own full-width row after the 32px header inset. The following title row and right-side actions align to each other. Do not pull the title column upward around the breadcrumb.
- Pass `breadcrumbs` for a multi-level ancestor path. When it is empty and `showBack` is true, expanded BarTitle derives one breadcrumb item from `backLabel` and `backAriaLabel` and continues to emit `dsBack`.
- Compact and constrained BarTitle keep the existing icon Back action; breadcrumbs never replace compact chrome or the destination-specific `backAriaLabel`.

**PanelTools tool views**

- `ds-panel-tools` owns the single visible header for Search, Agents, Messages, Stacks, Activity, and Help in drawer presentation and in the default shared-header fullscreen presentation. It composes the canonical left-aligned `ds-panel-tool-header` internally. Never add a second title bar inside a `*-view` slot unless the tool intentionally opts into the split fullscreen header contract below.
- Bind the `headers` object with one `PanelToolsHeaderConfig` per tool and replace its object identity whenever a tool changes title, navigation depth, menu state, or available actions.
- A base tool view omits `showBack`. A deeper view sets `showBack`, updates the same header title, and handles `dsHeaderBack` by returning to its parent view without unmounting the tool.
- Put right-side icon actions in the active tool's header config. PanelTools keeps the final action's control edge exactly 8px from the drawer edge in both base and detail headers. Handle `dsHeaderAction` in the tool owner; PanelTools owns placement, interaction styling, accessible button semantics, and menu-trigger anchoring.
- Every icon-only PanelTools action has a concise localized tooltip matching its accessible name. Shared rail, header, search/filter, composer submit/stop, and scroll-to-latest controls own their tooltips internally; applications wrap slotted composer tools/actions and contextual conversation-row actions in `ds-tooltip`.
- When fullscreen and overflow coexist, author fullscreen first and Ellipses second so the overflow menu remains the rightmost header action in drawer and fullscreen presentations.
- A menu opened by a right-side tool-header action uses `PANEL_TOOLS_HEADER_MENU_PLACEMENT`: bottom/end choice-cell alignment with a 12px side offset. The trigger is 8px inside the 48px header, so 12px places the popup 4px below the header edge, matching BarNav overflow. The shared section-inset offset aligns the final menu item's right edge with the trigger while the popup frame extends by its own padding. Do not substitute `popup-frame` or the Menu default 4px side offset. Apply the same placement to base-view and deeper-view menus.
- Slotted tool content starts directly below the shared header and owns only its body, empty/loading/error states, scrolling, composer/footer, and product behavior, except when using the explicit split fullscreen header contract.
- Do not make a full-view slot hide, replace, or visually duplicate PanelTools chrome. The only exception is `fullscreenHeaderMode="split"`, which suppresses the shared header only while fullscreen so a master/detail product can render one canonical `ds-panel-tool-header` per pane.
- Fullscreen presentation changes snap without drawer-width animation. For conversation tools, set `fullscreenHeaderMode="split"` and use the extra width for a fixed `--dimension-panel-width-xs` (300px) history rail on the left and the selected conversation on the right. The history header shows the tool title and list actions. The detail header shows the chat title, Exit fullscreen, and chat actions. It never shows Back because the parent list remains visible. Keep both panes mounted; selecting a history row replaces only the detail pane.
- When a tool has search, place `ds-panel-tool-search` directly below the shared header. Its contract is a transparent 48px row with 8px outer padding around the standard 32px **md** search control; never default a tool search to sm or xs.
- Search clear actions use the concise localized `clearLabel` by itself for both the tooltip and accessible name. Do not append the placeholder, searched domain, or current query.
- Panel-tool search keeps its 1px tertiary row divider unchanged while the input is focused. The divider belongs to the 48px container, not the 32px input, so it must not be promoted as an input focus boundary.
- When a tool search also filters its results, enable its optional filter trigger and pair it with an application-owned `ds-menu`. The 32px search control, 16px vertical divider, and borderless 32px Filter action keep 8px gaps; the product owns filter labels, selected state, matching policy, and result-empty copy.
- Panel-tool search is a shrinkable grid/flex item (`min-width: 0`) inside the fixed 300px drawer. A one-column grid that owns it must declare `grid-template-columns: minmax(0, 1fr)`; an implicit `auto` track can expand to the search row's intrinsic width and clip the filter action beneath the tool rail. Its filter trigger must remain fully inside the row with an 8px trailing inset; a long placeholder or inherited min-content width must never push the button under the tool rail. Verify the rendered SVG box, not only the trigger's accessible name or `icon` prop.
- Conversation history uses the same md choice-row label/subtext padding recipe as Menu. The scroll container changes from Menu's 4px section inset to an 8px outer inset; do not also give conversation rows an 8px bespoke padding. Adjacent rows within a conversation section keep a 4px gap. Rows retain the shared 6px md row padding plus the 2px label/subtext inset. Conversation titles use body-medium—not title-small—with emphasis only while unread; read titles use regular body-medium. Previews are body-small truncated to one line. A busy preview pairs that body-small status with the sm 16px Loader at a 4px gap. A positive `unreadCount` renders one dot on the title's right-side action track rather than a visible counter; unread titles use primary foreground and read titles use secondary.
- Use `ds-scroll-overlay` when ordinary scrollable content sits beneath a persistent footer action. Put content in the default slot and the complete footer in the `overlay` slot; the component keeps the fade active at every scroll position, reserves the footer's measured height, and begins the fade 8px before the visible footer content. Its `ResizeObserver` updates both clearance and fade whenever the overlay grows, including every MessageComposer growth step. ConversationList and MessageScroller use the same controller internally: set `actionLayout="footer"` on ConversationList for a full-width persistent action, and keep composers in MessageScroller's `overlay` slot rather than wrapping either component in an application-owned fade frame. ConversationList renders the measured fade as a separate surface-aware layer instead of masking the row ancestor, because a CSS mask creates a backdrop root and prevents contextual row actions from blurring the text behind them.
- Put contextual row controls in `ds-conversation-list-item`'s `actions` slot so they remain sibling controls rather than invalid buttons nested inside the row button. A standard chat-options action is a borderless rounded md ButtonUnfilled with the Ellipses icon. The component overlays it at a stable 8px right inset and reveals it on row hover or focus-within; touch layouts keep it visible. The application owns menu items, open state, focus return, pinning, and other product consequences.
- `ds-message-bubble` owns the default typography for plain conversation copy: body-medium regular (14px/20px). Use `variant="user"` for user-sent copy in agent and person-to-person channels; it uses secondary foreground. Use `variant="received"` for ordinary incoming person-to-person copy. Agent responses render through `ds-agent-response` without a MessageBubble surface so their ordered rich parts can use the available transcript width. Applications must not promote ordinary conversation turns to body-large. `ds-message` keeps 4px between its visible author, content, and timestamp or delivery footer. Failed outgoing delivery keeps the normal user bubble and renders negative “Failed to send” metadata in that footer; there is no error bubble variant.
- `ds-typing-indicator` is transient conversation status, not message content. Render it directly in an incoming `ds-message`, provide concise localized status text that names the participant when needed, and never approximate it with a MessageBubble variant. Use Loader or the owning region's busy state for loading or response-streaming progress.
- `ds-message-composer` begins at two body-medium lines, grows in whole-line increments through six lines, and then scrolls internally. Do not replace this with fixed one-row or arbitrary pixel heights in a consuming application.
- Put leading composer utilities such as Add in its `tools` slot. Put trailing utilities such as Dictation in its `actions` slot; the built-in Send/Stop action stays last with an 8px gap from the preceding action. Tool, Dictation, and Send/Stop icon buttons use the standard non-rounded control radius. The composer surface uses the 10px `--dimension-radius-125` token. While its textarea is focused by mouse or keyboard, the complete surface uses the same bold-brand inset stroke width and color as an active Input; the native textarea never draws a separate outline. Agent and person-to-person composers both use the brand submit intent by default—do not use AI color tokens merely to identify an agent channel.
- When a composer floats over a transcript, place its container in `ds-message-scroller`'s `overlay` slot with 8px padding on every side. The scroller measures the overlay, lets messages move behind it, reserves matching live-edge clearance, and positions Scroll to latest 8px above it. Do not recreate this with a fixed bottom padding or a sibling grid row that clips messages at the composer edge.
- To constrain a fullscreen conversation lane while keeping the scrollbar at the viewport edge, leave the `ds-message-scroller` host full width and set `--ds-message-scroller-content-max-width` on it; never put `max-width` on the scroller host. The custom property sizes the scroller's padded content box. When a target describes the usable message/composer width, add the scroller's two 16px inline paddings to that property and add the overlay container's two 8px paddings to the centered composer container, so the visible message lane and composer surface share the same edges.
- Tool drawer, fullscreen, and slotted product root surfaces remain transparent so ShellApp's chrome wash shows through. Add a background only to a specifically designed child surface; do not give an entire tool view an implicit primary or secondary fill.
- The PanelTools drawer uses `--dimension-panel-width-xs` (300px) on desktop and tablet. Do not introduce a wider desktop override; fullscreen remains viewport-wide.
- Drawer open/close is a clipped reveal of the already-rendered fixed-width surface. Keep the header and tool content fully opaque throughout width motion; retain the surface until the measured clip width reaches its terminal width, because transition events may arrive before the replacement easing finishes. Only skip paint once the drawer is fully closed and inert.

**Select / SelectMulti**

- `ds-select` owns one string value; `ds-select-multi` owns a JavaScript array of string values. Multi keeps the field label/placeholder visible and summarizes selection as plain inline text (`Label · count`) rather than replacing the label, rendering a badge, or rendering tags.
- Select popups use listbox/option semantics. `ds-menu` remains an action menu even though all three share anchored-popup and choice-row visual foundations; never switch select rows back to menu/menuitem roles.
- A Menu containing the specialized shell gradient picker is a richer non-modal dialog popup: the picker keeps radio-group semantics, ordinary preference rows remain buttons, Escape restores trigger focus, and Tab moves between popup controls before closing and continuing through the page at the boundary. Plain Menu content retains menu/menuitem semantics and roving arrow-key focus.
- Use Menu `selectionMode="single"` for mutually exclusive command choices such as one active filter. Every item supplies controlled `isSelected`; Menu renders `menuitemradio`, `aria-checked`, and a presentation-only md radio indicator in the leading control track, matching checkbox-option placement. Keep exactly one selected item, update the items after `dsSelect`, and include an explicit neutral option such as “All chats” when users must be able to clear the constraint. Do not model mutually exclusive choices as independent switch rows.
- Single-select rows rely on the selected active fill and foreground change; do not add a trailing check icon. They may use prefix icons. Multi-select rows use a presentation-only `ds-checkbox` indicator while the owning option retains listbox semantics and interaction; their option contract excludes icons because a choice row must never combine a checkbox and prefix icon.
- Options support label, value, subtext, and `isInactive`; single-select options additionally support a prefix icon. Use either flat `options` or grouped `sections`; sections take precedence. Arrays and objects must be assigned as JavaScript properties.
- `searchable` is immediate local filtering over label and subtext. Server search, debounce, networking, virtualization, and hierarchical children are intentionally outside these components.
- The popup search row always uses the md choice-row recipe: body-medium input text, a 20px md search icon, and the same outer plus row padding and label inset as popup options. It does not shrink with an sm or xs trigger. Its placeholder is secondary at rest and quaternary while focused because it becomes decorative once the editable field is active. Its field chrome and clear action follow the shared Input recipe.
- `isLoading` replaces or occupies the trigger prefix-icon zone, exposes busy state, and shows a centered loader while option interaction is unavailable.
- Clear actions live in the popup footer. Single clear emits an empty string; multi clear emits an empty array. Both emit `dsClear`, keep the popup open, and preserve useful focus.
- Omitted `background` is for primary and secondary surfaces. Pass `faint` explicitly on faint surfaces and use the matching medium, bold, strong, translucent, inverted, media, or always-dark context elsewhere.
- Multi native forms submit one repeated entry per selected value. Angular forms import `SelectValueAccessor` or `SelectMultiValueAccessor` with the matching generated component proxy.
- Hierarchical selection belongs to a future tree-select contract: single-select parents navigate, multi-select parents cascade with indeterminate state, and submitted values remain leaf-only by default.

**Input**

- `ds-input` owns single-line free text, email, telephone, URL, search, and password entry. Use Select for finite choices, Switch for immediate binary settings, and Slider for direct range adjustment.
- Compose Input in `ds-field` for its persistent visible label, description, and form-level error. Placeholder text is guidance, not a replacement for the label; it is secondary at rest and intentionally quaternary while focused because it becomes decorative once the editable field is active.
- Input shares Select's control recipe: md/sm/xs density, fill/hug width, transparent interaction fill, and an optional secondary inset border.
- Entered values use primary foreground. Prefix icons, suffix content, and resting placeholders use secondary foreground. Prefix icons are decorative; suffix content is for compact units or decoration and must not be the only source of meaning.
- Search fields show the standard borderless CrossCircle icon action only while a value exists. Clearing emits the empty value and returns focus to the native field.
- Focus promotes the normal boundary to the thicker bold-brand inset stroke. Error uses the thicker bold-negative inset stroke without changing geometry. Validation timing and persistent help text belong to the form owner.
- Use `readOnly` when a value must remain focusable and included in submission but cannot be edited. Use `isInactive` or `disabled` only when it is unavailable and should leave the tab order and form submission.
- Forward browser text-entry hints with `autoComplete`, `inputMode`, and `enterKeyHint`; choose `type` from the value's actual semantics rather than its visual treatment.
- Input exposes `data-focused`, `data-filled`, `data-dirty`, `data-touched`, `data-invalid`, `data-disabled`, `data-readonly`, and `data-required` state hooks. Do not style these into a second validation policy outside Field.
- Input is restricted to primary and secondary application backgrounds and does not expose a `background` prop. Choose another composition for faint, bold, strong, translucent, inverted, media, or always-dark surfaces.
- Use md in ordinary forms. Use sm or xs only when the containing toolbar or dense layout follows the same control-density recipe. Form fields normally fill their parent; hug width needs an explicit layout constraint.

**Field**

- `ds-field` composes exactly one Input, Select, or SelectMulti with a persistent visible label and optional description/error text. Checkbox, Radio, and Switch already own their label structure and do not belong inside Field.
- Field generates or accepts one stable `fieldId`, applies it to the child control, and connects the label and current supporting message with `for`, `aria-labelledby`, and `aria-describedby`. Authored ARIA references are preserved and merged.
- Put `error` and `errorMessage` on Field when composed. Field forwards the invalid state and supported child control border treatment; do not also set a child `errorMessage`, which would render duplicate error text.
- A visible error replaces the description. Error text must preserve any essential format or consequence guidance needed to correct the field. The form owner decides whether validation appears on change, blur, or submit.
- Clicking a Field label focuses its design-system control without opening a Select. Several controls answering one question require a native `fieldset` and `legend`, not one Field.
- Field exposes `data-focused`, `data-filled`, `data-dirty`, `data-touched`, `data-invalid`, `data-disabled`, and `data-required` hooks. The child remains the source of value, validity, and form submission.
- Field and its child fill the width supplied by the form layout. The form owns columns, wrapping, and responsive placement.

**Checkbox**

- `ds-checkbox` owns independent selection, acknowledgment, and consent. Use `ds-radio` for mutually exclusive choices and `ds-switch` for settings that apply immediately.
- Sizes are md with a 16px box centered in a 20px placement, sm with a 12px box in 16px, and xs with an 8px box in 12px. Labels map to body-medium, body-small, and caption respectively.
- The box always has a 2px radius. Unchecked uses an inset `--color-foreground-tertiary` stroke: 1.25px at md, 1px at sm, and 0.75px at xs. Checked and indeterminate remove the border, use a brand fill, and draw their component-owned mark at the same density-specific stroke width.
- Enter and Space activate an interactive checkbox. Activation clears indeterminate before toggling checked; native form reset restores both initial states.
- Use `presentation` only when a composite owner supplies selection semantics and interaction. Multi-select rows render an md presentation checkbox centered inside the shared 20px option icon zone; never combine it with a prefix icon.
- Checkbox is for primary, secondary, and faint app surfaces and does not expose a background prop.

**Radio**

- `ds-radio` owns one-of-many selection across a small visible option set. Although the public component name is singular, the host exposes `radiogroup` semantics and each option exposes `radio` semantics.
- Sizes match Checkbox: md has a 16px circle in a 20px placement, sm has a 12px circle in 16px, and xs has an 8px circle in 12px. Labels map to body-medium, body-small, and caption respectively.
- Unchecked circles use an inset `--color-foreground-tertiary` stroke: 1.25px at md, 1px at sm, and 0.75px at xs. Selected circles remove the border, use a brand fill, and draw a centered on-bold foreground dot sized 8px, 6px, and 4px respectively.
- Arrow keys move and select through active options; Home and End select the first and last active options. Roving tabindex prefers the selected option.
- Use Checkbox for independent or multi-select choices, Switch for immediately applied binary settings, and Select when a longer choice set must remain compact.
- Radio is for primary, secondary, and faint app surfaces and does not expose a background prop.

**SwatchPicker**

- `ds-swatch-picker` owns one-of-many selection from a small curated set of visual presets. It supports token-based flat colors, CSS gradients, optional preview opacity, inactive options, and visually separated sections that remain one radio group.
- Assign `options` or `sections` as JavaScript properties. Sections take precedence. Every option requires a stable value, an accessible label, and preview data; color alone never supplies meaning or the accessible name.
- The selected active option owns the single Tab stop. Arrow keys wrap while skipping inactive options; Home and End select the first and last active options. `dsChange` emits the selected string value.
- SwatchPicker is not an unrestricted color editor. Use it for curated presets, Radio for primarily textual choices, and Select for longer compact choice sets.
- `ds-shell-gradient-picker` and `ds-shell-gradient-swatch` are deprecated compatibility components. New shell appearance UI maps the fixed shell preset recipes into SwatchPicker options; do not publish another single-swatch component.

**Chip**

- `ds-chip` is an always-removable metadata value for primary surfaces, such as a user-applied filter, recipient, or tokenized input entry. Use `ds-tag` for static labels.
- Semantic state describes the represented value; `active` is not selection or pressed state. Chip is not navigation, a toggle, or a persistent status badge.
- The Cross dismiss icon is fixed. `dsRemove` has no payload; the parent identifies the bound item, removes it, and moves focus to the next chip, previous chip, or owning collection/input trigger.
- `isInactive` keeps the chip visible while disabling and removing its dismiss action from keyboard interaction.
- Labels stay on one line and truncate only when the parent supplies a maximum width. The parent owns size, wrapping, overflow, and responsive condensation.

**Tag**

- `ds-tag` is static metadata, taxonomy, affiliation, or semantic status on primary application surfaces by default. Use Chip for removable values and ButtonUnfilled for non-menu actions/toggles.
- Pass `interactive` only when the Tag opens a related menu. It renders a native button, emits `dsClick`, exposes controlled `expanded` + optional `ariaControls`, and adds a fixed decorative `ChevronUpDown` suffix. It never toggles open state internally.
- `icon` renders a decorative leading `ds-icon`, matching the Button icon API. There is no icon slot or consumer-configurable suffix.
- `isInactive` disables the interactive button and applies the shared inactive treatment. Static Tag remains outside the tab order and has no event or suffix.
- Intent describes content meaning, never interaction state. Brand marks Motive/product affiliation; AI marks AI-generated or AI-assisted content. Warning is higher urgency/risk than caution.
- Contrast changes prominence without changing meaning or parent surface context. `rounded` is a visual style only.
- The visible label owns the accessible name. The menu owner synchronizes `expanded`, associates `aria-controls`, opens the menu from `dsClick`, and follows Menu focus management.
- Labels stay on one line and truncate only when the parent supplies `maxWidth`. The parent selects density and owns collection wrapping, overflow, and responsive condensation.

**Badge**

- `ds-badge` is non-interactive supplemental notification chrome attached to an owning control or label. Counter is for unread quantity; dot communicates presence without quantity.
- The owner provides the primary accessible name. Give an announced counter or dot contextual supplemental text, or mark a purely visual badge `aria-hidden`; never expose a bare count or generic “notification” name.
- Non-positive counters hide. Counts above the compact limit render the limit plus a suffix (for example `9+`).
- Badge keeps one brand treatment. Use Tag or normal content for semantic statuses and quantities that must stand alone.
- Use the halo ring only when Badge overlaps an icon or other content. Disable it in a reserved safe-area slot such as a dedicated row suffix. When enabled, match it to the immediate backing surface; prefer typed surface presets and reserve direct overrides for component-local fills. Gradient rings align automatically inside active ShellApp gradient chrome.
- The owner positions Badge and owns responsive visibility or condensation. Badge never receives focus or pointer interaction.

**Divider**

- `ds-divider` separates sibling content groups within one surface when spacing alone is insufficient. Use the owning component's border for container edges, control outlines, and selected states.
- Horizontal and vertical orientations are supported. The parent owns placement and any responsive changes to orientation, visibility, inset, or length.
- Decorative dividers are hidden from assistive technology by default. Enable separator semantics only when the line represents meaningful document or group structure.
- Omitted `background` is for primary and secondary surfaces. Pass `faint` explicitly on faint surfaces even though it uses the same standard divider token; other contexts use their matching divider token, including navigation chrome.
- Insets remain symmetric along the line axis. Prefer token presets; explicit CSS lengths are for layout-specific exceptions.

**Icon**

- `ds-icon` renders canonical IcoMo system and `Flag*` glyphs. It is visual content, never the interactive target; compose it inside the owning button, link, or control.
- Icons are decorative by default. Add a label only when the icon itself conveys otherwise unavailable meaning; nested control icons stay decorative because the owner provides the accessible name.
- Omitted color inherits `currentColor`. Use semantic aliases or CSS-variable references only when the glyph needs an independent color role.
- `tertiary` and `quaternary` are restricted to icons inside genuinely inactive/disabled UI or to purely decorative icons. Quaternary is the fainter tier. Prefer the owning control's inactive state; informative icons and meaningful status graphics retain sufficient rendered contrast even when `aria-hidden`.
- Unknown names, failed loads, and rejected SVG markup leave an empty fixed-size box. Do not add a fallback glyph that could communicate the wrong meaning.
- Lazy loading is the default. Pre-register only critical first-paint glyphs with `registerIcons`; render-boundary SVG validation and parsed-DOM injection remain mandatory.
- Informative flags require explicit localized labels. The parent owns icon size and responsive changes.

**Loader**

- `ds-loader` communicates indeterminate progress for an operation. Use Skeleton for pending content with predictable structure; Loader does not represent determinate progress.
- Nested Loader stays unnamed while the owning button, field, or region exposes its busy state. Standalone Loader requires contextual status text; avoid duplicate announcements.
- Omitted color inherits `currentColor`. Explicit color aliases and CSS variables follow the Icon contract.
- Loader is an informative progress graphic: do not use `tertiary` or `quaternary` for standalone or informative loading states. Nested Loader inherits a readable color from its owning busy control or region.
- The owner decides whether to delay visibility for short operations, reserves space, supplies centering/overlay layout, and communicates completion or failure.
- Reduced motion stops rotation but keeps the glyph and status semantics visible. The parent owns size and responsive changes.

**Skeleton**

- `ds-skeleton` preserves expected content geometry while structured data is pending. It is an aria-hidden atom, not an operation-level progress indicator; use Loader for actions.
- Compose text, icon, and control atoms in the owner to approximate final count, hierarchy, width, and arrangement. Skeleton does not provide card, list, or table presets.
- The owning region exposes busy/loading semantics, delays brief placeholder flashes when appropriate, preserves focus, and swaps the complete composition for real content.
- Shimmer defaults on and may be disabled. Reduced motion always renders a static final shape. `rounded` is an optional visual treatment for icon and control atoms.
- Omitted `background` is for primary and secondary surfaces. Pass `faint` explicitly on faint surfaces even though it uses the same standard base/shimmer tokens; other contexts use matching tokens.
- The owner adapts placeholder count, width, and arrangement to its real responsive layout.

**Local tab navigation**

- `ds-tab-group` is the horizontal local-view tab primitive. It does not support vertical orientation.
- TabGroup's omitted default context (primary or secondary surfaces) keeps the filled outer track and selected pill with the brand-active fill. Explicit faint, medium, bold, strong, translucent, inverted, media, and always-dark contexts use a transparent outer track, the matching surface border, and that surface's active selected fill. TabGroup notification dots intentionally omit the halo because the selected active fill is a transient overlay rather than a stable ring surface.
- TabGroup items use one uniform `label`, `icon`, or `icon-label` variant per group. Icon-only items keep `label` as their accessible name; dots remain supplemental on every variant. Only the omitted default context emphasizes selected label text; explicit surface contexts keep label weight stable and promote foreground color.
- `ds-panel-sub-nav` is the vertical local-view tab primitive for panel/card side rails. It switches adjacent panels with `role="tablist"` / `role="tab"` semantics and ArrowUp/ArrowDown navigation.
- PanelSubNav selected rows use `ds-interaction-fill--selected` plus primary foreground color. Keep the `text-body-medium` recipe stable; selection must not change text weight.
- PanelSubNav's omitted `background` is the shared default treatment for primary and secondary parent surfaces and uses the brand-active selected fill. Pass `faint` explicitly on faint surfaces to use the neutral active fill; use the other matching context on medium, bold, strong, translucent, inverted, media, or always-dark surfaces.
- PanelSubNav rows are label-only, require a valid selected value when enabled items exist, and remain vertical at every width. The consuming panel owns responsive adaptation.
- `ds-panel-nav` and `ds-bar-nav` own application route navigation. BarNav renders its horizontal tabs internally; there is no standalone TabGroupNav component.

**Control density recipes**

Shared metrics for md / sm / xs control-like rows (Tag, PanelNav items, BarNav tabs, Menu items, Chip, read-only header titles, …). Import `src/wc/utils/control-density.css` and apply `.ds-control--md|sm|xs` on the host or inner row. A row may use the recipe for consistent geometry even when it is presentational rather than interactive.

**Default to md.** New controls and control-like rows use md unless their component contract explicitly requires sm or xs. A dense location such as shell chrome, a panel tool, a toolbar, or a popup is not by itself a reason to downsize content. For md, the complete content recipe is a 32px control, `text-body-medium` (14px/20px), and a 20px md icon. Do not choose these three values independently.

Applying `.ds-control--md|sm|xs` provides geometry variables only. A native input or button that uses internal `ds-text--*` utility classes must also import `src/wc/utils/typography.css`; otherwise it can silently inherit an application or Storybook font size. Prefer `ds-text` where native element constraints do not prevent it. Every new or changed control must have a rendered test for computed font size, line height, and icon box—not only a source assertion that the intended class and prop are present.

The density utility is the single source of truth for a row's height, inline padding, icon box, icon↔label gap, label inset, and default radius. Consume the `--ds-control-*` variables instead of repeating their current TokoMo token values in component CSS. Keep structural container padding separate: for example, a panel header may own an 8px outer inset while its read-only title and adjacent buttons use the md row/label metrics. Support `label`, `icon-label`, `label-icon`, and `icon-label-icon` compositions from the same variables so changing one density recipe propagates to every composition.

PanelNav inherits the md default radius for its item and header controls, while its existing local height, gap, and positioning aliases remain responsible for collapsed-shell and footer animation geometry.

|                    | **md**                            | **sm**                            | **xs**                            |
| ------------------ | --------------------------------- | --------------------------------- | --------------------------------- |
| Height             | `--dimension-size-400` (32)       | `--dimension-size-300` (24)       | `--dimension-size-200` (16)       |
| Icon               | `--dimension-iconography-md` (20) | `--dimension-iconography-sm` (16) | `--dimension-iconography-xs` (12) |
| Text               | `text-body-medium` (14/20)        | `text-body-small` (12/16)         | `text-caption` (9/12)             |
| Row padding-inline | `--dimension-space-075` (6)       | `--dimension-space-050` (4)       | `--dimension-space-025` (2)       |
| Label inset        | `--dimension-space-025` (2)       | `--dimension-space-025` (2)       | `--dimension-space-025` (2)       |
| Icon↔label gap     | `--dimension-space-050` (4)       | `--dimension-space-025` (2)       | `0`                               |
| Default radius     | `--dimension-radius-025` (2)      | same                              | same                              |
| Rounded            | `--dimension-radius-half`         | same                              | same                              |

CSS vars set by the helper classes: `--ds-control-height`, `--ds-control-icon`, `--ds-control-padding-inline`, `--ds-control-label-inset`, `--ds-control-gap`, `--ds-control-radius`. Text line-height is not a density variable; the control's `size` maps internally to a complete `ds-text` variant via `CONTROL_TEXT_VARIANT`.

The xs recipe is a compact **visual density**, not permission to crowd pointer targets. An owner that uses an operable xs control must place it within at least a 24×24 CSS-pixel allocation and preserve enough clearance that 24px circles centered on adjacent target bounds do not overlap. This contract also applies to compact Switch and Slider instances. Use sm or md whenever the layout cannot guarantee that spacing; presentation-only indicators are not pointer targets.

**Switch density**

- `ds-switch` is compact chrome placed inside menu, control, and form rows rather than a full-height control itself.
- Sizes are `md` = 32×20 with a 12px thumb and 4px body inset, `sm` = 24×16 with a 10px thumb and 3px inset, and `xs` = 20×12 with an 8px thumb and 2px inset. Unchecked uses a transparent track with a 1px inset `--color-border-secondary` stroke at every size and a solid `--color-foreground-tertiary` thumb without a border. Checked keeps the brand track and primary-background thumb with no strokes.
- The Switch host owns its structural unchecked inset stroke directly; do not put it on the shared interaction-fill pseudo-elements because a parent row may own those layers. Hover/press wash is confined to the thumb. Switch focus uses the shared **outset** `ds-focus-ring`, not the inset ring.
- Track color and thumb position animate with `--effect-motion-short-3`, matching SwatchPicker selection motion; do not add depressed/elevated shadows or press-scale transforms.
- Every switch requires an accessible name. Use `aria-label` for standalone icon-like contexts or `aria-labelledby` to associate visible text; use `name`/`value` for form submission.
- `readOnly` keeps the switch focusable and submitted but prevents state changes. `disabled` and `isInactive` remove it from keyboard interaction and form submission.
- Switch exposes `data-focused`, `data-filled`, `data-dirty`, `data-touched`, `data-valid`, and `data-invalid` in addition to its checked, inactive, read-only, and required hooks. Required invalid state is also exposed through `aria-required` and `aria-invalid`; form owners decide when to show validation messaging.
- Composite controls may set `presentation` so the switch is an aria-hidden, non-focusable visual indicator. The owner must provide state semantics; Menu switch rows use `menuitemcheckbox` + `aria-checked` and the default md switch size.

**Slider**

- `ds-slider` is direct manipulation for a bounded numeric value. Use Input when exact entry matters more, Radio for short named choices, and Switch for immediate binary settings.
- Its visible label matches Field: primary emphasized `text-body-small` at every control density. The value on the opposite side uses the same primary `text-body-small` metric without emphasis and keeps tabular numerals.
- Assign a number for a single thumb or a two-number array through the JavaScript `value` property for a range. Range values remain ordered, cannot cross, and may reserve `minStepsBetweenValues`; both thumbs remain in constant DOM/tab order.
- Every thumb contains a native range input. A visible `label` names a single thumb; range sliders require localized `startLabel` and `endLabel`. Use `valueText` for one authored value description or assign `valueTexts` for per-thumb range descriptions when raw numbers are not understandable by themselves.
- Pointer input chooses the nearest thumb and emits `dsChange` continuously; `dsCommit` is for expensive work after pointer, keyboard, or assistive-technology interaction settles.
- Horizontal Slider fills its parent. Vertical Slider uses a token-based default length that layouts may override through `--ds-slider-vertical-length`. `thumbAlignment="edge"` keeps the full thumb inside the control; `center` aligns its center to the endpoints.
- Sizes follow control density: md uses a 32px control, 16px thumb, and 4px rail; sm uses 24/12/3; xs uses 16/8/2. The rail uses a 1px inset `--color-border-secondary` stroke at every size, while the selected indicator uses bold brand. The thumb stays square with a 2px radius, has no border, and uses `--effect-elevation-elevated-sm` at every density.
- `readOnly` remains focusable and submitted but prevents changes. `disabled` and `isInactive` remove all thumbs from interaction and form submission. Form reset restores the initial normalized value; a range submits repeated entries under one name.
- Slider exposes orientation, dragging, focus, filled, dirty, touched, valid, disabled, and read-only data hooks. Do not add a second validation or gesture policy in consuming CSS.

**Interaction fill**

Shared layer recipe for interactive controls (buttons, Chip, PanelNav items, Menu items, TabGroup tabs, hover-enabled or linked ChartLegend rows, …). Import `src/wc/utils/interaction-fill.css` and apply `.ds-interaction-fill` on the interactive element.

Paint order (bottom → top): element background → `::before` (selected/active, opt-in) → label/icon/badge content → `::after` (hover/press wash + optional inset border + inset focus).

| Class / var                                                                                                   | Role                                                                                   |
| ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `.ds-interaction-fill`                                                                                        | Stacking context + `::before`/`::after` shells                                         |
| `.ds-interaction-fill--selected`                                                                              | Fills `::before` with `--ds-interaction-active`                                        |
| `.ds-interaction-fill--bordered`                                                                              | Inset secondary stroke on `::after` (above selected / hover)                           |
| `.ds-interaction-fill--on-faint\|medium\|bold\|strong\|translucent\|inverted\|media\|always-dark\|navigation` | Remap interaction tokens for the parent surface                                        |
| `--ds-interaction-hover\|pressed\|active`                                                                     | Overridable token hooks                                                                |
| `--ds-interaction-border-width\|color`                                                                        | Inset stroke on `::after` (default off)                                                |
| `--ds-interaction-dot-ring`                                                                                   | Set under `--selected` to `--ds-interaction-active` — badge halo matches selected fill |

Rules:

- Hover, pressed, and selected/active are three different states. Hover must use `--color-interaction-hover`, press must use `--color-interaction-pressed`, and only persistent product selection may use `--color-interaction-active*` through `.ds-interaction-fill--selected`. Never use an active/selected token to approximate hover or press.
- Never swap the control’s own `background-color` for hover/press. Never use `color-mix(bg, fg)` (or `mix-blend-mode`) for control hover — paint contrast-aware `--color-interaction-*` tokens on `::after`.
- Tokens are surface-aware: default app hover vs `--color-interaction-on-bold-background-hover`, etc. Map filled-button `contrast` → `--on-bold|strong|medium` (faint → default).
- `::before` = selected/active only. Default primary/secondary surfaces use `--color-interaction-active-brand`; explicit faint uses `--color-interaction-active`; stronger/specialized surfaces use their matching active token. Omit `--selected` when chrome wants foreground-only selection (`activeFill={false}` on `ds-button-unfilled`, PanelNav/BarNav) — primary fg still applies.
- `.ds-interaction-fill--selected` must not dynamically change label weight. Keep the component's base `ds-text` recipe and promote selected foreground color to the appropriate primary token instead. This rule is specific to the active-fill utility; separate selected-background recipes and foreground-only chrome define their own affordance contracts.
- **Badge / notification-dot halo:** when the control is `--selected`, the util sets `--ds-interaction-dot-ring` to `--ds-interaction-active`. Prefer remapping the component’s surface ring token under `--selected`, or pass `background="var(--ds-interaction-active)"` from the parent when selected (ButtonUnfilled does both) — nested scoped hosts can miss custom-property fallbacks. Idle / chrome-without-fill keep the surface ring.
- `::after` = hover + press (`transition: none`) + optional inset border + inset focus — **topmost** in the control stack (z-index above label/icon/badge). Pairs with `ds-focus-ring-inset` on the same pseudo — do not invent a second focus layer. Badge dots must sit under this wash.
- Fills use **positive** z-index so they sit above an opaque host background. Place label/icon with `.ds-interaction-fill__content` (or `position: relative; z-index: 2` on children) — never above `::after` (z-index: 3).
- If a control uses `all: unset`, re-assert `position: relative; z-index: 0` afterward so the util’s stacking context still applies (see PanelNav items).
- Omit `.ds-interaction-fill` when `isInactive`, or rely on `:disabled` (util skips hover/press on `:disabled`).
- Persistent selected _product_ state (e.g. Menu item `--selected`) may still use `::before` / a real background; hover continues to overlay via `::after`. Chip is dismiss-only, has no select/toggle state, and is used only on primary surfaces.
- **Inset borders on interaction targets:** paint the stroke on `::after` via `--ds-interaction-border-*` or `.ds-interaction-fill--bordered` so it stays visible **above** selected and hover washes. Do **not** put an inset `box-shadow` on the element itself (that layer sits under `::before` and gets covered when selected). Do **not** use a layout `border` on elements that also use `.ds-interaction-fill` — a real border paints outside the padding box and leaves a 1px halo outside the fill. Outer shells that are _not_ interaction targets (e.g. TabGroup `.tab-list` track) may keep a real border if they already compensate with padding math; interactive children must still use the util stroke.

**Control inactive**

Shared disabled/inactive visual for interactive controls. Import `src/wc/utils/control-inactive.css` and apply `.ds-control-inactive` when inactive.

| Class                  | Role                                                           |
| ---------------------- | -------------------------------------------------------------- |
| `.ds-control-inactive` | `opacity: 0.5`, `pointer-events: none`, `cursor: not-allowed` |

Rules:

- Prop name is **`isInactive`** (boolean, default `false`) on host controls (`ds-button-filled`, `ds-button-unfilled`, `ds-chip`, `ds-checkbox`, `ds-switch`, `ds-input`, `ds-select`, `ds-select-multi`, `ds-slider`, `ds-radio`, `ds-shell-gradient-swatch`, …). Item APIs use `isInactive` too (Menu items, Select/SelectMulti options, TabGroup / PanelSubNav tabs, Radio options, PanelTools rail items).
- Do not hand-roll inactive opacity on these controls — use the util.
- Still set native `disabled` / `aria-disabled` where the element is a real button/control so a11y and `:disabled` interaction-fill skips keep working.

**Focus states**

- New interactive components must use the shared focus utility in `src/wc/utils/focus-ring.css`; do not hand-roll `:focus-visible` outlines in component CSS.
- Import it from component CSS with `@import '../../utils/focus-ring.css';`.
- Prefer `ds-focus-ring-inset` for borderless controls, controls without their own stable background, chrome-aligned controls, menu items, nav items, tool rail actions, and tab-like controls. This keeps the ring tight to the visual hit target and avoids awkward outside outlines on grouped/pill surfaces.
- Use `ds-focus-ring` only when an outside ring is intentional and visually fits the component shape.
- Use `ds-focus-ring--visible` only when component-managed roving focus has confirmed keyboard modality, such as a menu opened with Enter/Space/Arrow keys or navigated with arrow keys. Do not apply it after pointer/mouse opens.
- Focus is a ring state, not hover. Keyboard/programmatic focus must not use hover or pressed fills unless the item is actually hovered or pressed.
- Set `--ds-focus-ring-color` from the surface context instead of hardcoding colors: default app surfaces use `--color-interaction-focus`, navigation chrome uses `--color-navigation-interaction-focus`, and medium/bold/strong/always-dark surfaces use their matching `*-interaction-*-focus` token.

**Toast**

- Mount one `ds-toast` near the application root. It consumes the default `toastManager` from `@ds-mo/ui/toast`; isolated applications may create and property-bind a custom manager with `createToastManager()`. Never mount two toast components for one manager.
- Toast is floating-only and replaces the former `ds-banner`; there is no persistent inline banner mode. Keep persistent messages in the owning page, form, field, or status composition.
- The manager owns `add`, ID upsert, `update`, `close`, `closeAll`, and `promise`. Promise loading records remain persistent and update the same ID to success or error.
- The global stack is bottom-end, newest-first, and limited to three visible records by default. While collapsed, each visible toast behind the frontmost is inset another 8px on both sides; hover or keyboard focus expands every visible toast to full width and its measured vertical offset. Ending toasts contribute zero stack height so the correct surviving toast promotes immediately without a second positional jump. Limited records remain mounted and inert until promoted. Anchored records use trigger-relative positioning and do not consume the global stack limit.
- Timers pause together on hover, focus, touch swipe, window blur, and document hiding, then resume from their exact remainder. `timeout=0` is persistent. Functional timeout values use `resolveCssTimeMs`; exit cleanup uses `resolveMotionTimeMs`.
- F6 moves focus into the Notifications region without stealing focus when a toast arrives. Escape closes the focused toast and focus moves to another toast or returns to the previous control. Low priority uses polite announcement; reserve high priority for urgent assertive feedback.
- Default swipe dismissal supports down and right, ignores interactive descendants, and exposes movement/direction state for styling. Close remains available as an unbordered `ds-button-unfilled` Cross action inset 8px from the surface's top and right edges.
- Toast surfaces use primary background plus floating elevation. Titles use primary `text-title-small`; descriptions use secondary `text-body-medium`. An optional action sits below the text, bottom-left aligned, as a bordered label-only `ds-button-unfilled`; it never dismisses implicitly. Styling by `type` is deferred to explicit data-state hooks rather than intent-colored surfaces.

**Reduced motion**

- Every infinite animation, spatial/layout transition, transform transition, opacity state transition, and overlay enter/exit animation must define a `@media (prefers-reduced-motion: reduce)` end state in the same stylesheet. `local/require-reduced-motion` warns when this contract is missing.
- Under reduced motion, stop infinite/decorative animation and make spatial, layout, opacity, and overlay changes immediate. Keep the final visual state; never hide required content merely to avoid motion. `ds-loader` remains a static loading glyph and relies on its status semantics or the owner's `aria-busy`.
- Short color, background-color, and border-color control transitions may remain. They do not move content and are the intentional tiered-policy exception.
- JS timers coupled to CSS enter/exit motion must use `resolveMotionTimeMs`; functional delays such as tooltip hover intent and toast auto-dismiss continue to use `resolveCssTimeMs`.
- Web Animations API and View Transition effects must check `prefersReducedMotion()` and apply the final state without running the decorative reveal.
- Chrome components emitting `dsChromeTransitionStart` must also settle on `transitioncancel`, zero computed duration, and a computed-duration watchdog so reduced motion cannot strand BarNav overflow coordination.

**Scroll edge fades**

- Import `src/wc/utils/scroll-edge-fade.css` and build classes with `scrollEdgeFadeClassMap` from `src/wc/utils/scroll-edge-fade.ts`.
- Fades are static by default. PanelNav intentionally uses a permanently visible bottom fade as chrome treatment; do not make it scroll-aware.
- For scroll affordances that should reflect available content, pass `scrollAware: true`. CSS scroll-driven animations reveal/hide configured edges from the container's own scroll position without JavaScript; unsupported browsers retain the configured static fades.
- Multiple physical edges (`top`, `bottom`, `left`, `right`) compose into one mask. When scroll state already exists in JavaScript, an `atEnd` edge map suppresses only the flush edges; boolean `true` removes the complete mask.
- Keep overflow on the same element that receives the fade classes. Make standalone scroll regions keyboard-reachable when their off-screen content would otherwise be inaccessible.

**Anchored choice-popup alignment**

- Every menu trigger must expose its popup relationship and keep the trigger's active/pressed visual state for the popup's full rendered lifetime, including exit motion. Do not clear the visual state as soon as `open` becomes false.
- For application-owned `ds-menu` instances, separate interactive `open` state from retained trigger/context state. Set `open=false` to begin closing, keep the trigger active and its item/anchor context stable, then clear them from `dsAfterClose`. Pressing the active trigger again may reopen and cancel the pending close.
- `ds-menu` snapshots the last painted sections through exit motion so an action may update product state without changing labels or swapping menu contexts during the fade. Consumers must still retain trigger state through `dsAfterClose`; the content snapshot does not own external trigger styling.

- `ds-menu`, Select, and SelectMulti share `choice-popup-alignment.ts`. The default `choice-cell` contract extends the popup frame by the section inset so the first/last interactive row edge—not the popup frame—aligns with the trigger.
- Leave `ds-menu.anchorAlignment` at `choice-cell` for ordinary menus. Use `popup-frame` only when a deliberately custom layout must align the popup's outer frame, and treat `alignOffset` as an additional nudge after that policy.
- Treat an anchored popup's `side` as its preferred side, not an unconditional physical placement. Shared positioning keeps that side when it fits; otherwise it flips to the opposite side only when the opposite offers more main-axis room, then clamps the result to the viewport. Do not add product-level bottom/top or right/left collision branches.
- Do not copy section-padding offsets into stories or host components. New anchored choice popups must use `resolveChoicePopupAlignOffset` and `choicePopupMinWidth` instead of hand-tuned alignment math.

**TypeScript**

- `strict` mode. No `any`. Export every public prop interface.
- Prefer string-union types for variant props (`type ButtonIntent = 'brand' | 'positive' | ...`).
- `@Prop()` with non-primitive types (arrays, objects) must be set via JS property (not HTML attribute). Note this in prop JSDoc.
- **Spatial and timing props** (`sideOffset`, `alignOffset`, `delay`, durations for JS timers) accept `number | string`: use a number for px/ms (backward compatible), or a TokoMo CSS value / `var(--dimension-*)` / `var(--effect-*)` string (preferred). Resolve at runtime via `src/wc/utils/resolve-css-length-px.ts` and `resolve-css-time-ms.ts` — never hardcode magic numbers that have token equivalents. Named defaults live in `src/wc/utils/token-defaults.ts` (`@ds-mo/tokens/ts` var names only — values still resolve at runtime).

**Storybook stories (Stencil pattern)**

```ts
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-my-component.js'; // import from dist

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

The automated accessibility audit normally scans every top-level `ds-*`
component in a story. In a showcase story where design-system captions or
annotations are siblings of the real component fixture, add
`data-a11y-fixture` to each component under test. When any explicit fixture is
present, only marked components are audited; never use the marker to exclude
content rendered by the component itself.

For components with complex JS-only props (arrays, objects), use `lit/directives/ref.js`:

```ts
import { ref } from 'lit/directives/ref.js';

render: () => html`
  <ds-select
    ${ref(el => {
      if (!el) return;
      (el as HTMLDsSelectElement).options = options;
    })}
  ></ds-select>
`;
```

For overlay components that need `?open=${true}` in stories (no `<script>` tags — they don't execute in Storybook):

```ts
render: () => html`<ds-modal ?open=${true} heading="Title">…</ds-modal>`;
```

---

## Common gotchas

**Fixed-height rows/controls: use `height` + `align-items: center`, not padding + line-height math.**
`PanelNav`'s and `BarNav`'s items both size to 32px (`--dimension-size-400`) via a _fixed_ `height` on a flex/grid container with `align-items: center`, `box-sizing: border-box`, plus **horizontal-only** padding. Do not calculate outer height by adding text leading + vertical padding + border. The 20px body-medium `ds-text` box centers inside 32px, leaving 6px geometric space per side. Symmetric real borders (border-box) or shared inset interaction strokes must not change the declared outer height.

**`ds-text` is the layout box — don't wrap it just to style it.**
Apply padding, flex/grid sizing, overflow width, z-index, and component classes directly to `<ds-text>`. Its inner native element exists only for semantics (`label`, headings, paragraph, IDs/`for`) and inherits the host's complete typography recipe. A neutral wrapper around only `ds-text` recreates the old split-box problem and is flagged by `local/prefer-direct-ds-text`. Keep a wrapper only when it owns real structure (mixed icon/dot/badge content, animation masks, semantic interaction targets).

**`position: relative` alone does NOT create a stacking context — you also need a non-`auto` `z-index`.**
`.ds-interaction-fill` sets `z-index: 0` on the control so its `::before`/`::after` fills stay inside that stacking context. Paint order: selected (`::before` z-index 1) → content (z-index 2) → hover/press (`::after` z-index 3, topmost — covers badge dots). Place label/icon with `.ds-interaction-fill__content` or `position: relative; z-index: 2` on children — never above `::after`. For genuinely floating elements that must sit above unrelated siblings (tooltips, popovers), use the `--dimension-z-index-*` token scale (`base` 0, `raised` 50, `overlay` 250, `modal` 450, `floating` 500, `tooltip` 750) rather than a magic number — see `TooltipDataViz.css`.

**Cross-component hover-sync: keep "external highlight" and "own hover" as separate state, don't collapse them into one prop.**
When two components sync hover via events (e.g. `ds-chart-donut`'s `dsSliceHover` ↔ `ds-chart-legend`'s `dsItemHover`, wired by the consumer via `activeLabel`), it's tempting to drive everything off the single `activeLabel` prop. Don't — some visual effects belong _only_ to a genuine pointer/keyboard interaction on that specific element (a hover-fill affordance implying "you can click here", or a data-viz tooltip) and must never appear just because a sibling's hover was synced in. Keep an internal `hoveredLabel` state for "did _this_ element get directly interacted with," and compute the shared dimming effect as `activeLabel ?? hoveredLabel` while gating the exclusive-to-real-hover effects on `hoveredLabel` (or, better, plain CSS `:hover`/`:focus-visible`) alone. A standalone Donut shows its chart-owned tooltip for local slice pointer/focus by default. Disable it when a visible legend already owns label/value detail; `ds-card-data-viz-donut` does this automatically when its legend slot is present. Static line-chart keys set ChartLegend local hover highlighting off; `ds-card-data-viz-line` enforces that contract for its slotted legend while genuine legend links retain their link affordances. See `ChartDonut`/`ChartLegend`.

**Paired chrome transition events must always settle, including cancellation.**
ShellApp consumers such as BarNav pause layout measurement between `dsChromeTransitionStart` and `dsChromeTransitionEnd`. A CSS `transitionend` listener alone is not a completion guarantee: framework hydration, responsive class churn, reduced motion, or a replacement transition can emit `transitioncancel` or no terminal event. Components that publish this lifecycle must handle both `transitionend` and `transitioncancel` and keep a watchdog derived from the element's computed transition duration/delay. Every emitted start must have exactly one matching end; otherwise sibling chrome can remain permanently hidden or inert. See `PanelNav.startCollapseAnimation` and the cancellation case in `shell-app-chrome.spec.ts`.

**Hover lists: put the "clear" listener on the container, not on each row, to avoid gap-crossing flicker.**
A list of hoverable rows with visual `gap`/`row-gap` between them has dead space that belongs to no row. If each row clears the highlight on its own `mouseleave`, moving the pointer from one row to the next (crossing that gap) causes a flicker: highlight → none → highlight. Fix: attach `mouseenter` per row (to set the highlight) but attach `mouseleave` once, on the container — the gap is still inside the container's box, so crossing it never fires the container's `mouseleave`; only actually leaving the whole list does, and that clears instantly with no timer/debounce needed. See `ChartLegend.tsx`.

**ChartLegend numeric columns are stable and right-aligned.**
In vertical legends, the label yields width first and truncates before the compact value or percentage columns. Values and percentages use tabular numerals and stay inside the row interaction fill. `percentageDecimals` accepts only `1` (default) or `2`; both the minimum and maximum fraction digits are locked to that value so every row uses the same precision while `locale` controls localized number punctuation.

**Data-visualization cards use their own shell boundary.**
Use `ds-card-shell-data-viz` for every chart, legend, or metric-visualization card. The shell owns only data-viz header/actions chrome, token-based width/min-height, and a flexible body. Dedicated compositions such as `ds-card-data-viz-donut` own chart regions, legends, hover synchronization, loading, empty, and error policy. `ds-card-setting` independently owns settings-section chrome; there is no standalone general-purpose `ds-card` primitive.

Use `ds-chart-bar` for one value per category and `ds-chart-bar-stacked` for several additive series sharing each category. ChartBarStacked's `stacked` variant preserves raw totals; its `percentage` variant normalizes every non-empty category independently to a fixed 0–100% axis, which is appropriate for composition across ordered time buckets. Series order is the stable bottom-to-top stack order. Adjacent segments keep a non-scaling 1px gap. Raw stacks give only the top visible segment the 2px top radius; normalized percentage stacks remain square on every corner because they touch both axis edges. Pair multi-series bars with a visible, static ChartLegend. Use `ds-card-data-viz-bar` for the canonical dashboard-card composition of a regular, stacked, or percentage bar chart; its legend slot is optional for a single series and expected for multiple series.

**Settings cards are controlled single-edit sections.**
Use `ds-card-setting` only for persistent settings sections with the standard Edit, Save, and Cancel header workflow. The parent owns one active editing section, body composition, value snapshots, validation, persistence, loading, and error consequences. `dsAction` distinguishes `edit`, `save`, and `cancel`; update the controlled `editing` prop only after applying the requested consequence. In particular, keep the section editing while save validation or persistence is pending, exit only after success, and resolve dirty changes before switching to another section rather than silently discarding them. When several sections share a page, give each icon action a localized accessible label that includes its section name. General read-only surfaces remain product-owned layouts rather than using CardSetting as generic card chrome.

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

| Workflow                 | Trigger                                                             | Purpose                                                                             |
| ------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `build.yml`              | PR to main                                                          | Build/package checks plus sharded cross-browser E2E and sharded Vitest Storybook accessibility |
| `pr-title.yml`           | PR opened/edited                                                    | Enforce conventional-commit PR titles (lowercase subject)                           |
| `codeql.yml`             | Push/PR to main, weekly Sunday                                      | GitHub CodeQL JS/TS security scan                                                   |
| `release-please.yml`     | Push to main                                                        | Open release PR on feat/fix; publish to npm via OIDC when release PR merges         |
| `deploy-storybook.yml`   | After successful npm publish (release-please), manual               | Build + deploy Storybook to GitHub Pages                                            |
| `dependabot.yml`         | Monthly                                                             | Bump github-actions + npm devDependencies                                           |

`build.yml` runs the browser suites for component, CSS, story, dependency, build, test, and workflow changes. Documentation-only and generated agent-metadata-only changes skip browser work through `scripts/ci-browser-scope.mjs`; the build/package gate still runs. Playwright E2E is split across three CI shards while retaining Chromium, Firefox, and WebKit coverage. Storybook component and accessibility tests use the free `@storybook/addon-vitest` browser integration, run in Chromium for both light and dark themes, and are split across two CI shards. Release Please PRs continue to skip browser suites.

CI must remain zero-cost on this public repository: use only standard GitHub-hosted runners such as `ubuntu-latest`, never GitHub larger runners. Failure artifacts are uploaded only on failure and retained for seven days; browser caches use GitHub's repository cache allowance.

---

## Things not to do

- **Do not edit `dist/`** — it's generated by `stencil build`. Edit `src/wc/`, then run `npm run build`.
- **Do not edit `src/angular/`** — auto-generated by the Angular output target. The hand-owned public barrel is `src/framework/angular.ts`.
- **Do not edit `src/react/`** — auto-generated by the React output target on every build.
- **Do not edit `src/wc/components.d.ts`** — auto-generated by Stencil. Do not append hand exports there (watch/dev rebuilds wipe them and CI fails “src/ mutated”). Ship shell APIs from `@ds-mo/ui/shell` and generic APIs from `@ds-mo/ui/utils` instead (e.g. `PANEL_NAV_USER_MENU_PLACEMENT` from `/shell`).
- **Do not hand-add React wrapper components** — new UI goes in `src/wc/components/`; React wrappers are generated automatically.
- **Do not hardcode colors, spacing, or other design values** — always use `@ds-mo/tokens` CSS custom properties. Hardcoding breaks theming.
- **Default to `scoped: true`** in `@Component()` so token CSS variables penetrate naturally. Use `shadow: true` only where required (e.g. `ds-loader`, `ds-switch`, `ds-skeleton`).
- **Do not name a `@Prop()` `title`** — it's a reserved HTML attribute and causes Stencil a build warning. Use `heading` or another name.
- **Do not rely on `@Watch` firing for the initial prop value** — it only fires on subsequent changes. Call the handler explicitly in `componentDidLoad()` for initial state (e.g. `if (this.open) this.onOpenChange(true)`).
- **Do not re-export service singletons from a file that has `@Component()`** — Stencil enforces one export per file. Put services in a separate `*.ts` file.
- **Do not hand-bump `package.json` version** during normal work — let release-please do it.
- **Do not `git push` to `main`** — always branch + PR.
- **Do not commit `NPM_TOKEN` or any npm auth** — publishing uses OIDC, no secrets required.
- **Do not skip `npm install -g npm@latest`** in the publish job — Trusted Publisher requires npm ≥ 11.5.1.
- **Do not set `NODE_AUTH_TOKEN`** in the publish step — OIDC handles auth; a stray token can conflict.
- **Do not publish raw TypeScript through package exports.** Compile public subpaths into `dist/` and run `npm run verify:pack` before merging.

---

## Fast lookups

### Design tokens

Read `node_modules/@ds-mo/tokens/dist/tokens-index.json` — one file, no grep. It's a flat object keyed by CSS custom-property name with `{$type, $value}` entries, plus a top-level `categories` map that groups names by category:

| Category key       | What's in it                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `colors.reference` | Raw palette (`--color-reference-*`)                                                                                  |
| `colors.semantic`  | Semantic surface/border/foreground colors (`--color-background-*`, `--color-border-*`, `--color-foreground-*`, etc.) |
| `colors.data`      | Data-viz palettes                                                                                                    |
| `dimensions`       | Spacing, sizing, radius, stroke (`--dimension-*`)                                                                    |
| `typography`       | Font size, weight, line-height (`--typography-*`)                                                                    |
| `effects`          | Animation duration/easing, motion shorthands, blur, shadow, elevation (`--effect-*`)                                 |

To find the right token: read the file, access the `categories.<key>` array for names, then look up the value. Single read, no grep.

**Motion tokens quick reference:**

- `--effect-motion-short-1` = 50 ms ease-in-out
- `--effect-motion-short-2` = 100 ms ease-in-out
- `--effect-motion-short-3` = 200 ms ease-in-out (default interaction speed)
- `--effect-motion-medium-1` = 300 ms ease-in-out

Use `--effect-motion-*` (duration + easing combined) in `transition:` values. If you need the duration alone for `calc()`, use `--effect-animation-duration-short-N` separately.

---

## Quick reference: where things live

| Need to change...                     | Edit this                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------- |
| A component's behavior                | `src/wc/components/<Name>/<Name>.tsx`                                     |
| A component's styling                 | `src/wc/components/<Name>/<Name>.css` (tokens only — no hardcoded values) |
| A component's Storybook stories       | `src/wc/components/<Name>/<Name>.stories.ts`                              |
| Shared CSS util demos (Storybook)     | `src/wc/stories/Utility/*.stories.ts`                                     |
| Angular adapter output                | Auto-generated: `src/angular/`; public barrel: `src/framework/angular.ts` |
| React wrapper output                  | Auto-generated: `src/react/` — do not hand-edit                           |
| Token-showcase stories                | `src/stories/*.stories.tsx`                                               |
| Usage docs (MDX)                      | `src/docs/*.mdx`                                                          |
| Component registry logic              | `scripts/build-registry.mjs`                                              |
| Agent composition recipes             | `agent/patterns/*/pattern.agent.json`                                     |
| BarNav overflow + SPA/HMR integration | `docs/framework-integration.md`                                           |
| BarNav overflow e2e tests             | `tests/e2e/bar-nav-overflow.spec.ts`                                      |
| MCP server                            | `scripts/mcp-server.mjs`; packaged build: `scripts/build-mcp.mjs`         |
| Stencil build config                  | `stencil.config.ts`                                                       |
| Release changelog sections            | `release-please-config.json`                                              |
| PR title rules                        | `.github/workflows/pr-title.yml`                                          |
| Storybook deploy                      | `.github/workflows/deploy-storybook.yml`                                  |
