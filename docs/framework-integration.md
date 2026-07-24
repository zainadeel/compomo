# Framework integration

CompoMo (`@ds-mo/ui`) is a **Stencil web component library**. `npm run build` emits:

- **`dist/components/`** — `<ds-*>` custom elements (canonical; auto-define on import)
- **`src/angular/`** — auto-generated Angular standalone adapters, published as compiled per-component subpaths
- **`src/react/`** — auto-generated React wrappers, published as compiled JavaScript

**Consumption options:**

| Host | Package subpath | Notes |
| --- | --- | --- |
| Any | `@ds-mo/ui/components/ds-*.js` | Canonical custom elements; tree-shake per tag |
| Angular | `@ds-mo/ui/angular/ds-*` | Standalone adapter per component; preferred for tree shaking |
| React | `@ds-mo/ui/react` | `DsButtonFilled`, `DsBarNav`, … |

There is no published `@ds-mo/ui/loader` or global component bundle such as `@ds-mo/ui/css`. Import TokoMo via `@ds-mo/tokens` (or `@ds-mo/tokens/css`). Component CSS is scoped inside each custom-element bundle. Deliberate renderer-neutral exports include `@ds-mo/ui/prose.css` for safe semantic document trees and `@ds-mo/ui/control-elevation.css` for elevated wrappers around controls.

## Elevated control wrappers

Import the stylesheet once, then apply the base class plus one `sm`, `md`, or `floating` level to an application-owned wrapper:

```css
@import '@ds-mo/ui/control-elevation.css';
```

```html
<div class="contact-action ds-control-elevation ds-control-elevation--md">
  <ds-button-filled label="Contact support" has-border="false"></ds-button-filled>
</div>
```

The utility places the split outer shadow on the wrapper and TokoMo's inset highlight on a non-interactive top overlay. It does not impose layout, radius, background, blur, or animation. The owner keeps those concerns and disables optional resting borders on wrapped controls. A wrapped Input uses `hasBorder="false"` at rest while its own focus and error strokes remain rendered beneath the topmost elevation highlight.

## Renderer-neutral prose

Import the stylesheet once after TokoMo tokens, then apply `.ds-prose` to an application-owned semantic container. This is a CSS surface rather than a web component, so it needs no React wrapper, Angular adapter, or custom-elements schema entry.

**Plain HTML**

```html
<link rel="stylesheet" href="/node_modules/@ds-mo/ui/dist/styles/prose.css" />
<article class="ds-prose">…safe semantic DOM…</article>
```

**React**

```tsx
import '@ds-mo/ui/prose.css';

export function SafeRenderedContent() {
  return <article className="ds-prose">{/* renderer-produced nodes */}</article>;
}
```

**Angular**

```css
@import '@ds-mo/ui/prose.css';
```

```html
<article class="ds-prose"><!-- renderer-produced nodes --></article>
```

Parsing and sanitization remain renderer/application responsibilities. Mark embedded product UI with `data-ds-prose="off"`, and place wide tables inside `.ds-prose__table-scroll`. Renderers must make genuinely scrollable table wrappers and native `pre` blocks keyboard-focusable; add contextual labelling when surrounding content does not identify the region. See [`docs/prose-foundation.md`](prose-foundation.md) for the distribution evidence and full boundary.

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

### `ds-shell-tools` — one persistent named slot per tool

Each fixed tool (`search`, `agents`, `messages`, `stacks`, `activity`, `help`) has a persistent **`*-view` named slot**. Mount every available product owner once at ShellApp scope. `ds-shell-tools` adapts those owners to PanelTools-compatible desktop/tablet chrome and full-stage mobile chrome without recreating application children. Search is required and pinned to the desktop rail header; **Help & Support** is required and pinned to its footer. Mobile groups Messages, Stacks, and Activity under Inbox.

```html
<ds-shell-tools slot="tools" open active-tool="agents" .items=${railItems}>
  <app-search-panel slot="search-view" />
  <app-agents-panel slot="agents-view" />
  <app-messages-panel slot="messages-view" />
  <app-stacks-panel slot="stacks-view" />
  <app-activity-panel slot="activity-view" />
  <app-help-panel slot="help-view" />
</ds-shell-tools>
```

`ds-panel-tools` remains backward compatible for applications that only need the existing desktop/tablet rail and drawer. New responsive shells should use `ds-shell-tools`.

Global shell shortcuts toggle Search (`K`), Agents (`A`), Stacks (`S`), Messages (`M`), Activity (`N`), and Help (`/`); `]` closes the drawer. They are skipped while the user is typing in an editable control.

## `ds-shell-app` (required workspace layout)

```html
<ds-shell-app nav-style="dashboard" gradient>
  <ds-panel-nav slot="panel" …></ds-panel-nav>
  <ds-shell-mobile-nav slot="mobile-navigation" …></ds-shell-mobile-nav>
  <ds-bar-nav slot="bar" …></ds-bar-nav>
  <ds-shell-mobile-section-nav slot="mobile-section-nav" …></ds-shell-mobile-section-nav>
  <ds-shell-tools slot="tools" …></ds-shell-tools>
  <main>…page content…</main>
  <ds-shell-mobile-bar slot="mobile-bar" …></ds-shell-mobile-bar>
</ds-shell-app>
```

| Prop | Default | Behavior |
| --- | --- | --- |
| `navStyle` | `dashboard` | Shell propagates to slotted `ds-panel-nav` and `ds-bar-nav` |
| `gradientPreset` | `neutral` | Desktop/tablet chrome wash: `none`, `cool`, `neutral`, `warm`, or `fresh`; mobile always uses a solid primary stage |
| `mobileDestination` | `area` | Controlled mobile Area, Search, Agents, or Inbox stage |
| `mobileNavigationOpen` | `false` | Controlled mobile navigation-pane state |

ShellApp reflects `responsive-mode` and emits `dsResponsiveModeChange` at the fixed boundaries: mobile below 768px, tablet from 768px through 1199px, and desktop at 1200px and wider. In mobile mode, the routed workspace stays mounted but becomes hidden and inert whenever Menu or a global tool occupies the stage. The bottom bar stays visible and owns its safe-area padding.

Built-in radial wash: `100% 100% at 0% 0%` — transparent → intent stop (`cool` / `neutral` / `warm`), layer opacity **10%**. Preset **`none`** skips the wash and leaves the secondary chrome surface only. Bar wash position is offset by panel width so the L-shape stays continuous when the panel collapses.

### Why the wash is synced in JavaScript

Nav chrome is not a single static bitmap behind the app. Transparent components (`ds-panel-nav`, `ds-bar-nav`, tools drawer under shell chrome) each composite the **same** `background-image` with per-surface `background-position` / `background-size` so scroll fades, badge rings, and bar offsets align during panel resize. `ds-shell-app` coalesces layout reads to one pass per frame and pauses `ResizeObserver`-driven sync during **panel-nav** width transitions.

**Viewport sizing:** the shared chrome layer uses `background-attachment: fixed`, so `--ds-shell-gradient-size` is derived from **`window.visualViewport` / `innerWidth` × `innerHeight`**, not `ds-shell-app.getBoundingClientRect()`. Host apps must still fill the viewport (`html, body, app-root, shell host { height: 100% }`) so the chrome clip rect covers nav surfaces; the wash bitmap itself is always viewport-sized. `ds-shell-app` also listens to `window` `resize` and `visualViewport` `resize`/`scroll` so mobile browser chrome changes re-sync the wash.

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

**motive-webapp-lab** reference: property bindings on `ds-bar-nav` / `ds-panel-tools`, `PanelNavHostDirective`, and document `data-nav-style` hint. Prefer PanelTools `storageKey` for last-tool continuity; the host may separately own open state when product requirements call for it, without redundantly flushing bindings on `dsToolChange`.

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

Import only the standalone adapters used by the Angular component. Import a generated value accessor from the Angular barrel when connecting a form control to Angular Forms.

```ts
import { DsPanelNav } from '@ds-mo/ui/angular/ds-panel-nav';
import { DsInput } from '@ds-mo/ui/angular/ds-input';
import { TextValueAccessor } from '@ds-mo/ui/angular';

@Component({
  imports: [DsPanelNav, DsInput, TextValueAccessor],
})
```

Do not add `CUSTOM_ELEMENTS_SCHEMA` when using adapters; Angular should validate the component properties and events.

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
  storageKey="product.panel-tools.last-tool"
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
  shellGradientPickerSections,
} from '@ds-mo/ui/shell';
import type { MenuSection, ShellGradientPreset } from '@ds-mo/ui';
```

```html
<ds-menu
  [open]="userMenuOpen"
  [anchor]="userMenuAnchor"
  [sections]="userMenuSections"
  [side]="userMenuPlacement.side"
  [align]="userMenuPlacement.align"
  [anchorAlignment]="userMenuPlacement.anchorAlignment"
  [sideOffset]="userMenuPlacement.sideOffset"
  [alignOffset]="userMenuPlacement.alignOffset"
  (dsClose)="onUserMenuClose()"
  (dsAfterClose)="onUserMenuAfterClose()"
  (dsSelect)="onUserMenuSelect($event)"
  (dsSwatchSelect)="onUserMenuSwatchSelect($event)"
></ds-menu>
```

On `dsNavUserAction`, set `userMenuAnchor = detail.anchor` and `userMenuPlacement = detail.menuPlacement` (or spread `PANEL_NAV_USER_MENU_PLACEMENT` directly).

**Sections pattern** (see Storybook **Menu → Appearance and theme**):

- `Appearance` — System / Dark / Light rows (`dsSelect` closes menu)
- `Theme` — `{ header: 'Theme', variant: 'swatch-picker', value, sections: shellGradientPickerSections() }` (`dsSwatchSelect`; menu stays open)

**Do not** pass `minWidth` unless a product needs a fixed width — `.menu-popup` uses `min-width: var(--dimension-menu-width-xs)` (200px). The swatch-picker row fits at that token width.

**Do not** copy BarNav overflow menu offsets (`side="bottom"`, `align="end"`, `space100+space050`) for the panel-nav user menu — different anchor and axis.

`ds-menu` aligns its first or last choice-row edge to the trigger by default, matching Select. Keep `anchorAlignment="choice-cell"` for ordinary menus; `popup-frame` is the escape hatch for deliberate outer-frame geometry. `side`, `align`, `sideOffset`, `alignOffset`, `menuWidth`, and `minWidth` remain available for custom placement.

`side` is a preferred placement. The shared Menu/Select positioning model keeps it when the popup fits; if it does not fit and the opposite side has more room, the popup flips bottom↔top or right↔left before its final position is clamped to the viewport. Keep product code declarative—do not measure the viewport or swap sides in the host application.

Menu state is controlled. `dsSelect` reports the chosen item but does not mutate `isSelected` / `switchValue` or close the menu. Replace the `items` or `sections` array with the next state, set `open=false` when that action should dismiss, retain the anchor and trigger-active state through the exit animation, and clear that retained context from `dsAfterClose`.

**Offset strings must be valid CSS lengths** when binding from host apps — use `var(--dimension-space-050)` or `calc(...)`, not bare custom-property names like `--dimension-space-050`. `PANEL_NAV_USER_MENU_PLACEMENT` and `ds-menu` defaults use `TOKEN_CSS_LENGTHS` (`var(--dimension-*)`) for this reason. BarNav overflow menus follow the same pattern.

### Other external menus

Bind `[open]`, `[sections]` or `[items]`, `[anchor]` / `anchor-id`, and placement props. Position math lives in the shared anchored-popup utility with main-axis collision flipping and viewport clamping.

## Reference consumer

**motive-webapp-lab** — shell + `PanelNavHostDirective` + document hint + Phase 0 perf harness (`npm run perf:phase0`). User menu: spread `PANEL_NAV_USER_MENU_PLACEMENT` from `@ds-mo/ui/shell`.
