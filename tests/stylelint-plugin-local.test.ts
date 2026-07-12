import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import stylelint from 'stylelint';
import localDsTextMetrics, { ruleName } from '../stylelint-plugin-local/index.js';

async function lint(code: string, codeFilename = 'src/wc/components/Example/Example.css') {
  const result = await stylelint.lint({
    code,
    codeFilename,
    config: {
      plugins: [localDsTextMetrics],
      rules: { [ruleName]: true },
    },
  });

  return result.results[0]?.warnings ?? [];
}

describe(ruleName, () => {
  it('rejects typography metric overrides on a ds-text consumer', async () => {
    const warnings = await lint(`
      ds-text.user-initial,
      ds-text.user-initial.ds-text--caption {
        line-height: 1;
        font-size: 10px;
      }
    `);

    assert.deepEqual(
      warnings.map(warning => warning.rule),
      [ruleName, ruleName],
    );
  });

  it('allows consumer layout and color declarations', async () => {
    const warnings = await lint(`
      ds-text.card-title {
        display: flex;
        align-items: center;
        padding-inline: var(--dimension-space-100);
        color: var(--color-foreground-primary);
      }
    `);

    assert.equal(warnings.length, 0);
  });

  it('allows ds-text to own its metrics inside the Text component', async () => {
    const warnings = await lint(
      `.ds-text__element { font: inherit; line-height: inherit; }`,
      'src/wc/components/Text/Text.css',
    );

    assert.equal(warnings.length, 0);
  });
});
