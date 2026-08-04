# Shared-component comparison

This first-pass comparison focuses on component boundaries, interaction, and
accessibility signals. It does not score visual preference, certify either
library, or make Phoenix behavior normative for CompoMo.

## System-level differences

| Dimension            | Phoenix                                                                                                                | CompoMo                                                                                | Consequence                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Runtime              | Angular 14 library with Angular CDK overlays and Angular-specific templates, directives, forms, and router integration | Stencil custom elements with generated Angular 19–22 and React 18/19 adapters          | CompoMo contracts must remain framework-neutral; Phoenix Angular conveniences are not portable requirements. |
| Styling              | Global SCSS classes and Phoenix token layers                                                                           | Scoped component CSS consuming TokoMo custom properties                                | Visual similarity should not justify copying selectors, Sass structure, or hardcoded recipes.                |
| Component boundaries | Often broad and configurable, including product/data concerns                                                          | More explicit user-job boundaries and composable owners                                | Apparent feature gaps may be deliberate ownership changes rather than missing props.                         |
| Responsive behavior  | Several components subscribe to shared breakpoint services and mutate presentation internally                          | Shell owners and component contracts declare their responsive responsibilities         | Avoid moving application-level responsiveness into every primitive.                                          |
| Metadata             | Storybook and source expose behavior; there is no normalized lifecycle/intent contract                                 | Every registered element has co-located agent intent and stable or experimental status | Compare intent first; do not infer parity from names alone.                                                  |

## Detailed comparisons

### Buttons

Phoenix uses one native-button directive with role, semantic type, background,
size, icon/template, loading, width, and shadow combinations. Specialized
button families then add icon, split, menu, select, upsell, floating,
navigation, and grouped behaviors.

CompoMo separates ButtonFilled from ButtonUnfilled. This makes emphasis a
component-level choice: ButtonFilled is the single primary action in a local
decision area, while ButtonUnfilled covers secondary actions, compact chrome,
and genuine pressed toggles. Both explicitly model popup relationships,
loading, inactive state, accessible names, and physical press policy.

**Assessment:** retain the CompoMo split. Evaluate Phoenix's specialized button
families as compositions or distinct interaction patterns; do not fold all of
their axes back into a single universal button.

### Input and Field

Phoenix applies a directive to native `input` and `textarea` elements, with
separate search, password, group, and addon owners. This retains native element
behavior and gives Angular templates broad composition freedom, but persistent
label, guidance, and error ownership remains distributed.

CompoMo Input is a form-associated single-line custom element supporting text,
email, telephone, URL, search, and password types. Field owns the persistent
label, guidance, error presentation, stable IDs, and interaction state for one
Input or Select.

**Assessment:** CompoMo's Field boundary is a useful improvement. A future
textarea should integrate with Field instead of expanding Input into a mixed
single-line/multiline contract.

### Select

Phoenix Select is an extensive Angular abstraction. It supports projected and
data-source options, virtual scrolling, local or server search, debouncing,
optimistic selection, option creation, link options, custom trigger/label/footer
templates, hierarchical selections, and several product display modes. Its
rendered trigger is exposed as a `menu`; the audited Storybook displayed 55
controls for the default story.

CompoMo Select supports single or multiple independent values, sections, local
search, loading, clearing, rich labels, error states, and form association. It
uses a combobox trigger with a listbox popup, option semantics,
`aria-activedescendant`, disabled-option skipping, and `aria-multiselectable`
for multiple mode.

**Assessment:** CompoMo has the stronger semantic baseline and a more legible
ownership boundary. Server fetching, option creation, and navigation should
remain application or pattern concerns unless repeated product evidence proves
they need a reusable owner. Virtualization is a potential capability gap for
very large datasets, not a reason to adopt Phoenix's whole contract.

### Modal

Phoenix Modal composes a custom Angular CDK overlay and focus trap. It supports
responsive bottom placement, full-screen mode, dark background, custom header
lanes, header selection, and extra filter/search regions. In the audited source
and rendered default story, the modal container was focusable but did not expose
a dialog role or `aria-modal`, and the icon-only close button had no accessible
name in the accessibility snapshot.

CompoMo Modal uses the native top-layer `dialog`, labels it from its heading,
supports `aria-describedby`, restores focus, closes on Escape, and keeps a
focused contract for confirmations or short blocking tasks with an optional
two-action footer.

**Assessment:** retain the native, narrowly scoped CompoMo contract. Generic
drawer, sheet, and large workflow surfaces should be researched separately
rather than added as Modal variants. The Phoenix findings are audit signals,
not a complete accessibility verdict.

### Toast

Phoenix Toast provides info, positive, negative, and caution methods over an
Angular CDK overlay. It supports title/content/actions, a configurable top
offset, horizontal or vertical content, optional close, duration, hover pause,
icons, and a three-item default stack. Its default placement is top-center.

CompoMo Toast uses a manager-driven bottom-end stack and also supports anchored
feedback, promise state transitions, persistent and high-priority records,
pauseable timers, limited-stack treatment, keyboard entry, action focus,
priority announcements, and swipe dismissal.

**Assessment:** CompoMo materially extends the interaction and accessibility
contract. Product testing should decide placement and interruption policy; the
Phoenix top-center position is context, not a required compatibility behavior.

### Tooltip and interactive disclosure

Phoenix Tooltip combines hover or click triggers, title, subtitle, arbitrary
templates, backdrop, close control, toggle-tip mode, and focus trapping. This
serves both non-interactive labels and interactive disclosure through one API.

CompoMo Tooltip intentionally renders only a supplementary, non-interactive
label. It opens for hover-capable pointer and keyboard focus, relates the popup
through `aria-describedby`, accounts for reduced motion and touch policy, and
keeps the trigger's accessible name independent.

**Assessment:** retain the strict Tooltip contract. If products need rich or
interactive disclosure, research a Popover/ToggleTip component with its own
focus, dismissal, and labeling rules instead of adding interactive content to
Tooltip.

### Toggle, Switch, and pressed actions

Phoenix Toggle can render as a switch, a toggle button, or icon-only control and
also integrates with Angular forms. Those are visually related but semantically
different jobs.

CompoMo Switch is only an immediate on/off setting with switch semantics and
form association. ButtonUnfilled owns genuine persistent toggle-button state
through `pressed`, while application composite owners can use `isActive` for
visual emphasis without inventing button semantics.

**Assessment:** the CompoMo separation is clearer and should remain. Migration
guidance will need to classify each Phoenix Toggle usage by user job rather than
map the component name mechanically.

### Tabs and route navigation

Phoenix Tabset handles local active-index selection and optional Angular Router
URL matching inside the same family.

CompoMo TabGroup is a local single-selection composite with tablist/tab
semantics and roving keyboard interaction. BarNav and PanelNav separately own
route navigation inside the application shell.

**Assessment:** preserve the local-versus-route boundary. Router adapters may
help applications connect navigation, but TabGroup should not absorb
framework-specific routing.

### Cards and overview surfaces

Phoenix has a generic Card, Content Card, Form Card, and Overview composition.
Its Form Card owns view/edit content lanes and responsive edit behavior; its
Overview can make items clickable and keyboard-navigable.

CompoMo does not expose a generic Card. CardOverview owns a reporting-period and
measure-summary job, CardSetting owns a controlled settings view/edit workflow,
and CardChart owns visualization chrome.

**Assessment:** this is an intentional move toward task-specific surfaces. Add a
generic card only if repeated product compositions require a stable semantic or
behavioral contract; visual containment alone is better served by layout and
surface recipes.

## Cross-cutting accessibility signals

Phoenix has meaningful strengths: Button and Input enhance native elements;
Checkbox uses a native checkbox; many overlays use Angular CDK positioning and
focus utilities; and newer Date Picker stories explicitly cover accessibility
states.

The first-pass audit also found areas that should not be inherited without
fresh research:

- Select exposes menu semantics for value selection instead of a
  combobox/listbox model.
- Modal's rendered default lacked dialog semantics and an accessible close
  name in the audited snapshot.
- Tooltip combines non-interactive tooltip and interactive toggle-tip behavior,
  including a clickable non-button close element in source.
- Several components own global window listeners, responsive services, or body
  scroll behavior, increasing integration coupling.

CompoMo's explicit semantics, forced-colors guidance, form association, and
intent metadata provide a stronger default foundation. They still require
focused rendered and assistive-technology verification; “different from
Phoenix” does not itself mean complete or correct.

## What to carry into future design work

Carry forward the questions Phoenix reveals, not its implementation:

- Which real production states and high-density workflows must remain possible?
- Which responsive adaptations are product requirements versus historical
  component behavior?
- Does the user need a primitive, a reusable composition, or application-owned
  workflow logic?
- What is the correct native or ARIA interaction model when starting from
  first principles?
- Which capabilities are genuinely used, and which exist only because a broad
  API accumulated them?

Answer those questions with standards, several current open-source references,
CompoMo's architecture, and Lab validation. Consult Phoenix only when the task
explicitly needs the production baseline.

## Evidence map

The detailed comparisons used these authoritative files in addition to the
rendered Storybooks:

| Area               | Phoenix evidence                                                              | CompoMo evidence                                                                                                                                                                                                                                                     |
| ------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Buttons            | `projects/core/src/lib/button/phx-button.component.ts` and its stories        | [ButtonFilled intent](../../../src/wc/components/ButtonFilled/ButtonFilled.agent.json) and [ButtonUnfilled intent](../../../src/wc/components/ButtonUnfilled/ButtonUnfilled.agent.json)                                                                              |
| Input and Field    | `projects/core/src/lib/input/`                                                | [Input intent](../../../src/wc/components/Input/Input.agent.json) and [Field intent](../../../src/wc/components/Field/Field.agent.json)                                                                                                                              |
| Select             | `projects/core/src/lib/select/select.component.ts`, its template, and stories | [Select intent](../../../src/wc/components/Select/Select.agent.json) and [Select source](../../../src/wc/components/Select/Select.tsx)                                                                                                                               |
| Modal              | `projects/core/src/lib/dialog/` and `projects/core/src/lib/modal/`            | [Modal intent](../../../src/wc/components/Modal/Modal.agent.json) and [Modal source](../../../src/wc/components/Modal/Modal.tsx)                                                                                                                                     |
| Toast              | `projects/core/src/lib/toast/`                                                | [Toast intent](../../../src/wc/components/Toast/Toast.agent.json) and [Toast source](../../../src/wc/components/Toast/Toast.tsx)                                                                                                                                     |
| Tooltip            | `projects/core/src/lib/tooltip/`                                              | [Tooltip intent](../../../src/wc/components/Tooltip/Tooltip.agent.json) and [Tooltip source](../../../src/wc/components/Tooltip/Tooltip.tsx)                                                                                                                         |
| Toggle and switch  | `projects/core/src/lib/toggle/`                                               | [Switch intent](../../../src/wc/components/Switch/Switch.agent.json) and [ButtonUnfilled intent](../../../src/wc/components/ButtonUnfilled/ButtonUnfilled.agent.json)                                                                                                |
| Tabs and routes    | `projects/core/src/lib/tabset/`                                               | [TabGroup intent](../../../src/wc/components/TabGroup/TabGroup.agent.json), [BarNav intent](../../../src/wc/components/BarNav/BarNav.agent.json), and [PanelNav intent](../../../src/wc/components/PanelNav/PanelNav.agent.json)                                     |
| Cards and overview | `projects/core/src/lib/card/` and `projects/core/src/lib/overview/`           | [CardOverview intent](../../../src/wc/components/CardOverview/CardOverview.agent.json), [CardSetting intent](../../../src/wc/components/CardSetting/CardSetting.agent.json), and [CardChart intent](../../../src/wc/components/CardChart/CardChart.agent.json) |
