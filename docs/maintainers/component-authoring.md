# Component authoring

Read this with `src/wc/AGENTS.md` and the nearest existing component that shares
the intended behavior.

## Add a component

Start from the authored-file scaffold:

```bash
npm run component:new -- StatusNote --summary "A persistent contextual message." --story-title "Feedback/StatusNote"
```

Use `--dry-run` to preview paths. The command refuses existing names and tags,
creates only the following files in `src/wc/components/<PascalName>/`, and never
writes generated adapters or registry files:

```text
<Name>.tsx
<Name>.css
<Name>.stories.ts
<Name>.agent.json
```

Use `@Component({ tag: 'ds-*', styleUrl: '<Name>.css', scoped: true })` unless
the implementation has a concrete shadow-DOM requirement.

The scaffold is an experimental slot container. Choose its actual semantics,
state ownership and composition before adding behavior. Replace every
`[AUTHOR: ...]` entry in its agent JSON with component-specific intent; remove a
truly inapplicable optional section instead of inventing a contract. Stories
must demonstrate the supported public states. Add tests for the behavior being
introduced, rather than a test that only proves the scaffold exists.

Run `npm run verify:authoring` for source-only feedback on missing artifacts,
duplicate tags, metadata/schema mismatches and unfinished scaffold guidance.
It also runs before typechecking, so it needs no generated build output. The
post-build agent validation still checks compiler API and composition facts.

After implementation:

```bash
npm run typecheck
npm run lint
npm run lint:css
npm run test
npm run build
npm run agent:validate
```

Add focused rendered coverage when behavior depends on layout, focus, pointer,
browser APIs, or responsive state.

## Ownership

- Stencil source owns props, events, methods, slots, semantics, and behavior.
- Component CSS and shared utilities own implementation geometry.
- Stories demonstrate supported states and compositions.
- Agent JSON explains selection, avoidance, state ownership, accessibility, and
  responsive intent without duplicating generated API facts.
- Executable patterns own reusable multi-component composition.

## Source patterns

- Reactive input: `@Prop()`.
- Internal render state: `@State()`.
- Prop side effect: `@Watch()`; call the same logic during initial lifecycle
  when the initial value also requires it.
- Consumer intent: `@Event()`.
- DOM reference: `@Element()` or a JSX ref.
- Consumer content: slots.
- Polymorphic native semantics: select the native element in `render()`.

Do not use component inheritance to share UI behavior. Extract a controller,
pure function, or shared CSS recipe when several components have the same
contract.

Prefer an existing component or executable pattern when it already owns the
interaction. Share a utility only when its consumers have the same contract;
leave semantics, controlled state and events with the component. Review the
form and connection-lifecycle guidance below for components that own those
resources. The [authoring lint rules](linting.md#repository-authoring-checks)
enforce a small set of structural conventions, while
[rendering security](rendering-security.md) describes content boundaries.

## Connection lifecycle

Custom elements can be removed and reinserted without being recreated.
`componentDidLoad()` runs once; use `connectedCallback()` to restore observers
and listeners on subsequent connections. When setup needs rendered DOM, share
it between those hooks and guard the first connection until rendering finishes.

Release observers, listeners, timers, and animation frames on disconnect, and
clear their handles. Prevent pending asynchronous work from updating a detached
component; use a connection generation when an old promise could finish after
reconnection. On reconnect, measure the current DOM and reconcile the latest
props even when the dimensions have not changed.

`ConnectionTasks` in `src/wc/utils/connection-tasks.ts` tracks cancellable frames
and guards microtasks or promise callbacks against an earlier connection. Call
its `cancel()` during disconnect and clear any component-owned frame handles.
Observers, listeners, and timers still need explicit teardown by their owner.
Controlled overlays reconcile their current `open` prop when reconnected. Reset
internally opened menus and pickers to closed on removal. Disconnecting cancels
exit work without emitting a stale completion event or returning focus from an
old connection; a normal connected close still owns its completion and focus.
When removal interrupts a shared transition or drag, release the original
owner's transition gate and restore any document styles changed by the drag.

For components that own these resources, add rendered coverage for repeated
disconnect/reconnect cycles and input changes while detached. See
the [chart lifecycle tests](../../tests/e2e/chart-lifecycle.spec.ts) for an example
that also controls font loading, and the
[navigation lifecycle tests](../../tests/e2e/navigation-lifecycle.spec.ts) for
transition ownership and interrupted drag cleanup.

Scoped slots can relocate authored nodes beneath rendered wrappers. When slot
presence or content changes drive component state, observe the relevant subtree
and slot attributes, and include character-data changes when plain text matters.
Keep the reconciliation idempotent so rendering does not cause an observer loop.
The [content lifecycle tests](../../tests/e2e/content-lifecycle.spec.ts) cover
responsive card measurement and dynamic slotted content after reconnection.
The [runtime lifecycle tests](../../tests/e2e/runtime-lifecycle.spec.ts) cover
controlled overlays, internal pickers, parsing, motion, and scroll observation.

Use `resolveCssLengthPx` for CSS-driven layout math and pass the component's
element when a length belongs to its inherited theme or font scope. Only fixed
numeric and pixel literals may be cached across measurements. Theme tokens,
relative font units, and viewport expressions must follow their current context.

## Form controls

Form-associated components own submission, validity, reset, disabled-fieldset
behavior, and browser state restoration. Reuse the helpers in
`src/wc/utils/form-association.ts` while keeping each control's meaning of an
empty or valid value in its own implementation.

Keep restoration state separate from submission when the two differ. An
unchecked checkbox, an inactive control, or a selection whose options have not
arrived can submit nothing while still having state worth restoring. Serialize
enough state to reconstruct the control, validate it when restoring, and do not
emit user-change events during reset or restoration.

Watch every prop that affects native form state, including validation messages,
options, and names used to construct repeated entries. Run the same sync during
initialization. Expose a reflected `form` prop so property bindings and generated
framework adapters can associate a control with an external owner.

Extend the [form contract tests](../../tests/e2e/form-contracts.spec.ts) when
adding a control. They exercise native submission, reset, disabled fieldsets,
external owners, and restoration state across supported browsers. The fixture
records real `ElementInternals` calls and invokes the restoration callback
deterministically; it does not assume that browser history or autofill will
choose to restore a page on every run.

## Documentation

Add consumer explanation only when a prop table or story cannot communicate the
concept. Put that explanation in Storybook MDX and link to the authoritative
component or pattern rather than copying its API.
