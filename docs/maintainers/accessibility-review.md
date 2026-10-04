# Accessibility journeys and visual review

Automated checks are evidence about specific contracts, not WCAG certification.
Use this process alongside [testing](testing.md) and [forced colors](forced-colors.md).
The maintainer reviewing a component change owns the relevant journey; a person
familiar with the assistive technology owns the listening pass. Record evidence
in the PR, including failures and untested cells. Do not mark manual checks as
passed from an Axe result or accessibility-tree snapshot.

## Representative matrix

| Journey                          | Automated owner                                                        | Manual verification                                                                             |
| -------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Navigation and tools             | `shell-managed`, `shell-mobile`, `navigation-lifecycle` rendered specs | Identify current destination, open a tool, navigate away and back without losing context        |
| Form → selection → review → save | `accessibility-journey` plus `form-contracts`                          | Names/descriptions, error recovery, expanded choice, dialog entry/return, one save announcement |
| Menus and dialogs                | `accessibility-overlays`                                               | Traverse choices, cancel, confirm; focus never reaches background content in a modal            |
| Large tables                     | `table-virtual`, `scroll-region-focus`                                 | Headers and row context, keyboard scroll, newly materialized content, selection and loading     |
| Conversation and agent output    | `agent-conversations`, `message-composer`, `message-scroller-width`    | Read a transcript, submit a message, hear relevant completion without announcing every token    |

Run keyboard journeys in Chromium, Firefox, and WebKit. Use VoiceOver with
Safari on macOS and NVDA with Firefox and Edge on Windows for the initial
manual matrix. Use actual mobile Safari with VoiceOver for the mobile shell
journey when mobile behavior changes. Record browser, OS, screen-reader version,
verbosity settings and input method; version names alone do not prove coverage.
The PR reviewer may adjust the matrix when the consuming product has a more
specific support policy.

## Reproducible listening pass

1. Build and serve the rendered fixtures with the Vite command from
   `playwright.config.ts`, or open the corresponding Storybook composition.
2. Start with a fresh browser context, light theme, keyboard navigation, and
   the screen reader's default verbosity. Repeat relevant states in dark theme
   and the platform's high-contrast mode.
3. Follow a complete journey in the table. Record the focused element, announced
   name/role/state/description, expected result, observed result and exact steps.
   Include validation failures, cancellation and recovery, not only success.
4. Repeat with browser zoom at 200% and 400%, then the browser's text-only zoom
   at 200% where supported. Confirm reading order, clipping, visible focus,
   target access, and reachability at 320 CSS pixels. A narrowed viewport or
   increased root font in automation does not replace real browser zoom.
5. Repeat motion-sensitive states with reduced motion, and Windows Contrast
   Themes with both a light and a dark theme. Confirm alternatives to color and
   motion remain meaningful. Do not alter the approved score palette here.
6. File reproducible failures with a WCAG criterion where established, severity,
   affected browser/AT combination and an authoritative regression layer. Link
   each correction to its regression. Coordinate changes to typography with
   the token owner rather than changing fixed control metrics independently.

Use a compact PR record: journey, environment, steps, expected/actual, result
(pass/fail/not run), evidence, reviewer. Leave the reviewer and result blank
until the listening pass happens.

## Focused visual baselines

`npm run test:visual` compares four element screenshots: the settings form with
keyboard focus and its focused review dialog, in light and dark themes. It uses
bundled Inter, a fixed viewport, locale, timezone and reduced motion. These
baselines protect focus, clipping, borders and theme composition; they do not
replace semantic or keyboard tests.

Baselines are platform-specific because font rasterization differs. The initial
committed set is Chromium on macOS; missing baselines on another platform must
fail rather than silently record. The three-engine semantic gate remains on
Linux CI. Add a separately reviewed Linux image set before enabling visual
comparison there. Keep visual tests separate from the engine-neutral rendered
suite so Linux CI never compares against macOS pixels.

After an intentional visual change, run
`npm run test:visual -- --update-snapshots` in the baseline environment, inspect
every changed image, and run again without updating. The PR author supplies
before/after images and explains intended changes; the component/design reviewer
approves the baseline diff. Never update snapshots automatically in CI or widen
the pixel threshold just to accept an unexplained failure. Playwright preserves
actual/expected/diff images and traces under `test-results/` on failure.
