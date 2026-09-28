import assert from 'node:assert/strict';
import fs from 'node:fs';
import { describe, it } from 'node:test';
import { textVariantClass } from '../src/wc/components/Text/text-utils';
import {
  TYPOGRAPHY_STYLE_ROWS,
  typographyTokenValue,
} from '../src/wc/stories/Foundation/typography-styles';
import { assertDeclarations, parseCss } from './helpers/css-contracts';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const css = parseCss(fs.readFileSync('src/wc/utils/typography.css', 'utf8'));

describe('typography style specifications', () => {
  it('keeps the TokoMo peer and development ranges aligned', () => {
    assert.equal(
      packageJson.peerDependencies['@ds-mo/tokens'],
      packageJson.devDependencies['@ds-mo/tokens']
    );
  });

  it('keeps Foundation metadata aligned with the shared typography recipe', () => {
    for (const row of TYPOGRAPHY_STYLE_ROWS) {
      const selector = `.${textVariantClass(row.variant)}`;
      assertDeclarations(css, `${selector}.ds-text--${row.emphasis ? 'emphasis' : 'regular'}`, {
        'font-weight': `var(${row.weightToken})`,
      });
      assertDeclarations(css, selector, {
        'font-size': `var(${row.fontSizeToken})`,
        'line-height': `var(${row.lineHeightToken})`,
        ...(row.uppercase ? { 'text-transform': 'uppercase' } : {}),
      });
      assert.ok(typographyTokenValue(row.fontSizeToken).endsWith('px'));
    }
    // typography-styles.spec.ts checks displayed specifications against computed metrics.
  });
});
