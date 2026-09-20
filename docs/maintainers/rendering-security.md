# Rendering security

Render strings as text or parsed Stencil nodes. Do not add a general HTML
insertion API or a permissive Trusted Types policy to make a renderer work.
Review both authored source and the browser exports of parser dependencies.

## Static icon boundary

`Icon/icon-svg.ts` owns SVG validation for built-in and app-registered glyphs.
It parses XML into bounded data with `sax`, validates the complete tree, then
uses namespaced DOM constructors. No unvalidated element is attached to the
document. Unsupported markup leaves the normal fixed-size icon box empty.

Custom glyphs must be static and self-contained. Supported geometry can use
local gradients, clipping, masks and references. Each instance rewrites IDs and
references together; references cannot target IDs elsewhere in the page.
The validator rejects cycles and bounds both source complexity and reference
expansion. The source owns the exact element, attribute and size limits.

Inline paint styles are a narrow compatibility exception: IcoMo flags use
ordered standard-color and display-p3 fallbacks. Preserve that order. Embedded
stylesheets, CSS variables, arbitrary styles, scripts, animation, foreign
content and external resources are unsupported. Registration populates the
string cache; it does not bypass validation at the rendering boundary.

When extending the supported subset, review every new resource-bearing or
interactive feature. Run the installed IcoMo catalog test and hostile-input
tests, including browser checks without CSP. Applications still own their
surrounding document styles and the source of any registered glyphs.

## Markdown and URLs

Markdown parses CommonMark/GFM into nodes and emits a selected semantic subset.
Raw HTML is ignored, code remains text, and images become links rather than
network-loaded images. `resolveSafeUrl` checks the parsed protocol before a
link is rendered. A component explicitly opts into any protocols beyond web
URLs; application URL encoding and authorization remain application concerns.

The Stencil build selects the pure-data export of the transitive
`decode-named-character-reference` dependency. Its browser export uses an HTML
sink even though the Markdown renderer itself never inserts HTML. Keep the
strict browser regression test when changing this resolution or updating the
parser dependency tree.

## CSP and Trusted Types verification

[Trusted Types](https://www.w3.org/TR/trusted-types/) protects browser injection
sinks, including [DOMParser.parseFromString](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString).
The Chromium fixture enforces `require-trusted-types-for 'script'` and
`trusted-types 'none'`, and checks actual rendering of icons, entity decoding
and formatted Markdown without a policy. It also proves the restriction is
active by attempting an intentionally blocked sink after the component checks.

This fixture allows inline styles because Stencil and token-backed component
styles require separate application CSP integration. It does not certify the
whole library under a nonce-only style policy. Other engines exercise hostile
SVG/Markdown rendering and local-reference isolation independently of CSP.

Run `tests/icon-svg.test.ts`, `tests/safe-url.test.ts` and
`tests/e2e/rendering-security.spec.ts`, then the normal full pre-PR gate. The
browser tests consume built artifacts, so rebuild first. See the
[testing strategy](testing.md) for local Firefox coverage.
