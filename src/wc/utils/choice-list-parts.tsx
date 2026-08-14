import { FunctionalComponent, h, VNode } from '@stencil/core';
import type { ChoiceOption } from './choice-list';
import {
  CONTROL_SUPPORTING_TEXT_VARIANT,
  CONTROL_TEXT_VARIANT,
  type ControlSize,
} from './control-text';

const INSET_ACTION_SIZE: Record<ControlSize, 'md' | 'sm' | 'xs'> = {
  lg: 'md',
  md: 'sm',
  sm: 'xs',
  xs: 'xs',
};

interface ChoiceSearchProps {
  size?: ControlSize;
  value: string;
  placeholder: string;
  ariaLabel?: string;
  controls?: string;
  activeDescendant?: string;
  disabled?: boolean;
  inputRef: (element: HTMLInputElement | null) => void;
  clearLabel: string;
  onValueChange: (value: string) => void;
  onClear?: () => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

export const ChoiceSearch: FunctionalComponent<ChoiceSearchProps> = ({
  size = 'md',
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
  let inputElement: HTMLInputElement | null = null;

  return (
    <div class="select-search">
      <div class={`select-search__control ds-control--${size}`}>
        <ds-icon name="MagnifyingGlass" size={size} color="inherit" />
        <input
          class={`ds-text--${CONTROL_TEXT_VARIANT[size].replace('text-', '')} ds-text--regular`}
          ref={element => {
            inputElement = (element as HTMLInputElement) ?? null;
            inputRef(inputElement);
          }}
          type="search"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={ariaLabel ?? placeholder}
          aria-controls={controls}
          aria-activedescendant={activeDescendant}
          onInput={event => onValueChange((event.target as HTMLInputElement).value)}
          onKeyDown={onKeyDown}
        />
        {value && !disabled && (
          <ds-tooltip
            class="select-search__clear-tooltip"
            label={clearLabel}
            side="top"
            size="sm"
          >
            <ds-button-unfilled
              class="select-search__clear"
              variant="icon"
              size={INSET_ACTION_SIZE[size]}
              icon="CrossCircle"
              hasBorder={false}
              rounded
              ariaLabel={clearLabel}
              onDsChange={event => event.stopPropagation()}
              onDsClick={() => {
                onValueChange('');
                onClear?.();
                requestAnimationFrame(() => inputElement?.focus());
              }}
            />
          </ds-tooltip>
        )}
      </div>
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
          {useCompactSummary ? compactSummary ?? summary : summary}
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
          {usesSubtext && (
            <ds-text
              class="ds-choice-item__subtext ds-control-label-box"
              as="span"
              variant={CONTROL_SUPPORTING_TEXT_VARIANT[size]}
              color="secondary"
            >
              {option.subtext?.trim() || '—'}
            </ds-text>
          )}
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
