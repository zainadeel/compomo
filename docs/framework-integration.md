# Framework integration — `ds-panel-nav`

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

---

# `ds-bar-nav` — responsive tab overflow

When tabs exceed the left zone width (action icons stay pinned on the right), `ds-bar-nav` **automatically** collapses all tabs into a single tab-styled trigger that opens `ds-menu`. No host configuration is required beyond the existing `tabs` / `value` (or `basePath` + `currentUrl`) bindings.

| Concern | Behavior |
| --- | --- |
| Overflow detection | Hidden inert `ds-tab-group` probe + `ResizeObserver` on the header left zone |
| Dividers | `{ type: 'divider' }` in `tabs` becomes menu section breaks (not routable) |
| Selection | Same `dsTabChange` event; menu uses `ds-menu` `dsSelect` internally |
| Expand / collapse | Driven by available width — widen the container to restore the tab row |

## Integrating in SPA dev servers (Angular, Vite, etc.)

Custom elements are registered when your app bundle first imports `@ds-mo/ui` (or per-component paths under `dist/components/`). **Hot module replacement does not reliably replace upgraded custom element definitions.**

After bumping `@ds-mo/ui` (especially BarNav overflow changes):

1. **Stop and restart** the dev server (`ng serve`, `vite`, etc.).
2. **Hard-reload** the browser (disable cache once if needed).

**Symptom of a stale CE definition:** `ds-bar-nav` renders tabs but never collapses — inspect the DOM and confirm `.bar-nav__tabs-probe` is present under `.bar-nav__left`. If the probe is missing, you are still running an older `ds-bar-nav` chunk.

## Angular imperative `tabs` binding

Same pattern as PanelNav: assign array props after upgrade (`ngAfterViewInit`, route changes). BarNav polls `syncHostPropsIfNeeded` across animation frames when props land late. Replace the `tabs` array reference when content changes.

```ts
@ViewChild('barNav') barNavRef?: ElementRef<HTMLElement & { tabs: BarNavTab[] }>;

ngAfterViewInit() {
  customElements.whenDefined('ds-bar-nav').then(() => this.flushBarNav());
}

private flushBarNav() {
  const el = this.barNavRef?.nativeElement;
  if (!el) return;
  el.tabs = this.barNavTabs;
  el.actions = this.barNavActions;
}
```

## Accessibility (collapsed mode)

- Trigger: `button` with `aria-haspopup="menu"` and `aria-expanded`
- Menu: `role="menu"` / `menuitem`; selected tab row uses `aria-current="true"` on the active item
- Keyboard: ArrowDown/Up/Enter/Space opens menu from trigger; Escape closes menu and returns focus to trigger
- On expand (width increases), focus moves to the selected tab in the visible `ds-tab-group`

## TokoMo tokens

Notification dots require `@ds-mo/tokens` **≥ 2.9.0** (`--dimension-size-075`). Restart the dev server after upgrading tokens so CSS variables resolve (0×0 dots if the variable is missing).
