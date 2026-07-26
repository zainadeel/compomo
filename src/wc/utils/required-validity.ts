/**
 * Shared "required field" validity contract for form-associated custom
 * elements (Checkbox, Radio, Switch, Input, Select, SelectMulti, …).
 *
 * Each control computes its own `missing` condition (what counts as empty
 * differs: unchecked, no value, no selection, …) and its own form value, then
 * calls `setRequiredValidity` instead of hand-rolling the `setValidity` call
 * and the default message string.
 *
 * @see AGENTS.md — "Required-field validity"
 */

export const DEFAULT_REQUIRED_MESSAGE = 'This field is required.';

/** Sets or clears the `valueMissing` validity flag on a form-associated element. */
export function setRequiredValidity(
  internals: ElementInternals,
  missing: boolean,
  message: string,
): void {
  internals.setValidity(missing ? { valueMissing: true } : {}, missing ? message : '');
}
