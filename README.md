# CompoMo — `@ds-mo/ui`

[![npm version](https://img.shields.io/npm/v/@ds-mo/ui.svg)](https://www.npmjs.com/package/@ds-mo/ui)

Framework-neutral Stencil web components styled with TokoMo tokens. CompoMo
ships custom elements plus generated Angular and React adapters.

## Install

```bash
npm install @ds-mo/tokens @ds-mo/icons @ds-mo/ui
```

Import TokoMo once at the application root:

```ts
import '@ds-mo/tokens';
import '@ds-mo/tokens/reset';
import '@ds-mo/tokens/globals';
```

## Use

Custom elements auto-define when their module is imported:

```ts
import '@ds-mo/ui/dist/components/ds-button-filled.js';
```

```html
<ds-button-filled label="Save"></ds-button-filled>
```

Angular applications should prefer per-component standalone adapters:

```ts
import { DsButtonFilled } from '@ds-mo/ui/angular/ds-button-filled';
```

React applications use the generated wrappers:

```tsx
import { DsButtonFilled } from '@ds-mo/ui/react';
```

Install `@ds-mo/icons` in the consuming application. `ds-icon` resolves exact
canonical IcoMo export names at application bundle time.

## Public support surfaces

- `@ds-mo/ui/shell` — framework-neutral shell contracts.
- `@ds-mo/ui/toast` — toast manager.
- `@ds-mo/ui/utils` — generic helpers such as `registerIcons`.
- `@ds-mo/ui/prose.css` — renderer-neutral semantic prose styling.
- `@ds-mo/ui/control-elevation.css` — elevated outer control wrappers.

There is no global component CSS bundle; styles ship with each custom element.

## Agent recipes

The package includes the local `compomo-mcp` executable with generated
component metadata and executable Custom Elements, Angular, and React
composition recipes.

```toml
# .codex/config.toml
[mcp_servers.compomo]
command = "./node_modules/.bin/compomo-mcp"
```

Use registry tools when component selection or a composition contract is
unclear. API facts come from Stencil metadata; curated intent comes from
co-located component agent JSON and executable patterns.

## Documentation

- [Storybook introduction and usage](src/docs/Introduction.mdx)
- [Framework integration](docs/framework-integration.md)
- [v13 migration guide](docs/migrations/v13.md)
- [Maintainer documentation router](docs/index.md)
- [Repository instructions](AGENTS.md)

Package versions, components, props, events, and exports are intentionally not
duplicated here. Read `package.json`, Storybook, or the generated registry for
current facts.
