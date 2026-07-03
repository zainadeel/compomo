#!/usr/bin/env node

/**
 * build-registry.mjs
 *
 * Generates an AI-readable component registry from CompoMo.
 * Output goes to public/r/ so it's served alongside Storybook on GitHub Pages.
 *
 * Unlike a shadcn registry (copy-paste model), this registry is designed for
 * an npm-distributed design system. Each component JSON explains:
 *
 *   - What the component does (description, props, features)
 *   - How to consume it (npm install, imports, CSS setup)
 *   - What it depends on (other CompoMo components, tokens, icons)
 *   - Full source code as reference for AI context
 *
 * This makes the library discoverable via MCP and usable with v0, without
 * pretending the components are self-contained copyable units.
 *
 * Endpoints:
 *   /r/registry.json      — master catalog (no source, just metadata)
 *   /r/{name}.json         — full component detail with source + usage guide
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const WC_SRC = path.join(ROOT, 'src', 'wc', 'components');
const OUT = path.join(ROOT, 'public', 'r');

const PKG = '@ds-mo/ui';
const STORYBOOK_URL = 'https://zainadeel.github.io/compomo/';
const TOKENS_PEER = '>=2.9.0';
const ICONS_PEER = '^5.0.1';
const TRILOGY_INSTALL = `npm install ${PKG} @ds-mo/tokens @ds-mo/icons`;

// ─── Component catalog ─────────────────────────────────────────────────────────

const COMPONENTS = [
  // Primitives
  ['Text', {
    title: 'Text',
    description: 'Typography primitive supporting all design-system text variants, colors, truncation, and wrapping.',
    exports: ['Text'],
    types: ['TextProps', 'TextVariant', 'TextStyle', 'TextColor', 'TextColorToken', 'TextDecoration', 'TextAlign', 'LineTruncation', 'TextWrap', 'TextElement'],
    props: {
      variant: { type: 'TextVariant', default: "'text-body-medium'", description: 'Typography variant from design tokens.' },
      children: { type: 'React.ReactNode', required: true },
      color: { type: 'TextColor', description: 'Token-based text color.' },
      as: { type: "'p' | 'span' | 'div' | 'label' | 'h1'-'h6'", default: "'p'" },
      lineTruncation: { type: '1 | 2 | 3 | 4 | 5 | "none"', default: "'none'" },
      decoration: { type: "'none' | 'underline' | 'dotted-underline'" },
      italic: { type: 'boolean' },
      align: { type: "'left' | 'center' | 'right'" },
      wrap: { type: "'wrap' | 'nowrap' | 'balance' | 'pretty'" },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: [],
  }],
  ['Surface', {
    title: 'Surface',
    description: 'Foundational container with intent-based or background-based coloring, elevation, edges, radius, and interactive states.',
    exports: ['Surface'],
    types: ['SurfaceProps', 'SurfaceIntent', 'SurfaceBackground', 'SurfaceContrast', 'SurfaceElevation', 'SurfaceEdge', 'SurfaceRadius', 'SurfaceRadiusPreset', 'SurfaceElement'],
    props: {
      intent: { type: "'brand' | 'positive' | 'negative' | 'warning' | 'caution' | 'ai' | 'neutral' | 'walkthrough' | 'guide'", description: 'Semantic intent coloring (mutually exclusive with background).' },
      contrast: { type: "'faint' | 'medium' | 'bold' | 'strong'", default: "'faint'" },
      background: { type: "'primary' | 'secondary' | 'transparent' | 'translucent'", description: 'Background mode (mutually exclusive with intent).' },
      elevation: { type: "'none' | 'depressed' | 'depressed-md' | 'flat' | 'elevated' | 'floating' | 'overlayTop' | 'overlayRight' | 'overlayBottom' | 'overlayLeft'", default: "'none'" },
      edge: { type: "SurfaceEdge | SurfaceEdge[]", description: 'Border edges. Only applies when elevation is none.' },
      radius: { type: "'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | string" },
      interactive: { type: 'boolean', description: 'Enables hover/press overlay.' },
      selected: { type: 'boolean' },
      inactive: { type: 'boolean' },
      as: { type: "'div' | 'section' | 'aside' | 'article' | 'header' | 'footer' | 'main' | 'nav' | 'span' | 'button' | 'td' | 'th'", default: "'div'" },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: [],
  }],
  ['Card', {
    title: 'Card',
    description: 'Content container with header, body, and footer sections. Supports elevation and radius presets.',
    exports: ['Card'],
    types: ['CardProps', 'CardElevation', 'CardRadius'],
    props: {
      children: { type: 'React.ReactNode', required: true },
      header: { type: 'React.ReactNode', description: 'Rendered with a bottom divider.' },
      footer: { type: 'React.ReactNode', description: 'Rendered with a top divider.' },
      elevation: { type: "'flat' | 'elevated' | 'floating'", default: "'elevated'" },
      radius: { type: "'sm' | 'md' | 'lg' | 'xl'", default: "'lg'" },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: ['Surface'],
  }],

  // Core Interactive
  ['Button', {
    title: 'Button',
    description: 'Primary action component with variants (primary/secondary), 8 semantic intents, 4 sizes, icon support, loading state, dropdown indicator, badge count, and elevation levels.',
    exports: ['Button'],
    types: ['ButtonProps', 'ButtonVariant', 'ButtonElevation', 'ButtonIntent', 'ButtonSize', 'ButtonContrast'],
    props: {
      label: { type: 'string', description: 'Button text. Omit for icon-only button.' },
      icon: { type: 'IconComponent', description: 'Leading icon from @ds-mo/icons.' },
      variant: { type: "'primary' | 'secondary'", default: "'primary'" },
      intent: { type: "'none' | 'neutral' | 'brand' | 'ai' | 'negative' | 'warning' | 'caution' | 'positive'", default: "'brand'" },
      size: { type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'" },
      contrast: { type: "'strong' | 'bold' | 'medium' | 'faint'", default: "'bold'" },
      elevation: { type: "'none' | 'flat' | 'elevated' | 'floating'", description: "Defaults to 'none' for primary, 'flat' for secondary." },
      loading: { type: 'boolean', description: 'Shows spinner, prevents interaction.' },
      dropdown: { type: 'boolean', description: 'Shows trailing ChevronDown icon.' },
      badgeCount: { type: 'number', description: "Displays badge. Shows '+' if > 9." },
      rounded: { type: 'boolean', description: 'Pill shape with extra padding.' },
      fullWidth: { type: 'boolean' },
      inactive: { type: 'boolean' },
      as: { type: 'React.ElementType', default: "'button'", description: 'Polymorphic element.' },
      onClick: { type: '(e: React.MouseEvent<HTMLElement>) => void' },
    },
    usesTokens: true,
    usesIcons: true,
    internalDeps: ['Text', 'Loader'],
  }],
  ['ToggleButton', {
    title: 'ToggleButton',
    description: 'Controlled toggle button with pressed state, icon and label support.',
    exports: ['ToggleButton'],
    types: ['ToggleButtonProps', 'ToggleButtonElevation', 'ToggleButtonSize'],
    props: {
      pressed: { type: 'boolean', required: true },
      onPressedChange: { type: '(pressed: boolean) => void', required: true },
      label: { type: 'string' },
      icon: { type: 'IconComponent' },
      size: { type: "'md' | 'sm' | 'xs'", default: "'md'" },
      elevation: { type: "'none' | 'flat' | 'elevated' | 'floating'", default: "'elevated'" },
      rounded: { type: 'boolean' },
      inactive: { type: 'boolean' },
    },
    usesTokens: true,
    usesIcons: true,
    internalDeps: ['Text'],
  }],
  ['ButtonGroup', {
    title: 'ButtonGroup',
    description: 'Groups Button children with automatic dividers and shared elevation/rounding. Reads props from first child to drive group styling.',
    exports: ['ButtonGroup'],
    types: ['ButtonGroupProps'],
    props: {
      children: { type: 'React.ReactNode', required: true, description: 'Button components as children.' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: ['Button'],
  }],
  ['ToggleButtonGroup', {
    title: 'ToggleButtonGroup',
    description: 'Groups ToggleButton children with dividers and shared chrome.',
    exports: ['ToggleButtonGroup'],
    types: ['ToggleButtonGroupProps'],
    props: {
      children: { type: 'React.ReactNode', required: true, description: 'ToggleButton components as children.' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: ['ToggleButton'],
  }],
  ['Tag', {
    title: 'Tag',
    description: 'Static metadata label with intent coloring and optional icon support.',
    exports: ['Tag'],
    types: ['TagProps', 'TagIntent', 'TagContrast', 'TagElevation', 'TagSize'],
    props: {
      label: { type: 'string', required: true },
      intent: { type: "'neutral' | 'brand' | 'ai' | 'negative' | 'warning' | 'caution' | 'positive'", default: "'neutral'" },
      contrast: { type: "'strong' | 'bold' | 'medium' | 'faint'", default: "'faint'" },
      elevation: { type: "'none' | 'flat' | 'elevated'", default: "'none'" },
      size: { type: "'md' | 'sm' | 'xs'", default: "'md'" },
      rounded: { type: 'boolean' },
      icon: { type: 'IconComponent' },
      maxWidth: { type: 'string | number' },
    },
    usesTokens: true,
    usesIcons: true,
    internalDeps: ['Text'],
  }],
  ['Chip', {
    title: 'Chip',
    description: 'Interactive metadata chip with pressed, inactive, removable, and icon states.',
    exports: ['Chip'],
    types: ['ChipProps', 'ChipIntent', 'ChipContrast', 'ChipElevation', 'ChipSize'],
    props: {
      label: { type: 'string', required: true },
      intent: { type: "'neutral' | 'brand' | 'ai' | 'negative' | 'warning' | 'caution' | 'positive'", default: "'neutral'" },
      contrast: { type: "'strong' | 'bold' | 'medium' | 'faint'", default: "'faint'" },
      elevation: { type: "'none' | 'flat' | 'elevated'", default: "'none'" },
      size: { type: "'md' | 'sm' | 'xs'", default: "'md'" },
      rounded: { type: 'boolean' },
      icon: { type: 'IconComponent' },
      removable: { type: 'boolean' },
      onRemove: { type: '() => void' },
      pressed: { type: 'boolean', description: 'For filter-chip behavior.' },
      onPressedChange: { type: '(pressed: boolean) => void' },
      onClick: { type: '() => void' },
      inactive: { type: 'boolean' },
      maxWidth: { type: 'string | number' },
    },
    usesTokens: true,
    usesIcons: true,
    internalDeps: ['Text'],
  }],
  ['Badge', {
    title: 'Badge',
    description: 'Compact counter or notification dot for status and unread indicators.',
    exports: ['Badge'],
    types: ['BadgeProps', 'BadgeVariant', 'BadgeSurface'],
    props: {
      variant: { type: "'counter' | 'dot'", default: "'counter'" },
      count: { type: 'number', default: '0', description: 'Counter value. Count 0 hides counter badges.' },
      max: { type: 'number', default: '9', description: 'Highest count shown before compacting to max+.' },
      surface: { type: "'default' | 'primary' | 'secondary' | 'medium' | 'bold' | 'strong' | 'navigation' | 'always-dark'", default: "'default'", description: 'Surface context used for the dot ring.' },
      background: { type: 'string', description: 'Direct ring background override for local surfaces.' },
      label: { type: 'string', description: 'Accessible label.' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: ['Text'],
  }],
  ['Loader', {
    title: 'Loader',
    description: 'SVG spinner that scales proportionally. Uses currentColor for theming.',
    exports: ['Loader'],
    types: ['LoaderProps'],
    props: {
      size: { type: 'number', default: '20' },
    },
    usesTokens: false,
    usesIcons: false,
    internalDeps: [],
  }],
  ['Toggle', {
    title: 'Toggle',
    description: 'Switch control with on/off state and accessible role="switch".',
    exports: ['Toggle'],
    types: ['ToggleProps'],
    props: {
      checked: { type: 'boolean', default: 'false' },
      onChange: { type: '(checked: boolean) => void' },
      inactive: { type: 'boolean' },
      'aria-label': { type: 'string' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: [],
  }],
  ['Checkbox', {
    title: 'Checkbox',
    description: 'Three-state checkbox (checked, unchecked, indeterminate) with keyboard support and custom icon slots.',
    exports: ['Checkbox'],
    types: ['CheckboxProps'],
    props: {
      label: { type: 'string', required: true },
      checked: { type: 'boolean', default: 'false' },
      indeterminate: { type: 'boolean', default: 'false' },
      onChange: { type: '(checked: boolean) => void' },
      inactive: { type: 'boolean' },
      checkedIcon: { type: 'IconComponent' },
      uncheckedIcon: { type: 'IconComponent' },
      indeterminateIcon: { type: 'IconComponent' },
    },
    usesTokens: true,
    usesIcons: true,
    internalDeps: ['Text'],
  }],
  ['Input', {
    title: 'Input',
    description: 'Text input supporting text, email, tel, url, search, and password types. Search type includes auto clear button.',
    exports: ['Input'],
    types: ['InputProps'],
    props: {
      value: { type: 'string', required: true },
      onChange: { type: '(e: React.ChangeEvent<HTMLInputElement>) => void', required: true },
      type: { type: "'text' | 'email' | 'tel' | 'url' | 'search' | 'password'", default: "'text'" },
      placeholder: { type: 'string' },
      suffix: { type: 'React.ReactNode' },
      inactive: { type: 'boolean' },
      clearIcon: { type: 'IconComponent', description: 'Custom clear icon for search type.' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: [],
  }],
  ['Slider', {
    title: 'Slider',
    description: 'Range input with visual fill track, label, and current value display.',
    exports: ['Slider'],
    types: ['SliderProps'],
    props: {
      value: { type: 'number', required: true },
      onChange: { type: '(value: number) => void', required: true },
      min: { type: 'number', default: '0' },
      max: { type: 'number', default: '100' },
      step: { type: 'number', default: '1' },
      label: { type: 'string', required: true },
      inactive: { type: 'boolean' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: ['Text'],
  }],
  ['Field', {
    title: 'Field',
    description: 'Simple label wrapper that links to child input via htmlFor.',
    exports: ['Field'],
    types: ['FieldProps'],
    props: {
      label: { type: 'string', required: true },
      children: { type: 'React.ReactNode', required: true },
      id: { type: 'string' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: ['Text'],
  }],
  ['Select', {
    title: 'Select',
    description: 'Dropdown select using `ds-menu` internally. Supports placeholder, inactive state, and custom chevron icon.',
    exports: ['Select'],
    types: ['SelectProps', 'SelectOption'],
    props: {
      value: { type: 'string | number', required: true },
      onChange: { type: '(value: string | number) => void', required: true },
      options: { type: 'SelectOption[]', required: true },
      placeholder: { type: 'string', default: "'Select option'" },
      inactive: { type: 'boolean' },
      chevronIcon: { type: 'IconComponent' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: ['Menu', 'Surface', 'Text'],
  }],

  // Floating / Portal
  ['Modal', {
    title: 'Modal',
    description: 'Dialog overlay with portal rendering, escape-to-close, backdrop click, focus management, and entry/exit animations.',
    exports: ['Modal'],
    types: ['ModalProps', 'ModalWidth'],
    props: {
      isOpen: { type: 'boolean', required: true },
      onClose: { type: '() => void', required: true },
      title: { type: 'string', required: true },
      children: { type: 'React.ReactNode', required: true },
      subtitle: { type: 'React.ReactNode' },
      footer: { type: 'React.ReactNode' },
      width: { type: "'sm' | 'md' | 'lg' | string", default: "'md'", description: 'sm=400px, md=560px, lg=720px, or custom CSS value.' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: ['Surface', 'Text'],
  }],
  ['Menu', {
    title: 'Menu',
    tag: 'menu',
    description: 'Positioned dropdown menu (`ds-menu`) with sections, selection, toggle items, and destructive items.',
    exports: ['ds-menu'],
    types: ['MenuItemData', 'MenuSection', 'MenuSide', 'MenuAlign'],
    props: {
      open: { type: 'boolean', description: 'Controls visibility. Set via JS property.' },
      items: { type: 'MenuItemData[]', description: 'Flat item list (use items or sections, not both).' },
      sections: { type: 'MenuSection[]', description: 'Grouped items with optional headers.' },
      side: { type: "'top' | 'right' | 'bottom' | 'left'", default: "'bottom'" },
      align: { type: "'start' | 'center' | 'end'", default: "'start'" },
      anchor: { type: 'HTMLElement', description: 'Positioning trigger. Set via JS: menuEl.anchor = triggerEl' },
      menuWidth: { type: 'string', description: 'Optional fixed menu width (e.g. match trigger).' },
    },
    events: ['dsSelect', 'dsClose'],
    jsPropNote: 'Assign items, sections, anchor, and open via JS properties after customElements.whenDefined("ds-menu").',
    usesTokens: true,
    usesIcons: false,
    internalDeps: [],
  }],
  ['Tooltip', {
    title: 'Tooltip',
    description: 'Positioned tooltip with portal rendering, delay, keyboard shortcut display, and viewport clamping.',
    exports: ['Tooltip'],
    types: ['TooltipProps', 'TooltipSide', 'TooltipAlign'],
    props: {
      label: { type: 'string', required: true },
      children: { type: 'React.ReactElement', required: true },
      side: { type: "'top' | 'right' | 'bottom' | 'left'", default: "'top'" },
      align: { type: "'start' | 'center' | 'end'", default: "'center'" },
      delay: { type: 'number', description: 'Hover delay in ms.' },
      shortcutKey: { type: 'string', description: 'Displays keyboard shortcut hint.' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: ['Text'],
  }],
  ['Banner', {
    title: 'Banner',
    description: 'Intent-colored message bar. Supports floating toast mode with auto-dismiss and fade-out animation.',
    exports: ['Banner'],
    types: ['BannerProps', 'BannerIntent', 'BannerContrast'],
    props: {
      intent: { type: "'brand' | 'positive' | 'negative' | 'warning' | 'caution' | 'ai' | 'neutral' | 'walkthrough' | 'guide'", required: true },
      contrast: { type: "'faint' | 'medium' | 'bold' | 'strong'", required: true },
      message: { type: 'string', required: true },
      floating: { type: 'boolean', description: 'Renders as portal toast with auto-dismiss.' },
      onDismiss: { type: '() => void' },
      header: { type: 'boolean', description: 'Shows decorative header.' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: ['Surface', 'Text'],
  }],

  // Complex & Utility
  ['Table', {
    title: 'Table',
    description: 'Data table with CSS grid layout, sorting, pagination, loading skeleton, row selection, and custom cell rendering.',
    exports: ['Table'],
    types: ['TableProps', 'TableColumn', 'SortState', 'SortDirection', 'CellType', 'FilterValue', 'FilterState', 'PaginationState'],
    props: {
      columns: { type: 'TableColumn<T>[]', required: true },
      data: { type: 'T[]', required: true },
      sortState: { type: 'SortState' },
      onSort: { type: '(columnId: string) => void' },
      onRowClick: { type: '(row: T, rowIndex: number) => void' },
      selectedRows: { type: 'Set<number>' },
      loading: { type: 'boolean' },
      pagination: { type: 'PaginationState' },
      onPaginationChange: { type: '(pageIndex: number, pageSize: number) => void' },
      emptyMessage: { type: 'string', default: "'No results found.'" },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: ['Text', 'Surface', 'Skeleton'],
  }],
  ['EmptyState', {
    title: 'EmptyState',
    description: 'Centered placeholder for empty content, no results, or no access states.',
    exports: ['EmptyState'],
    types: ['EmptyStateProps', 'EmptyStateType'],
    props: {
      type: { type: "'no-content' | 'no-results' | 'no-results-filter' | 'no-access'", default: "'no-content'" },
      message: { type: 'string', description: 'Overrides default message.' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: ['Text'],
  }],
  ['Fade', {
    title: 'Fade',
    description: 'Decorative edge-fade utility for scrollable content and overflow boundaries.',
    exports: ['Fade'],
    types: ['FadeProps', 'FadeSide', 'FadeSurface', 'FadeSize', 'FadeSizeToken'],
    props: {
      side: { type: "'top' | 'bottom' | 'left' | 'right'", default: "'bottom'" },
      size: { type: "'size-000' | 'size-050' | 'size-075' | 'size-100' | 'size-150' | 'size-200' | 'size-250' | 'size-300' | 'size-400' | 'size-500' | 'size-600' | 'size-800' | string", default: "'size-600'", description: 'Fade depth along the fade axis. Use dimension size token names or a CSS length.' },
      surface: { type: "'default' | 'primary' | 'secondary' | 'navigation' | 'media' | 'always-dark' | 'inverted'", default: "'default'", description: 'Surface context used to choose the fade target background token.' },
      background: { type: 'string', default: "'var(--color-background-secondary)'", description: 'Direct background override, useful for component-local surface variables.' },
      visible: { type: 'boolean', default: 'true', description: 'Controls opacity without removing the fade from its edge position.' },
      height: { type: 'string', description: 'Deprecated alias for size.' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: [],
  }],
  ['Scrollbar', {
    title: 'Scrollbar',
    description: 'Custom scrollbar with draggable thumb, proportional sizing, and hover reveal.',
    exports: ['Scrollbar'],
    types: ['ScrollbarProps', 'ScrollbarVariant'],
    props: {
      children: { type: 'React.ReactNode', required: true },
      variant: { type: "'default' | 'thick'", default: "'default'" },
      showTrackOnHover: { type: 'boolean', default: 'true' },
      onScroll: { type: '(e: React.UIEvent<HTMLDivElement>) => void' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: [],
  }],
  ['Header', {
    title: 'Header',
    description: 'App header bar with background variants.',
    exports: ['Header'],
    types: ['HeaderProps', 'HeaderBackground'],
    props: {
      children: { type: 'React.ReactNode' },
      background: { type: 'HeaderBackground' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: ['Surface'],
  }],

  // Classic
  ['RadioGroup', {
    title: 'RadioGroup',
    description: 'Radio selection group (`ds-radio-group`) with vertical/horizontal layout, per-option inactive, and keyboard navigation.',
    exports: ['ds-radio-group'],
    types: ['RadioOption'],
    props: {
      value: { type: 'string', required: true },
      onChange: { type: '(value: string) => void', required: true },
      options: { type: 'RadioOption[]', required: true },
      direction: { type: "'vertical' | 'horizontal'", default: "'vertical'" },
      inactive: { type: 'boolean' },
      'aria-label': { type: 'string' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: ['Text'],
  }],
  ['TabGroup', {
    title: 'TabGroup',
    description: 'Horizontal or vertical tab list (`ds-tab-group`) with roving keyboard focus and optional dividers between tab groups.',
    exports: ['ds-tab-group'],
    types: ['TabItem'],
    props: {
      tabs: { type: 'TabItem[]', required: true, description: 'Tab ids/labels; `{ type: "divider" }` for group breaks.' },
      value: { type: 'string', description: 'Selected tab id.' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: [],
  }],
  ['TabGroupNav', {
    title: 'TabGroupNav',
    description: 'Navigation-style tab list (`ds-tab-group-nav`) copied from the original TabGroup behavior for primary/secondary navigation surfaces.',
    exports: ['ds-tab-group-nav'],
    types: ['TabItem'],
    props: {
      tabs: { type: 'TabItem[]', required: true, description: 'Tab ids/labels; `{ type: "divider" }` for group breaks.' },
      value: { type: 'string', description: 'Selected tab id.' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: [],
  }],
  ['Accordion', {
    title: 'Accordion',
    description: 'Collapsible section list with single or multiple expand mode, animated height transitions, and controlled/uncontrolled state.',
    exports: ['Accordion', 'AccordionItem'],
    types: ['AccordionProps', 'AccordionItemProps', 'AccordionItemData'],
    props: {
      items: { type: 'AccordionItemData[]', required: true },
      multiple: { type: 'boolean', default: 'false', description: 'Allow multiple items open at once.' },
      expandedIds: { type: 'string[]', description: 'Controlled expanded state.' },
      onExpandedChange: { type: '(ids: string[]) => void' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: ['Text'],
  }],
  ['Breadcrumb', {
    title: 'Breadcrumb',
    description: 'Hierarchical navigation with link or button items, custom separator, and aria-current on the last item.',
    exports: ['Breadcrumb'],
    types: ['BreadcrumbProps', 'BreadcrumbItem'],
    props: {
      items: { type: 'BreadcrumbItem[]', required: true, description: 'Last item is treated as current page.' },
      separator: { type: 'React.ReactNode', default: "'/'" },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: ['Text'],
  }],
  ['Pagination', {
    title: 'Pagination',
    description: 'Standalone page navigation with ellipsis for large ranges, sibling count control, and keyboard-accessible buttons.',
    exports: ['Pagination'],
    types: ['PaginationProps'],
    props: {
      page: { type: 'number', required: true, description: '1-based current page.' },
      totalPages: { type: 'number', required: true },
      onPageChange: { type: '(page: number) => void', required: true },
      siblingCount: { type: 'number', default: '1' },
      inactive: { type: 'boolean' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: ['Text'],
  }],
  ['Divider', {
    title: 'Divider',
    description: 'Decorative horizontal or vertical visual separator for non-edge-to-edge separation. Supports surface-aware divider tokens, inset, and custom line length.',
    exports: ['Divider'],
    types: ['DividerProps', 'DividerOrientation', 'DividerSurface', 'DividerInset', 'DividerLength'],
    props: {
      orientation: { type: "'horizontal' | 'vertical'", default: "'horizontal'" },
      surface: { type: "'default' | 'on-bold-background' | 'on-strong-background' | 'on-medium-background' | 'on-translucent-background' | 'navigation' | 'media' | 'always-dark' | 'inverted'", default: "'default'", description: 'Surface context for the divider color token.' },
      inset: { type: "'none' | 'space-000' | 'space-012' | 'space-025' | 'space-050' | 'space-075' | 'space-100' | 'space-125' | 'space-150' | 'space-175' | 'space-200' | 'space-250' | 'space-300' | 'space-400' | 'space-600' | 'space-800' | string", default: "'none'", description: 'Start/end inset. Use TokoMo spacing token names or a CSS length.' },
      length: { type: "'auto' | 'full' | string", default: "'auto'", description: 'Line length along the divider axis.' },
      semantic: { type: 'boolean', default: 'false', description: 'Expose role=\"separator\". Default is decorative/aria-hidden.' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: [],
  }],
  ['Skeleton', {
    title: 'Skeleton',
    description: 'Loading placeholder with text, circular, and rectangular variants. Supports multi-line text and shimmer animation.',
    exports: ['Skeleton'],
    types: ['SkeletonProps', 'SkeletonVariant'],
    props: {
      variant: { type: "'text' | 'circular' | 'rectangular'", default: "'text'" },
      width: { type: 'string | number' },
      height: { type: 'string | number' },
      lines: { type: 'number', default: '1', description: "Text variant only. Last line renders at 60% width." },
      animate: { type: 'boolean', default: 'true' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: [],
  }],
  ['Toast', {
    title: 'Toast',
    description: 'Imperative toast notification system. Use toast.success()/error()/warning()/info() to show toasts. Place <ToastContainer /> once at the app root.',
    exports: ['ToastContainer', 'toast', 'useToasts'],
    types: ['ToastContainerProps', 'ToastData', 'ToastOptions', 'ToastIntent', 'ToastPosition'],
    props: {
      position: { type: "'top-center' | 'top-right' | 'bottom-center' | 'bottom-right'", default: "'top-center'", description: 'ToastContainer position prop.' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: ['Surface', 'Text'],
    usageNotes: 'Place <ToastContainer /> once at app root. Then call toast.success("Done!") anywhere.',
  }],
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

function toKebab(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

function readComponentFiles(dirName) {
  const dir = path.join(WC_SRC, dirName);
  const srcRel = `src/wc/components/${dirName}`;

  if (!fs.existsSync(dir)) {
    console.warn(`  ⚠ WC directory not found: ${dir}`);
    return [];
  }

  const filenames = fs.readdirSync(dir).filter(f =>
    (f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.css')) &&
    !f.endsWith('.stories.ts') &&
    !f.endsWith('.stories.tsx') &&
    f !== 'index.ts'
  );

  return filenames.map(filename => {
    const filePath = path.join(dir, filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    return {
      path: `${srcRel}/${filename}`,
      content,
      type: 'registry:ui',
    };
  });
}

/** Build the consumption guide for a web-component (Stencil) component. */
function buildConsumptionGuide(config) {
  const guide = {};

  // 1. Install — tokens + icons are required runtime peers for every consumer
  guide.install = TRILOGY_INSTALL;

  // 2. CSS setup — token CSS vars must be imported once at app root
  if (config.usesTokens) {
    guide.cssSetup = [
      "Import at your app entry point:",
      "  import '@ds-mo/tokens';        // or @ds-mo/tokens/css",
      "  import '@ds-mo/tokens/reset';",
      "  import '@ds-mo/tokens/globals';",
      "For dark mode: set data-theme=\"dark\" on <html>.",
      "Component CSS ships scoped inside each @ds-mo/ui custom-element import — no global @ds-mo/ui/css.",
    ].join('\n');
  }

  // 3. Register custom elements (import each tag you render — auto-define on import)
  guide.register = [
    "// Import only the <ds-*> tags your app uses:",
    `import '@ds-mo/ui/dist/components/ds-${toKebab(config.title)}.js';`,
    "",
    "// Angular: import proxies from '@ds-mo/ui/angular'",
    "// React: import { DsButton, … } from '@ds-mo/ui/react'",
  ].join('\n');

  // 4. Usage pattern (HTML / JSX / Angular template)
  const tag = config.tag ?? `ds-${toKebab(config.title)}`;
  guide.usage = {
    html: `<${tag}></${tag}>`,
    react: `<${tag}></${tag}>`,
    angular: `<${tag}></${tag}>`,
  };

  // 5. Events — all Stencil events are CustomEvents on the element
  if (config.events?.length) {
    guide.events = config.events.map(e => ({
      name: e,
      listen: `element.addEventListener('${e}', handler)`,
      reactProp: `on${e.charAt(0).toUpperCase() + e.slice(1)}={handler}`,
      angularBinding: `(${e})="handler($event)"`,
    }));
  }

  // 6. JS-only props (complex objects/arrays — cannot be set as HTML attributes)
  if (config.jsPropNote) {
    guide.jsPropNote = config.jsPropNote;
  }

  // 7. Internal dependencies
  if (config.internalDeps?.length) {
    guide.internalDependencies = config.internalDeps.map(dep => ({
      component: dep,
      note: `Used internally by ${config.title}. Bundled in ${PKG}.`,
    }));
  }

  // 8. Peer dependency summary
  guide.peerDependencies = {
    required: [`@ds-mo/tokens ${TOKENS_PEER}`, `@ds-mo/icons ${ICONS_PEER}`],
    optional: [],
    frameworks: 'None — works with React 17+, Angular 12+, plain HTML, and any framework with Custom Element support.',
  };

  // 9. Usage notes
  if (config.usageNotes) {
    guide.notes = config.usageNotes;
  }

  return guide;
}

// ─── Generate ───────────────────────────────────────────────────────────────────

fs.mkdirSync(OUT, { recursive: true });

const registryItems = [];

for (const [dirName, config] of COMPONENTS) {
  const name = toKebab(dirName);
  const files = readComponentFiles(dirName);

  if (files.length === 0) {
    console.warn(`  ⚠ Skipping ${name}: no files found`);
    continue;
  }

  const consumption = buildConsumptionGuide(config);

  const item = {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name,
    title: config.title,
    description: config.description,
    type: 'registry:ui',

    // ─── Consumption guide (how to use via npm) ──────────────
    meta: {
      library: PKG,
      distribution: 'npm',
      storybook: `${STORYBOOK_URL}?path=/story/${name}`,
      consumption,
      props: config.props ?? {},
      exports: config.exports,
      types: config.types ?? [],
    },

    // ─── Standard registry fields ────────────────────────────
    dependencies: [
      PKG,
      ...(config.usesTokens ? ['@ds-mo/tokens'] : []),
      ...(config.usesIcons ? ['@ds-mo/icons'] : []),
    ],
    registryDependencies: (config.internalDeps ?? []).map(d => toKebab(d)),

    // ─── Source reference (for AI context, not for copying) ──
    files,
  };

  // Write individual component JSON
  const outPath = path.join(OUT, `${name}.json`);
  fs.writeFileSync(outPath, JSON.stringify(item, null, 2));
  console.log(`  ✓ ${name}.json (${files.length} files, ${Object.keys(config.props ?? {}).length} props)`);

  // Collect for master manifest (no source inlined — lightweight)
  registryItems.push({
    name,
    title: config.title,
    description: config.description,
    type: 'registry:ui',
    meta: {
      library: PKG,
      distribution: 'npm',
      storybook: `${STORYBOOK_URL}?path=/story/${name}`,
      exports: config.exports,
      props: Object.fromEntries(
        Object.entries(config.props ?? {}).map(([k, v]) => [k, { type: v.type, required: v.required ?? false }])
      ),
    },
    dependencies: [
      PKG,
      '@ds-mo/tokens',
      ...(config.usesIcons ? ['@ds-mo/icons'] : []),
    ],
    registryDependencies: (config.internalDeps ?? []).map(d => toKebab(d)),
  });
}

// ─── Master manifest ────────────────────────────────────────────────────────────

const registry = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'compomo',
  homepage: STORYBOOK_URL,
  description: `CompoMo (@ds-mo/ui) — framework-agnostic web component library built with Stencil.js. Styled with TokoMo design tokens. Works with React 17+, Angular 12+, and plain HTML. Distributed as an npm package; not copy-paste.`,
  meta: {
    distribution: 'npm',
    install: TRILOGY_INSTALL,
    register: "import '@ds-mo/ui/dist/components/ds-button.js'; // import each <ds-*> tag you use",
    cssSetup: "import '@ds-mo/tokens';\nimport '@ds-mo/tokens/reset';\nimport '@ds-mo/tokens/globals';",
    themeSetup: "Set data-theme=\"dark\" on <html> for dark mode. Light is default.",
    peerDependencies: {
      required: [`@ds-mo/tokens ${TOKENS_PEER}`, `@ds-mo/icons ${ICONS_PEER}`],
      optional: [],
      frameworks: 'None required — works with any framework that supports Custom Elements.',
    },
  },
  items: registryItems,
};

fs.writeFileSync(path.join(OUT, 'registry.json'), JSON.stringify(registry, null, 2));
console.log(`\n  ✓ registry.json (${registryItems.length} components)`);
console.log(`\n  Registry built to ${OUT}`);
