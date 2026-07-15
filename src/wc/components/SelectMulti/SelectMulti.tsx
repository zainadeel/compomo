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
import {
  choiceBackgroundClassMap,
  enabledChoiceIndexes,
  filterChoiceSections,
  findChoiceTypeaheadMatch,
  flattenChoiceSections,
  moveChoiceIndex,
  resolveChoiceSections,
} from '../../utils/choice-list';
import type {
  SelectBackground,
  SelectOption,
  SelectSection,
  SelectSize,
} from '../Select/Select';

export type SelectMultiOption = Omit<SelectOption, 'icon'>;
export type SelectMultiSection = Omit<SelectSection, 'options'> & {
  options: SelectMultiOption[];
};
export type SelectMultiBackground = SelectBackground;
export type SelectMultiSize = SelectSize;
export type SelectMultiWidth = ControlWidth;

const ICON_SIZE: Record<SelectMultiSize, 'md' | 'sm' | 'xs'> = {
  md: 'md',
  sm: 'sm',
  xs: 'xs',
};

let selectMultiId = 0;

@Component({
  tag: 'ds-select-multi',
  styleUrl: 'SelectMulti.css',
  scoped: true,
  formAssociated: true,
})
export class SelectMulti {
  @Element() el!: HTMLElement;
  @AttachInternals() internals!: ElementInternals;

  /** Flat choices. Assign arrays through the JavaScript property. */
  @Prop() options: SelectMultiOption[] = [];
  /** Grouped choices; takes precedence over options. Assign through JavaScript. */
  @Prop() sections: SelectMultiSection[] = [];
  /** Selected values. Assign arrays through the JavaScript property. */
  @Prop({ mutable: true }) values: string[] = [];
  /** Controlled popup visibility. */
  @Prop({ mutable: true, reflect: true }) open: boolean = false;
  /** Native form field name used for each repeated selected-value entry. */
  @Prop({ reflect: true }) name: string | undefined;
  /** Native disabled state. */
  @Prop({ reflect: true }) disabled: boolean = false;
  /** Require at least one valid selected value. */
  @Prop({ reflect: true }) required: boolean = false;
  /** Validation message used when required is missing. */
  @Prop() requiredMessage: string = 'This field is required.';
  /** Persistent trigger label; selected option labels never replace it. */
  @Prop() placeholder: string = 'Select';
  /** Control density. */
  @Prop() size: SelectMultiSize = 'md';
  /** Width behavior: fill the parent or hug content. */
  @Prop() width: SelectMultiWidth = 'fill';
  /** Shared inactive treatment; removes interaction and form submission. */
  @Prop() isInactive: boolean = false;
  /** Replace the prefix with a loader and disable option interaction. */
  @Prop() isLoading: boolean = false;
  /** Show the selected interaction fill when at least one value exists. */
  @Prop() activeFill: boolean = true;
  /** Show the surface-aware inset border. */
  @Prop() hasBorder: boolean = true;
  /** Optional trigger prefix icon name. */
  @Prop() icon: string | undefined;
  /** Show the clear-all footer action when values exist. */
  @Prop() allowClear: boolean = true;
  /** Localized clear-all action label. */
  @Prop() clearLabel: string = 'Clear';
  /** Localized noun displayed after the selected count. */
  @Prop() selectedLabel: string = 'selected';
  /** Show immediate local filtering over option labels and subtext. */
  @Prop() searchable: boolean = false;
  /** Localized search-field placeholder and accessible name. */
  @Prop() searchPlaceholder: string = 'Search';
  /** Localized empty-filter result text. */
  @Prop() noResultsText: string = 'No results found';
  /** Accessible loading status label. */
  @Prop() loadingLabel: string = 'Loading';
  /** Actual parent surface context; omit on primary and secondary surfaces. */
  @Prop() background: SelectMultiBackground | undefined;
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

  /** Emitted after user toggles or clearing with a new values array. */
  @Event() dsChange!: EventEmitter<string[]>;
  /** Emitted after the footer clear-all action. */
  @Event() dsClear!: EventEmitter<void>;
  /** Emitted whenever popup visibility changes. */
  @Event() dsOpenChange!: EventEmitter<boolean>;

  @State() private activeIndex = -1;
  @State() private searchTerm = '';
  @State() private formDisabled = false;
  @State() private position = { x: 0, y: 0 };
  @State() private positionReady = false;
  @State() private focusRingVisible = false;

  private readonly generatedId = `ds-select-multi-${++selectMultiId}`;
  private readonly listboxId = `${this.generatedId}-listbox`;
  private readonly errorId = `${this.generatedId}-error`;
  private triggerEl: HTMLButtonElement | null = null;
  private popupEl: HTMLDivElement | null = null;
  private searchEl: HTMLInputElement | null = null;
  private initialValues: string[] = [];
  private typeahead = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;
  private outsideHandler: ((event: MouseEvent) => void) | null = null;
  private repositionHandler: (() => void) | null = null;

  componentWillLoad() {
    this.initialValues = [...this.values];
    this.syncFormValue();
  }

  componentDidLoad() {
    if (this.open) this.onOpenChange(true);
  }

  disconnectedCallback() {
    this.unbindPopupListeners();
    if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
  }

  @Watch('values')
  @Watch('disabled')
  @Watch('isInactive')
  @Watch('required')
  @Watch('name')
  @Watch('options')
  @Watch('sections')
  syncFormValue() {
    const resolvedValues = this.resolvedValues;
    if (this.isDisabled || !this.name || resolvedValues.length === 0) {
      this.internals.setFormValue(null);
    } else {
      const data = new FormData();
      resolvedValues.forEach(value => data.append(this.name as string, value));
      this.internals.setFormValue(data, JSON.stringify(resolvedValues));
    }
    const missing = this.required && !this.isDisabled && resolvedValues.length === 0;
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
      this.positionReady = false;
      requestAnimationFrame(() => {
        this.updatePosition();
        if (this.searchable) this.searchEl?.focus();
      });
    } else {
      this.unbindPopupListeners();
      this.searchTerm = '';
      this.positionReady = false;
    }
  }

  @Watch('searchTerm')
  onSearchTermChange() {
    this.activeIndex = enabledChoiceIndexes(this.visibleOptions)[0] ?? -1;
    requestAnimationFrame(() => this.updatePosition());
  }

  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
    this.syncFormValue();
  }

  formResetCallback() {
    this.values = [...this.initialValues];
    this.closePopup();
  }

  formStateRestoreCallback(state: string | File | FormData | null) {
    if (typeof state !== 'string') {
      this.values = [];
      return;
    }
    try {
      const restored = JSON.parse(state);
      this.values = Array.isArray(restored)
        ? restored.filter((value): value is string => typeof value === 'string')
        : [];
    } catch {
      this.values = [];
    }
  }

  @Method()
  async setFocus() {
    this.triggerEl?.focus();
  }

  private get isDisabled(): boolean {
    return this.disabled || this.isInactive || this.formDisabled;
  }

  private get allSections(): SelectMultiSection[] {
    return resolveChoiceSections(this.options, this.sections);
  }

  private get allOptions(): SelectMultiOption[] {
    return flattenChoiceSections(this.allSections);
  }

  private get visibleSections(): SelectMultiSection[] {
    return this.searchable
      ? filterChoiceSections(this.allSections, this.searchTerm)
      : this.allSections;
  }

  private get visibleOptions(): SelectMultiOption[] {
    return flattenChoiceSections(this.visibleSections);
  }

  private get resolvedValues(): string[] {
    const valid = new Set(this.allOptions.map(option => option.value));
    return [...new Set(this.values.filter(value => valid.has(value)))];
  }

  private get hasSelection(): boolean {
    return this.resolvedValues.length > 0;
  }

  private get activeOptionId(): string | undefined {
    return !this.isLoading && this.activeIndex >= 0
      ? `${this.generatedId}-option-${this.activeIndex}`
      : undefined;
  }

  private bindPopupListeners() {
    this.unbindPopupListeners();
    this.outsideHandler = event => {
      if (this.el.contains(event.target as Node)) return;
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

  private updatePosition() {
    if (!this.open || !this.triggerEl || !this.popupEl) return;
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
  }

  private openPopup(focusVisible: boolean, edge?: 'first' | 'last') {
    if (this.isDisabled || (!this.allOptions.length && !this.isLoading)) return;
    const enabled = enabledChoiceIndexes(this.visibleOptions);
    this.activeIndex =
      edge === 'last'
        ? (enabled[enabled.length - 1] ?? -1)
        : (enabled[0] ?? -1);
    this.focusRingVisible = focusVisible;
    this.open = true;
  }

  private closePopup(restoreFocus = false) {
    if (!this.open) return;
    this.open = false;
    if (restoreFocus) requestAnimationFrame(() => this.triggerEl?.focus());
  }

  private toggleOption(option: SelectMultiOption) {
    if (option.isInactive || this.isLoading) return;
    const current = this.resolvedValues;
    const next = current.includes(option.value)
      ? current.filter(value => value !== option.value)
      : [...current, option.value];
    this.values = next;
    this.dsChange.emit([...next]);
  }

  private clearSelection = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    this.values = [];
    this.dsChange.emit([]);
    this.dsClear.emit();
    requestAnimationFrame(() => (this.searchable ? this.searchEl?.focus() : this.triggerEl?.focus()));
  };

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
        this.activeIndex = moveChoiceIndex(this.visibleOptions, this.activeIndex, 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusRingVisible = true;
        this.activeIndex = moveChoiceIndex(this.visibleOptions, this.activeIndex, -1);
        break;
      case 'Home':
        event.preventDefault();
        this.focusRingVisible = true;
        this.activeIndex = enabledChoiceIndexes(this.visibleOptions)[0] ?? -1;
        break;
      case 'End': {
        event.preventDefault();
        this.focusRingVisible = true;
        const enabled = enabledChoiceIndexes(this.visibleOptions);
        this.activeIndex = enabled[enabled.length - 1] ?? -1;
        break;
      }
      case 'Enter':
      case ' ': {
        if (event.key === ' ' && this.searchable && event.target === this.searchEl) break;
        event.preventDefault();
        const option = this.visibleOptions[this.activeIndex];
        if (option) this.toggleOption(option);
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
        if (this.searchable) this.searchTerm = event.key;
        else this.handleTypeahead(event.key);
      }
      return;
    }
    this.handleListKeyDown(event);
  };

  private renderOption(option: SelectMultiOption, index: number) {
    const selected = this.values.includes(option.value);
    const active = this.activeIndex === index;
    return (
      <div
        id={`${this.generatedId}-option-${index}`}
        class={{
          'select-option': true,
          'ds-choice-item': true,
          'ds-control--md': true,
          'ds-focus-ring-inset': true,
          'ds-focus-ring--visible': active && this.focusRingVisible,
          'ds-interaction-fill': !option.isInactive,
          'ds-interaction-fill--selected': selected && !option.isInactive,
          'ds-control-inactive': !!option.isInactive,
          'select-option--active': active,
        }}
        role="option"
        aria-selected={String(selected)}
        aria-disabled={option.isInactive ? 'true' : undefined}
        onMouseDown={event => event.preventDefault()}
        onMouseMove={() => {
          if (!option.isInactive) {
            this.focusRingVisible = false;
            this.activeIndex = index;
          }
        }}
        onClick={() => this.toggleOption(option)}
      >
        <span class="ds-choice-item__icon ds-interaction-fill__content" aria-hidden="true">
          <ds-checkbox
            class="select-option__checkbox"
            label=""
            size="sm"
            checked={selected}
            presentation
          />
        </span>
        <div class="ds-choice-item__content ds-interaction-fill__content">
          <ds-text
            class="ds-choice-item__label"
            as="span"
            variant="text-body-medium"
            color={selected ? 'primary' : 'secondary'}
          >
            {option.label}
          </ds-text>
          {option.subtext && (
            <ds-text class="ds-choice-item__subtext" as="span" variant="text-body-small" color="secondary">
              {option.subtext}
            </ds-text>
          )}
        </div>
      </div>
    );
  }

  render() {
    const inactive = this.isDisabled;
    const count = this.resolvedValues.length;
    const textVariant = CONTROL_TEXT_VARIANT[this.size];
    const iconSize = ICON_SIZE[this.size];
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
          aria-invalid={this.error || undefined}
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
            {this.placeholder}
          </ds-text>
          {count > 0 && (
            <span class="trigger__count-box ds-interaction-fill__content" aria-hidden="true">
              <ds-badge
                class="trigger__count"
                count={count}
                max={99}
                hasRing={false}
              />
            </span>
          )}
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
              <div class="select-search ds-control--md">
                <ds-icon name="MagnifyingGlass" size="md" color="inherit" />
                <input
                  class="ds-text--body-medium ds-text--regular ds-focus-ring"
                  ref={element => {
                    this.searchEl = (element as HTMLInputElement) ?? null;
                  }}
                  type="search"
                  value={this.searchTerm}
                  placeholder={this.searchPlaceholder}
                  aria-label={this.searchPlaceholder}
                  aria-controls={this.listboxId}
                  aria-activedescendant={this.activeOptionId}
                  onInput={event => {
                    this.searchTerm = (event.target as HTMLInputElement).value;
                  }}
                  onKeyDown={event => this.handleListKeyDown(event)}
                />
              </div>
            )}
            <div
              id={this.listboxId}
              class="ds-choice-list"
              role="listbox"
              aria-multiselectable="true"
              aria-label={this.ariaLabel ?? this.placeholder}
              aria-busy={this.isLoading ? 'true' : undefined}
            >
              {this.isLoading ? (
                <div class="ds-choice-loading">
                  <ds-loader size="md" color="inherit" label={this.loadingLabel} />
                </div>
              ) : this.visibleOptions.length === 0 ? (
                <ds-text class="ds-choice-empty" as="div" variant="text-body-small" color="secondary">
                  {this.noResultsText}
                </ds-text>
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
                    {section.options.map(option => this.renderOption(option, flatIndex++))}
                  </div>
                ))
              )}
            </div>
            {this.allowClear && this.hasSelection && !this.isLoading && (
              <div class="ds-choice-footer">
                <ds-text class="ds-choice-footer__summary" as="span" variant="text-body-medium" color="secondary">
                  {count} {this.selectedLabel}
                </ds-text>
                <button
                  type="button"
                  class="ds-choice-footer__clear ds-focus-ring"
                  onClick={this.clearSelection}
                >
                  <ds-text as="span" variant="text-body-medium" color="inherit">
                    {this.clearLabel}
                  </ds-text>
                </button>
              </div>
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
