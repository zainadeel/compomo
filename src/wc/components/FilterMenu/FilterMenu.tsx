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
  controlWidthClass,
  resolveChoicePopupAlignOffset,
  resolveCssLengthPx,
  resolveMotionTimeMs,
  TOKEN_CSS_LENGTHS,
  TOKEN_DEFAULTS,
  type ControlWidth,
} from '../../utils';
import { observeTableCaptionCompact } from '../../utils/table-caption-compact';
import type { AnchoredAlign, AnchoredSide } from '../../utils/anchored-position';
import { AnchoredPositionController } from '../../utils/anchored-position-controller';
import { AnchoredOverlayInteractionController } from '../../utils/anchored-overlay-interaction-controller';
import { resolveAnchoredOverlayBoundaryRect } from '../../utils/anchored-overlay-boundary';
import { ChoiceOptionRow } from '../../utils/choice-list-parts';
import { choiceListUsesSubtext } from '../../utils/choice-list';

export type FilterMenuFilterKind = 'single' | 'multiple' | 'boolean' | 'date';
export type FilterMenuSize = 'lg' | 'md' | 'sm' | 'xs';
export type FilterMenuWidth = ControlWidth;

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

export interface FilterMenuChangeDetail {
  filterId: string;
  value: FilterMenuValue;
}

let filterMenuId = 0;

const ICON_SIZE: Record<FilterMenuSize, 'lg' | 'md' | 'sm' | 'xs'> = {
  lg: 'lg',
  md: 'md',
  sm: 'sm',
  xs: 'xs',
};

@Component({
  tag: 'ds-filter-menu',
  styleUrl: 'FilterMenu.css',
  scoped: true,
})
export class FilterMenu {
  @Element() el!: HTMLElement;

  /** Controlled popup visibility. */
  @Prop({ mutable: true }) open: boolean = false;
  /** Select trigger text. The selected count is appended automatically. */
  @Prop() triggerLabel: string = 'Filters';
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
  /** Show a visible focus ring on initial entry after keyboard activation. */
  @Prop() initialFocusVisible: boolean = false;

  @State() private shouldRender = false;
  @State() private closing = false;
  @State() private positionReady = false;
  @State() private pos: { x: number; y: number } = { x: 0, y: 0 };
  @State() private focusRingVisible = false;
  @State() private activeOptionIndex = 0;
  @State() private captionCompact = false;

  /** Requests a controlled value replacement without closing the popup. */
  @Event() dsChange!: EventEmitter<FilterMenuChangeDetail>;
  /** Requests that the consumer clear every filter value. */
  @Event() dsClear!: EventEmitter<void>;
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
            '.filter-menu__options [role="option"], .filter-menu__options input'
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
    values: FilterMenuValues
  ) {
    const options = filter.options ?? [];
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
    const enabled = options
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

  private renderOptions(filter: FilterMenuFilter, values: FilterMenuValues) {
    const value = values[filter.id];
    if (filter.kind === 'multiple' || filter.kind === 'single') {
      const selected = Array.isArray(value) ? value : [];
      const options = filter.options ?? [];
      const usesSubtext = choiceListUsesSubtext(
        options.map(option => ({
          label: option.label,
          value: option.value,
          subtext: option.description,
        }))
      );
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
              this.handleOptionKeyDown(event, filter, option, index, values)
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
      const option: FilterMenuOption = {
        label: filter.fieldLabel ?? filter.label,
        value: 'true',
        description: filter.description,
      };
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

    const dateValue = typeof value === 'string' ? value : '';
    const inputId = `${this.generatedId}-${filter.id}-input`;
    return (
      <div class="filter-menu__date-field">
        <label htmlFor={inputId}>
          <ds-text as="span" variant="text-body-small" emphasis color="primary">
            {filter.fieldLabel ?? 'Event date'}
          </ds-text>
        </label>
        <div class="filter-menu__date-control ds-control-frame ds-control--md">
          <input
            id={inputId}
            class="filter-menu__date-input"
            type="date"
            value={dateValue}
            onInput={(event: Event) =>
              this.dsChange.emit({
                filterId: filter.id,
                value: (event.target as HTMLInputElement).value,
              })
            }
          />
          {dateValue ? (
            <ds-button-unfilled
              variant="icon"
              icon="CrossCircle"
              size="sm"
              isInset
              hasBorder={false}
              rounded
              ariaLabel={`${this.clearLabel} ${filter.fieldLabel ?? filter.label}`}
              onDsClick={(event: CustomEvent<MouseEvent>) => {
                event.stopPropagation();
                this.dsChange.emit({ filterId: filter.id, value: '' });
              }}
            />
          ) : null}
        </div>
      </div>
    );
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

  render() {
    const state =
      this.closing && this.closingSnapshot
        ? this.closingSnapshot
        : {
            filters: this.filters,
            values: this.values,
            activeFilterId: this.activeFilterId,
          };
    const activeFilter = this.selectedFilter(state.filters, state.activeFilterId);
    const totalSelected = this.totalSelected(state.filters, state.values);
    const activeFilterCount = this.activeFilterCount(state.filters, state.values);
    const hasActiveFilters = activeFilterCount > 0;
    const label = `${this.triggerLabel}${hasActiveFilters ? ` · ${activeFilterCount}` : ''}`;
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
                            {count > 0 ? (
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

                  <div
                    id={`${this.generatedId}-panel`}
                    class="filter-menu__options"
                    role="tabpanel"
                    aria-labelledby={`${this.generatedId}-${activeFilter.id}-tab`}
                  >
                    <div
                      key={activeFilter.id}
                      class="filter-menu__option-list ds-choice-list ds-chrome-column ds-chrome-space--sm"
                      role="listbox"
                      aria-label={activeFilter.label}
                      aria-multiselectable={activeFilter.kind === 'multiple' ? 'true' : undefined}
                    >
                      {this.renderOptions(activeFilter, state.values)}
                    </div>
                  </div>
                </div>

                {totalSelected > 0 ? (
                  <div class="filter-menu__footer ds-choice-footer">
                    <div class="ds-choice-footer__content ds-control--md">
                      <ds-text
                        class="ds-choice-footer__summary"
                        as="span"
                        variant="text-body-medium"
                        color="secondary"
                        aria-live="polite"
                      >
                        {totalSelected} selected
                      </ds-text>
                      <button
                        class="filter-menu__clear ds-choice-footer__clear ds-text-action"
                        type="button"
                        onClick={() => this.dsClear.emit()}
                      >
                        <ds-text as="span" variant="text-body-medium" color="inherit">
                          {this.clearLabel}
                        </ds-text>
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </Host>
    );
  }
}
