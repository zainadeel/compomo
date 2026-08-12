# Font ownership and loading

Issue: [#403](https://github.com/zainadeel/compomo/issues/403)

Status: **split ownership with explicit consumer loading selected**

## Decision

The typography contract is split across the design-system trilogy and its
consumers:

| Layer | Owns | Does not own |
| --- | --- | --- |
| TokoMo | Semantic font-family tokens and their fallback stacks | Font files, `@font-face`, preloads, or network requests |
| CompoMo | Interface-versus-code intent in component and prose recipes | Font files or automatic font loading |
| Application | Font source, subsets, `@font-face`, preload policy, caching, CSP, and license distribution | Component-local font overrides |

The canonical interface family is `--typography-font-family-ui`. Code-oriented
surfaces consume `--typography-font-family-code`. CompoMo currently supplies
the following usable fallback while the code-family token is absent:

```css
'Fira Code', ui-monospace, 'SFMono-Regular', 'Cascadia Code', 'Roboto Mono',
Menlo, Monaco, Consolas, 'Liberation Mono', monospace
```

This fallback names Fira Code so an application that loads it once gets the
intended face immediately. It still resolves to an installed system monospace
face when the asset is unavailable, blocked, or still loading. Size, line
height, wrapping, scrolling, selection, and copy behavior remain owned by the
existing CompoMo recipes.

Fira Code programming ligatures are enabled with the CSS default. A consumer
with a product or accessibility reason to disable them can set:

```css
:root {
  --ds-code-font-variant-ligatures: none;
}
```

The current code recipes use regular weight only, so consumers need Fira Code
400. Inter continues to require 400, 500, 600, and 700 for the interface text
recipes. Adding syntax emphasis or editable-code behavior must establish a
concrete need before another Fira Code weight is shipped.

## Application loading contract

Load each family once at the application root, before product CSS. The same
setup applies to native custom elements, generated Angular adapters, and
generated React wrappers because all three render the canonical Stencil CSS.

```css
@font-face {
  font-family: 'Fira Code';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/fira-code-latin-400-normal.woff2') format('woff2');
}

:root {
  --typography-font-family-code:
    'Fira Code', ui-monospace, 'SFMono-Regular', 'Cascadia Code', 'Roboto Mono',
    Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
}
```

- Self-host WOFF2 assets and allow their origin in `font-src`; `'self'` is
  sufficient for the recommended same-origin setup. Components never request
  GitHub, Google Fonts, or another CDN.
- Use content-hashed filenames with long-lived immutable caching. Declare the
  face once so different code components reuse the browser font cache instead
  of initiating duplicate downloads.
- Start with the Latin 400 subset. Add Unicode subsets only when product
  content requires them and use `unicode-range` so they load on demand.
- Preload only the critical, first-view subset. A preload must use the same URL,
  `type="font/woff2"`, and `crossorigin` mode as the `@font-face` request or the
  browser can download it twice. Do not preload a font used only after opening
  an Agents panel.
- Keep `font-display: swap` so offline, slow, or blocked font loads retain the
  stable fallback. Do not wait on `document.fonts.ready` before rendering.
- Distribute Fira Code's copyright notice and complete SIL Open Font License
  1.1 with every asset copy. CompoMo's Storybook source retains the notice at
  [`docs/licenses/FiraCode-OFL-1.1.txt`](licenses/FiraCode-OFL-1.1.txt).

## Storybook contract and measured impact

Storybook acts as a consumer instead of receiving a private component
exception. Its preview imports the self-hosted `@fontsource/fira-code` Latin
400 stylesheet once, then the normal semantic token/fallback selects the font.
This makes the setup visible in application-root code and keeps component
bundles honest when the consumer import is removed.

The selected Fira Code Latin 400 WOFF2 asset is **23,312 bytes**. The Storybook
production build emits that one font asset and no WOFF duplicate. It is a
development-only dependency and `@ds-mo/ui` publishes only `dist/`, so the npm
package and application initial network payload gain **0 font bytes**. An
application that adopts the same Latin subset incurs one 23,312-byte font
response when code content first needs it, or at initial load only if it
chooses to preload it.

The current Lab already self-hosts Inter as a 48,432-byte Latin variable font
and an 85,272-byte lazy Latin-ext subset. Its Fira Code follow-up should reuse
that application-owned pattern rather than copying Storybook configuration or
adding a feature selector.

## Required follow-ups

This CompoMo change establishes the reusable hook but does not mutate the
separately versioned repositories:

1. **TokoMo:** publish `--typography-font-family-ui` for Inter and
   `--typography-font-family-code` through its CSS, JSON, TypeScript, and agent
   contracts without a compatibility alias; remove the automatic Google Fonts
   `@import` from `globals.css` so tokens do not create an undocumented remote
   request.
2. **Lab:** add one self-hosted Fira Code Latin 400 asset and OFL copy, declare
   it at the application root, optionally preload only if Agents code is in the
   first view, and verify the Agents coding box at desktop and mobile widths.
   The existing Inter self-hosting remains application-owned.

Until those follow-ups land, CompoMo remains usable through its system
monospace fallback; completing them is required for the Lab to visibly render
Fira Code and for TokoMo's published manifest to describe the token.

## Rejected alternatives

### Package fonts in CompoMo

Rejected because native, Angular, and React consumers would either duplicate
the same asset or pay for an automatic side effect unrelated to most
components. It would also make application CSP, preload, caching, offline, and
subset policy impossible to own at the deployment boundary.

### Load fonts from TokoMo globals

Rejected because importing design tokens must not create a third-party runtime
request. The existing Google Fonts Inter import is an audited migration item,
not a precedent for Fira Code.

### Hardcode Fira Code in the Agents feature

Rejected because fenced code, inline prose code, and tool-call details share
the same intent across products and frameworks. A Lab-only selector would
drift from Storybook and bypass the semantic token contract.
