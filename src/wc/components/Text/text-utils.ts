import type { TextElement, TextVariant } from './text-types';

/** `text-body-medium` → `ds-text--body-medium` */
export function textVariantClass(variant: TextVariant): string {
  return `ds-text--${variant.replace(/^text-/, '')}`;
}

/** Inline semantics get a measurable inline box; paragraphs/headings get a block box. */
export function textDisplayClass(element: TextElement): string {
  return element === 'span' || element === 'label'
    ? 'ds-text--inline-box'
    : 'ds-text--block-box';
}
