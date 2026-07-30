# Shared layout recipe foundation

CompoMo keeps repeated geometry in small internal recipes when several
components share the same structural contract. These recipes are maintainer
implementation details, not public consumer classes. Component props, slots,
events, and semantic ownership remain the public API.

## Control anatomy

`src/wc/utils/control-parts.css` consumes the metrics established by
`control-density.css`:

- `.ds-control-frame` owns density height, inline padding, gap, and radius.
- `.ds-control-icon-box` owns the fixed icon/adornment zone.
- `.ds-control-label-box` owns density-specific text-container inset.

ButtonFilled, ButtonUnfilled, Input, Select, Menu choice rows, and
ConversationListItem use these parts. Components continue to own borders,
surface treatment, interaction state, typography selection, and semantics.
Never add typography metrics to a control part.

## Field flow

`src/wc/utils/field-stack.css` owns the 4px vertical flow shared by a field
label, control, description, and error message. Field, Input, Select,
Select in either cardinality mode, and Slider use the same recipe. It does not impose width,
validation timing, or form semantics.

## Empty regions

`src/wc/utils/empty-region.css` centers an empty presentation in available
space. Choice popups use the base recipe while retaining their popup-specific
minimum height and inset. Application master/detail layouts should establish
one equivalent region recipe rather than repeating centering rules around each
`ds-empty-state`.

## Data-visualization card anatomy

`src/wc/components/CardDataViz` keeps Bar, Line, Donut, and custom card bodies
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
