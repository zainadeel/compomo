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
- Every job that runs npm uses `./.github/actions/setup-toolchain`. Do not add
  `actions/setup-node` with a hardcoded version or install a floating npm; the
  action fails unless Node matches `.nvmrc` and npm matches `packageManager`.
- Pin every external action, including inside local composite actions, to a full
  commit SHA with an exact `# vX.Y.Z` comment. Avoid wrapper actions that call
  other actions by mutable ref (for example `Wandalen/wretry.action`); the
  Pages deploy retries with native steps instead.
- Do not run CLI tools with `npx --yes`; add them as exact devDependencies.
- Workflows default to `permissions: contents: read`. Only the Release Please,
  publish, and Pages deploy jobs request write or OIDC access, at job level.
- Checkouts set `persist-credentials: false`; no job pushes with Git.
- Every job sets `timeout-minutes`. PR workflows cancel superseded runs; never
  add `cancel-in-progress` to release, publish, or Pages runs.
- Playwright jobs run in the official `mcr.microsoft.com/playwright` image,
  pinned by tag and digest, and install browsers without `--with-deps`. Do not
  reintroduce `--with-deps`: it downloads ~115 MB of system packages from the
  Ubuntu mirror and has pushed jobs past their timeouts. When `@playwright/test`
  changes, update the image tag and digest to the same version in the same PR
  (do not rely on Dependabot to bump the image).
- `Build library` and `Validate PR title` are required status checks. Do not
  rename those jobs without updating branch protection.

Before changing release behavior, read `docs/maintainers/releasing.md` and the
current workflow itself. Workflow source is authoritative for triggers,
permissions, Node/npm setup, sharding, and recovery behavior; do not duplicate
exact versions in prose.
