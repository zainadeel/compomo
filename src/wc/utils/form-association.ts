export type FormControlState = File | FormData | string | null;

export interface SetFormControlValueOptions {
  inactive?: boolean;
  state?: FormControlState;
}

export interface SetRepeatedFormControlValueOptions {
  inactive?: boolean;
  state?: FormControlState;
}

/**
 * Set one form-associated value while consistently omitting inactive controls.
 * Pass `state` only when restoration differs from the submitted value.
 */
export function setFormControlValue(
  internals: ElementInternals,
  value: File | string | null,
  options: SetFormControlValueOptions = {}
): void {
  const submission = options.inactive ? null : value;
  if (options.state === undefined) {
    internals.setFormValue(submission);
    return;
  }
  internals.setFormValue(submission, options.state);
}

/**
 * Submit repeated values under one field name and preserve a serialized array
 * for browser form-state restoration.
 */
export function setRepeatedFormControlValue(
  internals: ElementInternals,
  name: string | null | undefined,
  values: readonly (number | string)[],
  options: SetRepeatedFormControlValueOptions = {}
): void {
  if (options.inactive || !name || values.length === 0) {
    internals.setFormValue(null);
    return;
  }

  const data = new FormData();
  values.forEach(value => data.append(name, String(value)));
  internals.setFormValue(data, options.state ?? JSON.stringify(values));
}

export function restoreStringFormState(state: FormControlState, fallback: string = ''): string {
  return typeof state === 'string' ? state : fallback;
}

export function restoreStringArrayFormState(state: FormControlState): string[] {
  if (typeof state !== 'string') return [];
  try {
    const restored: unknown = JSON.parse(state);
    return Array.isArray(restored)
      ? restored.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
}

export function restoreNumberArrayFormState(
  state: FormControlState,
  maximumValues?: number
): number[] {
  if (typeof state !== 'string') return [];
  try {
    const restored: unknown = JSON.parse(state);
    if (!Array.isArray(restored)) return [];
    const values = restored
      .map(value => (typeof value === 'number' ? value : Number(value)))
      .filter(value => Number.isFinite(value));
    return maximumValues === undefined ? values : values.slice(0, maximumValues);
  } catch {
    return [];
  }
}
