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
const PACKAGE_JSON = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

const PKG = PACKAGE_JSON.name;
const STORYBOOK_URL = 'https://zainadeel.github.io/compomo/';
const TOKENS_PEER = PACKAGE_JSON.peerDependencies['@ds-mo/tokens'];
const ICONS_PEER = PACKAGE_JSON.peerDependencies['@ds-mo/icons'];
const TRILOGY_INSTALL = `npm install ${PKG} @ds-mo/tokens @ds-mo/icons`;
const FRAMEWORK_SUPPORT = 'Custom Elements; React 18/19 wrappers; Angular 19-22 standalone adapters.';
const FORM_CONTROL_PROPS = {
  name: { type: 'string', description: 'Native form field name.' },
  disabled: { type: 'boolean', default: 'false', description: 'Standard disabled state; Angular forms set this automatically.' },
  required: { type: 'boolean', default: 'false', description: 'Participates in native constraint validation.' },
  requiredMessage: { type: 'string', default: "'This field is required.'", description: 'Localizable required validation message.' },
};

// ─── Component catalog ─────────────────────────────────────────────────────────

const COMPONENTS = [
  // Primitives
  ['Text', {
    title: 'Text',
    description: 'Typography primitive supporting all design-system text variants, colors, truncation, and wrapping.',
    exports: ['Text'],
    types: ['TextProps', 'TextVariant', 'TextStyle', 'TextColor', 'TextColorToken', 'TextDecoration', 'TextAlign', 'LineTruncation', 'TextWrap', 'TextElement'],
    props: {
      variant: {
        type: 'TextVariant',
        default: "'text-body-medium'",
        description:
          'Size/leading recipe (display, title, body, caption). Emphasis weight + tracking is a separate prop.',
      },
      emphasis: {
        type: 'boolean',
        default: 'false',
        description:
          'Heavier weight + tighter letter-spacing. Default false. True: display bold, title/caption semibold, body medium.',
      },
      children: { type: 'React.ReactNode', required: true },
      color: { type: 'TextColor', description: 'Token-based text color.' },
      as: { type: "'p' | 'span' | 'div' | 'label' | 'h1'-'h6'", default: "'p'" },
      for: { type: 'string', description: 'Maps to `for` on label elements.' },
      textId: { type: 'string', description: 'DOM id on the inner text element (aria-labelledby / aria-describedby targets).' },
      lineTruncation: { type: '1 | 2 | 3 | 4 | 5 | "none"', default: "'none'" },
      decoration: { type: "'none' | 'underline' | 'dotted-underline'" },
      italic: { type: 'boolean' },
      align: { type: "'left' | 'center' | 'right'" },
      wrap: { type: "'wrap' | 'nowrap' | 'balance' | 'pretty'" },
      fontFeature: { type: "'normal' | 'tabular-nums'", default: "'normal'" },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: [],
  }],
  ['Card', {
    title: 'Card',
    tag: 'ds-card',
    description: 'Shared card chrome — width + matching min-height tokens, header (title + actions slot), and a flex body that fills leftover space. Compose from settings and data-viz cards.',
    exports: ['Card'],
    types: ['CardWidth', 'CardAppearance'],
    props: {
      heading: { type: 'string', required: true, description: 'Section title in the card header.' },
      cardWidth: {
        type: "'sm' | 'md' | 'lg'",
        default: "'md'",
        description:
          'Width token; also sets host min-height to the matching --dimension-card-height-*.',
      },
      appearance: { type: "'default' | 'editing'", default: "'default'", description: 'Chrome recipe — editing applies the settings edit wash.' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: ['Text'],
  }],
  ['CardSetting', {
    title: 'CardSetting',
    tag: 'ds-card-setting',
    description: 'Settings page section shell composed on ds-card with view/edit header actions. Edit state is controlled by the parent.',
    exports: ['CardSetting'],
    types: ['CardSettingWidth'],
    props: {
      heading: { type: 'string', required: true, description: 'Section title in the card header.' },
      cardWidth: {
        type: "'sm' | 'md' | 'lg'",
        default: "'md'",
        description:
          'Width token; also sets host min-height to the matching --dimension-card-height-* so empty bodies still fill the card.',
      },
      editing: { type: 'boolean', default: 'false', description: 'Controlled edit state.' },
    },
    events: ['dsEditingChange'],
    usesTokens: true,
    usesIcons: true,
    internalDeps: ['Card', 'Text', 'ButtonUnfilled', 'ButtonFilled'],
  }],
  ['CardDataVizDonut', {
    title: 'CardDataVizDonut',
    tag: 'ds-card-data-viz-donut',
    description: 'Donut data-viz card on shared ds-card chrome — fill chart region, content-sized legend, header filter action, and chart↔legend hover sync.',
    exports: ['CardDataVizDonut'],
    types: ['CardDataVizDonutWidth'],
    props: {
      heading: { type: 'string', required: true, description: 'Widget title in the card header.' },
      cardWidth: {
        type: "'sm' | 'md' | 'lg'",
        default: "'md'",
        description: 'Width token; also sets matching min-height.',
      },
    },
    events: ['dsFilterClick'],
    usesTokens: true,
    usesIcons: true,
    internalDeps: ['Card', 'ButtonUnfilled', 'ChartDonut', 'ChartLegend'],
  }],

  // Core Interactive
  ['ButtonFilled', {
    title: 'ButtonFilled',
    tag: 'ds-button-filled',
    description: 'Filled button with variant (label / icon / icon-label), control-density sizes, width hug/fill, and intent×contrast fills.',
    exports: ['ButtonFilled'],
    types: ['ButtonFilledIntent', 'ButtonFilledContrast', 'ButtonFilledVariant', 'ButtonFilledSize', 'ButtonFilledWidth'],
    props: {
      variant: { type: "'icon' | 'label' | 'icon-label'", default: "'label'", description: 'Content layout. Icon-only chrome must pass variant="icon".' },
      size: { type: "'md' | 'sm' | 'xs'", default: "'md'", description: 'Control-density height/padding/icon/type.' },
      width: { type: "'hug' | 'fill'", default: "'hug'", description: 'Width fit — hug content or fill the parent.' },
      label: { type: 'string', description: 'Visible text for label / icon-label variants.' },
      icon: { type: 'string', description: 'Canonical IcoMo icon export name for icon / icon-label variants.' },
      intent: { type: "'neutral' | 'brand' | 'ai' | 'negative' | 'warning' | 'caution' | 'positive' | 'guide' | 'walkthrough'", default: "'brand'" },
      contrast: { type: "'bold' | 'strong' | 'medium' | 'faint'", default: "'bold'" },
      isInactive: { type: 'boolean', default: 'false', description: 'Disables interaction (25% opacity via ds-control-inactive).' },
      ariaLabel: { type: 'string', description: 'Accessible name (required for icon-only when label is empty).' },
    },
    events: ['dsClick'],
    usesTokens: true,
    usesIcons: true,
    internalDeps: ['Icon'],
  }],
  ['ButtonUnfilled', {
    title: 'ButtonUnfilled',
    tag: 'ds-button-unfilled',
    description: 'Unfilled button with variant (label / icon / icon-label), control-density sizes, width hug/fill, active/border/dot, and surface-aware interaction states.',
    exports: ['ButtonUnfilled'],
    types: ['ButtonUnfilledBackground', 'ButtonUnfilledOnBackgroundContrast', 'ButtonUnfilledVariant', 'ButtonUnfilledSize', 'ButtonUnfilledWidth'],
    props: {
      variant: { type: "'icon' | 'label' | 'icon-label'", default: "'label'", description: 'Content layout. Icon-only chrome must pass variant="icon".' },
      size: { type: "'md' | 'sm' | 'xs'", default: "'md'", description: 'Control-density height/padding/icon/type.' },
      width: { type: "'hug' | 'fill'", default: "'hug'", description: 'Width fit — hug content or fill the parent.' },
      label: { type: 'string', description: 'Visible text for label / icon-label variants.' },
      icon: { type: 'string', description: 'Canonical IcoMo icon export name for icon / icon-label variants.' },
      isActive: { type: 'boolean', default: 'false', description: 'Active/selected state. Always promotes icon/label to primary foreground.' },
      activeFill: { type: 'boolean', default: 'true', description: 'When active, render selected interaction fill. Set false for shell chrome (primary fg, no fill).' },
      hasBorder: { type: 'boolean', default: 'true', description: 'Secondary 1px inset border. Default on; shell chrome should pass false.' },
      dot: { type: 'boolean', default: 'false', description: 'Notification dot (icon variant only).' },
      isInactive: { type: 'boolean', default: 'false', description: 'Disables interaction (25% opacity via ds-control-inactive).' },
      backgroundContrast: { type: "'default' | 'medium' | 'bold' | 'strong'", description: 'Parent surface contrast for interaction and focus tokens.' },
      background: { type: "'always-dark' | 'navigation'", description: 'Navigation and always-dark chrome surfaces.' },
      ariaLabel: { type: 'string', description: 'Accessible name (required for icon-only when label is empty).' },
    },
    events: ['dsClick', 'dsChange'],
    usesTokens: true,
    usesIcons: true,
    internalDeps: ['Icon', 'Badge'],
  }],
  ['Tag', {
    title: 'Tag',
    description: 'Static metadata label with intent coloring and optional icon support. Uses control-density recipes for md/sm/xs.',
    exports: ['Tag'],
    types: ['TagProps', 'TagIntent', 'TagContrast', 'TagSize'],
    props: {
      label: { type: 'string', required: true },
      intent: { type: "'neutral' | 'brand' | 'ai' | 'negative' | 'warning' | 'caution' | 'positive'", default: "'neutral'" },
      contrast: { type: "'strong' | 'bold' | 'medium' | 'faint'", default: "'faint'" },
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
    description: 'Removable metadata chip — same control-density recipe as Tag, colored by semantic state (default / active / error / caution). Not a toggle/select control.',
    exports: ['Chip'],
    types: ['ChipProps', 'ChipState', 'ChipSize', 'ChipBackground'],
    props: {
      label: { type: 'string', required: true },
      state: { type: "'default' | 'active' | 'error' | 'caution'", default: "'default'", description: 'Semantic color: neutral / brand / negative / caution faint.' },
      size: { type: "'md' | 'sm' | 'xs'", default: "'md'" },
      rounded: { type: 'boolean' },
      removable: { type: 'boolean', default: 'true', description: 'Shows the trailing dismiss (✕) control.' },
      onRemove: { type: '() => void' },
      isInactive: { type: 'boolean', default: 'false', description: 'Disables interaction (25% opacity via ds-control-inactive).' },
      background: { type: "'faint' | 'medium' | 'bold' | 'strong' | 'always-dark'" },
      maxWidth: { type: 'string | number' },
    },
    usesTokens: true,
    usesIcons: true,
    internalDeps: ['Text', 'Icon'],
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
    description: 'Anti-clockwise SVG spinner matching ds-icon size/color tokens. Spins in 1s via --effect-animation-duration-long-2.',
    exports: ['Loader'],
    types: ['LoaderSize', 'LoaderColor'],
    props: {
      size: { type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'", default: "'md'", description: 'Iconography size token — same scale as ds-icon.' },
      color: { type: 'IconColor', description: 'Semantic foreground color token, or a raw CSS var reference. Same tokens as ds-icon.' },
      label: { type: 'string', description: 'Accessible label for standalone usage (live region). Omit when the host already conveys busy state.' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: [],
  }],
  ['Toggle', {
    title: 'Toggle',
    description: 'Switch control with on/off state and accessible role="switch".',
    exports: ['Toggle'],
    types: ['ToggleProps'],
    props: {
      ...FORM_CONTROL_PROPS,
      checked: { type: 'boolean', default: 'false' },
      value: { type: 'string', default: "'on'", description: 'Submitted value when checked.' },
      onChange: { type: '(checked: boolean) => void' },
      isInactive: { type: 'boolean', default: 'false', description: 'Disables interaction (25% opacity via ds-control-inactive).' },
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
      ...FORM_CONTROL_PROPS,
      label: { type: 'string', required: true },
      checked: { type: 'boolean', default: 'false' },
      value: { type: 'string', default: "'on'", description: 'Submitted value when checked.' },
      indeterminate: { type: 'boolean', default: 'false' },
      onChange: { type: '(checked: boolean) => void' },
      isInactive: { type: 'boolean', default: 'false', description: 'Disables interaction (25% opacity via ds-control-inactive).' },
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
      ...FORM_CONTROL_PROPS,
      value: { type: 'string', required: true },
      onChange: { type: '(e: React.ChangeEvent<HTMLInputElement>) => void', required: true },
      type: { type: "'text' | 'email' | 'tel' | 'url' | 'search' | 'password'", default: "'text'" },
      placeholder: { type: 'string' },
      suffix: { type: 'React.ReactNode' },
      isInactive: { type: 'boolean', default: 'false', description: 'Disables interaction (25% opacity via ds-control-inactive).' },
      clearIcon: { type: 'IconComponent', description: 'Custom clear icon for search type.' },
      clearLabel: { type: 'string', default: "'Clear'", description: 'Localizable accessible label for the search clear action.' },
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
      isInactive: { type: 'boolean', default: 'false', description: 'Disables interaction (25% opacity via ds-control-inactive).' },
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
    description:
      'Dropdown select with unfilled-button chrome (label + trailing ChevronDown) in control-density sizes and width hug/fill. Uses ds-menu for the option list.',
    exports: ['Select'],
    types: ['SelectOption', 'SelectSize', 'SelectWidth'],
    props: {
      ...FORM_CONTROL_PROPS,
      options: {
        type: 'SelectOption[]',
        required: true,
        description: 'Options list. Set as a JS property (not an HTML attribute).',
      },
      value: { type: 'string', default: "''", description: 'Currently selected value.' },
      placeholder: { type: 'string', default: "'Select'" },
      size: { type: "'md' | 'sm' | 'xs'", default: "'md'", description: 'Control-density height/padding/icon/type.' },
      width: { type: "'hug' | 'fill'", default: "'fill'", description: 'Width fit — fill the parent (default) or hug content.' },
      isInactive: { type: 'boolean', default: 'false', description: 'Disables interaction (25% opacity via ds-control-inactive).' },
      activeFill: {
        type: 'boolean',
        default: 'true',
        description:
          'When a value is selected, render the selected interaction fill (same as unfilled-button activeFill). Selected/open promotes the label to primary; chevron stays secondary. Set false for primary label without fill.',
      },
      hasBorder: { type: 'boolean', default: 'true', description: 'Secondary 1px inset border. Default on.' },
    },
    events: ['dsChange'],
    usesTokens: true,
    usesIcons: true,
    internalDeps: ['Menu', 'Icon'],
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
    internalDeps: ['Text'],
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
    description: 'Positioned tooltip with control-density sizes, delay, keyboard shortcut display, and viewport clamping.',
    exports: ['Tooltip'],
    types: ['TooltipProps', 'TooltipSide', 'TooltipAlign', 'TooltipSize'],
    props: {
      label: { type: 'string', required: true },
      size: { type: "'md' | 'sm' | 'xs'", default: "'md'", description: 'Control-density height/padding/type.' },
      children: { type: 'React.ReactElement', required: true },
      side: { type: "'top' | 'right' | 'bottom' | 'left'", default: "'top'" },
      align: { type: "'start' | 'center' | 'end'", default: "'center'" },
      delay: {
        type: 'number | string',
        default: "'var(--effect-animation-delay-medium-3)' /* 1000ms */",
        description:
          'Hover/focus show delay. Default medium-3 (1000ms). Number (ms) or TokoMo time token. Instant reopen after a recent dismiss. Prefer default; override only for denser chrome or rare actions.',
      },
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
    internalDeps: ['Text'],
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
    internalDeps: ['Text', 'Skeleton'],
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
  // Classic
  ['RadioGroup', {
    title: 'RadioGroup',
    description: 'Radio selection group (`ds-radio-group`) with vertical/horizontal layout, per-option isInactive, and keyboard navigation.',
    exports: ['ds-radio-group'],
    types: ['RadioOption'],
    props: {
      ...FORM_CONTROL_PROPS,
      value: { type: 'string', required: true },
      onChange: { type: '(value: string) => void', required: true },
      options: { type: 'RadioOption[]', required: true },
      direction: { type: "'vertical' | 'horizontal'", default: "'vertical'" },
      isInactive: { type: 'boolean', default: 'false', description: 'Disables interaction (25% opacity via ds-control-inactive).' },
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
      tabs: { type: 'TabItem[]', required: true, description: 'Tab ids/labels; `{ type: "divider" }` for group breaks. Use `isInactive` on a tab to disable it (25% opacity).' },
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
      tabs: { type: 'TabItem[]', required: true, description: 'Tab ids/labels; `{ type: "divider" }` for group breaks. Use `isInactive` on a tab to disable it (25% opacity).' },
      value: { type: 'string', description: 'Selected tab id.' },
    },
    usesTokens: true,
    usesIcons: false,
    internalDeps: [],
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
      isInactive: { type: 'boolean', default: 'false', description: 'Disables interaction (25% opacity via ds-control-inactive).' },
      paginationLabel: { type: 'string', default: "'Pagination'" },
      previousPageLabel: { type: 'string', default: "'Previous page'" },
      nextPageLabel: { type: 'string', default: "'Next page'" },
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
    frameworks: FRAMEWORK_SUPPORT,
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
  description: `CompoMo (@ds-mo/ui) — framework-agnostic web component library built with Stencil.js. Styled with TokoMo design tokens. ${FRAMEWORK_SUPPORT} Distributed as an npm package; not copy-paste.`,
  meta: {
    distribution: 'npm',
    install: TRILOGY_INSTALL,
    register: "import '@ds-mo/ui/dist/components/ds-button-filled.js'; // import each <ds-*> tag you use",
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
