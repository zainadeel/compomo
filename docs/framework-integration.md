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
  <ds-panel-nav slot="panel" …></ds-panel-nav>
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
  …
></ds-panel-nav>
```

## External `ds-menu`

Use `dsNavUserAction` detail `{ anchor }` or `anchor-id="ds-panel-nav-user-menu-anchor"`.

## Reference consumer

**motive-webapp-lab** — shell + `PanelNavHostDirective` + document hint.
