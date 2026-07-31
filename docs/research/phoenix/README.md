# Phoenix baseline research

This folder records a point-in-time comparison between Phoenix, the design
library used by the current web application, and CompoMo, the forward-looking
component layer of the ds-mo design system.

Phoenix is context, not a specification for CompoMo. These documents explain
what the production library currently covers and where the two systems make
different decisions. They do not authorize copying Phoenix source, preserving
its component boundaries, or treating every difference as a CompoMo backlog
item.

## Baseline

The audit was performed on July 31, 2026.

| Library | Audited revision | Package version | Primary evidence                                                                                              |
| ------- | ---------------- | --------------- | ------------------------------------------------------------------------------------------------------------- |
| Phoenix | `6d027925556f`   | `14.37.0`       | `projects/core/src/public-api.ts`, component source, stories, and the local Storybook 6.5.16 catalog          |
| CompoMo | `e6154e0f0987`   | `13.4.0`        | `public/r/registry.json`, co-located `*.agent.json`, component source, and the local Storybook 10.5.5 catalog |

The Phoenix repository is a newly imported snapshot, so this audit cannot infer
historical rationale from its Git history. It can describe the current code and
rendered behavior only.

## How to use this research

- Use the [coverage audit](component-coverage.md) to understand broad overlap
  and gaps before proposing roadmap work.
- Use the [shared-component comparison](shared-component-comparison.md) when a
  product or migration question requires the current Phoenix baseline.
- Confirm exact CompoMo APIs in source, Storybook, or `public/r/`; this folder is
  not an API reference or a continuously maintained inventory.
- Re-run the audit before making claims about a later Phoenix or CompoMo
  release.

Coverage is not a mandate. A Phoenix-only component may be a real platform
need, an application-specific abstraction, a composition that CompoMo should
not package, or a deprecated pattern. A CompoMo-only component may represent a
new product direction rather than a Phoenix migration target.

## Phoenix reference policy

Do not consult Phoenix by default while authoring or redesigning a CompoMo
component. Consult it only when the task explicitly asks for one of these:

- current-production comparison;
- migration or compatibility analysis;
- naming or coverage audit;
- investigation of a known current-webapp behavior.

When Phoenix is in scope:

1. Compare user need, interaction contract, states, accessibility, and product
   ownership before comparing visual details.
2. Classify observed behavior as **carry forward**, **rethink**, **reject**, or
   **unknown**. Do not silently preserve it.
3. Treat Phoenix implementation details as evidence of current constraints,
   not as code to port.
4. Ask for a product decision when carrying behavior forward would materially
   shape CompoMo's public contract.
5. Keep application logic, data fetching, routing, and workflow consequences
   outside a general component unless CompoMo explicitly owns that pattern.

## Default research order for new components

Unless the task explicitly calls for Phoenix, research in this order:

1. Native web-platform behavior and relevant accessibility standards or WAI-ARIA
   Authoring Practices.
2. Current implementations and guidance from multiple mature open-source design
   systems or headless accessibility libraries. Candidates may include Adobe
   Spectrum/React Aria, Material, Carbon, Radix, and GOV.UK, selected for the
   component being researched.
3. CompoMo's existing primitives, TokoMo tokens, agent intent, and composition
   patterns.
4. Product requirements demonstrated in Lab.

Use several references when the interaction is complex. The goal is a robust
component for the future platform, not a restyled Phoenix implementation.

## Evidence limits

This is an orientation audit, not an accessibility certification, usage census,
or recommendation to deprecate Phoenix. Static source and Storybook demonstrate
available contracts; they do not prove which variants are used in production or
that every state behaves correctly in every browser and assistive technology.
