# CompoMo — `@ds-mo/ui`

[![npm version](https://img.shields.io/npm/v/@ds-mo/ui.svg)](https://www.npmjs.com/package/@ds-mo/ui)

Composable React UI components styled with [TokoMo](https://github.com/zainadeel/TokoMo) design tokens.

## Install

```bash
npm install @ds-mo/ui @ds-mo/tokens
```

**Required peer dependency:** `@ds-mo/tokens` provides all CSS custom properties (colors, dimensions, typography, effects) that CompoMo components consume. Components will not render correctly without it.

**Optional:** `@ds-mo/icons` for icon components used via the `icon` prop pattern.

```bash
npm install @ds-mo/icons
```

## Setup

Import TokoMo tokens globally (once, at your app root):

```tsx
import '@ds-mo/tokens';        // all tokens (colors, dimensions, typography, effects)
import '@ds-mo/tokens/reset';   // CSS reset
import '@ds-mo/tokens/globals'; // global styles
```

Then import CompoMo components:

```tsx
import { Button, Text, Surface, Card } from '@ds-mo/ui';
```

## Components

### Primitives
- **Text** — typography with variant system, semantic colors, truncation, wrap modes
- **Surface** — container with backgrounds, elevation, edges, radius, interactive states
- **Card** — elevated content container with header/footer slots
- **Input** — text input field
- **Slider** — range slider
- **Field** — label + input wrapper
- **LabelWrap** — label + content wrapper with layout variants
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

Components that accept icons use the typed prop pattern:

```tsx
icon?: React.ComponentType<{ size?: number | string }>
```

Pass any component that accepts a `size` prop. Works with `@ds-mo/icons` or custom SVG components.
