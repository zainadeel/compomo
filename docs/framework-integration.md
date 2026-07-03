# Framework integration

CompoMo (`@ds-mo/ui`) is a **Stencil web component library**. `npm run build` emits:

- **`dist/components/`** — `<ds-*>` custom elements (the library every host consumes)
- **`src/angular/`** — auto-generated Angular proxy directives (`angularOutputTarget`)

There is **no** Stencil React output target. React apps use `<ds-*>` in JSX with `CUSTOM_ELEMENTS_SCHEMA` and set complex props imperatively (`el.tabs = …`), same as motive-webapp-lab.

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

## `ds-app-shell` (optional workspace layout)

```html
<ds-app-shell nav-style="dashboard" gradient grid="false">
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
| `grid` | `false` | Diagonal grid overlay on the chrome layer (CSS only; independent of `gradient`) |
| `gradientSrc` | `''` | Optional `url(...)` image override for the wash |

The chrome layer mounts when **`gradient` or `grid`** is true. Panel, bar, and tools drawer surfaces are **transparent** under either prop so the chrome shows through. Page content (`default` slot) stays on an opaque `--color-background-primary` surface.

Built-in radial wash: `100% 100% at 0% 0%` — transparent → `--color-color-intent-blue-strong-background`, layer opacity **10%**. Bar wash position is offset by panel width so the L-shape stays continuous when the panel collapses.

### Why the wash is synced in JavaScript

Nav chrome is not a single static bitmap behind the app. Transparent components (`ds-panel-nav`, `ds-bar-nav`, tools drawer under shell chrome) each composite the **same** `background-image` with per-surface `background-position` / `background-size` so scroll fades, badge rings, and bar offsets align during panel resize. `ds-app-shell` coalesces layout reads to one pass per frame and pauses `ResizeObserver`-driven sync during **panel-nav** width transitions.

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

## External `ds-menu`

Use `dsNavUserAction` detail `{ anchor }` or `anchor-id="ds-panel-nav-user-menu-anchor"`.

## Reference consumer

**motive-webapp-lab** — shell + `PanelNavHostDirective` + document hint + Phase 0 perf harness (`npm run perf:phase0`).
