# Framework integration

CompoMo (`@ds-mo/ui`) is a **Stencil web component library**. `npm run build` emits:

- **`dist/components/`** — `<ds-*>` custom elements (canonical; auto-define on import)
- **`src/.generated/angular/`** — ignored Angular standalone proxy sources, compiled to published per-component subpaths
- **`src/.generated/react/`** — ignored React wrapper sources, compiled to published JavaScript

**Consumption options:**

| Host | Package subpath | Notes |
| --- | --- | --- |
| Any | `@ds-mo/ui/components/ds-*.js` | Canonical custom elements; tree-shake per tag |
| Angular | `@ds-mo/ui/angular/ds-*` | Standalone adapter per component; preferred for tree shaking |
| React | `@ds-mo/ui/react` | `DsButtonFilled`, `DsBarNav`, … |

Generated proxy source never lands in the authored tree. The publish step
retains the existing `dist/angular`, `dist/react`, and package import paths.
The generated React wrappers use CompoMo's private runtime adapter, backed by
the same `@lit/react` bridge selected by Stencil's React output target.
Consumers install only the documented React peers; Stencil's output-target
package remains a build dependency and is not required at application runtime.

There is no published `@ds-mo/ui/loader` or global component bundle such as `@ds-mo/ui/css`. Import TokoMo via `@ds-mo/tokens` (or `@ds-mo/tokens/css`). Component CSS is scoped inside each custom-element bundle. Deliberate renderer-neutral exports include `@ds-mo/ui/prose.css` for safe semantic document trees and `@ds-mo/ui/control-elevation.css` for elevated wrappers around controls.

Font files remain application-owned. Interface content consumes
`--typography-font-family-ui`; code surfaces consume
`--typography-font-family-code` with a robust system-monospace fallback. Load
Inter and Fira Code once at the application root rather than from a component
or framework adapter. The Stencil source, Angular adapters, and React wrappers
therefore share one CSS contract without duplicate downloads. See
[`docs/font-ownership.md`](font-ownership.md) for the self-hosted setup,
ligature override, CSP, caching, preload, license, and fallback requirements.

## Elevated control wrappers

Import the stylesheet once, then apply the base class plus one `sm`, `md`, or `floating` level to an application-owned wrapper:

```css
@import '@ds-mo/ui/control-elevation.css';
```

```html
<div
  class="contact-action ds-control-elevation ds-control-elevation--md ds-control-elevation--press-scale"
>
  <ds-button-filled label="Contact support" has-border="false"></ds-button-filled>
</div>
```

The utility places the split outer shadow on the wrapper and TokoMo's inset highlight on a non-interactive top overlay. It does not impose layout, radius, background, or blur. The owner keeps those concerns and disables optional resting borders on wrapped controls. Add `.ds-control-elevation--press-scale` only around `ds-button-filled` or `ds-button-unfilled`; it transfers the button's physical press motion to the entire elevated surface and honors reduced motion. A wrapped Input omits that modifier and uses `hasBorder="false"` at rest while its own focus and error strokes remain rendered beneath the topmost elevation highlight.

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

## Managed application shell

Use one managed `ds-shell-app` as the standard authenticated application
architecture. The application supplies:

- `navigation`: router-owned destinations, current URL/context, user identity,
  labels, and persistence options;
- `pageChrome`: route-owned heading, sections, depth, subsections, and actions;
- `tools`: explicit tool ids, labels, order, rail placement, shortcuts, mobile
  grouping, headers, unread state, and persistence.

```html
<ds-shell-app
  [navigation]="navigation"
  [pageChrome]="pageChrome"
  [tools]="tools"
  (dsNavSelect)="navigate($event.detail)"
  (dsTabChange)="navigate($event.detail)"
>
  <app-search slot="search-view" />
  <app-agents slot="agents-view" />
  <app-messages slot="messages-view" />
  <app-stacks slot="stacks-view" />
  <app-activity slot="activity-view" />
  <app-help slot="help-view" />
  <router-outlet />
</ds-shell-app>
```

Managed ShellApp internally assembles PanelNav and BarNav on desktop/tablet,
PanelTools through ShellTools, and MobileSheetNav, MobileBarNav, MobileHeader,
and ShellPage on mobile. It reflects `responsive-mode` at the fixed boundaries:
mobile below 768px, tablet from 768px through 1199px, and desktop at 1200px and
wider.

Navigation selection is intent-only. The application router owns
authorization, URLs, history, and route changes. After navigation completes,
replace `navigation` and `pageChrome` together from the resolved route state.

Mount every tool owner and routed-content owner once. ShellApp changes
presentation, visibility, and inert state without recreating them, preserving
focus, scroll, nested tool state, and element identity across breakpoints.

`PANEL_TOOLS_DEFAULT_ITEMS` reproduces the canonical Lab tool recipe: Search is
pinned first, Help last, existing shortcuts are preserved, and Messages,
Stacks, and Activity share the mobile Inbox destination. Custom item
collections use explicit metadata rather than special layout behavior inferred
from tool ids.

Global shell shortcuts are skipped while the user is typing in an editable
control.

### Advanced slotted composition

Set `composition="slotted"` only when a specialized application intentionally
owns the lower-level wiring. PanelNav, BarNav, PanelTools, ShellTools,
MobileSheetNav, MobileBarNav, MobileHeader, and ShellPage remain public.
PanelTools is the desktop/tablet primitive; ShellTools is the responsive tools
adapter. They are not interchangeable and are not merged.

Built-in radial wash: `100% 100% at 0% 0%` — transparent → intent stop (`cool` / `neutral` / `warm`), layer opacity **10%**. Preset **`none`** skips the wash and leaves the secondary chrome surface only. Bar wash position is offset by panel width so the L-shape stays continuous when the panel collapses.

### Why the wash is synced in JavaScript

Nav chrome is not a single static bitmap behind the app. Transparent components (`ds-panel-nav`, `ds-bar-nav`, tools drawer under shell chrome) each composite the **same** `background-image` with per-surface `background-position` / `background-size` so scroll fades, badge rings, and bar offsets align during panel resize. `ds-shell-app` coalesces layout reads to one pass per frame and pauses `ResizeObserver`-driven sync during **panel-nav** width transitions.

**Chrome-wash measurement:** the shared chrome layer uses
`background-attachment: fixed`, so `--ds-shell-gradient-size` is derived from
**`window.visualViewport` / `innerWidth` × `innerHeight`**, not
`ds-shell-app.getBoundingClientRect()`. This JavaScript measurement sizes and
re-synchronizes only the wash bitmap when browser chrome changes. It does not
own ShellApp layout height; the application root owns the bounded viewport
stage described below, and `ds-shell-app` fills that owner with `height: 100%`.

## Mobile document and root contract

The consuming application owns document metadata and the viewport-sized root.
CompoMo does not mutate `<head>`, turn the document body into an application
scroller, or independently apply viewport units to nested shell sections.

### Document metadata

Enable safe-area resolution with the production viewport declaration:

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, viewport-fit=cover"
/>
```

The application also owns the browser-chrome color. For a system-selected
theme, provide one value for each supported color scheme using actual colors
that match the application's first-painted root surface; CSS custom properties
cannot be resolved inside metadata:

```html
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#17191c" media="(prefers-color-scheme: dark)" />
```

If the application lets a person select a theme independently of the system,
render one unqualified `theme-color` entry for the initial selection and update
it whenever that controlled theme changes:

```html
<meta name="theme-color" content="#ffffff" />
```

```ts
const applicationThemeColors = {
  light: '#ffffff',
  dark: '#17191c',
} as const;

function synchronizeThemeColor(theme: keyof typeof applicationThemeColors) {
  document
    .querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])')
    ?.setAttribute('content', applicationThemeColors[theme]);
}
```

Keep this synchronization in application theme state. A web component must not
select or rewrite document-level metadata.

### Dynamic viewport stage and scroll ownership

Use the framework application root as the single viewport-height owner. The
`100vh` declaration is the fallback; browsers that support dynamic viewport
units use `100dvh` below the mobile breakpoint. Do not use `100svh` for this
fixed authenticated stage because it would leave unused space when browser
chrome retracts.

```css
html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  overscroll-behavior: none;
}

/* Use the selector owned by the host framework: app-root, #root, and so on. */
app-root {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
}

@media (max-width: 767px) {
  app-root {
    height: 100vh;
  }

  @supports (height: 100dvh) {
    app-root {
      height: 100dvh;
    }
  }
}

app-root > ds-shell-app {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
}
```

This prevents `body` from becoming a second scroll owner and contains root
overscroll so pull-to-refresh or viewport bounce cannot reveal a surface behind
the shell. ShellApp remains the bounded application stage. Routed content,
choice lists, sheets, tools, and other intentionally scrollable component
surfaces retain their existing local scrollers and overscroll behavior. Do not
use a blanket descendant selector such as `app-root * { overflow: hidden; }`.

### Safe-area ownership

`viewport-fit=cover` activates the safe-area contract already implemented by
CompoMo:

- ShellApp consumes the shared top inset once for the complete mobile stage.
- MobileBarNav consumes the persistent bottom inset.
- Routed pages, sheets, tools, and consumer headers inside ShellApp must not add
  duplicate top or bottom safe-area padding.
- An application-owned full-screen overlay rendered outside ShellApp is a new
  stage and must define its own safe-area ownership.

The shell's internal top and bottom owners remain singular as the dynamic
viewport changes; nested sections continue to size against ShellApp rather than
the viewport.

`ds-panel-tools` emits `dsChromeTransitionStart` with `phase: 'opening' | 'closing'`. On **opening**, `ds-bar-nav` lets tab overflow follow layout as the drawer animates (no synchronous collapse). On **closing**, it pauses overflow measurement until the drawer `max-width` transition ends so tabs do not flicker.

---

## Host integration contract (SPA)

Stencil may upgrade before framework property bindings land. Bind
`navigation`, `pageChrome`, and `tools` as properties, replace their object
identities when data changes, and synchronize completed route state once per
navigation. Seed `data-nav-style` before bootstrap when a hard reload must paint
the correct Dashboard or Settings context immediately.

Verify shell chrome and responsive identity behavior on a production build as
well as the framework dev server.

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

Import only the standalone adapters used by the Angular component. A managed
application layout normally imports ShellApp plus the application-owned tool
views and router outlet. Import a generated value accessor from the Angular
barrel when connecting a form control to Angular Forms.

```ts
import { DsShellApp } from '@ds-mo/ui/angular/ds-shell-app';
import { DsInput } from '@ds-mo/ui/angular/ds-input';
import { TextValueAccessor } from '@ds-mo/ui/angular';

@Component({
  imports: [DsShellApp, DsInput, TextValueAccessor],
})
```

Do not add `CUSTOM_ELEMENTS_SCHEMA` when using adapters; Angular should validate the component properties and events.

```html
<ds-shell-app
  [navigation]="navigation"
  [pageChrome]="pageChrome"
  [tools]="tools"
  (dsNavSelect)="navigate($event.detail)"
  (dsTabChange)="navigate($event.detail)"
>
  <router-outlet />
</ds-shell-app>
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
import type { MenuSection } from '@ds-mo/ui';
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
