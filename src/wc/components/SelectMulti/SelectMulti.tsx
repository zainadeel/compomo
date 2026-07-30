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
  choiceListUsesSubtext,
  filterChoiceSections,
  flattenChoiceSections,
  resolveChoiceSections,
} from '../../utils/choice-list';
import { SelectController } from '../../utils/select-controller';
import type { SelectBackground, SelectOption, SelectSection, SelectSize } from '../Select/Select';

export type SelectMultiOption = Omit<SelectOption, 'icon'>;
export type SelectMultiSection = Omit<SelectSection, 'options'> & {
  options: SelectMultiOption[];
};
export type SelectMultiBackground = SelectBackground;
export type SelectMultiSize = SelectSize;
export type SelectMultiWidth = ControlWidth;

const ICON_SIZE: Record<SelectMultiSize, 'lg' | 'md' | 'sm' | 'xs'> = {
  lg: 'lg',
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
  @Prop() requiredMessage: string = DEFAULT_REQUIRED_MESSAGE;
  /** Persistent trigger label; selected option labels never replace it. */
  @Prop() placeholder: string = 'Select';
  /** Control density. */
  @Prop() size: SelectMultiSize = 'md';
  /** Width fit — hug content (default) or fill the parent. */
  @Prop() width: SelectMultiWidth = 'hug';
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
  /** Show immediate local filtering over option labels, subtext, and section headings. */
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
  private initialValues: string[] = [];
  private readonly controller = this.createController();

  private createController() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- adapter getters preserve reactive component ownership without inheritance.
    const owner = this;
    return new SelectController<SelectMultiOption>({
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
        return -1;
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
      selectOption: option => owner.toggleOption(option),
    });
  }

  componentWillLoad() {
    this.initialValues = [...this.values];
    this.syncFormValue();
  }

  componentDidLoad() {
    this.controller.connect();
  }

  disconnectedCallback() {
    this.controller.disconnect();
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
    this.controller.setFocus();
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
    return this.controller.activeOptionId;
  }

  private closePopup(restoreFocus = false) {
    this.controller.closePopup(restoreFocus);
  }

  private openPopup(focusVisible: boolean, edge?: 'first' | 'last') {
    this.controller.openPopup(focusVisible, edge);
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
    this.controller.focusSearchOrTrigger();
  };

  private readonly handleListKeyDown = this.controller.handleListKeyDown;
  private readonly handleTriggerKeyDown = this.controller.handleTriggerKeyDown;

  private renderOption(option: SelectMultiOption, index: number, usesSubtext: boolean) {
    const selected = this.values.includes(option.value);
    const active = this.activeIndex === index;
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
          <span
            class="ds-choice-item__icon ds-control-icon-box ds-interaction-fill__content"
            aria-hidden="true"
          >
            <ds-checkbox
              class="select-option__checkbox"
              label=""
              size={this.size}
              checked={selected}
              presentation
            />
          </span>
        }
        onHover={() => {
          this.focusRingVisible = false;
          this.activeIndex = index;
        }}
        onSelect={() => this.toggleOption(option)}
      />
    );
  }

  render() {
    const inactive = this.isDisabled;
    const count = this.resolvedValues.length;
    const textVariant = CONTROL_TEXT_VARIANT[this.size];
    const iconSize = ICON_SIZE[this.size];
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
            {`${this.placeholder}${count > 0 ? ` · ${count}` : ''}`}
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
              aria-multiselectable="true"
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
                      this.renderOption(option, flatIndex++, usesOptionSubtext)
                    )}
                  </div>
                ))
              )}
            </div>
            {this.allowClear && this.hasSelection && !this.isLoading && (
              <ChoiceFooter
                size={this.size}
                summary={`${count} ${this.selectedLabel}`}
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
