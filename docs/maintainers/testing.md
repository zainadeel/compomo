# Testing strategy

Test in proportion to risk. Prefer the smallest deterministic check that would
fail for the regression, then broaden for shared or browser-sensitive changes.

| Change | Minimum verification |
| --- | --- |
| Prose documentation | links, formatting, relevant docs build |
| Agent JSON or pattern | `npm run agent:validate` |
| Pure TypeScript logic | focused Node test, `npm run typecheck` |
| Component rendering or events | focused unit test plus typecheck |
| CSS geometry or interaction | `npm run lint:css` plus focused Playwright test |
| Forms, overlays, focus, responsive shell | affected Playwright suite |
| Story or accessibility behavior | Storybook build and scoped a11y test |
| Component API/build output | `npm run build` |
| Public exports/package contents | `npm run verify:pack` |

Use all supported browsers when changing browser APIs, focus, layout
measurement, popup positioning, form association, scrolling, or animation
lifecycle. Chromium-only is appropriate for a narrow local geometry check when
cross-browser behavior is unaffected.

Rendered tests should assert public behavior or stable geometry contracts, not
incidental implementation classes unless the class itself is the tested shared
recipe.

Do not report a suite as passing unless it ran to completion. Record existing
warnings separately from failures.
