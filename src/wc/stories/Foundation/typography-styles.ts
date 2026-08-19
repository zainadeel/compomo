import {
  typographyFontsize2xl,
  typographyFontsize3xl,
  typographyFontsizeLg,
  typographyFontsizeMd,
  typographyFontsizeSm,
  typographyFontsizeXl,
  typographyFontsizeXs,
  typographyLineheight2xl,
  typographyLineheight3xl,
  typographyLineheightLg,
  typographyLineheightMd,
  typographyLineheightSm,
  typographyLineheightXl,
  typographyLineheightXs,
  typographyWeightBold,
  typographyWeightMedium,
  typographyWeightRegular,
  typographyWeightSemibold,
} from '@ds-mo/tokens/ts';
import typographyTokensJson from '@ds-mo/tokens/json/typography' with { type: 'json' };
import type { TextVariant } from '../../components/Text/text-types';

type TypographyTokenName =
  | typeof typographyFontsize2xl
  | typeof typographyFontsize3xl
  | typeof typographyFontsizeLg
  | typeof typographyFontsizeMd
  | typeof typographyFontsizeSm
  | typeof typographyFontsizeXl
  | typeof typographyFontsizeXs
  | typeof typographyLineheight2xl
  | typeof typographyLineheight3xl
  | typeof typographyLineheightLg
  | typeof typographyLineheightMd
  | typeof typographyLineheightSm
  | typeof typographyLineheightXl
  | typeof typographyLineheightXs
  | typeof typographyWeightBold
  | typeof typographyWeightMedium
  | typeof typographyWeightRegular
  | typeof typographyWeightSemibold;

type TypographyTokenDocument = Record<string, { readonly $value?: string }>;

const typographyTokens = typographyTokensJson as TypographyTokenDocument;

export type TypographyStyleRow = {
  variant: TextVariant;
  emphasis: boolean;
  label: string;
  sample: string;
  fontSizeToken: TypographyTokenName;
  lineHeightToken: TypographyTokenName;
  weightToken: TypographyTokenName;
  uppercase?: boolean;
};

export const TYPOGRAPHY_STYLE_ROWS: readonly TypographyStyleRow[] = [
  {
    variant: 'text-display-medium',
    emphasis: true,
    label: 'text-display-medium',
    sample: 'Display Medium',
    fontSizeToken: typographyFontsize3xl,
    lineHeightToken: typographyLineheight3xl,
    weightToken: typographyWeightBold,
  },
  {
    variant: 'text-display-medium',
    emphasis: false,
    label: 'text-display-medium regular',
    sample: 'Display Medium',
    fontSizeToken: typographyFontsize3xl,
    lineHeightToken: typographyLineheight3xl,
    weightToken: typographyWeightSemibold,
  },
  {
    variant: 'text-display-small',
    emphasis: true,
    label: 'text-display-small',
    sample: 'Display Small',
    fontSizeToken: typographyFontsize2xl,
    lineHeightToken: typographyLineheight2xl,
    weightToken: typographyWeightBold,
  },
  {
    variant: 'text-display-small',
    emphasis: false,
    label: 'text-display-small regular',
    sample: 'Display Small',
    fontSizeToken: typographyFontsize2xl,
    lineHeightToken: typographyLineheight2xl,
    weightToken: typographyWeightSemibold,
  },
  {
    variant: 'text-title-large',
    emphasis: true,
    label: 'text-title-large',
    sample: 'Title Large',
    fontSizeToken: typographyFontsizeXl,
    lineHeightToken: typographyLineheightXl,
    weightToken: typographyWeightSemibold,
  },
  {
    variant: 'text-title-large',
    emphasis: false,
    label: 'text-title-large regular',
    sample: 'Title Large',
    fontSizeToken: typographyFontsizeXl,
    lineHeightToken: typographyLineheightXl,
    weightToken: typographyWeightMedium,
  },
  {
    variant: 'text-title-medium',
    emphasis: true,
    label: 'text-title-medium',
    sample: 'Title Medium',
    fontSizeToken: typographyFontsizeLg,
    lineHeightToken: typographyLineheightLg,
    weightToken: typographyWeightSemibold,
  },
  {
    variant: 'text-title-medium',
    emphasis: false,
    label: 'text-title-medium regular',
    sample: 'Title Medium',
    fontSizeToken: typographyFontsizeLg,
    lineHeightToken: typographyLineheightLg,
    weightToken: typographyWeightMedium,
  },
  {
    variant: 'text-title-small',
    emphasis: true,
    label: 'text-title-small',
    sample: 'Title Small',
    fontSizeToken: typographyFontsizeMd,
    lineHeightToken: typographyLineheightMd,
    weightToken: typographyWeightSemibold,
  },
  {
    variant: 'text-title-small',
    emphasis: false,
    label: 'text-title-small regular',
    sample: 'Title Small',
    fontSizeToken: typographyFontsizeMd,
    lineHeightToken: typographyLineheightMd,
    weightToken: typographyWeightMedium,
  },
  {
    variant: 'text-body-large',
    emphasis: false,
    label: 'text-body-large',
    sample: 'The quick brown fox jumps over the lazy dog',
    fontSizeToken: typographyFontsizeLg,
    lineHeightToken: typographyLineheightLg,
    weightToken: typographyWeightRegular,
  },
  {
    variant: 'text-body-large',
    emphasis: true,
    label: 'text-body-large emphasis',
    sample: 'The quick brown fox jumps over the lazy dog',
    fontSizeToken: typographyFontsizeLg,
    lineHeightToken: typographyLineheightLg,
    weightToken: typographyWeightMedium,
  },
  {
    variant: 'text-body-medium',
    emphasis: false,
    label: 'text-body-medium',
    sample: 'The quick brown fox jumps over the lazy dog',
    fontSizeToken: typographyFontsizeMd,
    lineHeightToken: typographyLineheightMd,
    weightToken: typographyWeightRegular,
  },
  {
    variant: 'text-body-medium',
    emphasis: true,
    label: 'text-body-medium emphasis',
    sample: 'The quick brown fox jumps over the lazy dog',
    fontSizeToken: typographyFontsizeMd,
    lineHeightToken: typographyLineheightMd,
    weightToken: typographyWeightMedium,
  },
  {
    variant: 'text-body-small',
    emphasis: false,
    label: 'text-body-small',
    sample: 'The quick brown fox jumps over the lazy dog',
    fontSizeToken: typographyFontsizeSm,
    lineHeightToken: typographyLineheightSm,
    weightToken: typographyWeightRegular,
  },
  {
    variant: 'text-body-small',
    emphasis: true,
    label: 'text-body-small emphasis',
    sample: 'The quick brown fox jumps over the lazy dog',
    fontSizeToken: typographyFontsizeSm,
    lineHeightToken: typographyLineheightSm,
    weightToken: typographyWeightMedium,
  },
  {
    variant: 'text-caption',
    emphasis: false,
    label: 'text-caption',
    sample: 'caption label',
    fontSizeToken: typographyFontsizeXs,
    lineHeightToken: typographyLineheightXs,
    weightToken: typographyWeightMedium,
    uppercase: true,
  },
  {
    variant: 'text-caption',
    emphasis: true,
    label: 'text-caption emphasis',
    sample: 'caption emphasis',
    fontSizeToken: typographyFontsizeXs,
    lineHeightToken: typographyLineheightXs,
    weightToken: typographyWeightSemibold,
    uppercase: true,
  },
];

export function typographyTokenValue(token: TypographyTokenName): string {
  const value = typographyTokens[token]?.$value?.trim();
  if (!value) throw new Error(`Missing TokoMo typography token ${token}`);
  return value;
}

export function formatTypographySpec(row: TypographyStyleRow): string {
  const size = typographyTokenValue(row.fontSizeToken);
  const leading = typographyTokenValue(row.lineHeightToken);
  const weight = row.weightToken.replace('--typography-weight-', '');
  const spec = `${size} / ${leading}  ${weight}`;
  return row.uppercase ? `${spec} upper` : spec;
}
