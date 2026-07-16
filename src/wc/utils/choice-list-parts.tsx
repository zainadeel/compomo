// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Stencil's configured JSX factory requires h at compile time.
import { FunctionalComponent, h, VNode } from '@stencil/core';
import type { ChoiceOption } from './choice-list';

interface ChoiceSearchProps {
  value: string;
  placeholder: string;
  controls: string;
  activeDescendant?: string;
  inputRef: (element: HTMLInputElement | null) => void;
  clearLabel: string;
  onValueChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

export const ChoiceSearch: FunctionalComponent<ChoiceSearchProps> = ({
  value,
  placeholder,
  controls,
  activeDescendant,
  inputRef,
  clearLabel,
  onValueChange,
  onKeyDown,
}) => {
  let inputElement: HTMLInputElement | null = null;

  return (
    <div class="select-search">
      <div class="select-search__control ds-control--md">
        <ds-icon name="MagnifyingGlass" size="md" color="inherit" />
        <input
          class="ds-text--body-medium ds-text--regular"
          ref={element => {
            inputElement = (element as HTMLInputElement) ?? null;
            inputRef(inputElement);
          }}
          type="search"
          value={value}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-controls={controls}
          aria-activedescendant={activeDescendant}
          onInput={event => onValueChange((event.target as HTMLInputElement).value)}
          onKeyDown={onKeyDown}
        />
        {value && (
          <ds-button-unfilled
            class="select-search__clear"
            variant="icon"
            size="sm"
            icon="Cross"
            hasBorder={false}
            rounded
            ariaLabel={`${clearLabel} ${placeholder}`}
            onDsClick={() => {
              onValueChange('');
              requestAnimationFrame(() => inputElement?.focus());
            }}
          />
        )}
      </div>
    </div>
  );
};

interface ChoiceFooterProps {
  clearLabel: string;
  summary?: string;
  onClear: (event: MouseEvent) => void;
}

export const ChoiceFooter: FunctionalComponent<ChoiceFooterProps> = ({
  clearLabel,
  summary,
  onClear,
}) => (
  <div class="ds-choice-footer">
    <div class="ds-choice-footer__content ds-control--md">
      {summary && (
        <ds-text class="ds-choice-footer__summary" as="span" variant="text-body-medium" color="secondary">
          {summary}
        </ds-text>
      )}
      <button
        type="button"
        class="ds-choice-footer__clear ds-focus-ring"
        onClick={onClear}
      >
        <ds-text as="span" variant="text-body-medium" color="inherit">
          {clearLabel}
        </ds-text>
      </button>
    </div>
  </div>
);

interface ChoiceOptionRowProps {
  id: string;
  option: ChoiceOption;
  selected: boolean;
  active: boolean;
  focusRingVisible: boolean;
  usesSubtext: boolean;
  leading?: VNode;
  onHover: () => void;
  onSelect: () => void;
}

export const ChoiceOptionRow: FunctionalComponent<ChoiceOptionRowProps> = ({
  id,
  option,
  selected,
  active,
  focusRingVisible,
  usesSubtext,
  leading,
  onHover,
  onSelect,
}) => (
  <div
    id={id}
    class={{
      'select-option': true,
      'ds-choice-item': true,
      'ds-control--md': true,
      'ds-focus-ring-inset': true,
      'ds-focus-ring--visible': active && focusRingVisible,
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
      if (!option.isInactive) onHover();
    }}
    onClick={onSelect}
  >
    {leading}
    <div class="ds-choice-item__content ds-interaction-fill__content">
      <ds-text
        class="ds-choice-item__label"
        as="span"
        variant="text-body-medium"
        color={selected ? 'primary' : 'secondary'}
      >
        {option.label}
      </ds-text>
      {usesSubtext && (
        <ds-text class="ds-choice-item__subtext" as="span" variant="text-body-small" color="secondary">
          {option.subtext?.trim() || '—'}
        </ds-text>
      )}
    </div>
  </div>
);
