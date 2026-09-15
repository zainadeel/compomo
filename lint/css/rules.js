import rule0 from './rules/color-no-hex/index.mjs';
import rule1 from './rules/color-named/index.mjs';
import rule2 from './rules/declaration-property-value-disallowed-list/index.mjs';
import rule3 from './rules/at-rule-empty-line-before/index.mjs';
import rule4 from './rules/at-rule-no-vendor-prefix/index.mjs';
import rule5 from './rules/block-no-redundant-nested-style-rules/index.mjs';
import rule6 from './rules/color-hex-length/index.mjs';
import rule7 from './rules/comment-whitespace-inside/index.mjs';
import rule8 from './rules/container-name-pattern/index.mjs';
import rule9 from './rules/custom-media-pattern/index.mjs';
import rule10 from './rules/font-family-name-quotes/index.mjs';
import rule11 from './rules/function-name-case/index.mjs';
import rule12 from './rules/function-url-quotes/index.mjs';
import rule13 from './rules/keyframe-selector-notation/index.mjs';
import rule14 from './rules/layer-name-pattern/index.mjs';
import rule15 from './rules/length-zero-no-unit/index.mjs';
import rule16 from './rules/lightness-notation/index.mjs';
import rule17 from './rules/media-feature-name-no-vendor-prefix/index.mjs';
import rule18 from './rules/number-max-precision/index.mjs';
import rule19 from './rules/selector-attribute-quotes/index.mjs';
import rule20 from './rules/selector-no-vendor-prefix/index.mjs';
import rule21 from './rules/selector-pseudo-element-colon-notation/index.mjs';
import rule22 from './rules/selector-type-case/index.mjs';
import rule23 from './rules/shorthand-property-no-redundant-values/index.mjs';
import rule24 from './rules/value-no-vendor-prefix/index.mjs';
import rule25 from './rules/annotation-no-unknown/index.mjs';
import rule26 from './rules/at-rule-descriptor-no-unknown/index.mjs';
import rule27 from './rules/at-rule-descriptor-value-no-unknown/index.mjs';
import rule28 from './rules/at-rule-no-deprecated/index.mjs';
import rule29 from './rules/at-rule-no-unknown/index.mjs';
import rule30 from './rules/at-rule-prelude-no-invalid/index.mjs';
import rule31 from './rules/comment-no-empty/index.mjs';
import rule32 from './rules/custom-property-no-missing-var-function/index.mjs';
import rule33 from './rules/declaration-block-no-duplicate-custom-properties/index.mjs';
import rule34 from './rules/declaration-block-no-duplicate-properties/index.mjs';
import rule35 from './rules/declaration-block-no-shorthand-property-overrides/index.mjs';
import rule36 from './rules/declaration-property-value-no-unknown/index.mjs';
import rule37 from './rules/font-family-no-duplicate-names/index.mjs';
import rule38 from './rules/font-family-no-missing-generic-family-keyword/index.mjs';
import rule39 from './rules/function-calc-no-unspaced-operator/index.mjs';
import rule40 from './rules/keyframe-block-no-duplicate-selectors/index.mjs';
import rule41 from './rules/keyframe-declaration-no-important/index.mjs';
import rule42 from './rules/media-feature-name-no-unknown/index.mjs';
import rule43 from './rules/media-feature-name-value-no-unknown/index.mjs';
import rule44 from './rules/media-query-no-invalid/index.mjs';
import rule45 from './rules/media-type-no-deprecated/index.mjs';
import rule46 from './rules/named-grid-areas-no-invalid/index.mjs';
import rule47 from './rules/nesting-selector-no-missing-scoping-root/index.mjs';
import rule48 from './rules/no-duplicate-at-import-rules/index.mjs';
import rule49 from './rules/no-empty-source/index.mjs';
import rule50 from './rules/no-invalid-double-slash-comments/index.mjs';
import rule51 from './rules/no-invalid-position-at-import-rule/index.mjs';
import rule52 from './rules/no-invalid-position-declaration/index.mjs';
import rule53 from './rules/no-irregular-whitespace/index.mjs';
import rule54 from './rules/property-no-unknown/index.mjs';
import rule55 from './rules/selector-anb-no-unmatchable/index.mjs';
import rule56 from './rules/selector-pseudo-class-no-unknown/index.mjs';
import rule57 from './rules/selector-pseudo-element-no-unknown/index.mjs';
import rule58 from './rules/selector-type-no-unknown/index.mjs';
import rule59 from './rules/string-no-newline/index.mjs';
import rule60 from './rules/syntax-string-no-invalid/index.mjs';
export default {
  'color-no-hex': rule0,
  'color-named': rule1,
  'declaration-property-value-disallowed-list': rule2,
  'at-rule-empty-line-before': rule3,
  'at-rule-no-vendor-prefix': rule4,
  'block-no-redundant-nested-style-rules': rule5,
  'color-hex-length': rule6,
  'comment-whitespace-inside': rule7,
  'container-name-pattern': rule8,
  'custom-media-pattern': rule9,
  'font-family-name-quotes': rule10,
  'function-name-case': rule11,
  'function-url-quotes': rule12,
  'keyframe-selector-notation': rule13,
  'layer-name-pattern': rule14,
  'length-zero-no-unit': rule15,
  'lightness-notation': rule16,
  'media-feature-name-no-vendor-prefix': rule17,
  'number-max-precision': rule18,
  'selector-attribute-quotes': rule19,
  'selector-no-vendor-prefix': rule20,
  'selector-pseudo-element-colon-notation': rule21,
  'selector-type-case': rule22,
  'shorthand-property-no-redundant-values': rule23,
  'value-no-vendor-prefix': rule24,
  'annotation-no-unknown': rule25,
  'at-rule-descriptor-no-unknown': rule26,
  'at-rule-descriptor-value-no-unknown': rule27,
  'at-rule-no-deprecated': rule28,
  'at-rule-no-unknown': rule29,
  'at-rule-prelude-no-invalid': rule30,
  'comment-no-empty': rule31,
  'custom-property-no-missing-var-function': rule32,
  'declaration-block-no-duplicate-custom-properties': rule33,
  'declaration-block-no-duplicate-properties': rule34,
  'declaration-block-no-shorthand-property-overrides': rule35,
  'declaration-property-value-no-unknown': rule36,
  'font-family-no-duplicate-names': rule37,
  'font-family-no-missing-generic-family-keyword': rule38,
  'function-calc-no-unspaced-operator': rule39,
  'keyframe-block-no-duplicate-selectors': rule40,
  'keyframe-declaration-no-important': rule41,
  'media-feature-name-no-unknown': rule42,
  'media-feature-name-value-no-unknown': rule43,
  'media-query-no-invalid': rule44,
  'media-type-no-deprecated': rule45,
  'named-grid-areas-no-invalid': rule46,
  'nesting-selector-no-missing-scoping-root': rule47,
  'no-duplicate-at-import-rules': rule48,
  'no-empty-source': rule49,
  'no-invalid-double-slash-comments': rule50,
  'no-invalid-position-at-import-rule': rule51,
  'no-invalid-position-declaration': rule52,
  'no-irregular-whitespace': rule53,
  'property-no-unknown': rule54,
  'selector-anb-no-unmatchable': rule55,
  'selector-pseudo-class-no-unknown': rule56,
  'selector-pseudo-element-no-unknown': rule57,
  'selector-type-no-unknown': rule58,
  'string-no-newline': rule59,
  'syntax-string-no-invalid': rule60,
};
