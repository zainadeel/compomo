import type { TextVariant } from '../components/Text/text-types';

/** Control-density sizes shared by buttons, tags, chips, select, tooltip. */
export type ControlDensitySize = 'md' | 'sm' | 'xs';

/** Body/caption variant per control-density size (emphasis is separate). */
export const CONTROL_TEXT_VARIANT: Record<ControlDensitySize, TextVariant> = {
  md: 'text-body-medium',
  sm: 'text-body-small',
  xs: 'text-caption',
};
