# Physical press policy

`src/wc/utils/control-press.css` is the single source of truth for optional
scale-down feedback during a physical pointer or tap press. It is separate from
`interaction-fill.css`: hover/pressed washes, selected state, `aria-pressed`,
expanded state, focus, error, loading, and dragging do not opt a control into
scale.

The utility uses the individual CSS `scale` property so it composes with
component-owned `transform` positioning and animation. Its resting and pressed
values come from `--dimension-scale-default` and `--dimension-scale-subtle`;
`--effect-motion-short-2` owns timing and easing. Disabled, inactive, and busy
targets are ineligible. Reduced motion fixes the target at resting scale with no
transition.

Apply `.ds-control-press-scale` to the actual interactive hit target. The only
approved consumers are the native buttons inside `ButtonFilled` and
`ButtonUnfilled`. CSS `:active` defines transient physical feedback; keyboard
activation remains native and is not promised an equivalent held frame.

## Policy matrix

### Shared scale policy

| Component and target                         | Existing pressed/state paint                                                    | Transform ownership  | Policy and rationale                              | Composition                                                                                                                                                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ButtonFilled` — native `.button-filled`     | `interaction-fill` pressed wash                                                 | None after migration | **scale** — momentary action primitive            | The native hit target scales. An elevated owner adds `ds-control-elevation--press-scale` so the wrapper surface, shadow, highlight, and button scale together without compounding.                                                          |
| `ButtonUnfilled` — native `.button-unfilled` | `interaction-fill` pressed wash; expanded and selected paint remain independent | None                 | **scale by default** — momentary action primitive | Applies to label, icon, and icon-label variants. Owning composites may disable `pressScale` only when fixed child or background geometry must remain aligned; the pressed wash remains active. Popup-open state does not keep scale active. |

### No-scale targets

| Component and exact target                                                              | Existing pressed/state paint                                                                | Transform ownership                                                   | Rationale and composition                                                                                                                                                   |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AgentActivity` — native `summary`                                                      | Native disclosure feedback                                                                  | Chevron rotation                                                      | Disclosure geometry/state must remain stable.                                                                                                                               |
| `AgentQuestionnaire` — choice inputs, text input, and native action buttons             | Native choice, focus, selected, and pressed feedback                                        | None                                                                  | Multi-step form choices and navigation remain geometrically stable; the component does not borrow momentary action-button scale.                                            |
| `AgentSourceList` — native `summary` and source anchors                                 | Native disclosure/link feedback                                                             | Chevron rotation                                                      | Disclosures and links do not scale.                                                                                                                                         |
| `AgentToolCall` — native `summary`                                                      | Native disclosure feedback                                                                  | Chevron rotation                                                      | Disclosure state owns the chevron transform.                                                                                                                                |
| `AttachmentList` — attachment anchors                                                   | Native link feedback                                                                        | None                                                                  | Links retain stable text and hit geometry.                                                                                                                                  |
| `BarNav` — `.bar-nav__tab` and overflow trigger composition                             | Local active wash; selected tab state                                                       | None on tabs                                                          | Navigation tabs do not scale. The overflow trigger inherits scale only because it is a composed `ButtonUnfilled`.                                                           |
| `BarAction` — native Clear button and slotted actions                                   | Underlined on-bold text action and focus ring; slotted controls own their interaction paint | None                                                                  | The selected-set surface stays geometrically stable when Clear is pressed. Slotted `ButtonFilled` and `ButtonUnfilled` controls retain their primitive press policy.        |
| `BarTitle` — native back button and composed action/menu buttons                        | `interaction-fill` wash                                                                     | None                                                                  | The back/navigation target stays stable; composed button primitives follow their own policy.                                                                                |
| `Breadcrumb` — item anchors and buttons                                                 | Link underline/focus feedback                                                               | None                                                                  | Hierarchical navigation does not scale.                                                                                                                                     |
| `ButtonFilled` / `ButtonUnfilled` — split-mode segments                                 | Native button interaction washes                                                            | Joined segment geometry                                               | Both segments disable scale so the shared separator and outer boundary remain fixed for default and rounded split controls.                                                 |
| `CardOverview` — selectable `.card-overview__metric` cells                              | `interaction-fill` wash; roving focus state                                                 | None                                                                  | Summary measures are selection targets in a shared grid; every column must stay aligned, so cell geometry cannot move.                                                      |
| `ChartLegend` — interactive legend item                                                 | Hover/selected opacity and interaction state                                                | None                                                                  | Large data-selection rows remain geometrically stable.                                                                                                                      |
| `Checkbox` — host ARIA checkbox target                                                  | `interaction-fill`, mark, and checked/mixed state                                           | None                                                                  | Choice controls do not scale.                                                                                                                                               |
| `Chip` — root action and `.tag__remove` button                                          | Root interaction wash; remove action has a local active wash                                | None                                                                  | Selection/removal affordances keep stable chip geometry.                                                                                                                    |
| `ConversationListItem` — `.conversation-list-item__row` button                          | Local active wash and selected state                                                        | None                                                                  | Large selectable/navigation rows do not scale.                                                                                                                              |
| `FilterMenu` — select trigger, category tabs, option rows, date input, and Clear action | Expanded, selected, checked, and interaction-fill states                                    | Popup positioning and choice-list enter animation are container-owned | Popup anchors, filter choices, editable dates, and text actions remain geometrically stable; the composed date-clear `ButtonUnfilled` follows its primitive policy.         |
| `Input` — native input and optional clear action composition                            | Focus/error/filled state                                                                    | None                                                                  | Editable fields do not scale; a composed button action follows the button policy.                                                                                           |
| `Markdown` — rendered anchors, checklist inputs, and scrollable regions                 | Native link/choice feedback                                                                 | None                                                                  | Renderer-owned semantic content does not scale.                                                                                                                             |
| `Menu` — menu item buttons and choice rows                                              | `interaction-fill`, selected/checked state                                                  | Choice-list enter animation is container-owned                        | Popup choice rows do not scale.                                                                                                                                             |
| `MessageComposer` — native textarea and slotted/composed tools                          | Focus/editing state                                                                         | None                                                                  | The editor does not scale; composed button primitives follow their own policy.                                                                                              |
| `MessageScroller` — focusable scroll region                                             | Scroll/focus state                                                                          | None                                                                  | A scroll container is not a momentary action.                                                                                                                               |
| `MobileBarNav` — destination and overflow buttons                                       | Interaction wash plus coarse-pointer pressed-state workaround                               | None                                                                  | Navigation stays stable; the JS workaround owns deterministic Safari press cleanup without scale.                                                                           |
| `MobileSectionSwitcher` — section trigger button                                        | Expanded/menu state                                                                         | None                                                                  | Popup anchoring and centered header geometry stay stable.                                                                                                                   |
| `MobileSheetNav` — sheet navigation button                                              | Interaction/navigation state                                                                | None                                                                  | Navigation targets do not scale.                                                                                                                                            |
| `PanelNav` — anchors, navigation buttons, user button, and toggle composition           | Interaction/selected navigation state                                                       | Collapse and shell transitions are container-owned                    | Navigation rows stay stable; composed `ButtonUnfilled` controls follow their primitive policy.                                                                              |
| `PanelSubNav` — tab buttons                                                             | Interaction/selected tab state                                                              | None                                                                  | Tabs do not scale.                                                                                                                                                          |
| `Radio` — `[role="radio"]` option rows                                                  | `interaction-fill` and checked state                                                        | None                                                                  | Choice rows do not scale.                                                                                                                                                   |
| `ScrollOverlay` — focusable overflow region                                             | Focus/scroll state                                                                          | None                                                                  | A scroll region is not a momentary action.                                                                                                                                  |
| `Select` — `.trigger`, search input, and option rows                                    | Pressed/expanded/selected interaction fills                                                 | Popup/choice-list positioning and enter animation                     | Popup anchors, editable search, and choices do not scale.                                                                                                                   |
| `Select multiple` — `.trigger`, search input, and option rows                           | Pressed/expanded/selected interaction fills                                                 | Popup/choice-list positioning and enter animation                     | Popup anchors, editable search, and choices do not scale.                                                                                                                   |
| `ShellApp` — keyboard-focusable routed-content scroller                                 | Scroll/focus state                                                                          | Shell sizing and chrome transitions are container-owned               | A scroll container is not a momentary action.                                                                                                                               |
| `TabGroup` — tab buttons                                                                | `interaction-fill` and selected tab state                                                   | None                                                                  | Tabs do not scale.                                                                                                                                                          |
| `Table` — sort buttons, loaded-row checkbox controls, and focusable scroll region       | Pressed/hover row paint, controlled sort/selection state, and focus outline                 | Sticky and column geometry must remain stable                         | Table controls and its scroll region do not scale; composed load-more buttons retain the `ButtonUnfilled` primitive policy.                                                 |
| `TableGroup` — trigger composition, Data and Order choice rows, and Clear action        | Expanded, selected, and interaction-fill states                                             | Popup positioning and choice-list enter animation are container-owned | Popup anchoring and both aligned choice lists remain geometrically stable. The composed trigger explicitly disables button scale, and the text Clear action does not scale. |
| `TableSearch` — native search input, slash field-picker trigger, and field option rows  | Focus, expanded, active-option, and editable-value state                                    | Popup positioning and choice-list enter animation are container-owned | Editable search, popup anchoring, and choice rows remain geometrically stable; the composed clear `ButtonUnfilled` follows its primitive policy.                            |
| `Tag` — interactive tag button                                                          | `interaction-fill` and selected state                                                       | None                                                                  | Selection targets retain stable geometry.                                                                                                                                   |
| `Toast` — delegated consumer-provided buttons, links, and inputs                        | Consumer-owned                                                                              | Consumer-owned                                                        | Toast does not impose geometry on delegated interactive content; CompoMo button children keep their primitive policy.                                                       |

The issue’s former `ShellMobileBar`, `ShellMobileNav`, and
`ShellMobileSectionNav` inventory names correspond to the current
`MobileBarNav`, `MobileSheetNav`, and `MobileSectionSwitcher` components above.

### Component-specific targets

| Component and exact target                                         | Existing pressed/state paint                         | Transform ownership                 | Rationale and composition                                                |
| ------------------------------------------------------------------ | ---------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| `Slider` — native range input, active thumb, and rail press target | Drag-pressed thumb wash                              | Thumb travel is state/drag geometry | Continuous and drag interaction must never inherit action-button scale.  |
| `SwatchPicker` — `.swatch-picker__option` radio buttons            | Local active wash and selected halo                  | Selected halo scales independently  | Choice geometry and selection animation remain component-owned.          |
| `Switch` — host switch target and thumb                            | Local physical pressed wash; checked/read-only state | Thumb travel is state geometry      | Toggle travel and pressed paint remain component-specific without scale. |

Existing `scale()` uses in Modal enter/exit, choice-list enter, and swatch
selection halos are state/animation geometry—not physical press feedback—and
remain outside this utility.

## Composed button inventory

`BarWorkflow`, `CodeBlock`, `MessageComposer`, `MobileHeader`,
`PanelToolHeader`, `PanelTools`, and shell/tool actions may render or receive
`ButtonFilled` or `ButtonUnfilled`. They inherit the button primitive policy
unless fixed child or background geometry requires the unfilled button's
explicit `pressScale={false}` opt-out; their containers must not add another
press transform. PanelTools rail actions use that opt-out so notification-dot
halos remain aligned to the shell gradient. In downstream Lab this
includes Agents/Messages “New chat,” Help “Contact support,” chat composer
submit/stop, and other floating actions.

## Verification contract

- Press scale is paint-only: layout and hit bounds do not change.
- Pointer release outside the target restores resting scale; browser pointer
  cancellation also clears native `:active`.
- Inactive, disabled, loading/busy, and reduced-motion targets stay at resting
  scale.
- Keyboard activation retains native semantics and cannot leave scale sticky.
- Non-scale targets never receive `.ds-control-press-scale`.
- An elevation wrapper around an approved filled or unfilled button adds
  `.ds-control-elevation--press-scale`; wrappers around non-scale controls omit
  it.
- New component-local `:active` scale/transform declarations fail the inventory
  test unless the policy and an explicit component-specific exception are
  updated together.
