import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { textVariantClass } from '../src/wc/components/Text/text-utils';
import {
  TYPOGRAPHY_STYLE_ROWS,
  formatTypographySpec,
  typographyTokenValue,
} from '../src/wc/stories/Foundation/typography-styles';

const root = path.resolve(import.meta.dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const css = fs.readFileSync(path.join(root, 'src/wc/utils/typography.css'), 'utf8');
const story = fs.readFileSync(
  path.join(root, 'src/wc/stories/Foundation/Typography.stories.ts'),
  'utf8'
);

describe('typography style specifications', () => {
  it('keeps the TokoMo peer baseline aligned with the installed tokens package', () => {
    assert.equal(
      packageJson.peerDependencies['@ds-mo/tokens'],
      packageJson.devDependencies['@ds-mo/tokens']
    );
  });

  it('derives Foundation/Typography spec copy from TokoMo metadata', () => {
    assert.match(story, /TYPOGRAPHY_STYLE_ROWS/);
    assert.match(story, /formatTypographySpec/);
    assert.doesNotMatch(story, /\d+px\s*\/\s*\d+px/);
  });

  it('uses the 6.5 TokoMo metrics for display-small, title-medium, and body-large', () => {
    const rows = TYPOGRAPHY_STYLE_ROWS.filter(row =>
      ['text-display-small', 'text-title-medium', 'text-body-large'].includes(row.variant)
    );

    assert.equal(rows.length, 6);
    for (const row of rows) {
      const spec = formatTypographySpec(row);
      if (row.variant === 'text-display-small') {
        assert.match(spec, /^36px \/ 48px/);
      } else {
        assert.match(spec, /^17px \/ 24px/);
      }
    }
  });

  it('keeps recipe token names aligned with the shared typography CSS', () => {
    const variants = new Map<string, (typeof TYPOGRAPHY_STYLE_ROWS)[number]>();
    for (const row of TYPOGRAPHY_STYLE_ROWS) {
      variants.set(row.variant, row);
      const modifier = row.emphasis ? 'emphasis' : 'regular';
      const className = textVariantClass(row.variant).replace('ds-text--', '');
      assert.match(
        css,
        new RegExp(
          `\\.ds-text--${className}\\.ds-text--${modifier}[\\s\\S]*?font-weight: var\\(${row.weightToken}\\)`
        ),
        `${row.variant} ${modifier} weight`
      );
    }

    for (const row of variants.values()) {
      const className = textVariantClass(row.variant).replace('ds-text--', '');
      const block = css.match(
        new RegExp(
          `:host\\(\\.ds-text--${className}\\),[\\s\\S]*?\\.ds-text--${className} \\{([\\s\\S]*?)\\}`
        )
      )?.[1];
      assert.ok(block, `${row.variant} recipe block`);
      assert.match(block, new RegExp(`font-size: var\\(${row.fontSizeToken}\\);`));
      assert.match(block, new RegExp(`line-height: var\\(${row.lineHeightToken}\\);`));
      if (row.uppercase) {
        assert.match(block, /text-transform: uppercase;/);
      }
      assert.equal(typographyTokenValue(row.fontSizeToken).endsWith('px'), true);
    }
  });
});
