# CI and release guidance

Applies to `.github/`, release configuration, and publishing automation.

- Keep CI on standard GitHub-hosted runners.
- Preserve conventional PR-title validation.
- Build/package validation must catch generated-source drift and invalid public
  artifacts.
- Browser and Storybook accessibility work may be scoped by the repository's
  change classifier, but shared behavior changes require the relevant suites.
- Failure artifacts should be uploaded only when useful and retained briefly.
- Release Please owns versions, changelog updates, tags, and GitHub releases.
- npm publishing uses OIDC Trusted Publisher provenance. Do not add a routine
  `NPM_TOKEN`, local publish step, or manual version bump.
- Public subpaths must contain compiled JavaScript and declarations, not raw
  TypeScript.

Before changing release behavior, read `docs/maintainers/releasing.md` and the
current workflow itself. Workflow source is authoritative for triggers,
permissions, Node/npm setup, sharding, and recovery behavior; do not duplicate
exact versions in prose.
