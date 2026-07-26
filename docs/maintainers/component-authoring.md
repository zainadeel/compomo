# Component authoring

Read this with `src/wc/AGENTS.md` and the nearest existing component that shares
the intended behavior.

## Add a component

Create `src/wc/components/<PascalName>/` with:

```text
<Name>.tsx
<Name>.css
<Name>.stories.ts
<Name>.agent.json
```

Use `@Component({ tag: 'ds-*', styleUrl: '<Name>.css', scoped: true })` unless
the implementation has a concrete shadow-DOM requirement.

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

## Documentation

Add consumer explanation only when a prop table or story cannot communicate the
concept. Put that explanation in Storybook MDX and link to the authoritative
component or pattern rather than copying its API.
