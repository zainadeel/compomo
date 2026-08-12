# Shared layout recipe foundation

CompoMo keeps repeated geometry in small internal recipes when several
components share the same structural contract. These recipes are maintainer
implementation details, not public consumer classes. Component props, slots,
events, and semantic ownership remain the public API.

## Control anatomy

`src/wc/utils/control-parts.css` consumes the metrics established by
`control-density.css`:

- `.ds-control-frame` owns density height, inline padding, gap, and radius.
- `.ds-control-section-heading` aligns a section heading to the frame's label
  inset at the selected density.
- `.ds-control-icon-box` owns the fixed icon/adornment zone.
- `.ds-control-label-box` owns density-specific text-container inset.

ButtonFilled, ButtonUnfilled, Input, Select, Menu choice rows and section
headings, TooltipChart, and ConversationListItem use these parts. Components
continue to own borders, surface treatment, interaction state, typography
selection, and semantics. Never add typography metrics to a control part.

`src/wc/utils/control-density-inset.css` is a narrow modifier for a control
nested inside another control at the same density. It reduces only the nested
control's outer box and outer inline padding. The base recipe continues to own
its icon, text inset, gap, radius, and typography. Components must expose an
intentional API before opting into this modifier; it is not a default density.

## Field flow

`src/wc/utils/field-stack.css` owns the 4px vertical flow shared by a field
label, control, description, and error message. Field, Input, Select,
Select in either cardinality mode, and Slider use the same recipe. It does not impose width,
validation timing, or form semantics.

## Compact header anatomy

`src/wc/utils/chrome-header.css` owns the geometry repeated by Banner, Modal,
PanelToolHeader, and compact BarTitle:

- a 48px compact minimum with an 8px outer inset and 8px zone gap;
- the md row's 6px all-side copy-container inset and 2px balanced inline text inset;
- leading, yielding copy, and trailing-control zones;
- a 4px title-to-description gap when copy is stacked or wraps to a new line;
- an optional tertiary bottom boundary for bounded chrome.

The recipe does not choose heading semantics, typography, surface color,
wrapping policy, or actions. Each component keeps those responsibilities and
may remain taller than the compact minimum when supporting copy wraps.

## Empty regions

`src/wc/utils/empty-region.css` centers an empty presentation in available
space. Choice popups use the base recipe while retaining their popup-specific
minimum height and inset. Application master/detail layouts should establish
one equivalent region recipe rather than repeating centering rules around each
`ds-empty-state`.

## Data-visualization card anatomy

`src/wc/components/CardChart` keeps Bar, Line, Donut, and custom card bodies
aligned within one public component:

- the body is a vertical fill layout;
- the chart consumes remaining space;
- the legend remains content-sized;
- the donut modifier lets its chart stretch in both axes.

Chart behavior, hover synchronization, filtering, and slot presence remain
owned by the selected card variant.

## Select controller

`src/wc/utils/select-controller.ts` is a composition-based controller shared by
single and multiple Select. It owns popup mounting retries, anchored positioning,
outside dismissal, focus restoration, typeahead, and listbox traversal.
Decorated Stencil state, form submission, validation, scalar selection, and
array selection remain in their respective components.

Do not replace this boundary with component inheritance. Any keyboard or popup
lifecycle change must be verified for both Select variants.
