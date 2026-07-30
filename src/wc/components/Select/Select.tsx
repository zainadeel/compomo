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
  CONTROL_SUPPORTING_TEXT_VARIANT,
  CONTROL_TEXT_VARIANT,
  DEFAULT_REQUIRED_MESSAGE,
  setRequiredValidity,
  type ControlWidth,
} from '../../utils';
import { ChoiceFooter, ChoiceOptionRow, ChoiceSearch } from '../../utils/choice-list-parts';
import {
  choiceBackgroundClassMap,
  choiceListUsesIcons,
  choiceListUsesSubtext,
  enabledChoiceIndexes,
  filterChoiceSections,
  flattenChoiceSections,
  resolveChoiceSections,
  type ChoiceBackground,
  type ChoiceOption,
  type ChoiceSection,
} from '../../utils/choice-list';
import { SelectController } from '../../utils/select-controller';

export type SelectOption = ChoiceOption;
export type SelectSection = ChoiceSection;
export type SelectBackground = ChoiceBackground;
export type SelectSize = 'lg' | 'md' | 'sm' | 'xs';
export type SelectWidth = ControlWidth;

const ICON_SIZE: Record<SelectSize, 'lg' | 'md' | 'sm' | 'xs'> = {
  lg: 'lg',
  md: 'md',
  sm: 'sm',
  xs: 'xs',
};

let selectId = 0;

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
  @Prop() requiredMessage: string = DEFAULT_REQUIRED_MESSAGE;
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
  private initialValue = '';
  private readonly controller = this.createController();

  private createController() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- adapter getters preserve reactive component ownership without inheritance.
    const owner = this;
    return new SelectController<SelectOption>({
      get host() {
        return owner.el;
      },
      generatedId: owner.generatedId,
      get options() {
        return owner.visibleOptions;
      },
      get searchable() {
        return owner.searchable;
      },
      get isLoading() {
        return owner.isLoading;
      },
      get isDisabled() {
        return owner.isDisabled;
      },
      get preferredIndex() {
        return owner.visibleOptions.findIndex(
          option => option.value === owner.value && !option.isInactive
        );
      },
      get open() {
        return owner.open;
      },
      set open(value) {
        owner.open = value;
      },
      get activeIndex() {
        return owner.activeIndex;
      },
      set activeIndex(value) {
        owner.activeIndex = value;
      },
      get searchTerm() {
        return owner.searchTerm;
      },
      set searchTerm(value) {
        owner.searchTerm = value;
      },
      get focusRingVisible() {
        return owner.focusRingVisible;
      },
      set focusRingVisible(value) {
        owner.focusRingVisible = value;
      },
      get position() {
        return owner.position;
      },
      set position(value) {
        owner.position = value;
      },
      get positionReady() {
        return owner.positionReady;
      },
      set positionReady(value) {
        owner.positionReady = value;
      },
      selectOption: option => owner.selectOption(option),
    });
  }

  componentWillLoad() {
    this.initialValue = this.value;
    this.syncFormValue();
  }

  componentDidLoad() {
    this.controller.connect();
  }

  disconnectedCallback() {
    this.controller.disconnect();
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
    setRequiredValidity(this.internals, missing, this.requiredMessage);
    this.controller.optionsChanged();
  }

  @Watch('isLoading')
  onLoadingChange() {
    this.controller.loadingChanged();
  }

  @Watch('open')
  onOpenChange(open: boolean) {
    this.dsOpenChange.emit(open);
    this.controller.openChanged(open);
  }

  @Watch('searchTerm')
  onSearchTermChange() {
    this.controller.searchChanged();
  }

  @Watch('activeIndex')
  onActiveIndexChange() {
    this.controller.activeIndexChanged();
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
    this.controller.setFocus();
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
    return this.controller.activeOptionId;
  }

  private closePopup(restoreFocus = false) {
    this.controller.closePopup(restoreFocus);
  }

  private openPopup(focusVisible: boolean, edge?: 'first' | 'last') {
    this.controller.openPopup(focusVisible, edge);
  }

  private selectOption(option: SelectOption) {
    if (option.isInactive || this.isLoading) return;
    this.value = option.value;
    this.dsChange.emit(this.value);
    this.controller.closePopup(true);
  }

  private clearSelection = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    this.value = '';
    this.dsChange.emit('');
    this.dsClear.emit();
    const enabled = enabledChoiceIndexes(this.visibleOptions);
    this.activeIndex = enabled[0] ?? -1;
    this.controller.focusSearchOrTrigger();
  };

  private readonly handleListKeyDown = this.controller.handleListKeyDown;
  private readonly handleTriggerKeyDown = this.controller.handleTriggerKeyDown;

  private renderOption(
    option: SelectOption,
    index: number,
    usesIcons: boolean,
    usesSubtext: boolean
  ) {
    const selected = option.value === this.value;
    const active = index === this.activeIndex;
    return (
      <ChoiceOptionRow
        size={this.size}
        id={`${this.generatedId}-option-${index}`}
        option={option}
        selected={selected}
        active={active}
        focusRingVisible={this.focusRingVisible}
        usesSubtext={usesSubtext}
        leading={
          usesIcons && option.icon ? (
            <span
              class="ds-choice-item__icon ds-control-icon-box ds-interaction-fill__content"
              aria-hidden="true"
            >
              <ds-icon name={option.icon} size={this.size} color="inherit" />
            </span>
          ) : undefined
        }
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
    const describedBy =
      [this.ariaDescribedby, showError ? this.errorId : undefined].filter(Boolean).join(' ') ||
      undefined;
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
          'ds-field-stack': true,
          'ds-control-inactive': inactive,
          [`ds-control--${this.size}`]: true,
          ...controlWidthClass(this.width),
          [`select-host--background-${this.background}`]: !!this.background,
        }}
      >
        <button
          ref={element => {
            this.controller.setTriggerElement((element as HTMLButtonElement) ?? null);
          }}
          id={this.inputId ?? this.generatedId}
          type="button"
          class={{
            trigger: true,
            'ds-control-frame': true,
            'ds-focus-ring-inset': true,
            'ds-interaction-fill': true,
            'ds-interaction-fill--selected': !inactive && this.activeFill && this.hasSelection,
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
            <span
              class="trigger__prefix ds-control-icon-box ds-interaction-fill__content"
              aria-hidden="true"
            >
              {this.isLoading ? (
                <ds-loader size={iconSize} color="inherit" />
              ) : (
                <ds-icon name={this.icon} size={iconSize} color="inherit" />
              )}
            </span>
          )}
          <ds-text
            class="trigger__label ds-control-label-box ds-interaction-fill__content"
            as="span"
            variant={textVariant}
            color="inherit"
            lineTruncation={1}
          >
            {label}
          </ds-text>
          <span
            class="trigger__chevron ds-control-icon-box ds-interaction-fill__content"
            aria-hidden="true"
          >
            <ds-icon name="ChevronDown" size={iconSize} color="inherit" />
          </span>
        </button>

        {this.open && (
          <div
            popover="manual"
            ref={element => {
              this.controller.setPopupElement((element as HTMLDivElement) ?? null);
            }}
            class="select-popup ds-choice-popup"
            style={popupStyle}
          >
            {this.searchable && (
              <ChoiceSearch
                size={this.size}
                value={this.searchTerm}
                placeholder={this.searchPlaceholder}
                controls={this.listboxId}
                activeDescendant={this.activeOptionId}
                inputRef={this.controller.setSearchElement}
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
                  <ds-loader size={this.size} color="inherit" />
                </div>
              ) : this.visibleOptions.length === 0 ? (
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
              ) : (
                this.visibleSections.map(section => (
                  <div
                    class={{
                      'ds-choice-section': true,
                      'ds-chrome-column': true,
                      'ds-chrome-space--sm': true,
                      'ds-choice-section--divided': !!section.divider,
                    }}
                    role={section.header ? 'group' : undefined}
                    aria-label={section.header}
                  >
                    {section.header && (
                      <ds-text
                        class={`ds-choice-section__header ds-control--${this.size}`}
                        as="span"
                        variant={CONTROL_SUPPORTING_TEXT_VARIANT[this.size]}
                        emphasis
                        color="primary"
                        aria-hidden="true"
                      >
                        {section.header}
                      </ds-text>
                    )}
                    {section.options.map(option =>
                      this.renderOption(option, flatIndex++, usesOptionIcons, usesOptionSubtext)
                    )}
                  </div>
                ))
              )}
            </div>
            {this.allowClear && this.hasSelection && !this.isLoading && (
              <ChoiceFooter
                size={this.size}
                clearLabel={this.clearLabel}
                onClear={this.clearSelection}
              />
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
