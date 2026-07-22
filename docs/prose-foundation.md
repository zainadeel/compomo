# Prose foundation decision

Issue: [#305](https://github.com/zainadeel/compomo/issues/305)

Status: **CSS export selected**

## Concrete consumer

The first consumer is a streamed agent response. `ds-agent-response` keeps response parts in authored order, while its Markdown part uses `ds-markdown` to produce safe semantic DOM. The prose foundation owns only the typography, document rhythm, overflow, and opt-out behavior of that DOM.

The representative fixture contains headings, paragraphs, nested lists, links, inline code, fenced code, a blockquote, a wide table, and long content. It places that prose between activity, tool-call, attachment, and source parts so product UI and prose can be evaluated together.

## Distribution spike

Two models were evaluated against Stencil 4.43.5.

### Scoped `<ds-prose>` custom element

Stencil transforms a scoped descendant rule such as:

```css
ds-prose :where(p, ul, ol, blockquote) { /* … */ }
```

into a selector that requires Stencil's generated scope class on each matched descendant. Arbitrary semantic DOM supplied by a renderer is not authored by the component's render function and cannot be relied upon to carry that class. A normal scoped component therefore cannot provide a general light-DOM prose boundary.

Turning scoping off makes the selector work, but the result is a custom element whose only job is to register global CSS. That adds a semantically empty wrapper, a JavaScript-definition and upgrade dependency, generated React/Angular adapters, and component lifecycle work without adding behavior or accessibility semantics. Styling may also arrive later than server-rendered content.

### Exported CSS surface

The selected surface is:

```css
@import '@ds-mo/ui/prose.css';
```

```html
<article class="ds-prose">
  <!-- safe semantic DOM from an application-owned renderer -->
</article>
```

This model:

- preserves the consumer's `article`, `section`, or `div` semantics;
- works before custom elements upgrade and without JavaScript;
- applies equally to plain HTML, React, and Angular renderers;
- can style arbitrary safe semantic DOM, not only Stencil-authored nodes;
- avoids a component created solely for naming symmetry;
- keeps all selectors at zero specificity through `:where()`, allowing ordinary consumer CSS to override it without `!important`.

## Public contract

- Import `@ds-mo/ui/prose.css` after TokoMo tokens.
- Apply `.ds-prose` to a consumer-owned semantic container.
- The initial recipe is the compact conversation rhythm. A roomier documentation mode is intentionally deferred until it has a concrete consumer.
- Wrap wide tables in `.ds-prose__table-scroll`; this wrapper owns horizontal scrolling while the native table retains its semantics. When it actually scrolls, the renderer must make the wrapper keyboard-focusable (for example, `tabindex="0"`) and provide contextual labelling when the surrounding content does not already identify it.
- Native `pre` blocks that actually scroll must likewise be keyboard-focusable. This remains renderer markup because CSS cannot add focus semantics.
- Add `data-ds-prose="off"` to embedded product UI. The attribute opts its complete subtree out and cannot be implicitly re-enabled by a nested prose class.
- Nested `.ds-prose` containers use the same recipe and do not compound typography values.
- New blocks own `margin-block-start`. There are no `:last-child`, `:empty`, or forward-looking `:has()` rules, so appending content does not restyle earlier blocks.
- Typography, spacing, colors, borders, and radii come only from TokoMo tokens.

## Ownership boundary

| Layer | Owns | Does not own |
| --- | --- | --- |
| `ds-text` | One measurable UI-text box and one complete typography variant | Document trees or inter-block rhythm |
| Prose CSS | Styling safe existing semantic DOM | Parsing, sanitization, streaming state, or component mapping |
| Renderer | Parsing, safety, semantic nodes, incomplete syntax, and product mappings | The shared visual prose recipe |
| `ds-agent-response` | Authored part order and response-level streaming state | Prose element styling |

`ds-markdown` remains an optional, experimental renderer because agent-response's serializable parts API needs a safe string-to-DOM implementation and it already builds nodes without `innerHTML`. Its styling now consumes the same `.ds-prose` source as any application renderer. The CSS export has no dependency on `ds-markdown`, the Markdown parser, or Stencil.

## Framework implications

- **Plain HTML:** link the CSS export and add the class to an `article` or other semantic container.
- **React:** import the CSS once and use `className="ds-prose"` on the renderer-owned element.
- **Angular:** include the package CSS export in the application stylesheet pipeline and use `class="ds-prose"`; no adapter or schema entry is needed.

## Deferred work

- A roomier documentation/CMS rhythm.
- Syntax highlighting and renderer plugin policy.
- An application-level rich-text editor.
- RTL-specific review and fixtures; logical properties are used, but RTL verification is outside the current issue scope.
