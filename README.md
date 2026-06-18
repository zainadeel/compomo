# CompoMo — `@ds-mo/ui`

[![npm version](https://img.shields.io/npm/v/@ds-mo/ui.svg)](https://www.npmjs.com/package/@ds-mo/ui)

Composable web UI components (Stencil custom elements) styled with [TokoMo](https://github.com/zainadeel/TokoMo) design tokens. Works in any framework — ships Angular proxies out of the box.

## Install

```bash
npm install @ds-mo/ui @ds-mo/tokens @ds-mo/icons
```

**Required peer dependencies:**

- **`@ds-mo/tokens`** — CSS custom properties (colors, dimensions, typography, effects). Components will not render correctly without it.
- **`@ds-mo/icons`** — SVG sources for `<ds-icon>` and built-in icon props. Resolved at **your app bundle time** from your installed IcoMo version (not baked into `@ds-mo/ui`).

## Setup

Import TokoMo tokens globally (once, at your app root):

```tsx
import '@ds-mo/tokens';        // all tokens (colors, dimensions, typography, effects)
import '@ds-mo/tokens/reset';   // CSS reset
import '@ds-mo/tokens/globals'; // global styles
```

Register custom elements once at app boot:

```ts
import { defineCustomElements } from '@ds-mo/ui/loader';
import '@ds-mo/tokens/css';
import '@ds-mo/ui/css';

defineCustomElements();
```

Your app bundler (Vite, Webpack, esbuild, etc.) must be able to resolve `@ds-mo/icons` when it bundles `ds-icon` — install `@ds-mo/icons` alongside `@ds-mo/ui`.

Then use `<ds-*>` tags in templates. **Angular** can import Stencil-generated proxy directives from `@ds-mo/ui/angular`. **React** uses the custom elements directly (no parallel React component layer) with `CUSTOM_ELEMENTS_SCHEMA` and imperative JS properties where needed.

**SPA hosts (Angular / React):** `ds-panel-nav` and `ds-bar-nav` need a [first-paint integration contract](docs/framework-integration.md) on hard reload — set a document variant hint or element attributes before the custom element upgrades.

## Components

### Primitives
- **Text** — typography with variant system, semantic colors, truncation, wrap modes
- **Surface** — container with backgrounds, elevation, edges, radius, interactive states
- **Card** — elevated content container with header/footer slots
- **Input** — text input field
- **Slider** — range slider
- **Field** — label + input wrapper
- **Divider** — horizontal or vertical rule

### Actions
- **Button** — primary/secondary/tertiary with intents, sizes, icon support
- **ButtonGroup** — grouped button row with shared borders
- **ToggleButton** — two-state selectable button
- **ToggleButtonGroup** — radio-style group of toggle buttons

### Controls
- **Toggle** — on/off switch
- **Checkbox** — with label and indeterminate state
- **Radio** — single-select radio input

### Data display
- **Tag** — labels with intents, contrasts, removable
- **Badge** — numeric count indicator
- **Table** — sortable, paginated data table
- **Accordion** — collapsible content sections
- **Pagination** — page navigation control

### Overlays
- **Modal** — dialog with title, subtitle, footer slots
- **Menu** — dropdown with sections, selection, positioning
- **Tooltip** — hover tooltip with shortcut key support
- **Select** — dropdown select
- **Toast** — transient notification
- **Banner** — notification bar with intents, toast mode

### Navigation
- **Tab** — tab button with selection state
- **TabGroup** — grouped tabs with shared selection
- **Breadcrumb** — path navigation

### Status
- **EmptyState** — placeholder states
- **Loader** — loading indicator
- **Skeleton** — content placeholder

### Layout
- **Header** — page header with left/center/right slots
- **Sidebar** — collapsible, resizable navigation with sections and items

### Utility
- **Fade** — gradient overlay
- **Scrollbar** — custom scrollbar
- **ErrorBoundary** — error catch with fallback

## Token dependency

All styling uses TokoMo CSS custom properties. No hardcoded colors, sizes, or shadows — everything maps to the token system. Components will render unstyled if `@ds-mo/tokens` is not imported.

## Icon pattern

Components that accept icons use named slots:

```html
<ds-button>
  <ds-icon-arrow-right slot="icon"></ds-icon-arrow-right>
  Save
</ds-button>
```

Pass any element into `slot="icon"`. Works with `@ds-mo/icons` or any custom SVG element.
