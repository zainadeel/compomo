# Figma Code Connect templates

Template files (`*.figma.ts`) map Figma components to code snippets shown in **Dev Mode → Inspect**.

## Before you publish

1. **Replace the `// url=...` line** in each template with **Right-click component → Copy link to selection** from your library file. The URL must point at the **Icon** (or other) component node, not a random frame.
2. **Personal access token** with **Code Connect (Write)** and **File content (Read)**. Do not commit it.
   - `export FIGMA_ACCESS_TOKEN='...'`
   - or pass `-t` / `--token` to the publish command.

## Commands (from repo root)

```bash
# Help
npx figma connect --help

# Scaffold a new template from a Figma URL (writes into cwd — use --outDir)
npx figma connect create "https://www.figma.com/design/...?node-id=..." --outDir code-connect

# Validate + dry run
npm run figma:connect:publish:dry-run

# Publish to Figma
npm run figma:connect:publish
```

## Editor / TypeScript

Use `tsconfig.figma.json` in your IDE for autocomplete on `figma` APIs in this folder (see root README).

## Repo ↔ Figma GitHub integration

The file you publish to must match the **same repo and branch** linked in Figma’s Code Connect / GitHub settings, or designers will not see your snippets.

## CI (optional)

On **`main`**, GitHub Actions can publish when this folder or `figma.config.json` changes — see [`.github/workflows/figma-code-connect.yml`](../.github/workflows/figma-code-connect.yml). Add repo secret **`FIGMA_ACCESS_TOKEN`** (Settings → Secrets and variables → Actions). Details in the root **README** under *Figma Code Connect*.
