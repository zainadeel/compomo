# Releasing

Normal releases are automated:

1. Merge a conventional `feat:`, `fix:`, or `perf:` change through a PR.
2. Release Please opens or updates the release PR.
3. Merge the release PR.
4. The workflow creates the tag and GitHub release, then publishes to npm using
   OIDC Trusted Publisher provenance.

Do not hand-bump versions or run routine `npm publish`.

## Commit semantics

- `feat:` → minor
- `fix:` or `perf:` → patch
- breaking change → major
- documentation, tests, refactors, chores, and CI do not normally release

`release-please-config.json` is authoritative for changelog mapping.

## Exceptional recovery

If a tag/release exists but a later workflow step prevented npm publishing,
rerun the Release Please workflow for the existing tag. Do not replace the
configured publishing identity with a local token.

Use a `Release-As: X.Y.Z` commit trailer only when a deliberate exact version is
required. Preserve the trailer in the merge commit.

Publishing configuration belongs in `.github/workflows/release-please.yml` and
npm Trusted Publisher settings. See `.github/AGENTS.md` before changing it.
