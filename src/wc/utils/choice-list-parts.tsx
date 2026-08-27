import { FunctionalComponent, h, VNode } from '@stencil/core';
import type { ChoiceOption } from './choice-list';
import {
  CONTROL_SUPPORTING_TEXT_VARIANT,
  CONTROL_TEXT_VARIANT,
  type ControlSize,
} from './control-text';

interface ChoiceListSectionProps {
  size?: ControlSize;
  heading?: string;
  ariaLabel: string;
  className?: string;
}

/** Shared listbox anatomy used when an owning surface composes choice lists directly. */
export const ChoiceListSection: FunctionalComponent<ChoiceListSectionProps> = (
  { size = 'md', heading, ariaLabel, className },
  children
) => (
  <div
    class={`ds-choice-list ds-chrome-column ds-chrome-space--sm ${className ?? ''}`.trim()}
    role="listbox"
    aria-label={ariaLabel}
  >
    {heading ? (
      <ds-text
        class={`ds-choice-section__header ds-control-section-heading ds-control--${size}`}
        as="div"
        variant={CONTROL_SUPPORTING_TEXT_VARIANT[size]}
        color="primary"
        emphasis
        aria-hidden="true"
      >
        {heading}
      </ds-text>
    ) : null}
    {children}
  </div>
);

interface ChoiceSearchProps {
  size?: ControlSize;
  hasFocusBoundary?: boolean;
  hasInteractionFill?: boolean;
  value: string;
  placeholder: string;
  ariaLabel?: string;
  controls?: string;
  activeDescendant?: string;
  disabled?: boolean;
  inputRef: (element: HTMLDsInputElement | null) => void;
  clearLabel: string;
  onValueChange: (value: string) => void;
  onClear?: () => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

export const ChoiceSearch: FunctionalComponent<ChoiceSearchProps> = ({
  size = 'md',
  hasFocusBoundary = true,
  hasInteractionFill = true,
  value,
  placeholder,
  ariaLabel,
  controls,
  activeDescendant,
  disabled = false,
  inputRef,
  clearLabel,
  onValueChange,
  onClear,
  onKeyDown,
}) => {
  return (
    <div
      class={{
        'select-search': true,
        'select-search--without-focus-boundary': !hasFocusBoundary,
      }}
    >
      <ds-input
        class="select-search__control"
        ref={element => inputRef((element as HTMLDsInputElement) ?? null)}
        type="search"
        size={size}
        width="fill"
        value={value}
        placeholder={placeholder}
        icon="MagnifyingGlass"
        clearLabel={clearLabel}
        isInactive={disabled}
        hasBorder={false}
        hasInteractionFill={hasInteractionFill}
        ariaLabel={ariaLabel ?? placeholder}
        ariaControls={controls}
        ariaActiveDescendant={activeDescendant}
        onKeyDown={onKeyDown}
        onDsChange={(event: CustomEvent<string>) => {
          event.stopPropagation();
          onValueChange(event.detail);
        }}
        onDsClear={(event: CustomEvent<void>) => {
          event.stopPropagation();
          onClear?.();
        }}
      />
    </div>
  );
};

interface ChoiceFooterProps {
  size?: ControlSize;
  clearLabel: string;
  summary?: string;
  compactSummary?: string;
  useCompactSummary?: boolean;
  contentRef?: (element: HTMLDivElement | null) => void;
  summaryMeasureRef?: (element: HTMLElement | null) => void;
  clearRef?: (element: HTMLButtonElement | null) => void;
  onClear: (event: MouseEvent) => void;
}

export const ChoiceFooter: FunctionalComponent<ChoiceFooterProps> = ({
  size = 'md',
  clearLabel,
  summary,
  compactSummary,
  useCompactSummary = false,
  contentRef,
  summaryMeasureRef,
  clearRef,
  onClear,
}) => (
  <div class="ds-choice-footer">
    <div
      ref={element => contentRef?.((element as HTMLDivElement) ?? null)}
      class={`ds-choice-footer__content ds-control--${size}`}
    >
      {summary && [
        <ds-text
          key="summary"
          class="ds-choice-footer__summary"
          as="span"
          variant={CONTROL_TEXT_VARIANT[size]}
          color="secondary"
        >
          {useCompactSummary ? (compactSummary ?? summary) : summary}
        </ds-text>,
        <ds-text
          key="summary-measure"
          ref={element => summaryMeasureRef?.((element as HTMLElement) ?? null)}
          class="ds-choice-footer__summary-measure"
          as="span"
          variant={CONTROL_TEXT_VARIANT[size]}
          color="secondary"
          aria-hidden="true"
        >
          {summary}
        </ds-text>,
      ]}
      <button
        ref={element => clearRef?.((element as HTMLButtonElement) ?? null)}
        type="button"
        class="ds-choice-footer__clear ds-text-action ds-focus-ring"
        onClick={onClear}
      >
        <ds-text as="span" variant={CONTROL_TEXT_VARIANT[size]} color="inherit">
          {clearLabel}
        </ds-text>
      </button>
    </div>
  </div>
);

interface ChoiceActionFooterProps {
  size?: ControlSize;
  label: string;
  onAction: (event: MouseEvent) => void;
}

export const ChoiceActionFooter: FunctionalComponent<ChoiceActionFooterProps> = ({
  size = 'md',
  label,
  onAction,
}) => (
  <div class="ds-choice-footer">
    <div class={`ds-choice-footer__content ds-control--${size}`}>
      <button
        type="button"
        class="ds-choice-footer__action ds-text-action ds-focus-ring"
        onClick={onAction}
      >
        <ds-text as="span" variant={CONTROL_TEXT_VARIANT[size]} color="inherit">
          {label}
        </ds-text>
      </button>
    </div>
  </div>
);

interface ChoiceOptionRowProps {
  size?: ControlSize;
  id: string;
  option: ChoiceOption;
  selected: boolean;
  active: boolean;
  focusRingVisible: boolean;
  usesSubtext: boolean;
  leading?: VNode;
  supporting?: VNode;
  action?: VNode;
  actionOpen?: boolean;
  popupRole?: 'listbox' | 'grid';
  tabIndex?: number;
  onFocus?: () => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onHover: () => void;
  onSelect: () => void;
}

export const ChoiceOptionRow: FunctionalComponent<ChoiceOptionRowProps> = ({
  size = 'md',
  id,
  option,
  selected,
  active,
  focusRingVisible,
  usesSubtext,
  leading,
  supporting,
  action,
  actionOpen = false,
  popupRole = 'listbox',
  tabIndex,
  onFocus,
  onKeyDown,
  onHover,
  onSelect,
}) => {
  const grid = popupRole === 'grid';
  return (
    <div
      id={grid ? id : undefined}
      role={grid ? 'row' : undefined}
      aria-selected={grid ? String(selected) : undefined}
      aria-disabled={grid && option.isInactive ? 'true' : undefined}
      class={{
        'select-option-row': true,
        'select-option-row--has-action': !!action,
        'select-option-row--action-open': actionOpen,
        'select-option-row--keyboard-active': !!action && active && focusRingVisible,
      }}
    >
      <div
        id={grid ? undefined : id}
        class={{
          'select-option': true,
          'ds-choice-item': true,
          'ds-control-frame': true,
          [`ds-control--${size}`]: true,
          'ds-focus-ring-inset': true,
          'ds-focus-ring--visible': active && focusRingVisible,
          'ds-interaction-fill': !option.isInactive,
          'ds-interaction-fill--selected': selected && !option.isInactive,
          'ds-control-inactive': !!option.isInactive,
          'select-option--active': active,
        }}
        role={grid ? 'gridcell' : 'option'}
        tabIndex={tabIndex}
        aria-selected={grid ? undefined : String(selected)}
        aria-disabled={!grid && option.isInactive ? 'true' : undefined}
        onMouseDown={event => event.preventDefault()}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        onMouseMove={() => {
          if (!option.isInactive) onHover();
        }}
        onClick={onSelect}
      >
        {leading}
        <div class="ds-choice-item__content ds-interaction-fill__content">
          <ds-text
            class="ds-choice-item__label ds-control-label-box"
            as="span"
            variant={CONTROL_TEXT_VARIANT[size]}
            color={selected ? 'primary' : 'secondary'}
          >
            {option.label}
          </ds-text>
          {supporting ??
            (usesSubtext ? (
              <ds-text
                class="ds-choice-item__subtext ds-control-label-box"
                as="span"
                variant={CONTROL_SUPPORTING_TEXT_VARIANT[size]}
                color="secondary"
              >
                {option.subtext?.trim() || '—'}
              </ds-text>
            ) : null)}
        </div>
      </div>
      {action && (
        <div
          class="select-option-row__action ds-control-elevation ds-control-elevation--md ds-control-elevation--press-scale"
          role={grid ? 'gridcell' : undefined}
        >
          {action}
        </div>
      )}
    </div>
  );
};
