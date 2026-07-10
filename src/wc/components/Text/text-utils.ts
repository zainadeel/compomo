import type { TextVariant } from './text-types';

/** `text-body-medium` → `ds-text--body-medium` */
export function textVariantClass(variant: TextVariant): string {
  return `ds-text--${variant.replace(/^text-/, '')}`;
}
