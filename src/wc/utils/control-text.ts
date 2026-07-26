import type { TextVariant } from '../components/Text/text-types';

/** Shared public control sizes. Typography is derived; it is not a separate density API. */
export type ControlSize = 'lg' | 'md' | 'sm' | 'xs';

/** Complete text variant selected internally by each control size. */
export const CONTROL_TEXT_VARIANT: Record<ControlSize, TextVariant> = {
  lg: 'text-body-large',
  md: 'text-body-medium',
  sm: 'text-body-small',
  xs: 'text-caption',
};

/** Supporting copy paired with each control density in two-line choice rows. */
export const CONTROL_SUPPORTING_TEXT_VARIANT: Record<ControlSize, TextVariant> = {
  lg: 'text-body-medium',
  md: 'text-body-small',
  sm: 'text-caption',
  xs: 'text-caption',
};
