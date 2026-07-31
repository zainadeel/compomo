# Component lifecycle

Lifecycle status describes public-contract maturity for consumers and agents. It
does not grade visual quality, prohibit production use, or replace semantic
versioning.

## Status meaning

- `experimental`: the component is usable, but its public contract or intended
  composition may still change as the product pattern settles.
- `stable`: the component's public contract and intended composition are
  supported across documented frameworks.
- `deprecated`: consumers should migrate to `replacedBy`, or follow the
  recorded replacement reason when no direct replacement exists.
- `removed`: the stable ID remains reserved for discovery and migration
  history, but the component is no longer shipped.

## Graduation gate

Promote an experimental component to stable only when all of these are true:

1. Its public props, events, methods, slots, and composition responsibility are
   settled, with no active redesign that would redefine them.
2. Its source, story, agent JSON, and referenced pattern agree on ownership.
3. Focused tests cover its meaningful behavior and any browser-sensitive
   geometry, focus, pointer, form, or overlay contract.
4. Accessibility and responsive behavior are represented in both intent and
   rendered verification where applicable.
5. A publish-shaped build and framework-consumer verification pass with the
   component included.

Production use by itself is not a graduation signal. Conversely, experimental
does not mean an agent should recreate the component locally; agents should
still prefer the canonical component and respect its documented ownership.

## Changing status

Inspect the component artifacts, referenced patterns, current issues, and
focused tests. Change the co-located agent JSON, regenerate the registry, and
run agent validation. A stable contract that must be replaced follows the
deprecation and stable-ID rules in the
[agent contract RFC](../agent-contract-rfc.md).
