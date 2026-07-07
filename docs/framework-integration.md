# Framework integration

CompoMo (`@ds-mo/ui`) is a **Stencil web component library**. `npm run build` emits:

- **`dist/components/`** — `<ds-*>` custom elements (canonical; auto-define on import)
- **`src/angular/`** — auto-generated Angular proxy directives (`angularOutputTarget`)
- **`src/react/`** — auto-generated React wrappers (`reactOutputTarget`)

**Consumption options:**

| Host | Package subpath | Notes |
| --- | --- | --- |
| Any | `@ds-mo/ui/dist/components/ds-*.js` | Tree-shake per tag; motive-webapp-lab uses this |
| Angular | `@ds-mo/ui/angular` | Template property/event bindings |
| React | `@ds-mo/ui/react` | `DsButton`, `DsBarNav`, … |

There is no published `@ds-mo/ui/loader` or global `@ds-mo/ui/css` export. Import TokoMo via `@ds-mo/tokens` (or `@ds-mo/tokens/css`). Component CSS is scoped inside each custom-element bundle.

On hard reload, seed **all** bar-nav props (`basePath`, `tabs`, `currentUrl`) before the custom element upgrades — not only `currentUrl`. See motive-webapp-lab `shellChromeStateForPath()`.

---

## Nav chrome `navStyle` (panel + bar)

Primary navigation (`ds-panel-nav`) and secondary navigation (`ds-bar-nav`) share a **`navStyle`** property — style slots:

| `navStyle` | Typical route |
| --- | --- |
| `dashboard` | `/dashboard/*` |
| `settings` | `/settings/*` |

**HTML attribute:** `nav-style` (avoids collision with the element's native `style` property).

**Colors are unified for now** — both slots use app surface tokens (`--color-background-secondary`, etc.). The `--dashboard` / `--settings` BEM classes are hooks for future texture/glyph layers.

Bind the **same** `navStyle` on shell, panel, and bar so they stay in sync.

### `ds-bar-nav` — tabs only

Bar nav is **section tabs** (and an optional `heading` when tabs are hidden). Tool shortcuts (search, messages, agents, …) live on **`ds-panel-tools`**, not inline on the bar.

### `ds-panel-tools` — one named slot per tool

Each rail tool (`search`, `agents`, `messages`, `stacks`, `activity`) has a **named slot** for its own composed UI. Mount all tool panels in the host; `ds-panel-tools` shows the slot matching `active-tool` while the drawer is open (and keeps it visible during the close slide).

```html
<ds-panel-tools slot="tools" open active-tool="agents" .items=${railItems}>
  <app-search-panel slot="search" />
  <app-agents-panel slot="agents" />
  <app-messages-panel slot="messages" />
  <app-stacks-panel slot="stacks" />
  <app-activity-panel slot="activity" />
</ds-panel-tools>
```

The drawer header title comes from `PANEL_TOOLS_LABELS[active-tool]`. Closing the drawer (`open=false`) slides the panel shut; slotted tool content stays in the DOM so state survives the next open.

## `ds-app-shell` (optional workspace layout)

```html
<ds-app-shell nav-style="dashboard" gradient>
  <ds-panel-nav slot="panel" …></ds-panel-nav>
  <ds-bar-nav slot="bar" …></ds-bar-nav>
  <ds-panel-tools slot="tools" …></ds-panel-tools>
  <main>…page content…</main>
</ds-app-shell>
```

| Prop | Default | Behavior |
| --- | --- | --- |
| `navStyle` | `dashboard` | Shell propagates to slotted `ds-panel-nav` and `ds-bar-nav` |
| `gradient` | `false` | Radial wash on the shared chrome layer + JS sync of `--ds-shell-gradient-*` vars to shell, panel, and bar |
| `gradientPreset` | `neutral` | Built-in wash when `gradient` is true: `none` (solid secondary), `cool`, `neutral`, or `warm` |
| `gradientSrc` | `''` | Optional `url(...)` image override for the wash |

The chrome layer mounts when **`gradient`** is true. Panel, bar, and tools drawer surfaces are **transparent** under gradient so the chrome shows through. Page content (`default` slot) stays on an opaque `--color-background-primary` surface.

Built-in radial wash: `100% 100% at 0% 0%` — transparent → intent stop (`cool` / `neutral` / `warm`), layer opacity **10%**. Preset **`none`** skips the wash and leaves the secondary chrome surface only. Bar wash position is offset by panel width so the L-shape stays continuous when the panel collapses.

### Why the wash is synced in JavaScript

Nav chrome is not a single static bitmap behind the app. Transparent components (`ds-panel-nav`, `ds-bar-nav`, tools drawer under shell chrome) each composite the **same** `background-image` with per-surface `background-position` / `background-size` so scroll fades, badge rings, and bar offsets align during panel resize. `ds-app-shell` coalesces layout reads to one pass per frame and pauses `ResizeObserver`-driven sync during **panel-nav** width transitions.

**Viewport sizing:** the shared chrome layer uses `background-attachment: fixed`, so `--ds-shell-gradient-size` is derived from **`window.visualViewport` / `innerWidth` × `innerHeight`**, not `ds-app-shell.getBoundingClientRect()`. Host apps must still fill the viewport (`html, body, app-root, shell host { height: 100% }`) so the chrome clip rect covers nav surfaces; the wash bitmap itself is always viewport-sized. `ds-app-shell` also listens to `window` `resize` and `visualViewport` `resize`/`scroll` so mobile browser chrome changes re-sync the wash.

`ds-panel-tools` emits `dsChromeTransitionStart` with `phase: 'opening' | 'closing'`. On **opening**, `ds-bar-nav` lets tab overflow follow layout as the drawer animates (no synchronous collapse). On **closing**, it pauses overflow measurement until the drawer `max-width` transition ends so tabs do not flicker.

---

## Host integration contract (SPA)

Stencil runs `componentWillLoad` before framework property bindings land. Follow these rules in Angular / React hosts:

| Do | Don't |
| --- | --- |
| Bind `groups`, `currentUrl`, `tabs`, `basePath`, `open`, `items` via template/JSX properties | Imperatively re-flush the same props on every custom-element event when bindings already handle state |
| Call `syncFromUrl` (or equivalent) **once** per navigation — e.g. `NavigationEnd`, or eager `NavigationStart` only when crossing dashboard ↔ settings | Double-sync on both `NavigationStart` and `NavigationEnd` for every route |
| Stamp `data-nav-style` / `nav-style` before `ds-panel-nav` connects on hard reload | Rely on bindings alone for first-paint `navStyle` |
| Verify shell chrome perf on a **production build** (`ng build` + static serve), not only `ng serve` | Assume dev-server HMR reflects custom-element upgrade timing |

**motive-webapp-lab** reference: property bindings on `ds-bar-nav` / `ds-panel-tools`, `PanelNavHostDirective`, document `data-nav-style` hint, tools state persisted to `localStorage` only (no redundant flush on `dsToolChange`).

---

## `ds-panel-nav` first paint

| Concern | Requirement |
| --- | --- |
| Hard reload style | Set `data-nav-style` on `<html>` before importing nav components, **or** stamp `nav-style` before the element connects |

## Bootstrap snippet

```html
<script>
  (function () {
    var path = location.pathname.split('?')[0] || '';
    var style = path.indexOf('/settings') === 0 ? 'settings' : 'dashboard';
    document.documentElement.setAttribute('data-nav-style', style);
  })();
</script>
```

## Angular

```html
<ds-panel-nav
  [attr.nav-style]="navStyle"
  [navStyle]="navStyle"
  [groups]="groups"
  [currentUrl]="currentPath"
  …
></ds-panel-nav>

<ds-bar-nav
  [navStyle]="navStyle"
  [basePath]="barNavBasePath"
  [currentUrl]="currentPath"
  [tabs]="barNavTabs"
  …
></ds-bar-nav>

<ds-panel-tools
  [open]="toolsOpen"
  [activeTool]="activeTool"
  [items]="panelToolsItems"
  (dsToolChange)="onToolChange($event)"
></ds-panel-tools>
```

## `ds-panel-tools` drawer paint skip

When the drawer is **fully closed** (`open=false`, not animating), slot content inside `.panel-tools__body` uses `content-visibility: auto` to skip paint. The flag is **cleared** during `motion-opening` and `motion-closing` so open/close slides stay WYSIWYG — content remains mounted and paints with the clip frame.

The drawer surface also sets `aria-hidden="true"` and the **`inert`** attribute while closed so slotted focusables cannot receive keyboard focus behind the rail.

## External `ds-menu`

Host apps render **external** `ds-menu` instances (not bundled inside `ds-panel-nav`) for user settings, appearance, theme pickers, etc.

### Panel-nav user menu (canonical)

1. Listen for `dsNavUserAction` on `ds-panel-nav`. Detail includes:
   - `anchor` — footer user button (`id="ds-panel-nav-user-menu-anchor"`)
   - `menuPlacement` — recommended `ds-menu` props (same as `PANEL_NAV_USER_MENU_PLACEMENT`)
2. Bind the external menu:

```ts
import {
  PANEL_NAV_USER_MENU_PLACEMENT,
  type MenuSection,
  type ShellGradientPreset,
} from '@ds-mo/ui';
// or: import { PANEL_NAV_USER_MENU_PLACEMENT } from '@ds-mo/ui/nav';
```

```html
<ds-menu
  [open]="userMenuOpen"
  [anchor]="userMenuAnchor"
  [sections]="userMenuSections"
  [side]="userMenuPlacement.side"
  [align]="userMenuPlacement.align"
  [sideOffset]="userMenuPlacement.sideOffset"
  [alignOffset]="userMenuPlacement.alignOffset"
  (dsClose)="onUserMenuClose()"
  (dsSelect)="onUserMenuSelect($event)"
  (dsGradientSelect)="onUserMenuGradientSelect($event)"
></ds-menu>
```

On `dsNavUserAction`, set `userMenuAnchor = detail.anchor` and `userMenuPlacement = detail.menuPlacement` (or spread `PANEL_NAV_USER_MENU_PLACEMENT` directly).

**Sections pattern** (see Storybook **Menu → Appearance and theme**):

- `Appearance` — System / Dark / Light rows (`dsSelect` closes menu)
- `Theme` — `{ header: 'Theme', variant: 'gradient-picker', value }` (`dsGradientSelect`; menu stays open)

**Do not** pass `minWidth` unless a product needs a fixed width — `.menu-popup` uses `min-width: var(--dimension-menu-width-xs)` (200px). The gradient-picker row fits at that token width.

**Do not** copy BarNav overflow menu offsets (`side="bottom"`, `align="end"`, `space100+space050`) for the panel-nav user menu — different anchor and axis.

`ds-menu` still accepts `side`, `align`, `sideOffset`, `alignOffset`, `menuWidth`, and `minWidth` as escape hatches when a host needs custom placement.

**Offset strings must be valid CSS lengths** when binding from host apps — use `var(--dimension-space-050)` or `calc(...)`, not bare custom-property names like `--dimension-space-050`. `PANEL_NAV_USER_MENU_PLACEMENT` and `ds-menu` defaults use `TOKEN_CSS_LENGTHS` (`var(--dimension-*)`) for this reason. BarNav overflow menus follow the same pattern.

### Other external menus

Bind `[open]`, `[sections]` or `[items]`, `[anchor]` / `anchor-id`, and placement props. Position math lives in `menu-position.ts` with viewport clamping.

## Reference consumer

**motive-webapp-lab** — shell + `PanelNavHostDirective` + document hint + Phase 0 perf harness (`npm run perf:phase0`). User menu: spread `PANEL_NAV_USER_MENU_PLACEMENT` from `@ds-mo/ui`.
