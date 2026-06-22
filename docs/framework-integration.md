# Framework integration

CompoMo (`@ds-mo/ui`) is a **Stencil web component library**. `npm run build` emits:

- **`dist/components/`** — `<ds-*>` custom elements (the library every host consumes)
- **`src/angular/`** — auto-generated Angular proxy directives (`angularOutputTarget`)

There is **no** Stencil React output target. React apps use `<ds-*>` in JSX with `CUSTOM_ELEMENTS_SCHEMA` and set complex props imperatively (`el.tabs = …`), same as motive-webapp-lab.

---

## Nav chrome `navStyle` (panel + bar)

Primary navigation (`ds-panel-nav`) and secondary navigation (`ds-bar-nav`) share a **`navStyle`** property that picks the token family:

| `navStyle` | Tokens |
| --- | --- |
| `navigation` | `--color-navigation-*` (dark nav chrome) |
| `default` | Standard app surface / foreground / interaction tokens |

**HTML attribute:** `nav-style` (avoids collision with the element's native `style` property).

Bind the **same** `navStyle` on both components from your shell so primary and secondary nav stay visually in sync.

## `ds-app-shell` (optional workspace layout)

Use **`ds-app-shell`** for the workspace chrome only (panel + bar + main) — not the entire app:

```html
<ds-app-shell nav-style="navigation" gradient>
  <ds-panel-nav slot="panel" disable-view-transition …></ds-panel-nav>
  <ds-bar-nav slot="bar" …></ds-bar-nav>
  <main>…page content…</main>
</ds-app-shell>
```

| Feature | Behavior |
| --- | --- |
| `navStyle` | Shell propagates to slotted `ds-panel-nav` and `ds-bar-nav` |
| `gradient` | Static L-shaped radial wash on nav backgrounds only (not main content) |
| `gradientSrc` | Optional `url(...)` image override (e.g. SVG) instead of built-in radial |

Built-in radial: `128.57% 141.42% at 0% 0%` — transparent → `--color-color-intent-blue-medium-background` (50%) → `--color-color-intent-blue-strong-background` (100%), layer opacity **10%**. Same wash for all `navStyle` values; tokens follow `data-theme`.

Gradient is painted as `background-image` on panel/bar **above** opaque `--_nav-bg`, below labels/icons. Shell sets `--ds-shell-gradient-*` CSS vars sized to the L bounds.

---

## `ds-panel-nav` first paint

Web components are framework-neutral. SPA frameworks (Angular, React, Vue) bind **JavaScript properties** after the custom element connects. Stencil runs `componentWillLoad` and paints **before** those bindings land.

`ds-panel-nav` keeps an internal `renderedStyle` state for chrome surfaces. On hard reload, property-only bindings can produce a one-frame wrong look unless the host follows the first-paint contract below.

This is a one-time integration pattern per host app — not a reason to avoid web components.

## First-paint contract

Resolution order in `componentWillLoad` (see `resolvePanelNavStyle`):

1. Host element `nav-style` **attribute**
2. `document.documentElement.getAttribute('data-nav-style')`
3. `navStyle` prop default (`navigation` for panel nav, `default` for bar nav)

Also set `disable-view-transition` as a **static attribute** when the host app owns view transitions (e.g. Angular Router `withViewTransitions`). It must be present before `navStyle` is first read.

| Concern | Requirement |
| --- | --- |
| Hard reload style | Set `data-nav-style` on `<html>` before importing nav components, **or** stamp `nav-style` / `disable-view-transition` attributes before the element connects |
| Property bindings alone | Not sufficient for first paint |
| Complex props (`groups`, BarNav `tabs`) | May land one frame late — PanelNav polls via `syncHostPropsIfNeeded` |
| Bar nav sync | Bind `navStyle` / `nav-style` on `ds-bar-nav` from the same shell state as `ds-panel-nav` |

## Bootstrap snippet (any framework)

In `index.html` before your app bundle:

```html
<script>
  (function () {
    var path = location.pathname.split('?')[0] || '';
    var style = path.indexOf('/settings') === 0 ? 'default' : 'navigation';
    document.documentElement.setAttribute('data-nav-style', style);
  })();
</script>
```

Or from application entry (before importing nav components):

```ts
import { setNavStyleHint } from '@ds-mo/ui/nav';

const path = window.location.pathname.split('?')[0] || '';
setNavStyleHint(path.startsWith('/settings') ? 'default' : 'navigation');
```

## Angular

Use static attributes and/or a thin host directive that stamps attrs in the directive `constructor` (before Stencil connects):

```html
<ds-panel-nav
  disable-view-transition
  [attr.nav-style]="navStyle"
  [navStyle]="navStyle"
  …
></ds-panel-nav>

<ds-bar-nav
  [attr.nav-style]="navStyle"
  [navStyle]="navStyle"
  …
></ds-bar-nav>
```

```ts
@Directive({ selector: 'ds-panel-nav[appPanelNavHost]', standalone: true })
export class PanelNavHostDirective {
  constructor() {
    const host = inject(ElementRef<HTMLElement>).nativeElement;
    const style = resolveNavStyleFromUrl(window.location.pathname);
    host.setAttribute('disable-view-transition', '');
    host.setAttribute('nav-style', style);
    host.setAttribute('router-mode', 'event');
  }
}
```

## React

`useEffect` runs too late for first paint. Use the `index.html` document hint and/or a wrapper that sets attributes on the DOM ref in `useLayoutEffect` on mount only. Prefer the document hint for hard reload.

## Radial style reveal (view transitions)

When crossing between `navigation` and `default` sections, apps can run a **radial reveal** from the panel-nav footer gear. The host owns `document.startViewTransition` — set `disable-view-transition` on `ds-panel-nav` so transitions do not nest.

`ds-bar-nav` registers `view-transition-name: ds-shell-bar-nav`. Use `@ds-mo/ui/nav` helpers so the reveal clips **both** the page and the bar nav:

```ts
import {
  ensureShellNavVtStyle,
  runShellNavStyleRevealOnReady,
} from '@ds-mo/ui/nav';

ensureShellNavVtStyle();
const transition = document.startViewTransition(() => {
  applyShellStyleChange();
});
runShellNavStyleRevealOnReady(transition);
```

## Reference consumer

**motive-webapp-lab** (Angular 22) — shell + `PanelNavHostDirective` + document hint + `view-transitions.ts`.
