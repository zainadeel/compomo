import {
  AttachInternals,
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Method,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import {
  controlWidthClass,
  CONTROL_TEXT_VARIANT,
  resolveCssLengthPx,
  resolveCssTimeMs,
  TOKEN_DEFAULTS,
  type ControlWidth,
} from '../../utils';
import { computeAnchoredPopupPosition } from '../../utils/anchored-popup';
import { ChoiceFooter, ChoiceOptionRow, ChoiceSearch } from '../../utils/choice-list-parts';
import {
  choiceBackgroundClassMap,
  choiceListUsesIcons,
  choiceListUsesSubtext,
  enabledChoiceIndexes,
  filterChoiceSections,
  findChoiceTypeaheadMatch,
  flattenChoiceSections,
  moveChoiceIndex,
  resolveChoiceSections,
  type ChoiceBackground,
  type ChoiceOption,
  type ChoiceSection,
} from '../../utils/choice-list';

export type SelectOption = ChoiceOption;
export type SelectSection = ChoiceSection;
export type SelectBackground = ChoiceBackground;
export type SelectSize = 'md' | 'sm' | 'xs';
export type SelectWidth = ControlWidth;

const ICON_SIZE: Record<SelectSize, 'md' | 'sm' | 'xs'> = {
  md: 'md',
  sm: 'sm',
  xs: 'xs',
};

let selectId = 0;
/** rAF retries while the conditionally rendered popup mounts. */
const POSITION_RETRY_BUDGET = 8;

@Component({
  tag: 'ds-select',
  styleUrl: 'Select.css',
  scoped: true,
  formAssociated: true,
})
export class Select {
  @Element() el!: HTMLElement;
  @AttachInternals() internals!: ElementInternals;

  /** Flat choices. Assign arrays through the JavaScript property. */
  @Prop() options: SelectOption[] = [];
  /** Grouped choices; takes precedence over options. Assign through JavaScript. */
  @Prop() sections: SelectSection[] = [];
  /** Selected string value. Unknown values render the placeholder and are not submitted. */
  @Prop({ mutable: true }) value: string = '';
  /** Controlled popup visibility. */
  @Prop({ mutable: true, reflect: true }) open: boolean = false;
  /** Native form field name. */
  @Prop({ reflect: true }) name: string | undefined;
  /** Native disabled state. */
  @Prop({ reflect: true }) disabled: boolean = false;
  /** Require one valid selected value. */
  @Prop({ reflect: true }) required: boolean = false;
  /** Validation message used when required is missing. */
  @Prop() requiredMessage: string = 'This field is required.';
  /** Trigger text shown when no valid value is selected. */
  @Prop() placeholder: string = 'Select';
  /** Control density. */
  @Prop() size: SelectSize = 'md';
  /** Width fit — hug content (default) or fill the parent. */
  @Prop() width: SelectWidth = 'hug';
  /** Shared inactive treatment; removes interaction and form submission. */
  @Prop() isInactive: boolean = false;
  /** Replace the prefix with a loader and disable option interaction. */
  @Prop() isLoading: boolean = false;
  /** Show the selected interaction fill when a valid value exists. */
  @Prop() activeFill: boolean = true;
  /** Show the surface-aware inset border. */
  @Prop() hasBorder: boolean = true;
  /** Optional trigger prefix icon name. */
  @Prop() icon: string | undefined;
  /** Show the clear footer action when a value exists. */
  @Prop() allowClear: boolean = true;
  /** Localized clear action label. */
  @Prop() clearLabel: string = 'Clear';
  /** Show immediate local filtering over option labels, subtext, and section headings. */
  @Prop() searchable: boolean = false;
  /** Localized search-field placeholder and accessible name. */
  @Prop() searchPlaceholder: string = 'Search';
  /** Localized empty-filter result text. */
  @Prop() noResultsText: string = 'No results found';
  /** Accessible loading status label. */
  @Prop() loadingLabel: string = 'Loading';
  /** Actual parent surface context; omit on primary and secondary surfaces. */
  @Prop() background: SelectBackground | undefined;
  /** Show invalid visual state. */
  @Prop() error: boolean = false;
  /** Error text rendered below the trigger when error is true. */
  @Prop() errorMessage: string | undefined;
  /** ID applied to the internal combobox trigger for external labels. */
  @Prop() inputId: string | undefined;
  /** Direct accessible name when no external label is available. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;
  /** IDs of elements that label the combobox. */
  @Prop({ attribute: 'aria-labelledby' }) ariaLabelledby: string | undefined;
  /** Additional IDs that describe the combobox. */
  @Prop({ attribute: 'aria-describedby' }) ariaDescribedby: string | undefined;

  /** Emitted after user selection or clearing with the next scalar value. */
  @Event() dsChange!: EventEmitter<string>;
  /** Emitted after the footer clear action. */
  @Event() dsClear!: EventEmitter<void>;
  /** Emitted whenever popup visibility changes. */
  @Event() dsOpenChange!: EventEmitter<boolean>;

  @State() private activeIndex = -1;
  @State() private searchTerm = '';
  @State() private formDisabled = false;
  @State() private position = { x: 0, y: 0 };
  @State() private positionReady = false;
  @State() private focusRingVisible = false;

  private readonly generatedId = `ds-select-${++selectId}`;
  private readonly listboxId = `${this.generatedId}-listbox`;
  private readonly errorId = `${this.generatedId}-error`;
  private triggerEl: HTMLButtonElement | null = null;
  private popupEl: HTMLDivElement | null = null;
  private searchEl: HTMLInputElement | null = null;
  private initialValue = '';
  private typeahead = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;
  private outsideHandler: ((event: MouseEvent) => void) | null = null;
  private repositionHandler: (() => void) | null = null;
  private positionRetryRaf: number | null = null;

  componentWillLoad() {
    this.initialValue = this.value;
    this.syncFormValue();
  }

  componentDidLoad() {
    if (this.open) this.onOpenChange(true);
  }

  disconnectedCallback() {
    this.cancelPositionRetry();
    this.unbindPopupListeners();
    if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
  }

  @Watch('value')
  @Watch('disabled')
  @Watch('isInactive')
  @Watch('required')
  @Watch('options')
  @Watch('sections')
  syncFormValue() {
    const inactive = this.isDisabled;
    const resolvedValue = this.hasSelection ? this.value : '';
    this.internals.setFormValue(inactive ? null : resolvedValue);
    const missing = this.required && !inactive && !resolvedValue;
    this.internals.setValidity(missing ? { valueMissing: true } : {}, missing ? this.requiredMessage : '');
    if (this.open) {
      const enabled = enabledChoiceIndexes(this.visibleOptions);
      if (!enabled.includes(this.activeIndex)) this.activeIndex = enabled[0] ?? -1;
      requestAnimationFrame(() => this.updatePosition());
    }
  }

  @Watch('isLoading')
  onLoadingChange() {
    if (this.open) requestAnimationFrame(() => this.updatePosition());
  }

  @Watch('open')
  onOpenChange(open: boolean) {
    this.dsOpenChange.emit(open);
    if (open) {
      this.bindPopupListeners();
      this.schedulePositionUpdate(() => {
        this.scrollActiveOptionIntoView();
        if (this.searchable) this.searchEl?.focus();
      });
    } else {
      this.cancelPositionRetry();
      this.unbindPopupListeners();
      this.searchTerm = '';
      this.positionReady = false;
    }
  }

  @Watch('searchTerm')
  onSearchTermChange() {
    const enabled = enabledChoiceIndexes(this.visibleOptions);
    this.activeIndex = enabled[0] ?? -1;
    requestAnimationFrame(() => {
      this.updatePosition();
      this.scrollActiveOptionIntoView();
    });
  }

  @Watch('activeIndex')
  onActiveIndexChange() {
    requestAnimationFrame(() => this.scrollActiveOptionIntoView());
  }

  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
    this.syncFormValue();
  }

  formResetCallback() {
    this.value = this.initialValue;
    this.closePopup();
  }

  formStateRestoreCallback(state: string | File | FormData | null) {
    this.value = typeof state === 'string' ? state : '';
  }

  @Method()
  async setFocus() {
    this.triggerEl?.focus();
  }

  private get isDisabled(): boolean {
    return this.disabled || this.isInactive || this.formDisabled;
  }

  private get allSections(): SelectSection[] {
    return resolveChoiceSections(this.options, this.sections);
  }

  private get allOptions(): SelectOption[] {
    return flattenChoiceSections(this.allSections);
  }

  private get visibleSections(): SelectSection[] {
    return this.searchable
      ? filterChoiceSections(this.allSections, this.searchTerm)
      : this.allSections;
  }

  private get visibleOptions(): SelectOption[] {
    return flattenChoiceSections(this.visibleSections);
  }

  private get selectedOption(): SelectOption | undefined {
    return this.allOptions.find(option => option.value === this.value);
  }

  private get hasSelection(): boolean {
    return Boolean(this.selectedOption);
  }

  private get activeOptionId(): string | undefined {
    return !this.isLoading && this.activeIndex >= 0
      ? `${this.generatedId}-option-${this.activeIndex}`
      : undefined;
  }

  private scrollActiveOptionIntoView() {
    if (!this.open || !this.activeOptionId) return;
    this.el
      .querySelector<HTMLElement>(`#${this.activeOptionId}`)
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  private bindPopupListeners() {
    this.unbindPopupListeners();
    this.outsideHandler = event => {
      const target = event.target as Node;
      if (this.el.contains(target)) return;
      this.closePopup();
    };
    this.repositionHandler = () => this.updatePosition();
    document.addEventListener('mousedown', this.outsideHandler, true);
    window.addEventListener('scroll', this.repositionHandler, true);
    window.addEventListener('resize', this.repositionHandler);
  }

  private unbindPopupListeners() {
    if (this.outsideHandler) {
      document.removeEventListener('mousedown', this.outsideHandler, true);
      this.outsideHandler = null;
    }
    if (this.repositionHandler) {
      window.removeEventListener('scroll', this.repositionHandler, true);
      window.removeEventListener('resize', this.repositionHandler);
      this.repositionHandler = null;
    }
  }

  private cancelPositionRetry() {
    if (this.positionRetryRaf !== null) {
      cancelAnimationFrame(this.positionRetryRaf);
      this.positionRetryRaf = null;
    }
  }

  /** Retry until the conditionally rendered popup is mounted and measurable. */
  private schedulePositionUpdate(onReady?: () => void) {
    if (!this.open) return;

    this.cancelPositionRetry();
    this.positionReady = false;
    let remaining = POSITION_RETRY_BUDGET;

    const attempt = () => {
      this.positionRetryRaf = null;
      if (!this.open) return;

      if (this.updatePosition()) {
        onReady?.();
        return;
      }

      if (remaining > 0) {
        remaining -= 1;
        this.positionRetryRaf = requestAnimationFrame(attempt);
      }
    };

    this.positionRetryRaf = requestAnimationFrame(attempt);
  }

  /** @returns `true` when the current popup was found and positioned. */
  private updatePosition(): boolean {
    if (
      !this.open ||
      !this.triggerEl ||
      !this.popupEl ||
      !this.popupEl.isConnected ||
      !this.el.contains(this.popupEl)
    ) return false;
    const sectionPadding = resolveCssLengthPx(TOKEN_DEFAULTS.space050, TOKEN_DEFAULTS.space050);
    this.popupEl.style.minWidth = `${this.triggerEl.offsetWidth + sectionPadding * 2}px`;
    this.position = computeAnchoredPopupPosition({
      anchorRect: this.triggerEl.getBoundingClientRect(),
      popupWidth: this.popupEl.offsetWidth,
      popupHeight: this.popupEl.offsetHeight,
      side: 'bottom',
      align: 'start',
      sideOffsetPx: sectionPadding,
      alignOffsetPx: -sectionPadding,
      viewportPadPx: sectionPadding,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    });
    this.positionReady = true;
    return true;
  }

  private openPopup(focusVisible: boolean, edge?: 'first' | 'last') {
    if (this.isDisabled || (!this.allOptions.length && !this.isLoading)) return;
    const enabled = enabledChoiceIndexes(this.visibleOptions);
    const selectedIndex = this.visibleOptions.findIndex(
      option => option.value === this.value && !option.isInactive,
    );
    this.activeIndex =
      edge === 'last'
        ? (enabled[enabled.length - 1] ?? -1)
        : selectedIndex >= 0
          ? selectedIndex
          : (enabled[0] ?? -1);
    this.focusRingVisible = focusVisible;
    this.open = true;
  }

  private closePopup(restoreFocus = false) {
    if (!this.open) return;
    this.open = false;
    if (restoreFocus) requestAnimationFrame(() => this.triggerEl?.focus());
  }

  private selectOption(option: SelectOption) {
    if (option.isInactive || this.isLoading) return;
    this.value = option.value;
    this.dsChange.emit(this.value);
    this.closePopup(true);
  }

  private clearSelection = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    this.value = '';
    this.dsChange.emit('');
    this.dsClear.emit();
    const enabled = enabledChoiceIndexes(this.visibleOptions);
    this.activeIndex = enabled[0] ?? -1;
    requestAnimationFrame(() => (this.searchable ? this.searchEl?.focus() : this.triggerEl?.focus()));
  };

  private moveActive(direction: 1 | -1) {
    this.activeIndex = moveChoiceIndex(this.visibleOptions, this.activeIndex, direction);
  }

  private setActiveEdge(edge: 'first' | 'last') {
    const enabled = enabledChoiceIndexes(this.visibleOptions);
    this.activeIndex =
      edge === 'first' ? (enabled[0] ?? -1) : (enabled[enabled.length - 1] ?? -1);
  }

  private handleTypeahead(key: string) {
    if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
    this.focusRingVisible = true;
    const normalized = key.toLocaleLowerCase();
    const repeatedCharacter =
      this.typeahead.length > 0 &&
      [...this.typeahead].every(character => character === normalized);
    this.typeahead = repeatedCharacter ? normalized : `${this.typeahead}${normalized}`;
    const match = findChoiceTypeaheadMatch(this.visibleOptions, this.typeahead, this.activeIndex);
    if (match >= 0) this.activeIndex = match;
    const resetMs = resolveCssTimeMs(
      TOKEN_DEFAULTS.animationDurationMedium1,
      TOKEN_DEFAULTS.animationDurationMedium1,
    );
    this.typeaheadTimer = setTimeout(() => {
      this.typeahead = '';
      this.typeaheadTimer = null;
    }, resetMs);
  }

  private handleListKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusRingVisible = true;
        this.moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusRingVisible = true;
        this.moveActive(-1);
        break;
      case 'Home':
        event.preventDefault();
        this.focusRingVisible = true;
        this.setActiveEdge('first');
        break;
      case 'End':
        event.preventDefault();
        this.focusRingVisible = true;
        this.setActiveEdge('last');
        break;
      case 'Enter':
      case ' ': {
        if (event.key === ' ' && this.searchable && event.target === this.searchEl) break;
        event.preventDefault();
        const option = this.visibleOptions[this.activeIndex];
        if (option) this.selectOption(option);
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.closePopup(true);
        break;
      case 'Tab':
        this.closePopup();
        break;
      default:
        if (!this.searchable && event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
          this.handleTypeahead(event.key);
        }
    }
  }

  private handleTriggerKeyDown = (event: KeyboardEvent) => {
    if (!this.open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        this.openPopup(true, event.key === 'ArrowUp' ? 'last' : 'first');
      } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        this.openPopup(true);
        if (this.searchable) {
          this.searchTerm = event.key;
        } else {
          this.handleTypeahead(event.key);
        }
      }
      return;
    }
    this.handleListKeyDown(event);
  };

  private renderOption(
    option: SelectOption,
    index: number,
    usesIcons: boolean,
    usesSubtext: boolean,
  ) {
    const selected = option.value === this.value;
    const active = index === this.activeIndex;
    return (
      <ChoiceOptionRow
        id={`${this.generatedId}-option-${index}`}
        option={option}
        selected={selected}
        active={active}
        focusRingVisible={this.focusRingVisible}
        usesSubtext={usesSubtext}
        leading={usesIcons && option.icon ? (
          <span class="ds-choice-item__icon ds-interaction-fill__content" aria-hidden="true">
            <ds-icon name={option.icon} size="md" color="inherit" />
          </span>
        ) : undefined}
        onHover={() => {
            this.focusRingVisible = false;
            this.activeIndex = index;
        }}
        onSelect={() => this.selectOption(option)}
      />
    );
  }

  render() {
    const inactive = this.isDisabled;
    const showPlaceholder = !this.hasSelection;
    const label = showPlaceholder ? this.placeholder : this.selectedOption?.label;
    const textVariant = CONTROL_TEXT_VARIANT[this.size];
    const iconSize = ICON_SIZE[this.size];
    const usesOptionIcons = choiceListUsesIcons(this.allOptions);
    const usesOptionSubtext = choiceListUsesSubtext(this.allOptions);
    const showError = this.error && Boolean(this.errorMessage);
    const describedBy = [this.ariaDescribedby, showError ? this.errorId : undefined]
      .filter(Boolean)
      .join(' ') || undefined;
    const popupStyle = {
      position: 'fixed',
      left: '0',
      top: '0',
      transform: `translate(${Math.round(this.position.x)}px, ${Math.round(this.position.y)}px)`,
      zIndex: 'var(--dimension-z-index-floating)',
      visibility: this.positionReady ? 'visible' : 'hidden',
    };
    let flatIndex = 0;

    return (
      <Host
        class={{
          'select-host': true,
          'ds-control-inactive': inactive,
          'ds-control--md': this.size === 'md',
          'ds-control--sm': this.size === 'sm',
          'ds-control--xs': this.size === 'xs',
          ...controlWidthClass(this.width),
          [`select-host--background-${this.background}`]: !!this.background,
        }}
      >
        <button
          ref={element => {
            this.triggerEl = (element as HTMLButtonElement) ?? null;
          }}
          id={this.inputId ?? this.generatedId}
          type="button"
          class={{
            trigger: true,
            'ds-focus-ring-inset': true,
            'ds-interaction-fill': true,
            'ds-interaction-fill--selected':
              !inactive && this.activeFill && this.hasSelection,
            'trigger--bordered': this.hasBorder || this.error,
            'trigger--placeholder': showPlaceholder,
            'trigger--has-value': this.hasSelection,
            'wrapper--error': this.error,
            [`ds-control--${this.size}`]: true,
            ...choiceBackgroundClassMap(this.background),
          }}
          disabled={inactive}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={String(this.open)}
          aria-controls={this.open ? this.listboxId : undefined}
          aria-activedescendant={this.open && !this.searchable ? this.activeOptionId : undefined}
          aria-label={this.ariaLabel}
          aria-labelledby={this.ariaLabelledby}
          aria-describedby={describedBy}
          aria-invalid={this.error ? 'true' : undefined}
          aria-required={this.required || undefined}
          aria-busy={this.isLoading ? 'true' : undefined}
          onClick={() => (this.open ? this.closePopup() : this.openPopup(false))}
          onKeyDown={this.handleTriggerKeyDown}
        >
          {(this.icon || this.isLoading) && (
            <span class="trigger__prefix ds-interaction-fill__content" aria-hidden="true">
              {this.isLoading ? (
                <ds-loader size={iconSize} color="inherit" />
              ) : (
                <ds-icon name={this.icon} size={iconSize} color="inherit" />
              )}
            </span>
          )}
          <ds-text
            class="trigger__label ds-interaction-fill__content"
            as="span"
            variant={textVariant}
            color="inherit"
            lineTruncation={1}
          >
            {label}
          </ds-text>
          <span class="trigger__chevron ds-interaction-fill__content" aria-hidden="true">
            <ds-icon name="ChevronDown" size={iconSize} color="inherit" />
          </span>
        </button>

        {this.open && (
          <div
            ref={element => {
              this.popupEl = (element as HTMLDivElement) ?? null;
            }}
            class="select-popup ds-choice-popup"
            style={popupStyle}
          >
            {this.searchable && (
              <ChoiceSearch
                value={this.searchTerm}
                placeholder={this.searchPlaceholder}
                controls={this.listboxId}
                activeDescendant={this.activeOptionId}
                inputRef={element => {
                  this.searchEl = element;
                }}
                clearLabel={this.clearLabel}
                onValueChange={value => {
                  this.searchTerm = value;
                }}
                onKeyDown={event => this.handleListKeyDown(event)}
              />
            )}
            <div
              id={this.listboxId}
              class="ds-choice-list"
              role="listbox"
              aria-label={this.ariaLabel ?? this.placeholder}
              aria-busy={this.isLoading ? 'true' : undefined}
            >
              {this.isLoading ? (
                <div
                  class="ds-choice-loading"
                  role="option"
                  aria-selected="false"
                  aria-disabled="true"
                  aria-label={this.loadingLabel}
                  aria-live="polite"
                >
                  <ds-loader size="md" color="inherit" />
                </div>
              ) : this.visibleOptions.length === 0 ? (
                <div
                  class="ds-choice-empty"
                  role="option"
                  aria-selected="false"
                  aria-disabled="true"
                  aria-label={this.noResultsText}
                  aria-live="polite"
                >
                  <ds-empty-state body={this.noResultsText} />
                </div>
              ) : (
                this.visibleSections.map(section => (
                  <div
                    class={{
                      'ds-choice-section': true,
                      'ds-choice-section--divided': !!section.divider,
                    }}
                    role={section.header ? 'group' : undefined}
                    aria-label={section.header}
                  >
                    {section.header && (
                      <ds-text
                        class="ds-choice-section__header ds-control--md"
                        as="span"
                        variant="text-body-small"
                        emphasis
                        color="primary"
                        aria-hidden="true"
                      >
                        {section.header}
                      </ds-text>
                    )}
                    {section.options.map(option => this.renderOption(
                      option,
                      flatIndex++,
                      usesOptionIcons,
                      usesOptionSubtext,
                    ))}
                  </div>
                ))
              )}
            </div>
            {this.allowClear && this.hasSelection && !this.isLoading && (
              <ChoiceFooter clearLabel={this.clearLabel} onClear={this.clearSelection} />
            )}
          </div>
        )}

        {showError && (
          <ds-text
            class="error-text"
            as="div"
            variant="text-body-small"
            color="negative"
            textId={this.errorId}
            role="alert"
          >
            {this.errorMessage}
          </ds-text>
        )}
      </Host>
    );
  }
}
