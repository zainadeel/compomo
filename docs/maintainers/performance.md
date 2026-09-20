# Measuring component performance

Select the pinned toolchain, build once, then run:

```bash
npm run build
npm run perf:measure
```

The command prints JSON for warmed model/formatting/parser timings and minified
component bundle costs. Run the same script against both revisions on the same
machine, with other builds and browser tests idle. Include the revision, CPU,
Node version, median and p95 in the PR. These are comparison measurements, not
universal response-time guarantees or CI wall-clock thresholds.

`scripts/measure-performance.mjs` owns the representative workloads: grouped
selection, chart compilation, repeated formatting, complete Markdown documents
and growing streaming snapshots. Extend those fixtures when a consuming app
supplies a materially different workload. Parser timings exclude network,
layout and DOM rendering. Bundle figures sum gzip bytes per emitted chunk;
static and lazy closures are reported separately, and `@ds-mo/*` peers are
excluded. They are not the final application's transfer size.

Use the manual stress stories for Table, Chart and Markdown to inspect input
responsiveness, resizing and scrolling. Record a browser Performance trace when
investigating a visible delay. For retention concerns, compare heap snapshots
after collection at the same settled state, repeat mount/update/remove cycles,
and inspect retaining paths instead of treating a transient heap peak as a leak.

The rendered `performance-contracts.spec.ts` suite enforces deterministic
contracts: bounded table DOM, correct large-list selection, chart focus without
guide remeasurement, and replacement of streamed Markdown after reconnection.
The ordinary chart lifecycle suite covers resizing and deferred font work.
DOM cardinality checks do not prove the absence of every memory leak.

## Optimization boundaries

Reuse derived data within the snapshot that owns it. Controlled arrays and
objects change by reference; do not introduce a global cache of application
records. Bound formatter caches, prune measurements when definitions change,
and clear connection resources on removal. Keep chart focus and tooltip work
independent of scene compilation and guide measurement.

Virtual rows bound rendering, not loaded data: applications still own paging,
fetching and the supplied in-memory model. SVG chart cost follows mark and
point count; reduce or aggregate application data when a dense scene becomes
unreadable. No automatic downsampling should discard meaningful points.

Markdown remains a complete-document CommonMark/GFM parse. Multiple content
updates within a frame coalesce, but a large document can still consume more
than a frame to parse and render. Buffer large streamed snapshots in the
application and separate completed messages rather than growing one transcript
document indefinitely. Do not implement append-only parsing without accounting
for constructs that can change earlier content, such as incomplete fences and
reference definitions. A worker or incremental parser requires a separate
measured design, including delivery/build compatibility and equivalent output.
