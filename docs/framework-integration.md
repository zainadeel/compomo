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
<ds-app-shell nav-style="dashboard" gradient>
  <ds-panel-nav slot="panel" disable-view-transition …></ds-panel-nav>
  <ds-bar-nav slot="bar" …></ds-bar-nav>
  <main>…page content…</main>
</ds-app-shell>
```

| Feature | Behavior |
| --- | --- |
| `navStyle` | Shell propagates to slotted `ds-panel-nav` and `ds-bar-nav` |
| `gradient` | Static L-shaped radial wash on nav backgrounds only |
| `gradientSrc` | Optional `url(...)` image override |

Built-in radial: `100% 100% at 0% 0%` — transparent → `--color-color-intent-blue-strong-background`, layer opacity **10%**.

---

## `ds-panel-nav` first paint

SPA frameworks bind **JavaScript properties** after the custom element connects. Stencil runs `componentWillLoad` before those bindings land.

| Concern | Requirement |
| --- | --- |
| Hard reload style | Set `data-nav-style` on `<html>` before importing nav components, **or** stamp `nav-style` before the element connects |
| Router-owned VT | Set `disable-view-transition` as a static attribute when the host app uses `withViewTransitions` |

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
  disable-view-transition
  [attr.nav-style]="navStyle"
  [navStyle]="navStyle"
  …
></ds-panel-nav>
```

## Radial reveal (view transitions)

When crossing between `dashboard` and `settings`, the host runs a **radial reveal** from the panel-nav footer gear. Set `disable-view-transition` on `ds-panel-nav` so transitions do not nest.

```ts
import { ensureShellNavVtStyle, runShellNavStyleRevealOnReady } from '@ds-mo/ui/nav';

ensureShellNavVtStyle();
const transition = document.startViewTransition(() => applyShellStyleChange());
runShellNavStyleRevealOnReady(transition);
```

## External `ds-menu`

Use `dsNavUserAction` detail `{ anchor }` or `anchor-id="ds-panel-nav-user-menu-anchor"`.

## Reference consumer

**motive-webapp-lab** — shell + `PanelNavHostDirective` + document hint + `view-transitions.ts`.
