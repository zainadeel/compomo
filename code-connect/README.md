# Figma Code Connect templates

Template files (`*.figma.ts`) map Figma components to code snippets shown in **Dev Mode → Inspect**.

## Where templates live

- **`published/`** — only files here matching `*.figma.ts` are **published** (see `figma.config.json` `include`). Each file’s `// url=` must be a **real** node from *Copy link to selection*; placeholder URLs **fail CI** on `figma connect publish`.
- **`examples/`** — reference templates (same syntax) that are **not** published. Copy into `published/` when you are ready.

## Before you publish

1. Copy `examples/ds-icon.figma.ts` → `published/DsIcon.figma.ts` (or start from `npx figma connect create "<url>" --outDir code-connect/published`).
2. Set **`// url=...`** to the real component link from Figma.
3. **Personal access token** with **Code Connect (Write)** and **File content (Read)**. Do not commit it.
   - `export FIGMA_ACCESS_TOKEN='...'`
   - or pass `-t` / `--token` to the publish command.

## Commands (from repo root)

```bash
# Help
npx figma connect --help

# Scaffold a new template from a Figma URL
npx figma connect create "https://www.figma.com/design/...?node-id=..." --outDir code-connect/published

# Validate + dry run
npm run figma:connect:publish:dry-run

# Publish to Figma
npm run figma:connect:publish
```

## Editor / TypeScript

Use `tsconfig.figma.json` in your IDE for autocomplete on `figma` APIs in `published/` and `examples/` (see root README).

## Repo ↔ Figma GitHub integration

The file you publish to must match the **same repo and branch** linked in Figma’s Code Connect / GitHub settings, or designers will not see your snippets.

## CI (optional)

On **`main`**, GitHub Actions can publish when this folder or `figma.config.json` changes — see [`.github/workflows/figma-code-connect.yml`](../.github/workflows/figma-code-connect.yml). Add repo secret **`FIGMA_ACCESS_TOKEN`** (Settings → Secrets and variables → Actions). Details in the root **README** under *Figma Code Connect*.

If **`published/`** has no `*.figma.ts` files, publish exits successfully and does nothing (so CI stays green until you add a validated template).
