# Forced-colors accessibility

Use this guide when a component depends on color, a subtle fill, box-shadow,
gradient, elevation, or authored data colors to communicate meaning.

## Contract

Windows Contrast Themes and browser forced-colors mode replace most authored
colors with a user-selected system palette. The operating system owns the
resolved colors. CompoMo owns which system role an element represents and
whether real geometry remains after shadows and fills are removed.

`src/wc/utils/forced-colors.css` is the single internal mapping:

| CompoMo role | OS system color | Meaning |
| --- | --- | --- |
| `--ds-forced-color-surface` | `Canvas` | Page or surface |
| `--ds-forced-color-content` | `CanvasText` | Content or structural boundary |
| `--ds-forced-color-control-boundary` | `ButtonText` | Interactive control boundary |
| `--ds-forced-color-selected` | `Highlight` | Focused, checked, or selected state |
| `--ds-forced-color-on-selected` | `HighlightText` | Content on a selected state |
| `--ds-forced-color-disabled` | `GrayText` | Disabled or inactive content |

These keywords are references to the user's OS palette, not authored RGB
values. Do not duplicate the keywords in component CSS; import the utility and
consume the matching internal role.

## Implementation rules

- Leave `forced-color-adjust` at its default `auto`. Existing text, icons,
  backgrounds, and real borders should normally follow the browser mapping.
- Restore meaning that disappears with shadows or fills by adding a real
  border or layout-neutral inset outline inside
  `@media (forced-colors: active)`.
- Use the control-boundary role for interactive edges, the content role for
  structural surfaces, and the selected role for focus, checked, and selected
  state.
- Do not rely on a selected fill alone. Preserve a state mark, outline,
  position, label, or native semantic that remains distinguishable.
- Preserve invalid state with a non-color cue such as a dashed outline in
  addition to its accessible state and message.
- Render disabled content at full opacity with the disabled system role; an
  opacity-only treatment can disappear into the forced palette.
- Replace elevation-only separation on menus, dialogs, tooltips, toasts, and
  floating cards with a real boundary.
- Stop decorative shimmer in forced-colors mode while keeping a static loading
  placeholder and the owning busy/status semantics.

Use `forced-color-adjust: none` only for a literal data mark or preview whose
authored color carries information, such as chart marks and their legend
swatches. Keep surrounding labels, focus, controls, and chrome under OS
control, and add a system-colored boundary where the authored mark could merge
with the canvas.

## Review

Use **Accessibility → Forced Colors Review** in Storybook with a Windows
Contrast Theme enabled. Check at least:

- control, popup, dialog, tooltip, toast, and elevated-card boundaries;
- keyboard focus and focus return;
- checked, indeterminate, selected, expanded, invalid, loading, and disabled
  states;
- text and essential icons;
- navigation selection without fill-only differentiation;
- chart category/value distinctions, legend correspondence, and chart focus;
- loading feedback without decorative motion.

On Windows, review the story in current Edge and Firefox with Contrast Themes
enabled under **Settings → Accessibility → Contrast themes**. Test at least one
dark and one light contrast theme. Record browser/OS versions and any state
that loses its boundary or meaning. This manual pass complements automation;
it is not reproducible from macOS.

Run the focused automation locally in Chromium:

```bash
npx playwright test tests/e2e/forced-colors.spec.ts --project=chromium
```

CI runs the repository browser matrix; engines that do not implement
forced-colors CSS emulation self-skip this focused suite while retaining their
normal-theme coverage. Also run `npm run lint:css`, `npm run typecheck`,
`npm run build`, and the Storybook build/a11y checks for shared forced-colors
changes.
