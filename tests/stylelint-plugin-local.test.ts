import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import stylelint from 'stylelint';
import localDsTextMetrics, { ruleName } from '../stylelint-plugin-local/index.js';
import localReducedMotion, {
  reducedMotionRuleName,
} from '../stylelint-plugin-local/require-reduced-motion.js';

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

async function lintMotion(code: string) {
  const result = await stylelint.lint({
    code,
    codeFilename: 'src/wc/components/Example/Example.css',
    config: {
      plugins: [localReducedMotion],
      rules: { [reducedMotionRuleName]: true },
    },
  });

  return result.results[0]?.warnings ?? [];
}

describe(reducedMotionRuleName, () => {
  it('rejects animation without a reduced-motion override', async () => {
    const warnings = await lintMotion(`
      .loader { animation: spin var(--effect-motion-short-3) infinite; }
    `);
    assert.deepEqual(warnings.map(warning => warning.rule), [reducedMotionRuleName]);
  });

  it('rejects spatial and opacity transitions without an override', async () => {
    const warnings = await lintMotion(`
      .drawer { transition: max-width var(--effect-motion-medium-1), opacity var(--effect-motion-short-2); }
      .thumb { transition-property: transform; }
    `);
    assert.deepEqual(
      warnings.map(warning => warning.rule),
      [reducedMotionRuleName, reducedMotionRuleName],
    );
  });

  it('allows color-only micro-transitions', async () => {
    const warnings = await lintMotion(`
      .button {
        transition:
          color var(--effect-motion-short-2),
          background-color var(--effect-motion-short-2),
          border-color var(--effect-motion-short-2);
      }
    `);
    assert.equal(warnings.length, 0);
  });

  it('allows motion when the stylesheet defines a reduced-motion override', async () => {
    const warnings = await lintMotion(`
      .thumb { transition: transform var(--effect-motion-short-3); }
      @media (prefers-reduced-motion: reduce) {
        .thumb { transition: none; }
      }
    `);
    assert.equal(warnings.length, 0);
  });
});
