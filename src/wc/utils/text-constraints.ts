/** Native text constraints, including programmatic values and external form owners. */
export interface TextConstraints {
  value: string;
  type?: string;
  required: boolean;
  requiredMessage: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function lengthLimit(value: number | undefined): number | undefined {
  return value !== undefined && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : undefined;
}

export function textConstraintValidity(config: TextConstraints): {
  flags: ValidityStateFlags;
  message: string;
} {
  const input = document.createElement('input');
  input.type = config.type ?? 'text';
  input.required = config.required;
  if (config.pattern !== undefined) input.pattern = config.pattern;
  for (const key of ['min', 'max', 'step'] as const) {
    if (config[key] !== undefined) input[key] = String(config[key]);
  }
  input.value = config.value;
  const flags: ValidityStateFlags = {};
  for (const key of [
    'valueMissing',
    'typeMismatch',
    'patternMismatch',
    'rangeUnderflow',
    'rangeOverflow',
    'stepMismatch',
    'badInput',
  ] as const) {
    if (input.validity[key]) flags[key] = true;
  }
  const min = lengthLimit(config.minLength);
  const max = lengthLimit(config.maxLength);
  if (config.type !== 'number' && config.value.length) {
    if (min !== undefined && config.value.length < min) flags.tooShort = true;
    if (max !== undefined && config.value.length > max) flags.tooLong = true;
  }
  const message = flags.valueMissing
    ? config.requiredMessage
    : flags.tooLong
      ? `Use ${max} characters or fewer.`
      : flags.tooShort
        ? `Use at least ${min} characters.`
        : flags.patternMismatch && config.patternMessage
          ? config.patternMessage
          : input.validationMessage;
  return { flags, message };
}
