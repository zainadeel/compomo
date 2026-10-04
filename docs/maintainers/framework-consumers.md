# Packed framework consumer contracts

`npm run test:framework-consumers` installs the npm tarball in a temporary
consumer, bundles the fixtures in `tests/fixtures/framework-consumers/`, and
launches real framework renderers in a browser. It never aliases `@ds-mo/ui` to
source or resolves the fixture's packages from this repository. Temporary
installs and servers are cleaned up on failure as well as success.

The Angular fixture is a standalone application using generated per-component
adapters, Angular reactive forms and the published value accessors. It covers
string, empty, numeric, null and range values, required validation, disabled
state, reset, dirty/touched state, update-on-blur/submit, delayed options,
external native form ownership and adapter destruction/recreation with a
surviving form model. Browser actions edit the actual native controls; the
existing native suite still owns browser form restoration and fieldset policy.

React renders generated wrappers inside development StrictMode. Vue uses the
generated `modelValue`/`update:modelValue` binding, the render-function equivalent
of `v-model`. Both verify controlled updates, event delivery exactly once,
unmount/remount cleanup and a controlled dialog's dismissal/focus return.
React additionally checks forwarded element refs; Vue checks boolean models.
Each renderer also preserves the mounted input and its value while ShellApp
changes between mobile, tablet and desktop presentation.
The fixtures intentionally keep application logic small and inspect observable
state, not renderer internals.

By default the command runs Chromium. Set
`FRAMEWORK_BROWSERS=chromium,webkit` for the local macOS engines, or
`FRAMEWORK_BROWSERS=chromium,firefox,webkit` for Linux. The rendered-contract CI
job runs all three after installing Playwright browsers. The full local PR
gate includes the Chromium consumer run.

Framework versions are the exact installed lockfile versions, selected within
`package.json` peer ranges and copied into the isolated consumer manifest.
This is a tested current-version matrix, not proof of every older version
allowed by the peer ranges. A change to the supported lower bound requires a
separate lower-bound fixture run before changing that compatibility claim.
Stencil remains the sole implementation of component behavior.

React and Vue keep a stable application container inside the shell's scoped slot;
conditional children mount and unmount inside that container. Direct removal of
a relocated slot child is not a supported React/Vue contract. Stencil's experimental
slot fixes also change DOM traversal and text semantics, so enabling them requires
passing the complete native and accessibility suites, not just the consumer test.

To extend coverage, change the executable fixture and its assertions in
`scripts/verify-framework-consumers.mjs` together. Keep native component
geometry and the full accessibility state matrix in their existing suites.
Use [framework integration](../framework-integration.md) for consumer setup.
