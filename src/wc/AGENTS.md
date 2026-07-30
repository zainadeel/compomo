# Web component source guidance

Applies to `src/wc/`.

## Before editing

For a component, read its TSX, CSS, story, and agent JSON. Read referenced
patterns when changing a composition contract. Inspect a shared utility before
adding component-local geometry that may already have an owner.

## Styling

- Use TokoMo variables for every design value.
- Keep component styles in the co-located CSS file.
- Use `:host` for host behavior and classes for internal structure.
- Do not override `ds-text` font metrics. Select an atomic variant and emphasis.
- Put layout classes directly on `ds-text`; do not wrap it solely for layout.
- Use `ds-icon` for product icons. Raw SVG is limited to primitives,
  visualizations, loaders, and genuine brand marks.
- Fixed-height controls use border-box sizing and horizontal padding; borders
  must not enlarge the declared height.
- Reuse `src/wc/utils/` only when several components share the same structural
  contract. Utilities must not take over component semantics or public API.

Follow the local ESLint and Stylelint messages. Justify unavoidable exceptions
at the line where they occur.

## Components

- Prefer native semantics inside the custom element.
- Keep controlled state controlled; events report intent unless the API
  explicitly owns mutation.
- Preserve accessible names through loading and visual-only state changes.
- Distinguish hover, pressed, selected, expanded, inactive, and loading states.
- Keep focus entry, focus return, keyboard traversal, and dismissal explicit for
  overlays and composite controls.
- Do not use `title` as a Stencil prop.
- Do not rely on `@Watch` for initial values.
- Keep services and reusable controllers outside files containing
  `@Component()`.
- Share behavior with composition, controllers, or pure functions rather than
  component inheritance.

## Internal recipes

- `control-density.css`: lg/md/sm/xs control metrics.
- `control-parts.css`: frame, icon box, and label box anatomy.
- `field-stack.css`: label/control/supporting-message flow.
- `empty-region.css`: bounded empty-region centering.
- `chrome-layout.css`: spacing-only row/column/grid chrome.
- `CardDataViz`: one component-owned chart/legend card anatomy.
- `select-controller.ts`: single and multiple Select popup lifecycle and traversal.
- `anchored-position.ts`: pure element-anchored popup geometry (flip + clamp).
- `anchored-position-controller.ts`: anchored-popup lifecycle — listener binding,
  measurement retries, frame coalescing, teardown. Owning components keep their
  own anchor semantics in the `measure` callback.

These are implementation details, not consumer classes. Ownership rationale
lives in `docs/layout-recipe-foundation.md`.

## Stories and docs

Stories use `@storybook/web-components` with Lit. Demonstrate meaningful public
states rather than internal classes. Use `data-a11y-fixture` only to identify
the actual component fixtures in a showcase; never use it to exclude content
rendered by the component.

Consumer concepts belong in `src/docs/`. Keep exact props and defaults in
generated API documentation.

## Verification

Use `docs/maintainers/testing.md`. Shared utilities and component primitives
require focused coverage for every consumer family they affect.
