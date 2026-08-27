import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Listen,
  Prop,
  State,
  type VNode,
  Watch,
} from '@stencil/core';
import {
  CONTROL_TEXT_VARIANT,
  DATE_FILTER_RELATIVE_PRESETS,
  controlWidthClass,
  dateFilterRangeValue,
  dateFilterRelativeValue,
  parseDateFilterValue,
  resolveChoicePopupAlignOffset,
  resolveCssLengthPx,
  resolveMotionTimeMs,
  shiftIsoCalendarDate,
  TOKEN_CSS_LENGTHS,
  TOKEN_DEFAULTS,
  type ControlWidth,
} from '../../utils';
import { observeTableCaptionCompact } from '../../utils/table-caption-compact';
import type { AnchoredAlign, AnchoredSide } from '../../utils/anchored-position';
import { AnchoredPositionController } from '../../utils/anchored-position-controller';
import { AnchoredOverlayInteractionController } from '../../utils/anchored-overlay-interaction-controller';
import { resolveAnchoredOverlayBoundaryRect } from '../../utils/anchored-overlay-boundary';
import { ChoiceOptionRow, ChoiceSearch } from '../../utils/choice-list-parts';
import { choiceListUsesSubtext } from '../../utils/choice-list';
import {
  FILTER_MENU_WEEKDAYS,
  filterMenuCalendarDays,
  filterMenuCalendarMonth,
  filterMenuCalendarMonthLabel,
  filterMenuToday,
  shiftFilterMenuCalendarMonth,
} from './filter-menu-calendar';

export type FilterMenuFilterKind = 'single' | 'multiple' | 'boolean' | 'date';
export type FilterMenuSize = 'lg' | 'md' | 'sm' | 'xs';
export type FilterMenuWidth = ControlWidth;
export type FilterMenuFooterLayout = 'summary' | 'categories-clear';
export type FilterMenuMatchMode = 'any' | 'all';
type FilterMenuDateMode = 'range' | 'relative';

export interface FilterMenuOption {
  label: string;
  value: string;
  description?: string;
  isInactive?: boolean;
}

export interface FilterMenuFilter {
  id: string;
  label: string;
  kind: FilterMenuFilterKind;
  options?: FilterMenuOption[];
  description?: string;
  fieldLabel?: string;
  /** Draw a standard menu-section divider after this category. */
  divider?: boolean;
}

export type FilterMenuValue = string[] | boolean | string;
export type FilterMenuValues = Record<string, FilterMenuValue | undefined>;
export type FilterMenuMatchModes = Record<string, FilterMenuMatchMode | undefined>;

export interface FilterMenuChangeDetail {
  filterId: string;
  value: FilterMenuValue;
}

export interface FilterMenuMatchModeChangeDetail {
  filterId: string;
  mode: FilterMenuMatchMode;
}

let filterMenuId = 0;

const ICON_SIZE: Record<FilterMenuSize, 'lg' | 'md' | 'sm' | 'xs'> = {
  lg: 'lg',
  md: 'md',
  sm: 'sm',
  xs: 'xs',
};

const DATE_MODE_TABS = [
  { id: 'relative', label: 'Relative' },
  { id: 'range', label: 'Range' },
];

const RELATIVE_DATE_OPTIONS: FilterMenuOption[] = DATE_FILTER_RELATIVE_PRESETS.map(preset => ({
  label: preset.label,
  value: dateFilterRelativeValue(preset.value),
}));

@Component({
  tag: 'ds-filter-menu',
  styleUrl: 'FilterMenu.css',
  scoped: true,
})
export class FilterMenu {
  @Element() el!: HTMLElement;

  /** Controlled popup visibility. */
  @Prop({ mutable: true }) open: boolean = false;
  /** Select trigger text. */
  @Prop() triggerLabel: string = 'Filters';
  /** Append the active-filter count to the visible trigger label. */
  @Prop() showSelectedCount: boolean = true;
  /** Optional select trigger prefix icon name. */
  @Prop() icon: string | undefined = 'Filters';
  /** Select trigger density. */
  @Prop() size: FilterMenuSize = 'md';
  /** Select trigger width fit. */
  @Prop() width: FilterMenuWidth = 'hug';
  /** Show the surface-aware inset border around the select trigger. */
  @Prop() hasBorder: boolean = true;
  /** Show selected interaction fill when one or more criteria are active. */
  @Prop() activeFill: boolean = false;
  /**
   * Opt into table-caption icon-only chrome below 900px. The trigger omits its
   * visible label and chevron; keep an accessible name via aria-label.
   */
  @Prop({ reflect: true }) collapseLabel: boolean = false;
  /** ID applied to the internal select trigger. */
  @Prop() inputId: string | undefined;
  /** Direct accessible name for the internal select trigger. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;
  /** Product-owned filter categories and option definitions. */
  @Prop() filters: FilterMenuFilter[] = [];
  /** Controlled values keyed by filter id. */
  @Prop() values: FilterMenuValues = {};
  /** Controlled any/all match mode keyed by multiple-choice filter id. Defaults to any. */
  @Prop() matchModes: FilterMenuMatchModes = {};
  /** Controlled category shown in the option pane. */
  @Prop() activeFilterId: string | undefined;
  /** External trigger element to position against. */
  @Prop() anchor: HTMLElement | undefined;
  /** ID of the external trigger element used for positioning and focus return. */
  @Prop() anchorId: string | undefined;
  /** Explicit collision owner; otherwise the nearest data-ds-overlay-boundary ancestor is used. */
  @Prop() boundary: HTMLElement | undefined;
  /** Preferred popup side; collision handling may flip it. */
  @Prop() side: AnchoredSide = 'bottom';
  /** Cross-axis alignment against the trigger. */
  @Prop() align: AnchoredAlign = 'end';
  /** Gap between trigger and popup — number in px or a TokoMo length. */
  @Prop() sideOffset: number | string = TOKEN_CSS_LENGTHS.space050;
  /** Cross-axis offset — number in px or a TokoMo length. */
  @Prop() alignOffset: number | string = 0;
  /** Popup width. It remains clamped to its collision boundary by the component recipe. */
  @Prop() menuWidth: string = TOKEN_CSS_LENGTHS.menuWidthLg;
  /** Accessible name for the non-modal filter dialog. */
  @Prop() menuLabel: string = 'Filters';
  /** Accessible name for the category tab list. */
  @Prop() categoriesLabel: string = 'Filter categories';
  /** Footer action and date-clear accessible label. */
  @Prop() clearLabel: string = 'Clear';
  /** Placeholder shown in each non-date option search header. */
  @Prop() searchPlaceholder: string = 'Search';
  /** Empty-state text shown when an option search has no matches. */
  @Prop() noResultsText: string = 'No results';
  /** Footer recipe: full-width selected summary or reserved category-pane Clear action. */
  @Prop() footerLayout: FilterMenuFooterLayout = 'summary';
  /** Show a visible focus ring on initial entry after keyboard activation. */
  @Prop() initialFocusVisible: boolean = false;

  @State() private shouldRender = false;
  @State() private closing = false;
  @State() private positionReady = false;
  @State() private pos: { x: number; y: number } = { x: 0, y: 0 };
  @State() private focusRingVisible = false;
  @State() private activeOptionIndex = 0;
  @State() private captionCompact = false;
  @State() private dateModeByFilter: Record<string, FilterMenuDateMode> = {};
  @State() private calendarMonthByFilter: Record<string, string> = {};
  @State() private pendingRangeStartByFilter: Record<string, string> = {};
  @State() private previewRangeEndByFilter: Record<string, string> = {};
  @State() private optionQueryByFilter: Record<string, string> = {};

  /** Requests a controlled value replacement without closing the popup. */
  @Event() dsChange!: EventEmitter<FilterMenuChangeDetail>;
  /** Requests that the consumer clear every filter value. */
  @Event() dsClear!: EventEmitter<void>;
  /** Requests a controlled any/all mode replacement for a multiple-choice filter. */
  @Event() dsMatchModeChange!: EventEmitter<FilterMenuMatchModeChangeDetail>;
  /** Requests a controlled active-category replacement. */
  @Event() dsActiveFilterChange!: EventEmitter<string>;
  /** Requests that the controlled popup close. */
  @Event() dsClose!: EventEmitter<void>;
  /** Emitted whenever internal select-trigger activation changes popup visibility. */
  @Event() dsOpenChange!: EventEmitter<boolean>;
  /** Emitted after exit motion and rendered popup removal complete. */
  @Event() dsAfterClose!: EventEmitter<void>;

  private readonly generatedId = `ds-filter-menu-${++filterMenuId}`;
  private triggerElement: HTMLButtonElement | null = null;
  private pendingInitialFocusVisible = false;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private captionCompactDisconnect: (() => void) | undefined;
  private hasLoaded = false;
  private closingSnapshot: {
    filters: FilterMenuFilter[];
    values: FilterMenuValues;
    matchModes: FilterMenuMatchModes;
    activeFilterId: string | undefined;
  } | null = null;

  private readonly position = new AnchoredPositionController({
    getAnchor: () => this.resolvedAnchor,
    getPopup: () => this.el.querySelector<HTMLElement>('.filter-menu-popup'),
    getOwnerDocument: () => this.el.ownerDocument,
    measure: (anchor, popup) => {
      if (!this.open) return null;
      const anchorRect = anchor.getBoundingClientRect();
      const sectionInsetPx = resolveCssLengthPx(TOKEN_DEFAULTS.space050, TOKEN_DEFAULTS.space050);
      return {
        anchorRect,
        popupWidth: popup.offsetWidth || this.popupFallbackWidth,
        popupHeight: popup.offsetHeight || this.popupFallbackHeight,
        side: this.side,
        align: this.align,
        sideOffsetPx: resolveCssLengthPx(this.sideOffset, TOKEN_DEFAULTS.space050),
        alignOffsetPx: resolveChoicePopupAlignOffset({
          align: this.align,
          alignOffsetPx: resolveCssLengthPx(this.alignOffset, 0),
          sectionInsetPx,
        }),
        viewportPadPx: this.viewportPad,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        collisionRect: resolveAnchoredOverlayBoundaryRect(anchor, this.boundary),
      };
    },
    apply: ({ x, y }) => {
      this.pos = { x, y };
    },
    onReady: () => {
      this.positionReady = true;
    },
    liveUpdate: 'double-frame',
    observeResize: true,
    topLayer: true,
  });
  private readonly interaction = new AnchoredOverlayInteractionController({
    getAnchor: () => this.resolvedAnchor,
    getPopup: () => this.el.querySelector<HTMLElement>('.filter-menu-popup'),
    getOwnerDocument: () => this.el.ownerDocument,
    onOutsideActivation: () => this.close(),
  });

  componentDidLoad() {
    this.hasLoaded = true;
    this.syncCaptionCompactObserver();
    if (this.open) this.onOpenChange(true);
  }

  connectedCallback() {
    if (!this.hasLoaded) return;
    this.syncCaptionCompactObserver();
    if (this.open) this.onOpenChange(true);
  }

  disconnectedCallback() {
    this.disconnectCaptionCompactObserver();
    this.position.unobserve();
    this.teardownListeners();
  }

  @Watch('collapseLabel')
  onCollapseLabelChange() {
    this.syncCaptionCompactObserver();
  }

  @Watch('open')
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      this.teardownListeners();
      this.closingSnapshot = null;
      this.shouldRender = true;
      this.closing = false;
      this.positionReady = false;
      this.focusRingVisible = this.pendingInitialFocusVisible || this.initialFocusVisible;
      this.setupListeners();
      this.position.schedule(() => this.focusInitialCategory());
      return;
    }

    if (!this.shouldRender) return;
    this.position.cancel();
    this.captureClosingSnapshot();
    this.closing = true;
    this.teardownListeners();
    const duration = resolveMotionTimeMs(
      TOKEN_DEFAULTS.motionShort2,
      TOKEN_DEFAULTS.animationDurationShort3
    );
    if (duration <= 0) {
      this.finishClose();
      return;
    }
    this.closeTimer = setTimeout(() => this.finishClose(), duration);
  }

  @Watch('anchor')
  @Watch('anchorId')
  @Watch('boundary')
  @Watch('side')
  @Watch('align')
  @Watch('sideOffset')
  @Watch('alignOffset')
  @Watch('menuWidth')
  onPositionInputChange() {
    if (this.open) this.position.schedule();
  }

  @Listen('keydown')
  handleKeyDown(event: KeyboardEvent) {
    if (!this.shouldRender || this.closing) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key !== 'Tab' || !this.tabLeavesPopup(event)) return;
    event.preventDefault();
    this.close(false);
    this.interaction.moveFocusAfterTab(event.shiftKey);
  }

  private get resolvedAnchor(): HTMLElement | null {
    if (this.anchor) return this.anchor;
    if (this.anchorId) return document.getElementById(this.anchorId);
    return this.triggerElement;
  }

  private get usesInternalTrigger(): boolean {
    return !this.anchor && !this.anchorId;
  }

  private get viewportPad(): number {
    return resolveCssLengthPx(TOKEN_DEFAULTS.space050, TOKEN_DEFAULTS.space050);
  }

  private get popupFallbackWidth(): number {
    return resolveCssLengthPx(TOKEN_DEFAULTS.menuWidthLg, TOKEN_DEFAULTS.menuWidthLg);
  }

  private get popupFallbackHeight(): number {
    return resolveCssLengthPx(TOKEN_DEFAULTS.menuFallbackHeight, TOKEN_DEFAULTS.menuFallbackHeight);
  }

  private setupListeners() {
    this.interaction.connect();
    this.position.observe();
  }

  private teardownListeners() {
    this.position.unobserve();
    this.interaction.disconnect();
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  private close(restoreFocus = true) {
    this.captureClosingSnapshot();
    if (restoreFocus) this.interaction.focusAnchor();
    this.dsOpenChange.emit(false);
    this.dsClose.emit();
    this.open = false;
    this.onOpenChange(false);
  }

  private toggleFromTrigger(event: MouseEvent) {
    if (this.open) {
      this.close();
      return;
    }
    this.pendingInitialFocusVisible = event.detail === 0;
    this.open = true;
    this.dsOpenChange.emit(true);
    this.onOpenChange(true);
  }

  private handleTriggerKeyDown(event: KeyboardEvent) {
    if (event.key !== 'ArrowDown' || this.open) return;
    event.preventDefault();
    this.pendingInitialFocusVisible = true;
    this.open = true;
    this.dsOpenChange.emit(true);
    this.onOpenChange(true);
  }

  private finishClose() {
    const popup = this.el.querySelector<HTMLElement>('.filter-menu-popup');
    if (popup?.matches(':popover-open')) popup.hidePopover();
    this.shouldRender = false;
    this.closing = false;
    this.closingSnapshot = null;
    this.closeTimer = null;
    this.dateModeByFilter = {};
    this.calendarMonthByFilter = {};
    this.pendingRangeStartByFilter = {};
    this.previewRangeEndByFilter = {};
    this.optionQueryByFilter = {};
    this.dsAfterClose.emit();
  }

  private captureClosingSnapshot() {
    if (this.closingSnapshot) return;
    this.closingSnapshot = {
      filters: this.filters.map(filter => ({
        ...filter,
        options: filter.options?.map(option => ({ ...option })),
      })),
      values: Object.fromEntries(
        Object.entries(this.values).map(([key, value]) => [
          key,
          Array.isArray(value) ? [...value] : value,
        ])
      ),
      matchModes: { ...this.matchModes },
      activeFilterId: this.activeFilterId,
    };
  }

  private focusInitialCategory() {
    requestAnimationFrame(() => {
      this.el.querySelector<HTMLElement>('.filter-menu__category[tabindex="0"]')?.focus();
      this.pendingInitialFocusVisible = false;
    });
  }

  private tabLeavesPopup(event: KeyboardEvent): boolean {
    return this.interaction.tabLeavesPopup(event);
  }

  private selectedFilter(filters: FilterMenuFilter[], activeFilterId: string | undefined) {
    return filters.find(filter => filter.id === activeFilterId) ?? filters[0];
  }

  private selectedCount(filter: FilterMenuFilter, values: FilterMenuValues): number {
    const value = values[filter.id];
    if (filter.kind === 'multiple') return Array.isArray(value) ? value.length : 0;
    if (filter.kind === 'boolean') return value === true ? 1 : 0;
    return typeof value === 'string' && value.length > 0 ? 1 : 0;
  }

  private totalSelected(filters: FilterMenuFilter[], values: FilterMenuValues): number {
    return filters.reduce((total, filter) => total + this.selectedCount(filter, values), 0);
  }

  private activeFilterCount(filters: FilterMenuFilter[], values: FilterMenuValues): number {
    return filters.filter(filter => this.selectedCount(filter, values) > 0).length;
  }

  private selectCategory(filterId: string, focus = false) {
    this.activeOptionIndex = 0;
    this.dsActiveFilterChange.emit(filterId);
    if (!focus) return;
    requestAnimationFrame(() => {
      this.el.querySelector<HTMLElement>(`[data-filter-category="${filterId}"]`)?.focus();
    });
  }

  private handleCategoryKeyDown(
    event: KeyboardEvent,
    filters: FilterMenuFilter[],
    filterId: string
  ) {
    const currentIndex = filters.findIndex(filter => filter.id === filterId);
    let nextIndex: number;
    if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % filters.length;
    else if (event.key === 'ArrowUp')
      nextIndex = (currentIndex - 1 + filters.length) % filters.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = filters.length - 1;
    else if (event.key === 'ArrowRight') {
      event.preventDefault();
      requestAnimationFrame(() => {
        this.el
          .querySelector<HTMLElement>(
            '.filter-menu__options [role="option"], .filter-menu__options [data-date-option], .filter-menu__options input'
          )
          ?.focus();
      });
      return;
    } else return;

    event.preventDefault();
    this.focusRingVisible = true;
    this.selectCategory(filters[nextIndex].id, true);
  }

  private handlePanelKeyDown(event: KeyboardEvent, filterId: string) {
    if (event.key !== 'ArrowLeft') return;
    event.preventDefault();
    this.el.querySelector<HTMLElement>(`[data-filter-category="${filterId}"]`)?.focus();
  }

  private handleOptionKeyDown(
    event: KeyboardEvent,
    filter: FilterMenuFilter,
    option: FilterMenuOption,
    index: number,
    values: FilterMenuValues,
    visibleOptions: FilterMenuOption[] = filter.options ?? []
  ) {
    if (event.key === 'ArrowLeft') {
      this.handlePanelKeyDown(event, filter.id);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectOption(filter, option, values);
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const enabled = visibleOptions
      .map((candidate, optionIndex) => ({ candidate, optionIndex }))
      .filter(({ candidate }) => !candidate.isInactive)
      .map(({ optionIndex }) => optionIndex);
    if (!enabled.length) return;
    const current = enabled.indexOf(index);
    let next: number;
    if (event.key === 'Home') next = enabled[0];
    else if (event.key === 'End') next = enabled[enabled.length - 1];
    else {
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const start = current >= 0 ? current : direction === 1 ? -1 : 0;
      next = enabled[(start + direction + enabled.length) % enabled.length];
    }
    this.activeOptionIndex = next;
    this.focusRingVisible = true;
    requestAnimationFrame(() => {
      this.el
        .querySelector<HTMLElement>(`#${this.generatedId}-${filter.id}-option-${next}`)
        ?.focus();
    });
  }

  private optionMatchesQuery(option: FilterMenuOption, query: string): boolean {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return true;
    return `${option.label} ${option.description ?? ''}`.toLocaleLowerCase().includes(normalized);
  }

  private visibleOptions(
    filter: FilterMenuFilter,
    query = this.optionQueryByFilter[filter.id] ?? ''
  ) {
    if (filter.kind === 'boolean') {
      const option = this.booleanOption(filter);
      return this.optionMatchesQuery(option, query) ? [option] : [];
    }
    return (filter.options ?? []).filter(option => this.optionMatchesQuery(option, query));
  }

  private booleanOption(filter: FilterMenuFilter): FilterMenuOption {
    return {
      label: filter.fieldLabel ?? filter.label,
      value: 'true',
      description: filter.description,
    };
  }

  private setOptionQuery(filter: FilterMenuFilter, value: string) {
    const visibleOptions = this.visibleOptions(filter, value);
    const firstEnabled = visibleOptions.findIndex(option => !option.isInactive);
    this.activeOptionIndex = firstEnabled;
    this.focusRingVisible = false;
    this.optionQueryByFilter = { ...this.optionQueryByFilter, [filter.id]: value };
    requestAnimationFrame(() => {
      const content = this.el.querySelector<HTMLElement>('.filter-menu__options-content');
      if (content) content.scrollTop = 0;
      this.position.schedule();
    });
  }

  private handleOptionSearchKeyDown(event: KeyboardEvent, filter: FilterMenuFilter) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const visibleOptions = this.visibleOptions(filter);
    const enabled = visibleOptions
      .map((option, index) => ({ option, index }))
      .filter(({ option }) => !option.isInactive)
      .map(({ index }) => index);
    if (!enabled.length) return;
    event.preventDefault();
    const next = event.key === 'ArrowDown' ? enabled[0] : enabled[enabled.length - 1];
    this.activeOptionIndex = next;
    this.focusRingVisible = true;
    requestAnimationFrame(() => {
      this.el
        .querySelector<HTMLElement>(`#${this.generatedId}-${filter.id}-option-${next}`)
        ?.focus();
    });
  }

  private toggleMultiple(
    filter: FilterMenuFilter,
    option: FilterMenuOption,
    checked: boolean,
    values: FilterMenuValues
  ) {
    if (option.isInactive) return;
    const current = Array.isArray(values[filter.id]) ? (values[filter.id] as string[]) : [];
    const selected = new Set(current);
    if (checked) selected.add(option.value);
    else selected.delete(option.value);
    const ordered = (filter.options ?? [])
      .map(candidate => candidate.value)
      .filter(value => selected.has(value));
    this.dsChange.emit({ filterId: filter.id, value: ordered });
  }

  private selectOption(
    filter: FilterMenuFilter,
    option: FilterMenuOption,
    values: FilterMenuValues
  ) {
    if (option.isInactive) return;
    if (filter.kind === 'single') {
      this.dsChange.emit({ filterId: filter.id, value: option.value });
      return;
    }
    const selected = Array.isArray(values[filter.id])
      ? (values[filter.id] as string[]).includes(option.value)
      : false;
    this.toggleMultiple(filter, option, !selected, values);
  }

  private dateMode(filterId: string, value: FilterMenuValue | undefined): FilterMenuDateMode {
    return this.dateModeByFilter[filterId] ?? parseDateFilterValue(value)?.kind ?? 'relative';
  }

  private setDateMode(filter: FilterMenuFilter, value: FilterMenuValue | undefined, mode: string) {
    if (mode !== 'range' && mode !== 'relative') return;
    this.dateModeByFilter = { ...this.dateModeByFilter, [filter.id]: mode };
    this.activeOptionIndex = 0;
    if (mode === 'range' && !this.calendarMonthByFilter[filter.id]) {
      const parsed = parseDateFilterValue(value);
      const initialDate = parsed?.kind === 'range' ? parsed.start : filterMenuToday();
      this.calendarMonthByFilter = {
        ...this.calendarMonthByFilter,
        [filter.id]: filterMenuCalendarMonth(initialDate),
      };
    }
    if (mode === 'relative' && this.pendingRangeStartByFilter[filter.id]) {
      const next = { ...this.pendingRangeStartByFilter };
      delete next[filter.id];
      this.pendingRangeStartByFilter = next;
    }
    if (mode === 'relative') this.clearCalendarRangePreview(filter.id);
  }

  private calendarMonth(filterId: string, value: FilterMenuValue | undefined): string {
    const parsed = parseDateFilterValue(value);
    const initialDate = parsed?.kind === 'range' ? parsed.start : filterMenuToday();
    return this.calendarMonthByFilter[filterId] ?? filterMenuCalendarMonth(initialDate);
  }

  private moveCalendarMonth(filterId: string, month: string, offset: number) {
    this.clearCalendarRangePreview(filterId);
    this.calendarMonthByFilter = {
      ...this.calendarMonthByFilter,
      [filterId]: shiftFilterMenuCalendarMonth(month, offset),
    };
  }

  private selectCalendarDate(filterId: string, value: string) {
    this.clearCalendarRangePreview(filterId);
    const pendingStart = this.pendingRangeStartByFilter[filterId];
    const next = { ...this.pendingRangeStartByFilter };
    if (pendingStart) delete next[filterId];
    else next[filterId] = value;
    this.pendingRangeStartByFilter = next;
    this.dsChange.emit({
      filterId,
      value: dateFilterRangeValue(pendingStart ?? value, value),
    });
  }

  private previewCalendarRange(filterId: string, value: string) {
    if (!this.pendingRangeStartByFilter[filterId]) return;
    if (this.previewRangeEndByFilter[filterId] === value) return;
    this.previewRangeEndByFilter = { ...this.previewRangeEndByFilter, [filterId]: value };
  }

  private clearCalendarRangePreview(filterId: string) {
    if (!this.previewRangeEndByFilter[filterId]) return;
    const next = { ...this.previewRangeEndByFilter };
    delete next[filterId];
    this.previewRangeEndByFilter = next;
  }

  private focusCalendarDate(filterId: string, value: string) {
    this.previewCalendarRange(filterId, value);
    const targetMonth = filterMenuCalendarMonth(value);
    if (this.calendarMonthByFilter[filterId] !== targetMonth) {
      this.calendarMonthByFilter = { ...this.calendarMonthByFilter, [filterId]: targetMonth };
    }
    requestAnimationFrame(() => {
      this.el.querySelector<HTMLElement>(`[data-date-option="${value}"]`)?.focus();
    });
  }

  private handleCalendarDayKeyDown(event: KeyboardEvent, filterId: string, value: string) {
    let offset: number | null = null;
    if (event.key === 'ArrowLeft') offset = -1;
    else if (event.key === 'ArrowRight') offset = 1;
    else if (event.key === 'ArrowUp') offset = -7;
    else if (event.key === 'ArrowDown') offset = 7;
    else if (event.key === 'Home') {
      offset = -new Date(`${value}T00:00:00Z`).getUTCDay();
    } else if (event.key === 'End') {
      offset = 6 - new Date(`${value}T00:00:00Z`).getUTCDay();
    } else if (event.key === 'PageUp') {
      const month = shiftFilterMenuCalendarMonth(filterMenuCalendarMonth(value), -1);
      const day = value.slice(8, 10);
      const candidate = `${month}-${day}`;
      const target = parseDateFilterValue(candidate) ? candidate : `${month}-01`;
      event.preventDefault();
      this.focusCalendarDate(filterId, target);
      return;
    } else if (event.key === 'PageDown') {
      const month = shiftFilterMenuCalendarMonth(filterMenuCalendarMonth(value), 1);
      const day = value.slice(8, 10);
      const candidate = `${month}-${day}`;
      const target = parseDateFilterValue(candidate) ? candidate : `${month}-01`;
      event.preventDefault();
      this.focusCalendarDate(filterId, target);
      return;
    }
    if (offset === null) return;
    event.preventDefault();
    this.focusCalendarDate(filterId, shiftIsoCalendarDate(value, offset));
  }

  private renderRelativeDateOptions(filter: FilterMenuFilter, value: FilterMenuValue | undefined) {
    const relativeFilter: FilterMenuFilter = {
      ...filter,
      kind: 'single',
      options: RELATIVE_DATE_OPTIONS,
    };
    return (
      <div
        class="filter-menu__date-relative ds-choice-list ds-chrome-column ds-chrome-space--sm"
        role="listbox"
        aria-label="Relative date"
      >
        {RELATIVE_DATE_OPTIONS.map((option, index) => (
          <ChoiceOptionRow
            size="md"
            id={`${this.generatedId}-${filter.id}-relative-${index}`}
            option={option}
            selected={value === option.value}
            active={index === this.activeOptionIndex}
            focusRingVisible={this.focusRingVisible}
            usesSubtext={false}
            tabIndex={index === this.activeOptionIndex ? 0 : -1}
            onFocus={() => {
              this.activeOptionIndex = index;
            }}
            onKeyDown={(event: KeyboardEvent) =>
              this.handleOptionKeyDown(event, relativeFilter, option, index, {
                [filter.id]: value,
              })
            }
            onHover={() => {
              this.focusRingVisible = false;
              this.activeOptionIndex = index;
            }}
            onSelect={() => this.dsChange.emit({ filterId: filter.id, value: option.value })}
          />
        ))}
      </div>
    );
  }

  private renderDateCalendar(filter: FilterMenuFilter, value: FilterMenuValue | undefined) {
    const parsed = parseDateFilterValue(value);
    const range = parsed?.kind === 'range' ? parsed : null;
    const month = this.calendarMonth(filter.id, value);
    const days = filterMenuCalendarDays(month);
    const today = filterMenuToday();
    const pendingStart = this.pendingRangeStartByFilter[filter.id];
    const previewEnd = this.previewRangeEndByFilter[filter.id];
    const previewStart = pendingStart && previewEnd ? [pendingStart, previewEnd].sort()[0] : null;
    const previewFinish = pendingStart && previewEnd ? [pendingStart, previewEnd].sort()[1] : null;
    const preferredFocus =
      this.pendingRangeStartByFilter[filter.id] ??
      range?.end ??
      (month === today.slice(0, 7) ? today : '');
    const focusDate = days.some(day => day.value === preferredFocus)
      ? preferredFocus
      : (days.find(day => day.inMonth)?.value ?? days[0]?.value);

    return (
      <div class="filter-menu__calendar">
        <div class="filter-menu__calendar-heading ds-control--md">
          <ds-button-unfilled
            class="filter-menu__calendar-nav filter-menu__calendar-nav--previous"
            variant="icon"
            icon="ChevronLeft"
            size="md"
            hasBorder={false}
            ariaLabel="Previous month"
            onDsClick={() => this.moveCalendarMonth(filter.id, month, -1)}
          />
          <ds-text as="span" variant="text-body-medium" emphasis color="primary">
            {filterMenuCalendarMonthLabel(month)}
          </ds-text>
          <ds-button-unfilled
            class="filter-menu__calendar-nav filter-menu__calendar-nav--next"
            variant="icon"
            icon="ChevronRight"
            size="md"
            hasBorder={false}
            ariaLabel="Next month"
            onDsClick={() => this.moveCalendarMonth(filter.id, month, 1)}
          />
        </div>
        <div class="filter-menu__calendar-weekdays" aria-hidden="true">
          {FILTER_MENU_WEEKDAYS.map(day => (
            <ds-text as="span" variant="text-body-small" color="secondary">
              {day}
            </ds-text>
          ))}
        </div>
        <div
          class="filter-menu__calendar-grid"
          role="grid"
          aria-label={filterMenuCalendarMonthLabel(month)}
          onMouseLeave={() => this.clearCalendarRangePreview(filter.id)}
        >
          {days.map(day => {
            const selectedInRange = Boolean(
              range && day.value >= range.start && day.value <= range.end
            );
            const previewInRange = Boolean(
              previewStart &&
              previewFinish &&
              day.value >= previewStart &&
              day.value <= previewFinish
            );
            const inRange = previewInRange || selectedInRange;
            const rangeEdge = Boolean(
              previewStart
                ? day.value === pendingStart
                : range && (day.value === range.start || day.value === range.end)
            );
            const textColor = rangeEdge
              ? 'on-bold'
              : inRange || day.value === today
                ? 'primary'
                : day.inMonth
                  ? 'secondary'
                  : 'tertiary';
            return (
              <button
                type="button"
                role="gridcell"
                data-date-option={day.value}
                class={{
                  'filter-menu__calendar-day': true,
                  'filter-menu__calendar-day--outside': !day.inMonth,
                  'filter-menu__calendar-day--today': day.value === today,
                  'filter-menu__calendar-day--in-range': inRange,
                  'filter-menu__calendar-day--range-preview': previewInRange,
                  'filter-menu__calendar-day--range-edge': rangeEdge,
                  'ds-focus-ring-inset': true,
                  'ds-interaction-fill': true,
                }}
                aria-label={day.label}
                aria-selected={selectedInRange ? 'true' : 'false'}
                tabIndex={day.value === focusDate ? 0 : -1}
                onMouseEnter={() => this.previewCalendarRange(filter.id, day.value)}
                onFocus={() => this.previewCalendarRange(filter.id, day.value)}
                onClick={() => this.selectCalendarDate(filter.id, day.value)}
                onKeyDown={(event: KeyboardEvent) =>
                  this.handleCalendarDayKeyDown(event, filter.id, day.value)
                }
              >
                <ds-text
                  class="ds-interaction-fill__content"
                  as="span"
                  variant="text-body-medium"
                  color={textColor}
                  emphasis={day.value === today}
                >
                  {day.day}
                </ds-text>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  private renderDateFilter(filter: FilterMenuFilter, value: FilterMenuValue | undefined) {
    const mode = this.dateMode(filter.id, value);
    return (
      <div class="filter-menu__date">
        <header class="filter-menu__date-header ds-chrome-header ds-chrome-header--bounded">
          <ds-tab-group
            ariaLabel="Date filter mode"
            size="md"
            width="fill"
            hasContainer={false}
            value={mode}
            tabs={DATE_MODE_TABS}
            onDsChange={(event: CustomEvent<string>) => {
              event.stopPropagation();
              this.setDateMode(filter, value, event.detail);
            }}
          />
        </header>
        <div class="filter-menu__date-body">
          {mode === 'relative'
            ? this.renderRelativeDateOptions(filter, value)
            : this.renderDateCalendar(filter, value)}
        </div>
      </div>
    );
  }

  private renderOptionSearch(filter: FilterMenuFilter) {
    return (
      <div class="filter-menu__option-search">
        <ChoiceSearch
          size="md"
          hasFocusBoundary={false}
          hasInteractionFill={false}
          value={this.optionQueryByFilter[filter.id] ?? ''}
          placeholder={this.searchPlaceholder}
          ariaLabel={`Search ${filter.label} options`}
          controls={`${this.generatedId}-${filter.id}-options`}
          inputRef={() => undefined}
          clearLabel={`Clear ${filter.label} search`}
          onValueChange={value => this.setOptionQuery(filter, value)}
          onKeyDown={(event: KeyboardEvent) => this.handleOptionSearchKeyDown(event, filter)}
        />
      </div>
    );
  }

  private renderNoOptionResults() {
    return (
      <div
        class="ds-choice-empty ds-empty-region"
        role="option"
        aria-selected="false"
        aria-disabled="true"
        aria-label={this.noResultsText}
        aria-live="polite"
      >
        <ds-empty-state body={this.noResultsText} />
      </div>
    );
  }

  private renderOptions(filter: FilterMenuFilter, values: FilterMenuValues) {
    const value = values[filter.id];
    if (filter.kind === 'multiple' || filter.kind === 'single') {
      const selected = Array.isArray(value) ? value : [];
      const allOptions = filter.options ?? [];
      const options = this.visibleOptions(filter);
      const usesSubtext = choiceListUsesSubtext(
        allOptions.map(option => ({
          label: option.label,
          value: option.value,
          subtext: option.description,
        }))
      );
      if (!options.length) return this.renderNoOptionResults();
      return options.map((option, index) => {
        const isSelected =
          filter.kind === 'multiple' ? selected.includes(option.value) : value === option.value;
        return (
          <ChoiceOptionRow
            size="md"
            id={`${this.generatedId}-${filter.id}-option-${index}`}
            option={{
              label: option.label,
              value: option.value,
              subtext: option.description,
              isInactive: option.isInactive,
            }}
            selected={isSelected}
            active={index === this.activeOptionIndex}
            focusRingVisible={this.focusRingVisible}
            usesSubtext={usesSubtext}
            tabIndex={index === this.activeOptionIndex ? 0 : -1}
            leading={
              filter.kind === 'multiple' ? (
                <span
                  class="ds-choice-item__icon ds-control-icon-box ds-interaction-fill__content"
                  aria-hidden="true"
                >
                  <ds-checkbox label="" size="md" checked={isSelected} presentation />
                </span>
              ) : undefined
            }
            onFocus={() => {
              this.activeOptionIndex = index;
            }}
            onKeyDown={(event: KeyboardEvent) =>
              this.handleOptionKeyDown(event, filter, option, index, values, options)
            }
            onHover={() => {
              this.focusRingVisible = false;
              this.activeOptionIndex = index;
            }}
            onSelect={() => this.selectOption(filter, option, values)}
          />
        );
      });
    }

    if (filter.kind === 'boolean') {
      const [option] = this.visibleOptions(filter);
      if (!option) return this.renderNoOptionResults();
      return (
        <ChoiceOptionRow
          size="md"
          id={`${this.generatedId}-${filter.id}-option-0`}
          option={{
            label: option.label,
            value: option.value,
            subtext: option.description,
          }}
          selected={value === true}
          active
          focusRingVisible={this.focusRingVisible}
          usesSubtext={Boolean(option.description)}
          tabIndex={0}
          leading={
            <span
              class="ds-choice-item__icon ds-control-icon-box ds-interaction-fill__content"
              aria-hidden="true"
            >
              <ds-checkbox label="" size="md" checked={value === true} presentation />
            </span>
          }
          onKeyDown={(event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft') this.handlePanelKeyDown(event, filter.id);
            else if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              this.dsChange.emit({ filterId: filter.id, value: value !== true });
            }
          }}
          onHover={() => {
            this.focusRingVisible = false;
          }}
          onSelect={() => this.dsChange.emit({ filterId: filter.id, value: value !== true })}
        />
      );
    }

    return this.renderDateFilter(filter, value);
  }

  private get captionIconOnly(): boolean {
    return (
      this.collapseLabel && this.captionCompact && this.usesInternalTrigger && Boolean(this.icon)
    );
  }

  private syncCaptionCompactObserver(): void {
    this.disconnectCaptionCompactObserver();
    if (!this.collapseLabel) {
      if (this.captionCompact) this.captionCompact = false;
      return;
    }
    this.captionCompactDisconnect = observeTableCaptionCompact(this.el, compact => {
      if (this.captionCompact !== compact) this.captionCompact = compact;
    });
  }

  private disconnectCaptionCompactObserver(): void {
    this.captionCompactDisconnect?.();
    this.captionCompactDisconnect = undefined;
  }

  private renderCaptionTooltip(trigger: VNode, label: string): VNode {
    if (!this.collapseLabel) return trigger;
    return (
      <ds-tooltip label={label} side="top" size="sm">
        {trigger}
      </ds-tooltip>
    );
  }

  private renderFooter(totalSelected: number, categoriesClear: boolean) {
    return (
      <div
        class={{
          'filter-menu__footer': true,
          'filter-menu__footer--categories-clear': categoriesClear,
          'ds-choice-footer': true,
        }}
        aria-hidden={categoriesClear && totalSelected === 0 ? 'true' : undefined}
      >
        <div class="ds-choice-footer__content ds-control--md">
          {!categoriesClear ? (
            <ds-text
              class="ds-choice-footer__summary"
              as="span"
              variant="text-body-medium"
              color="secondary"
              aria-live="polite"
            >
              {totalSelected} selected
            </ds-text>
          ) : null}
          {totalSelected > 0 ? (
            <button
              class="filter-menu__clear ds-choice-footer__clear ds-text-action"
              type="button"
              onClick={() => {
                this.pendingRangeStartByFilter = {};
                this.dsClear.emit();
              }}
            >
              <ds-text as="span" variant="text-body-medium" color="inherit">
                {this.clearLabel}
              </ds-text>
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  private renderMatchModeFooter(filter: FilterMenuFilter, matchModes: FilterMenuMatchModes) {
    const mode: FilterMenuMatchMode = matchModes[filter.id] === 'all' ? 'all' : 'any';
    const nextMode: FilterMenuMatchMode = mode === 'any' ? 'all' : 'any';
    return (
      <div class="filter-menu__match-mode-footer ds-choice-footer">
        <div class="filter-menu__match-mode-content ds-choice-footer__content ds-control--md">
          <ds-text as="span" variant="text-body-medium" color="secondary">
            Limit results to
          </ds-text>
          <button
            class="filter-menu__match-mode-toggle ds-text-action ds-focus-ring"
            type="button"
            aria-label={`Limit ${filter.label} results to ${nextMode} selected`}
            onClick={() => this.dsMatchModeChange.emit({ filterId: filter.id, mode: nextMode })}
            onKeyDown={(event: KeyboardEvent) => this.handlePanelKeyDown(event, filter.id)}
          >
            <ds-text as="span" variant="text-body-medium" color="inherit">
              {mode}
            </ds-text>
          </button>
          <ds-text as="span" variant="text-body-medium" color="secondary">
            selected
          </ds-text>
        </div>
      </div>
    );
  }

  render() {
    const state =
      this.closing && this.closingSnapshot
        ? this.closingSnapshot
        : {
            filters: this.filters,
            values: this.values,
            matchModes: this.matchModes,
            activeFilterId: this.activeFilterId,
          };
    const activeFilter = this.selectedFilter(state.filters, state.activeFilterId);
    const totalSelected = this.totalSelected(state.filters, state.values);
    const activeFilterCount = this.activeFilterCount(state.filters, state.values);
    const hasActiveFilters = activeFilterCount > 0;
    const categoriesClearFooter = this.footerLayout === 'categories-clear';
    const label = `${this.triggerLabel}${
      this.showSelectedCount && hasActiveFilters ? ` · ${activeFilterCount}` : ''
    }`;
    const textVariant = CONTROL_TEXT_VARIANT[this.size];
    const iconSize = ICON_SIZE[this.size];
    const popupId = `${this.generatedId}-popup`;
    const popupStyle: Record<string, string> = {
      position: 'fixed',
      left: '0',
      top: '0',
      width: this.menuWidth,
      transform: `translate(${Math.round(this.pos.x)}px, ${Math.round(this.pos.y)}px)`,
      zIndex: '9998',
      visibility: this.positionReady ? 'visible' : 'hidden',
    };

    return (
      <Host
        class={{
          'filter-menu-host': true,
          'filter-menu-host--external-trigger': !this.usesInternalTrigger,
          'ds-select-trigger-host': this.usesInternalTrigger,
          [`ds-control--${this.size}`]: true,
          'ds-table-caption-control': this.collapseLabel,
          'ds-table-caption-control--compact': this.captionIconOnly,
          ...controlWidthClass(this.width),
        }}
      >
        {this.usesInternalTrigger
          ? this.renderCaptionTooltip(
              <button
                ref={element => {
                  this.triggerElement = (element as HTMLButtonElement) ?? null;
                }}
                id={this.inputId ?? `${this.generatedId}-trigger`}
                type="button"
                class={{
                  trigger: true,
                  'ds-control-frame': true,
                  'ds-focus-ring-inset': true,
                  'ds-interaction-fill': true,
                  'ds-interaction-fill--selected': this.activeFill && hasActiveFilters,
                  'trigger--expanded': this.open || this.closing,
                  'trigger--bordered': this.hasBorder,
                  'trigger--has-value': hasActiveFilters,
                  [`ds-control--${this.size}`]: true,
                }}
                role="combobox"
                aria-haspopup="dialog"
                aria-expanded={String(this.open)}
                aria-controls={this.open ? popupId : undefined}
                aria-label={this.ariaLabel ?? this.menuLabel}
                onClick={(event: MouseEvent) => this.toggleFromTrigger(event)}
                onKeyDown={(event: KeyboardEvent) => this.handleTriggerKeyDown(event)}
              >
                {this.icon ? (
                  <span
                    class="trigger__prefix ds-control-icon-box ds-interaction-fill__content"
                    aria-hidden="true"
                  >
                    <ds-icon name={this.icon} size={iconSize} color="inherit" />
                  </span>
                ) : null}
                {this.captionIconOnly ? null : (
                  <ds-text
                    class="trigger__label-box trigger__label trigger__label-content ds-control-label-box ds-interaction-fill__content"
                    as="span"
                    variant={textVariant}
                    color="inherit"
                    lineTruncation={1}
                  >
                    {label}
                  </ds-text>
                )}
                {this.captionIconOnly ? null : (
                  <span
                    class="trigger__chevron ds-control-icon-box ds-interaction-fill__content"
                    aria-hidden="true"
                  >
                    <ds-icon name="ChevronDown" size={iconSize} color="inherit" />
                  </span>
                )}
              </button>,
              this.captionIconOnly ? label : ''
            )
          : null}

        {this.shouldRender ? (
          <div
            id={popupId}
            popover="manual"
            class={{
              'filter-menu-popup': true,
              'ds-choice-popup': true,
              'ds-choice-popup--closing': this.closing,
            }}
            style={popupStyle}
            role="dialog"
            aria-label={this.menuLabel}
          >
            {activeFilter ? (
              <div class="filter-menu">
                <div class="filter-menu__body">
                  <div class="filter-menu__category-pane">
                    <div
                      class="filter-menu__categories ds-choice-list ds-chrome-column ds-chrome-space--sm"
                      role="tablist"
                      aria-label={this.categoriesLabel}
                      aria-orientation="vertical"
                    >
                      {state.filters.map(filter => {
                        const active = filter.id === activeFilter.id;
                        const count = this.selectedCount(filter, state.values);
                        return (
                          <div
                            key={filter.id}
                            class={{
                              'filter-menu__category-section': true,
                              'ds-choice-section--divided': Boolean(filter.divider),
                            }}
                          >
                            <button
                              id={`${this.generatedId}-${filter.id}-tab`}
                              type="button"
                              role="tab"
                              data-filter-category={filter.id}
                              class={{
                                'filter-menu__category': true,
                                'filter-menu__category--active': active,
                                'ds-choice-item': true,
                                'ds-control-frame': true,
                                'ds-control--md': true,
                                'ds-focus-ring-inset': true,
                                'ds-focus-ring--visible': active && this.focusRingVisible,
                                'ds-interaction-fill': true,
                                'ds-interaction-fill--selected': active,
                              }}
                              aria-selected={String(active)}
                              aria-controls={`${this.generatedId}-panel`}
                              tabIndex={active ? 0 : -1}
                              onMouseDown={() => {
                                this.focusRingVisible = false;
                              }}
                              onClick={() => this.selectCategory(filter.id)}
                              onKeyDown={(event: KeyboardEvent) =>
                                this.handleCategoryKeyDown(event, state.filters, filter.id)
                              }
                            >
                              <ds-text
                                class="ds-choice-item__content ds-choice-item__label ds-control-label-box ds-interaction-fill__content"
                                as="span"
                                variant="text-body-medium"
                                color={active ? 'primary' : 'secondary'}
                              >
                                {filter.label}
                              </ds-text>
                              {count > 0 && filter.kind === 'date' ? (
                                <span
                                  class="filter-menu__category-dot-box ds-interaction-fill__content"
                                  aria-hidden="true"
                                >
                                  <ds-badge variant="dot" hasRing={false} label="" />
                                </span>
                              ) : count > 0 ? (
                                <ds-tag
                                  class="ds-choice-item__tag ds-interaction-fill__content"
                                  label={String(count)}
                                  size="sm"
                                  intent="brand"
                                  contrast="bold"
                                  isInset
                                  rounded
                                />
                              ) : null}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {categoriesClearFooter ? this.renderFooter(totalSelected, true) : null}
                  </div>

                  <div
                    id={`${this.generatedId}-panel`}
                    class={{
                      'filter-menu__options': true,
                      'filter-menu__options--date': activeFilter.kind === 'date',
                    }}
                    role="tabpanel"
                    aria-labelledby={`${this.generatedId}-${activeFilter.id}-tab`}
                  >
                    {activeFilter.kind === 'date' ? null : this.renderOptionSearch(activeFilter)}
                    <div class="filter-menu__options-content">
                      {activeFilter.kind === 'date' ? (
                        <div key={activeFilter.id} class="filter-menu__option-list--date">
                          {this.renderOptions(activeFilter, state.values)}
                        </div>
                      ) : (
                        <div
                          id={`${this.generatedId}-${activeFilter.id}-options`}
                          key={activeFilter.id}
                          class="filter-menu__option-list ds-choice-list ds-chrome-column ds-chrome-space--sm"
                          role="listbox"
                          aria-label={activeFilter.label}
                          aria-multiselectable={
                            activeFilter.kind === 'multiple' ? 'true' : undefined
                          }
                        >
                          {this.renderOptions(activeFilter, state.values)}
                        </div>
                      )}
                    </div>
                    {activeFilter.kind === 'multiple'
                      ? this.renderMatchModeFooter(activeFilter, state.matchModes)
                      : null}
                  </div>
                </div>

                {!categoriesClearFooter && totalSelected > 0
                  ? this.renderFooter(totalSelected, false)
                  : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </Host>
    );
  }
}
