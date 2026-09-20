import { h } from '@stencil/core';
import type { TableCellEditor } from './table-types';

/** Shared controls own field behavior; Table owns the draft, cell chrome and commit boundary. */
export function renderTableCellEditor(
  editor: TableCellEditor,
  value: string,
  ariaLabel: string,
  anchor: HTMLElement | undefined,
  change: (value: string) => void
) {
  const common = {
    value,
    ariaLabel,
    required: editor.required,
    size: 'md' as const,
    width: 'fill' as const,
    hasBorder: false,
    hasInteractionFill: false,
    onDsChange: (event: CustomEvent<string | string[]>) => {
      event.stopPropagation();
      if (typeof event.detail === 'string') change(event.detail);
    },
  };
  switch (editor.type) {
    case 'select':
      return (
        <ds-select
          {...common}
          options={editor.options}
          searchable={editor.searchable}
          anchor={anchor}
          hasFocusRing={false}
        />
      );
    case 'date':
      return <ds-input-date {...common} min={editor.min} max={editor.max} />;
    case 'time':
      return (
        <ds-input-time
          {...common}
          min={editor.min}
          max={editor.max}
          step={editor.step ?? 60}
          hourFormat={editor.hourFormat ?? '24'}
        />
      );
    case 'textarea':
      return (
        <ds-textarea
          {...common}
          rows={1}
          resize="none"
          minLength={editor.minLength}
          maxLength={editor.maxLength}
        />
      );
    case 'number':
      return (
        <ds-input
          {...common}
          type="number"
          min={editor.min}
          max={editor.max}
          step={editor.step}
          showStepper={editor.showStepper ?? true}
        />
      );
    default:
      return (
        <ds-input
          {...common}
          type="text"
          minLength={editor.minLength}
          maxLength={editor.maxLength}
        />
      );
  }
}
