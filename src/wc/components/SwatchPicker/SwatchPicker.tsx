import { Component, Element, Event, EventEmitter, Prop, h, Host } from '@stencil/core';
import {
  flattenSwatchPickerOptions,
  normalizeSwatchPickerOpacity,
  resolveSwatchPickerNavigationIndex,
  resolveSwatchPickerTabIndex,
  type SwatchPickerNavigationKey,
  type SwatchPickerOption,
  type SwatchPickerSection,
} from './swatch-picker-types';

@Component({
  tag: 'ds-swatch-picker',
  styleUrl: 'SwatchPicker.css',
  scoped: true,
})
export class SwatchPicker {
  @Element() el!: HTMLElement;

  /** Selected option value. */
  @Prop({ mutable: true, reflect: true }) value: string = '';

  /** Flat option list. Sections take precedence when supplied. Assign as a JavaScript property. */
  @Prop() options: SwatchPickerOption[] = [];

  /** Visually separated option groups that remain one radio group. Assign as a JavaScript property. */
  @Prop() sections: SwatchPickerSection[] = [];

  /** Accessible name for the complete one-of-many choice. */
  @Prop() groupLabel: string = 'Swatch options';

  @Event() dsChange!: EventEmitter<string>;

  private get activeOptions(): SwatchPickerOption[] {
    return flattenSwatchPickerOptions(this.options, this.sections);
  }

  private selectOption(option: SwatchPickerOption) {
    if (option.isInactive || option.value === this.value) return;
    this.value = option.value;
    this.dsChange.emit(option.value);
  }

  private focusOption(index: number) {
    requestAnimationFrame(() => {
      const optionButtons = this.el
        .querySelectorAll<HTMLButtonElement>('.swatch-picker__option');
      optionButtons[index]?.focus();
    });
  }

  private handleOptionKeyDown(
    event: KeyboardEvent,
    currentIndex: number,
  ) {
    const key = event.key as SwatchPickerNavigationKey;
    if (!['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'Home', 'End'].includes(key)) {
      return;
    }

    const nextIndex = resolveSwatchPickerNavigationIndex(
      this.activeOptions,
      currentIndex,
      key,
    );
    if (nextIndex === null) return;

    event.preventDefault();
    const nextOption = this.activeOptions[nextIndex];
    this.selectOption(nextOption);
    this.focusOption(nextIndex);
  }

  private renderOption(
    option: SwatchPickerOption,
    index: number,
    tabIndex: number,
  ) {
    const selected = option.value === this.value;
    const opacity = normalizeSwatchPickerOpacity(option.preview.opacity);

    return (
      <button
        key={option.value}
        type="button"
        class={{
          'swatch-picker__option': true,
          'swatch-picker__option--selected': selected,
          'ds-focus-ring-inset': true,
          'ds-control-inactive': !!option.isInactive,
        }}
        style={{
          '--_swatch-preview-color': option.preview.backgroundColor ?? 'var(--color-background-secondary)',
          '--_swatch-preview-image': option.preview.backgroundImage ?? 'none',
          '--_swatch-preview-opacity': String(opacity),
        }}
        role="radio"
        aria-label={option.label}
        aria-checked={selected ? 'true' : 'false'}
        tabIndex={index === tabIndex ? 0 : -1}
        disabled={option.isInactive}
        onClick={() => this.selectOption(option)}
        onKeyDown={(event: KeyboardEvent) => this.handleOptionKeyDown(event, index)}
      >
        <span class="swatch-picker__fill" aria-hidden="true" />
        <span class="swatch-picker__border" aria-hidden="true" />
        <span class="swatch-picker__interaction" aria-hidden="true" />
        <span class="swatch-picker__halo" aria-hidden="true" />
        <span class="swatch-picker__stroke" aria-hidden="true" />
      </button>
    );
  }

  render() {
    const activeOptions = this.activeOptions;
    const tabIndex = resolveSwatchPickerTabIndex(activeOptions, this.value);
    let optionIndex = 0;

    return (
      <Host>
        <div
          class="swatch-picker"
          role="radiogroup"
          aria-label={this.groupLabel}
        >
          {(this.sections.length > 0 ? this.sections : [{ options: this.options }]).map((section, sectionIndex) => [
            section.options.map(option => {
              const currentIndex = optionIndex++;
              return this.renderOption(option, currentIndex, tabIndex);
            }),
            sectionIndex < (this.sections.length > 0 ? this.sections.length : 1) - 1 && (
              <span class="swatch-picker__divider" aria-hidden="true" />
            ),
          ])}
        </div>
      </Host>
    );
  }
}
