# Phoenix and CompoMo component coverage

This is a family-level audit, not a one-to-one class count. Phoenix exposes
Angular components, directives, and services with several related classes per
family. CompoMo exposes framework-neutral custom elements and deliberately
packages some concerns at different boundaries.

At the audited revisions:

- Phoenix has 70 public `lib/` families after excluding locale, pipes, and
  service-only exports.
- CompoMo has 66 registered custom elements: 36 marked stable and 30 marked
  experimental in their agent intent.
- 22 normalized clusters address the same or a closely related user need. Those
  clusters contain 23 CompoMo elements because CompoMo splits filled and
  unfilled buttons.
- 44 Phoenix public families have no dedicated CompoMo element.
- 43 CompoMo elements have no dedicated Phoenix family.

The numbers are orientation signals only. A family can contain several public
components, and a missing dedicated component may already be achievable through
composition.

The Phoenix count comes from unique first-level `lib/` paths exported by
`projects/core/src/public-api.ts`. The CompoMo count comes from
[`public/r/registry.json`](../../../public/r/registry.json). Storybook was used
to confirm discoverability, names, variants, and explicit deprecation labels;
source remained authoritative when Storybook grouping differed from public
exports.

## Shared or near-equivalent needs

**Same core need** means the libraries address substantially the same user job.
**Near** means the apparent match has meaningfully different ownership or
boundaries and should not be treated as drop-in parity.

| Phoenix                                | CompoMo                      | Match          | Boundary note                                                                                                                                                                                                                   |
| -------------------------------------- | ---------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Badge                                  | Badge                        | Same core need | Phoenix supports counts and status styling; CompoMo narrows Badge to a counter or dot supplement owned by another control or label.                                                                                             |
| Breadcrumb                             | Breadcrumb                   | Same core need | Both provide hierarchical navigation; CompoMo explicitly supports native links or application-owned selection and current-page semantics.                                                                                       |
| Button                                 | ButtonFilled, ButtonUnfilled | Same core need | Phoenix combines role, intent, background, and emphasis in one directive. CompoMo separates primary and secondary/chrome actions and gives persistent toggle state only to ButtonUnfilled.                                      |
| Card and Overview                      | CardOverview                 | Near           | Phoenix provides generic Card variants plus a keyboard-navigable Overview container. CompoMo CardOverview owns a specific headline-score, reporting-period, and comparable-measures composition.                                |
| Form Card                              | CardSetting                  | Near           | Both support view/edit settings surfaces. CompoMo fixes the view/edit/save/cancel ownership while leaving body content to the application.                                                                                      |
| Checkbox                               | Checkbox                     | Same core need | Both support checked, unchecked, mixed, disabled, and form integration. CompoMo also defines density and presentation-only modes.                                                                                               |
| Divider                                | Divider                      | Same core need | CompoMo is decorative by default and makes structural separator semantics explicit.                                                                                                                                             |
| Icon                                   | Icon                         | Same core need | Phoenix uses an Angular directive and icon map. CompoMo securely lazy-loads canonical IcoMo glyphs and distinguishes decorative from named graphic use.                                                                         |
| Input                                  | Input                        | Same core need | Phoenix styles native input/textarea hosts and adds separate search/password components. CompoMo owns a form-associated single-line custom element; search and password are types, while textarea remains outside its contract. |
| Spinner                                | Loader                       | Same core need | Both communicate indeterminate progress. CompoMo can expose polite standalone status text and inherits the owning control's color.                                                                                              |
| Menu and Dropdown                      | Menu                         | Near           | Phoenix separates a generic overlay/dropdown mechanism from menu content. CompoMo Menu owns anchored command and choice-menu behavior, not a generic popover primitive.                                                         |
| Dialog and Modal                       | Modal                        | Same core need | Phoenix composes Modal over a custom CDK overlay/dialog. CompoMo uses a native top-layer dialog for focused confirmations and short blocking tasks.                                                                             |
| Radio List and deprecated Radio Select | Radio                        | Same core need | CompoMo packages a complete form-associated one-of-many set with roving focus rather than separate radio and list owners.                                                                                                       |
| Select and Mobile Select               | Select                       | Same core need | Both cover single/multiple choice and search. Phoenix also owns data-source, server-search, virtual-scroll, template, link-option, and option-creation concerns; CompoMo keeps a smaller data and interaction contract.         |
| Skeleton                               | Skeleton                     | Same core need | Both preserve pending geometry; CompoMo defines Skeleton as an aria-hidden atomic placeholder rather than a complete loading state.                                                                                             |
| Slider                                 | Slider                       | Same core need | Both support single/range values and formatting. CompoMo also owns vertical orientation, form association, read-only behavior, and explicit accessible labels for both thumbs.                                                  |
| Toggle                                 | Switch                       | Same core need | Phoenix combines switch and toggle-button modes. CompoMo reserves Switch for immediate settings and uses ButtonUnfilled `pressed` for persistent toggle buttons.                                                                |
| Tabset                                 | TabGroup                     | Same core need | Phoenix combines local selection with optional Angular Router matching. CompoMo keeps TabGroup local and moves route navigation into BarNav and PanelNav.                                                                       |
| Tag                                    | Tag                          | Same core need | Phoenix includes display and upsell variants. CompoMo keeps Tag as metadata/status or a menu trigger and gives removal ownership to Chip.                                                                                       |
| Text                                   | Text                         | Same core need | Both expose tokenized typography. CompoMo emphasizes semantic HTML and measurable line-box recipes.                                                                                                                             |
| Toast                                  | Toast                        | Same core need | Both provide a global manager, stacking, timed dismissal, intents, actions, and hover pausing. CompoMo adds anchored feedback, promise states, priority announcements, keyboard access, and swipe dismissal.                    |
| Tooltip                                | Tooltip                      | Same core need | Phoenix combines hover/click tooltip, toggle-tip, templates, and closable content. CompoMo deliberately limits Tooltip to supplementary non-interactive labeling on hover-capable pointer and keyboard focus.                   |

## Phoenix-only dedicated families

These 44 public families do not have a dedicated CompoMo custom element. The
grouping suggests decision areas; it is not a proposed roadmap.

| Area                           | Phoenix families                                                                                                                   | First-pass interpretation                                                                                                                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Action compositions            | Action Row, Button Group, Menu Button, Button Select, Split Button, Upsell Button, Floating Button, Icon Button, Navigation Button | Several may be compositions of CompoMo buttons, Menu, Badge, and layout recipes rather than new primitives. Split actions and button-based selection need separate interaction research.                                  |
| Foundations and layout helpers | Addon, Addon Wrapper, Filter Row, Grid, Middle Truncate, Scrollable, Underline                                                     | Some are CSS/layout recipes or directives rather than durable component boundaries. Evaluate the user contract before creating elements.                                                                                  |
| Inline feedback                | Alert, Banner                                                                                                                      | CompoMo has Toast and EmptyState, but neither replaces persistent in-flow status or page-level announcement. This is a genuine uncovered need when products require it.                                                   |
| Surfaces and disclosure        | Bottom Sheet, Collapse, Drawer, Modal Upsell                                                                                       | CompoMo has application navigation sheets and Modal but no generic sheet, drawer, accordion/disclosure, or upsell modal. Do not stretch those existing contracts to substitute.                                           |
| Form and data entry            | Comment Field, Date Picker, Date Picker Group, File Upload, Month Picker, Tag Select, Time Picker, Tokenize Input, Typeahead       | These are substantial uncovered workflows. Input already covers search and password types, but CompoMo has no general textarea or autocomplete owner. AttachmentList is display-only and is not a file-upload substitute. |
| Data display and navigation    | Carousel, Link, deprecated List, Nav Card, Pagination, Summary, Table                                                              | Table/pagination and native-link guidance are likely higher-value decisions than recreating every container. ConversationList is specialized and does not replace a general List.                                         |
| Media                          | Document Viewer, Gallery, Image Pan/Zoom                                                                                           | Product-specific media needs are not represented in CompoMo.                                                                                                                                                              |
| Reordering                     | Drag and Drop, deprecated Draggable List                                                                                           | Research native input methods, keyboard alternatives, and product consequences before choosing a reusable boundary.                                                                                                       |
| Specialized search             | Omni Search Filter                                                                                                                 | This appears closer to a product composition than a general primitive; validate ownership before considering parity.                                                                                                      |

Phoenix Storybook explicitly labels Draggable List, List, and Radio Select as
deprecated. Its Button stories also deprecate the icon type in favor of the
dedicated Icon Button. Presence in Phoenix therefore does not imply a pattern
should survive.

Phoenix source also contains `sheet` and `tile` directories that are not
exported by `projects/core/src/public-api.ts`; they are excluded from the public
coverage count.

## CompoMo-only dedicated elements

These 43 elements have no dedicated Phoenix public family.

| Area                             | CompoMo elements                                                                                                                                                                                                                                              | Direction represented                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Agent and conversation           | AgentActivity, AgentResponse, AgentSourceList, AgentToolCall, AttachmentList, CodeBlock, ConversationList, ConversationListItem, ConversationListSection, Markdown, Message, MessageActions, MessageBubble, MessageComposer, MessageScroller, TypingIndicator | A channel-neutral conversation and agent-response system with explicit ownership boundaries.                                                           |
| Application shell and navigation | BarNav, BarTitle, BarWorkflow, MobileBarNav, MobileHeader, MobileSectionSwitcher, MobileSheetNav, PanelNav, PanelSubNav, PanelToolHeader, PanelToolSearch, PanelTools, ShellApp, ShellPage, ShellTools                                                        | A managed responsive application shell rather than isolated navigation widgets.                                                                        |
| Data visualization               | CardDataViz, ChartBar, ChartDonut, ChartLegend, ChartLine, TooltipDataViz                                                                                                                                                                                     | A shared visualization language and chart composition layer not present as public Phoenix families.                                                    |
| General primitives and utilities | Avatar, Chip, EmptyState, Field, ScrollOverlay, SwatchPicker                                                                                                                                                                                                  | New separations for identity, removable metadata, empty content, accessible field composition, persistent-footer scrolling, and curated visual choice. |

## High-signal future decisions

The audit makes these areas worth deliberate research when product demand
appears. They are not automatically approved work:

1. Table plus pagination and data-density behavior.
2. Date and time selection.
3. Persistent inline alert and banner feedback.
4. General textarea, autocomplete/typeahead, and tokenized entry.
5. File upload, progress, recovery, and attachment intake.
6. Generic disclosure, popover, drawer, and bottom-sheet boundaries.
7. Generic card and list patterns versus application-owned composition.
8. Link guidance or a Link component, especially across router adapters.
