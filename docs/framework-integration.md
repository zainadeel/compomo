# Framework integration

CompoMo (`@ds-mo/ui`) is a **Stencil web component library**. `npm run build` emits:

- **`dist/components/`** — `<ds-*>` custom elements (the library every host consumes)
- **`src/angular/`** — auto-generated Angular proxy directives (`angularOutputTarget`)

There is **no** Stencil React output target. React apps use `<ds-*>` in JSX with `CUSTOM_ELEMENTS_SCHEMA` and set complex props imperatively (`el.tabs = …`), same as motive-webapp-lab.

---

## `ds-panel-nav` first paint

Web components are framework-neutral. SPA frameworks (Angular, React, Vue) bind **JavaScript properties** after the custom element connects. Stencil runs `componentWillLoad` and paints **before** those bindings land.

`ds-panel-nav` keeps an internal `renderedVariant` state for theme surfaces (`dashboard` = dark nav, `settings` = light nav). On hard reload, property-only bindings can produce a one-frame wrong theme unless the host follows the first-paint contract below.

This is a one-time integration pattern per host app — not a reason to avoid web components.

## First-paint contract

Resolution order in `componentWillLoad` (see `resolvePanelNavVariant`):

1. Host element `variant` **attribute**
2. `document.documentElement.getAttribute('data-panel-nav-variant')`
3. `variant` prop default (`dashboard`)

Also set `disable-view-transition` as a **static attribute** when the host app owns view transitions (e.g. Angular Router `withViewTransitions`). It must be present before `variant` is first read.

| Concern | Requirement |
| --- | --- |
| Hard reload variant | Set `data-panel-nav-variant` on `<html>` before importing `ds-panel-nav.js`, **or** stamp `variant` / `disable-view-transition` attributes before the element connects |
| Property bindings alone | Not sufficient for first paint |
| Complex props (`groups`, BarNav `tabs`) | May land one frame late — PanelNav polls via `syncHostPropsIfNeeded` |

## Bootstrap snippet (any framework)

In `index.html` before your app bundle:

```html
<script>
  (function () {
    var path = location.pathname.split('?')[0] || '';
    var variant = path.indexOf('/settings') === 0 ? 'settings' : 'dashboard';
    document.documentElement.setAttribute('data-panel-nav-variant', variant);
  })();
</script>
```

Or from application entry (before `import '@ds-mo/ui/dist/components/ds-panel-nav.js'`):

```ts
import { setPanelNavVariantHint } from '@ds-mo/ui'; // source / future dist export

const path = window.location.pathname.split('?')[0] || '';
setPanelNavVariantHint(path.startsWith('/settings') ? 'settings' : 'dashboard');
```

## Angular

Use static attributes and/or a thin host directive that stamps attrs in the directive `constructor` (before Stencil connects):

```html
<ds-panel-nav
  disable-view-transition
  [attr.variant]="variant"
  [variant]="variant"
  …
></ds-panel-nav>
```

```ts
@Directive({ selector: 'ds-panel-nav', standalone: true })
export class PanelNavHostDirective {
  constructor() {
    const host = inject(ElementRef<HTMLElement>).nativeElement;
    host.setAttribute('disable-view-transition', '');
    host.setAttribute('variant', resolveVariantFromUrl());
  }
}
```

## React

`useEffect` runs too late for first paint. Use the `index.html` document hint and/or a wrapper that sets attributes on the DOM ref in `useLayoutEffect` on mount only. Prefer the document hint for hard reload.

## Reference consumer

`motive-webapp-lab` (Angular 19) — shell + `PanelNavHostDirective` + document hint.
