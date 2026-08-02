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

## Browser tiers and ownership inventory

Rendered tests remain cross-browser by default. A reviewed assertion may use
`chromiumOnly(owner, reason)` from `tests/e2e/browser-tier.ts` when Chromium is
the authoritative layer for engine-neutral composition, token-backed geometry,
or an integrated Axe fixture already covered by the Storybook state matrix.
The reason is required and is emitted in the machine-readable inventory.

Do not use the Chromium-only tier for browser APIs, focus behavior, native form
association, popup positioning, scrolling, responsive owner identity, direct
touch, or animation lifecycle. Those cases continue in Chromium, Firefox, and
WebKit.

```bash
npm run test:inventory:check
npm run test:inventory > test-inventory.json
```

The inventory resolves every Node test, actual Playwright case (including
parameterized cases), and exported Storybook story to its owner, risk, decision,
browser set, and rationale. `tests/test-ownership-policy.json` holds defaults,
audited suite boundaries, and the pre-audit browser-execution baseline. CI
rejects missing ownership metadata or an audited policy that does not reduce
the baseline.

Storybook owns generic component Axe coverage across documented light and dark
states. Keep a fixture Axe scan only when it covers an integrated, open, focused,
loading, live-region, or semantic-document state that the component stories do
not reproduce. Retained fixture scans use `chromiumOnly('accessibility', reason)`;
the interaction that establishes the state remains cross-browser in its own
test. Retired fixture scans and their Storybook replacements are recorded in the
inventory policy so deletion retains an explicit ownership trail.

Rendered tests should assert public behavior or stable geometry contracts, not
incidental implementation classes unless the class itself is the tested shared
recipe.

Use `tests/e2e/rendered-geometry.ts` for measured layout contracts. Its default
half-pixel tolerance covers ordinary CSS subpixel rounding without accepting a
whole-pixel regression. The larger composited-edge ceiling is only for adjacent
moving layers and remains strict enough to reject a visible gap. Use definite
bounds and hit-target checks when a rendered test depends on fixture-owned
viewport dimensions or pointer geometry, so an invalid fixture fails as setup
rather than masquerading as a component regression.

Do not report a suite as passing unless it ran to completion. Record existing
warnings separately from failures.
