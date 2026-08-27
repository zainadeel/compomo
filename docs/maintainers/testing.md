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

On macOS, the default `npm run test:e2e` run intentionally uses Chromium and
WebKit only. Playwright's bundled Firefox build is a Nightly application and
can hang during headless launch on macOS, leaving high-CPU browser workers
behind. Firefox remains part of Linux CI; use the Docker helper below for local
Firefox coverage.

Set `PLAYWRIGHT_ENABLE_FIREFOX=1` only when deliberately investigating the
native macOS Firefox path.

### Local Firefox on macOS

When the Playwright Firefox build cannot launch on the host macOS version, run
Firefox in the pinned Playwright Linux image:

```bash
npm run test:e2e:firefox:local -- tests/e2e/example.spec.ts
```

The helper resolves the Playwright image version from `package-lock.json`, uses
an isolated Docker volume for Linux dependencies, and forwards additional
Playwright arguments. On macOS, install and start a lightweight Docker runtime
once with `brew install colima docker` and `colima start --cpu 4 --memory 8`.
Worktrees outside Colima's default `/Users` mount must be added explicitly; the
helper prints the exact scoped restart command when that is required.

## Browser tiers and ownership

The pull-request gate runs the focused `@pr-critical` and `@cross-browser`
contracts in Chromium, Firefox, and WebKit. These tests cover native forms and
focus, anchored overlays, scrolling, touch, responsive shell ownership,
virtualization, and motion lifecycle. The unit guard in
`tests/browser-tier.test.ts` keeps every engine-sensitive behavior family in
that set.

The full rendered Chromium suite is the local preflight and remains available
as `npm run test:e2e:chromium`. A reviewed assertion may use
`chromiumOnly(owner, reason)` from `tests/e2e/browser-tier.ts` when Chromium is
the authoritative layer for engine-neutral composition, token-backed geometry,
or an integrated Axe fixture already covered by the Storybook state matrix. The
reason is required and stays beside the test so reviewers can evaluate the tier
without consulting another policy list. Mark a small, representative contract
`@pr-critical` when it belongs in the always-on three-engine pull-request gate;
use `@cross-browser` when cross-engine behavior is itself the assertion.

Do not use the Chromium-only tier for browser APIs, focus behavior, native form
association, popup positioning, scrolling, responsive owner identity, direct
touch, or animation lifecycle. Those cases continue in Chromium, Firefox, and
WebKit.

Storybook owns generic component Axe coverage across documented light and dark
states. Light mode runs the complete serious/critical rule set. Dark mode repeats
the CSS-dependent contrast rules across the same component states; theme-
invariant semantics are not scanned twice. Keep a fixture Axe scan only when it
covers an integrated, open, focused, loading, live-region, or semantic-document
state that the component stories do not reproduce. Retained fixture scans use
`chromiumOnly('accessibility', reason)`; the interaction that establishes the
state remains cross-browser in its own test. When removing a scan or
consolidating rendered coverage, identify its authoritative replacement in the
pull request. Git history keeps that decision with the deletion without creating
a second test catalog that must stay in sync.

Rendered tests should assert public behavior or stable geometry contracts, not
incidental implementation classes unless the class itself is the tested shared
recipe.

Opening or preparing a pull request always requires a fresh, successful local
`npm run verify:local:full` run after the final code change. Treat a request to
open a PR as an instruction to run this preflight first; the focused GitHub PR
gate is not a substitute. If it fails or cannot complete, do not open the PR as
verified—report the failure or blocker. Also run the focused rendered spec for
every affected component. Use `npm run test:e2e:chromium --
tests/e2e/<spec>.spec.ts` for ordinary rendered changes. Run the corresponding
WebKit contract locally, and the Docker-backed Firefox helper where browser APIs
or engine-sensitive behavior changed. Use `npm run test:e2e:webkit --
tests/e2e/<spec>.spec.ts` for the local WebKit contract. Use `npm run
test:e2e:pr` to reproduce the three-engine pull-request gate on Linux; macOS
omits native Firefox unless it is deliberately enabled.

Use `tests/e2e/rendered-geometry.ts` for measured layout contracts. Its default
half-pixel tolerance covers ordinary CSS subpixel rounding without accepting a
whole-pixel regression. The larger composited-edge ceiling is only for adjacent
moving layers and remains strict enough to reject a visible gap. Use definite
bounds and hit-target checks when a rendered test depends on fixture-owned
viewport dimensions or pointer geometry, so an invalid fixture fails as setup
rather than masquerading as a component regression.

Do not report a suite as passing unless it ran to completion. Record existing
warnings separately from failures.
