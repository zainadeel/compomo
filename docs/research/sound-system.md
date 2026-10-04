# Optional sound: architecture decision

Status: proposed for maintainer/design review. This is an investigation and a
bounded prototype specification, not authorization for automatic audio or a
new published package. CompoMo should keep emitting its existing interaction
intents. Prefer an independently owned, optional `@ds-mo/sounds` experiment with
application-owned mappings before considering any component adapter.

## Inspected evidence

The original CueLume URL redirects to `danielwh2/cuelume`. The source reviewed
is commit `6ee4f7fab7890aeeb702cc311b14c6de937eceb5` (October 2, 2026); npm reports
`cuelume@0.2.4`, 178,023 unpacked bytes. Source and published artifacts must be
compared before reusing a recipe; the README already describes a v0.3 migration
while the manifest still declares 0.2.4.

The inspected npm tarball contains compiled ESM/declarations for the engine,
bindings and all palettes, README, manifest and MIT license; it contains no audio
assets. Its compressed package download is 36,446 bytes. Bundling its complete
public entry with the repository's esbuild, minified ESM, measured 26,768 raw,
7,464 gzip and 6,584 Brotli bytes. These are complete-entry comparison numbers,
not an application-specific tree-shaking claim. Importing that published entry
in Node without browser globals succeeded. The published engine also defaults
enabled and exposes no disposal/visibility policy.

- [Audio engine](https://github.com/danielwh2/cuelume/blob/6ee4f7fab7890aeeb702cc311b14c6de937eceb5/src/audio/engine.ts): lazy shared context, a reusable noise buffer/output bus and reverberation, bounded per-cue voice replacement, gain normalization, user-activation check and silent resume rejection. Enablement starts **true**. Disabling affects future playback rather than stopping current voices. Resume callbacks can retain captured playback settings; there is no disposal or hidden-document policy. Tone/noise synthesis and random variation require listening and real-browser measurement, beyond mocked tests.
- [Delegated bindings](https://github.com/danielwh2/cuelume/blob/6ee4f7fab7890aeeb702cc311b14c6de937eceb5/src/interactions/bind.ts): idempotent roots and handled-event deduplication, native select/change handling, keyboard/IME filtering and legacy hover throttling. Binding returns no disposer. Closest-element lookup uses `event.target`, so composed/shadow boundaries and cancelled interactions need explicit experiments before adapting this to custom elements.
- [Runtime tests](https://github.com/danielwh2/cuelume/blob/6ee4f7fab7890aeeb702cc311b14c6de937eceb5/test/runtime.test.mjs): mocked audio coverage checks canonical names, themes, envelope constraints, activation, failures, volume, voice replacement and delegated events. This is useful lifecycle evidence, not an audible quality assessment or mobile autoplay certification.
- [Package manifest](https://github.com/danielwh2/cuelume/blob/6ee4f7fab7890aeeb702cc311b14c6de937eceb5/package.json): ESM, declarations, `sideEffects: false`, no runtime dependencies, TypeScript build and Node tests. This is a small actively changing project, so pin any evaluation artifact and compare source/tag/tarball provenance rather than assuming API maturity.
- [License](https://github.com/danielwh2/cuelume/blob/6ee4f7fab7890aeeb702cc311b14c6de937eceb5/LICENSE): MIT, copyright Daniel Belyi. Preserve the full notice with any copied code or recipes and include it in package notices. No source or sound recipe is copied by this decision.

Lessons to adopt independently: semantic names, explicit consumer preferences,
lazy audio setup, shared resources, event deduplication and silent failure.
Do not inherit enabled-by-default behavior, non-disposable bindings or a palette
merely because the implementation is compact.

## Alternatives and ownership

| Option                                          | Decision and tradeoff                                                                                                                                         |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consume CueLume optionally                      | Useful comparison implementation. Requires a policy layer for opt-in, interruption, disposal and visibility; an upstream dependency is not yet justified.     |
| Independent `@ds-mo/sounds`                     | Preferred experiment: framework-neutral core, replaceable recipes and a lifecycle designed for explicit consent. Costs separate maintenance and audio design. |
| `@ds-mo/ui/sound`                               | Reject for now: couples component releases and audio design; risks pulling audio into general component bundles.                                              |
| Application-owned playback with existing events | Adopt now. Existing `dsChange`, navigation and application completion events already identify the owning action. No new generic sound event is needed.        |
| Standalone package plus optional adapters       | Possible later, only after a vocabulary and policy have survived the bounded experiment. Adapters must remain explicit and removable.                         |

CompoMo owns accessible controls and semantic interaction events. The application
owns whether sound exists, preference persistence, successful outcomes and one
mapping owner per action. A future sound package owns rendering, resources,
policy enforcement and replaceable palettes. Angular/React/native consumers use
the same core, without framework-specific behavior or a second event stream.

## Proposed contract

Create a controller with `enabled: false`, an explicitly supplied palette and
volume in [0, 1]. Expose `setEnabled`, `setVolume`, `setPalette`, `play`, `stop`
and `dispose`. Importing or constructing it must create no AudioContext,
listeners or storage writes. Preference loading and persistence remain in the
application. Provide a plainly named Sound setting, mute and volume controls,
plus a Preview action that itself constitutes intentional playback. Do not use
reduced-motion as an inferred sound preference. Visual/text/AT feedback remains
complete when audio is unavailable or muted.

`play(intent, { actionId, signal })` must return a non-throwing result such as
played, muted, unavailable, cancelled or throttled. An action id is optional for
manual preview but required by an adapter. A bounded, expiring dedupe cache
suppresses duplicate component/application mappings. A button press must not
also imply that its network request succeeded. Default mappings choose the
confirmed outcome over an extra press sound.

On disable, hidden document, abort, route-owner disposal or controller disposal,
cancel queued work and fade/stop active voices. A generation check after every
resume or asset-loading promise prevents an old action playing after re-enable.
Create/resume only from an intentional user activation; never queue a backlog
that plays later. Catch construction, resume, decode and rendering failures.
Keep one context per application sound controller, one master gain and at most
two concurrent voices initially. Repeated identical cues within 150 ms coalesce;
never emit sounds for hover, focus, scrolling, every keystroke or streamed token.
These are proposed experiment policies, not measured optimal audio values.

## Vocabulary for design review

| Intent                              | Proposed owner/mapping                               | Initial rule                                                     |
| ----------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| `selection.changed`                 | Application handles a Select/Switch committed change | Optional, one cue per committed change                           |
| `surface.opened` / `surface.closed` | Explicit Menu/Modal mapping                          | Omit by default in dense workflows; cancellation is not an error |
| `operation.succeeded`               | Application confirms save/export completion          | One outcome cue, never triggered by the submit button alone      |
| `operation.failed`                  | Application exposes a recoverable failure            | Accompany visible error and recovery; no alarm/loop              |
| `result.ready`                      | Application completes a requested result             | One cue at completion, never per streaming update                |

Treat semantic names as versioned API; audio recipes are replaceable design
assets, not CSS tokens. Names should describe meaning rather than pitch or
instrument. A changed meaning requires migration. This table is proposed;
no sound or component mapping has received a listening/design sign-off yet.

## Bounded experiment and exit criteria

Build outside the default UI entry with two renderers behind the same contract:
a small original synthesized palette and two licensed packaged audio assets.
Keep a typed registry, lazily load recipes/assets only after enablement, cache
decoded assets with bounded ownership, and abort fetches on disposal. Static
ESM imports must be tree-shakeable and SSR-safe. Asset URLs need explicit
`connect-src` policy and normal caching; avoid eval, inline scripts and data
URLs as requirements. Inspect the production bundle to prove UI-only consumers
pay zero audio cost.

Provide an isolated Storybook workbench with enable/mute, volume, renderer and
palette choice, individual Preview buttons, a Select/Switch sequence and a
save outcome. Show the corresponding visual status and expose policy outcomes.
The page must start silent on every load. Do not wire the whole library.

Test the controller with a fake clock/audio backend for rejected resume,
rapid input, dedupe expiry, hidden tabs, disable/re-enable races, cancellation,
disposal and multiple owners. Silent rendered tests cover actual activation,
keyboard/touch parity, teardown and navigation in Chromium and WebKit, with
Firefox under the established Linux workflow. Separately listen on desktop
and physical mobile devices; record autoplay recovery and hardware volume.

For each renderer record raw/gzip/brotli bytes, first-enable and first-play
latency, warm-play latency, long tasks, retained nodes/buffers after repeated
navigation and memory after disposal. Compare a no-audio control run. No browser latency or retained-memory numbers are claimed by this research. A designer reviews every
proposed cue at multiple volumes and in repeated realistic sequences; an
accessibility reviewer checks user control, equivalence and sensory load.
Proceed only if those results support the payload and maintenance cost.
