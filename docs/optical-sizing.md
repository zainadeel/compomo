# Optical Sizing & Padding — Design Reference

A collection of the specific sizing rules, corrections, and reasoning behind them.
Intended as a reference when building new components so these patterns stay consistent.

---

## 1. Icon-edge padding correction

**The rule:** when an icon sits flush against a component's edge, the padding on that side should equal `(componentHeight − iconSize) / 2` — the same gap the icon already has top and bottom.

**Why:** without this, the horizontal padding (a design-system token chosen for text) is too generous for an icon. Text has no visible bounding box so extra padding reads as breathing room. An icon has a hard visual edge, so the same padding creates an unequal-looking gap — more air on the left/right than on the top/bottom of the icon.

**The formula:**

```
edge padding = (height − iconSize) / 2
```

**Button / ToggleButton (`iconAndLabel` layout — icon on left):**

| Size | Height | Icon | Optical gap | Left padding (icon side) | Right padding (label side) |
|------|--------|------|-------------|--------------------------|----------------------------|
| XS   | 16px   | 12px | 2px         | `space-025` = 2px ✓      | `space-025` = 2px          |
| SM   | 24px   | 16px | 4px         | `space-050` = 4px         | `space-075` = 6px          |
| MD   | 32px   | 20px | 6px         | `space-075` = 6px         | `space-100` = 8px          |
| LG   | 40px   | 24px | 8px         | `space-100` = 8px         | `space-150` = 12px         |

Note the asymmetry: the label side keeps its normal token value; only the icon side is corrected. XS happens to already be correct since the base token matches the gap.

**Tag / Chip (`iconLeft` / `iconRight` — leading icon or remove button):**

Shared `tag--*` CSS applies to both `ds-tag` and `ds-chip`. Optical gap classes:

| Size | Height | Icon | Optical gap | CSS class     |
|------|--------|------|-------------|---------------|
| XS   | 12px   | 12px | 0px         | `iconLeftXS` / `iconRightXS` = `0` |
| SM   | 20px   | 16px | 2px         | `iconLeftSM` / `iconRightSM` = `space-025` |
| MD   | 28px   | 20px | 4px         | `iconLeftMD` / `iconRightMD` = `space-050` |

**`ds-chip`:** `tag--icon-right-{SIZE}` is applied when `removable` is true (remove button). Leading-icon classes (`tag--icon-left-*`) are not toggled yet — slot detection is TODO.

**`ds-tag`:** same CSS; TSX does not render a remove button and does not toggle icon optical classes yet.

For Chip, the remove-button side (right) is corrected when `removable` is set. Leading-icon correction will apply once slot presence is wired.

---

## 2. Rounded (pill) padding correction

**The rule:** pill-shaped components add `space-050` (4px) extra padding on any side that has no content anchor (bare label text at the edge, no icon).

**Why:** a pill's large corner radius curves far into the edge, eating into the visual breathing room around the text. The extra `space-050` compensates so the text doesn't feel cramped against the rounded edge. Sides that already have an icon do not get the correction — the icon acts as a visual anchor and the tighter icon-edge padding (rule 1) already applies.

**Button / ToggleButton (rounded):**

Added to *both* sides for `labelOnly`. Added only to the *label/right side* for `iconAndLabel` (the icon side keeps the corrected icon-edge padding from rule 1):

```
labelOnly:    padding = base + space-050 (both sides)
iconAndLabel: left  = icon-edge padding + space-050
              right = base + space-050
```

**Tag / Chip (rounded — pill padding correction classes):**

Host classes `tag--rounded-no-icon-left` and `tag--rounded-no-remove-right` add `space-050` on bare label edges.

| Component   | No leading icon (left)     | No remove button (right)        |
|-------------|----------------------------|---------------------------------|
| `ds-chip`   | `tag--rounded-no-icon-left` when `rounded` (icon slot TODO) | `tag--rounded-no-remove-right` when `rounded && !removable` |
| `ds-tag`    | same class when `rounded`  | same when `rounded` (no remove UI yet) |

When both an icon and a remove button are present, neither trailing correction applies on Chip. When neither is present (label only), both can apply.

---

## 3. Remove / dismiss button hover area

**The rule:** the hover highlight on a small dismiss button (`×`) should maintain the same optical gap to the component edge as the icon has to the component top/bottom — and the hover highlight's border-radius should be tuned per-size so it doesn't visually eat into that gap.

**Structure:** a `::before` pseudo-element on the remove button carries the hover background, sized via `inset` (negative margin on all sides). The button itself has `padding: 0`.

**Values (`ds-chip` remove button):**

| Tag size | Icon size | Tag height | Optical gap | `inset` | Hover area | `::before` radius |
|----------|-----------|------------|-------------|---------|------------|-------------------|
| MD       | 20px      | 28px       | 4px         | `-2px`  | 24×24px    | `radius-025` = 2px |
| SM       | 16px      | 20px       | 2px         | `-1px`  | 18×18px    | `3px`              |
| XS       | 12px      | 12px       | 0px         | `0`     | 12×12px    | `radius-050` = 4px |

**Radius choices:**

- MD: `2px` — small enough to not visually arc into the 2px gap between the hover area and the tag edge.
- SM: `3px` — 1px gap, proportionally softer corner.
- XS: `4px` (matches the tag's own corner radius) — flush to the tag edge, creating a nested rounded rectangle effect.
- Rounded tags: `border-radius: 50%` on `::before` for all sizes — fully circular hover, matching the pill tag language.

**Why not simply use padding on the button?** The `inset` approach keeps the button's layout footprint at exactly the icon size, so the tag's own padding tokens (rule 1) drive the spacing without needing to account for extra button padding.

---

## 4. Alpha dividers in component groups

**The rule:** dividers between grouped components (ButtonGroup, ToggleButtonGroup) must use an alpha color token and must be physically positioned to overlap adjacent button fills — not sit in the gap between them.

**Why the token alone isn't enough:** `color-border-tertiary` = `rgb(0 0 0 / 0.1)` (10% black in light mode, 10% white in dark mode). This is the right token — it's designed to blend over any surface. But a 1px flex child sitting *between* two buttons composites against the group/page background, not against the button fills. When buttons have a colored pressed state (e.g. `bg-faint-brand`, blue) the divider still shows as 10% black over white — a gray line that breaks the blue.

**The fix:**

```css
.divider {
  position: relative;
  z-index: 1;
  margin: 0 -0.5px;
  pointer-events: none;
}
```

`margin: 0 -0.5px` makes the divider overlap 0.5px of each adjacent button. `z-index: 1` (works because flex children with `position: relative` participate in stacking) causes it to paint on top of the button fills. Now `rgb(0 0 0 / 0.1)` composites over the actual button background — a whisper of darker blue over a pressed blue button, barely-visible gray over a white button.

---

## 6. Divider independence from button state

**The rule:** dividers in groups must be separate DOM elements, not borders or box-shadows on the buttons.

**Why:** `opacity: 0.5` on an inactive button would also fade a `border-left` or `box-shadow` that forms the divider. This creates visual asymmetry — the inactive button's left divider fades while its right divider (owned by the next button) stays opaque. The divider appears broken on one side.

As a separate `<div>` the divider is outside any button's stacking context and unaffected by adjacent button opacity, transform, or any other state.

**Ghost (elevation: none) dividers:** short centred lines at icon height, additionally hidden when an adjacent button is hovered or pressed (ghost interaction is chip-based, not full-height, so dividers adjacent to active chips should disappear):

```css
.item:hover + .dividerGhost,
.dividerGhost:has(+ .item:hover)     { opacity: 0; }
.itemPressed + .dividerGhost,
.dividerGhost:has(+ .itemPressed)    { opacity: 0; }
```

Full-height dividers (elevated / flat / floating) do not hide on hover or press — they are part of the component's chrome and remain visible.

---

## Quick reference — token ladder

For convenience, the spacing tokens used across these rules:

| Token           | Value |
|-----------------|-------|
| `space-012`     | 1px   |
| `space-025`     | 2px   |
| `space-050`     | 4px   |
| `space-075`     | 6px   |
| `space-100`     | 8px   |
| `space-150`     | 12px  |

| Token           | Value |
|-----------------|-------|
| `radius-025`    | 2px   |
| `radius-050`    | 4px   |
| `radius-half`   | 50%   |
