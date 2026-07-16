export type TextVariant =
  | 'text-display-medium'
  | 'text-display-small'
  | 'text-title-large'
  | 'text-title-medium'
  | 'text-title-small'
  | 'text-body-large'
  | 'text-body-medium'
  | 'text-body-small'
  | 'text-caption';

export type TextColorToken =
  | 'primary' | 'secondary' | 'tertiary' | 'quaternary'
  | 'brand' | 'negative' | 'positive' | 'warning' | 'caution' | 'ai'
  | 'on-strong' | 'on-bold' | 'inherit';

export type TextColor = TextColorToken | `var(--${string})`;
export type TextDecoration = 'none' | 'underline' | 'dotted-underline';
export type TextAlign = 'left' | 'center' | 'right';
export type LineTruncation = 1 | 2 | 3 | 4 | 5 | '1' | '2' | '3' | '4' | '5' | 'none';
export type TextWrap = 'wrap' | 'nowrap' | 'balance' | 'pretty';
export type TextElement = 'p' | 'span' | 'div' | 'label' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
export type TextFontFeature = 'normal' | 'tabular-nums';
