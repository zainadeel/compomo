import type { BarNavTab } from '../BarNav/bar-nav-types';
import type { BarTitleActionItem, BarTitlePrimaryAction } from '../BarTitle/bar-title-types';
import type { BreadcrumbItem } from '../Breadcrumb/breadcrumb-types';
import type { MobileHeaderTone } from '../MobileHeader/mobile-header-types';
import type { PanelNavGroup, PanelNavItem, PanelNavRouterMode } from '../PanelNav/panel-nav-types';
import type {
  PanelToolsHeaders,
  PanelToolsHeaderAction,
  PanelToolsItem,
} from '../PanelTools/panel-tools-types';
import type { NavChromeStyle } from '../../shell/nav-chrome';
import type { ShellPageContentInset, ShellPageContentSurface } from '../ShellPage/shell-page-types';

export type ShellAppComposition = 'managed' | 'slotted';

/**
 * Router-owned application navigation supplied to managed ShellApp.
 * ShellApp renders the responsive chrome but never performs route changes.
 */
export interface ShellNavigationConfig {
  /** Groups shown in the current desktop/tablet PanelNav context. */
  groups?: PanelNavGroup[];
  /** Complete Dashboard collection used by the mobile navigation sheet. */
  dashboardGroups?: PanelNavGroup[];
  /** Complete Settings collection used by the mobile navigation sheet. */
  settingsGroups?: PanelNavGroup[];
  /** Current application URL used for active-item matching. */
  currentUrl?: string;
  /** Optional explicit active destination when URL matching is unavailable. */
  activeId?: string;
  /** Current Dashboard or Settings browsing context. */
  browseContext?: NavChromeStyle;
  /** Managed shells default to event routing so the application router stays authoritative. */
  routerMode?: PanelNavRouterMode;
  /** Persisted desktop PanelNav collapse preference key. */
  storageKey?: string;
  userName?: string;
  userInitial?: string;
  accountMenuExpanded?: boolean;
  dashboardLabel?: string;
  settingsLabel?: string;
  accountLabel?: string;
  /** Hide the mobile-sheet Account shortcut when Settings already owns that destination. */
  showMobileAccount?: boolean;
  navigationLabel?: string;
  dashboardNavigationLabel?: string;
  settingsNavigationLabel?: string;
}

/**
 * Route-owned page chrome. The same data drives desktop BarNav/BarTitle and
 * the intentionally different mobile MobileHeader presentation.
 */
export interface ShellPageChromeConfig {
  heading?: string;
  /** Desktop/tablet route-navigation heading when it differs from the page h1. */
  routeHeading?: string;
  description?: string;
  headingLevel?: 'h1' | 'h2';
  tabs?: BarNavTab[];
  value?: string;
  basePath?: string;
  currentUrl?: string;
  sectionsAriaLabel?: string;
  subsections?: BarNavTab[];
  subvalue?: string;
  subsectionsAriaLabel?: string;
  showBack?: boolean;
  backAriaLabel?: string;
  backIcon?: string;
  backLabel?: string;
  breadcrumbs?: BreadcrumbItem[];
  breadcrumbAriaLabel?: string;
  primaryAction?: BarTitlePrimaryAction | null;
  actions?: BarTitleActionItem[];
  /** Icon actions rendered in the mobile header's trailing lane. */
  mobileActions?: PanelToolsHeaderAction[];
  actionsAriaLabel?: string;
  tone?: MobileHeaderTone;
  contentInset?: ShellPageContentInset;
  /** Remove only the content gutter adjacent to the page header. */
  contentInsetBlockStart?: ShellPageContentInset;
  /** Exact roomy block-start content inset when the responsive default is not appropriate. */
  contentInsetBlockStartSize?: string;
  /** Exact block-start content inset while page-title capacity is compact or constrained. */
  compactContentInsetBlockStartSize?: string;
  /** Allow a roomy page title to compact in response to page scrolling. */
  scrollCompaction?: boolean;
  /** Draw the divider beneath the desktop/tablet page title. */
  showHeaderDivider?: boolean;
  /** Override divider visibility while the page title is compact or constrained. */
  showCompactHeaderDivider?: boolean;
  /** Canvas surface painted by ShellPage around and beneath routed content. */
  contentSurface?: ShellPageContentSurface;
}

/**
 * Product-owned global tools supplied to managed ShellApp. Tool view content
 * remains mounted in the corresponding named `*-view` slots.
 */
export interface ShellToolsConfig {
  items?: PanelToolsItem[];
  headers?: PanelToolsHeaders;
  storageKey?: string;
  fullscreenHeaderMode?: 'shared' | 'split';
  toolsLabel?: string;
  toolShortcutsLabel?: string;
  inboxLabel?: string;
  inboxNavigationLabel?: string;
  /** Temporarily conceal the mobile bar while a tool-owned keyboard interaction needs the space. */
  mobileBarHidden?: boolean;
}

export interface ShellNavigationSelectDetail {
  id: string;
  item?: PanelNavItem;
}
