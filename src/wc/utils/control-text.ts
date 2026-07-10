import type { TextVariant } from '../components/Text/text-types';

/** Shared public control sizes. Typography is derived; it is not a separate density API. */
export type ControlSize = 'md' | 'sm' | 'xs';

/** Complete text variant selected internally by each control size. */
export const CONTROL_TEXT_VARIANT: Record<ControlSize, TextVariant> = {
  md: 'text-body-medium',
  sm: 'text-body-small',
  xs: 'text-caption',
};
