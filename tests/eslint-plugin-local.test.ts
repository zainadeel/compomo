import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import local from '../eslint-plugin-local/index.js';

function lint(code: string, rule = 'prefer-direct-ds-text') {
  const linter = new Linter({ configType: 'flat' });
  return linter.verify(
    code,
    [
      {
        files: ['**/*.tsx'],
        languageOptions: {
          parser: tseslint.parser,
          parserOptions: { ecmaFeatures: { jsx: true } },
        },
        plugins: { local },
        rules: { [`local/${rule}`]: 'warn' },
      },
    ],
    { filename: 'src/wc/components/Example/Example.tsx' },
  );
}

describe('local/prefer-direct-ds-text', () => {
  it('flags a neutral wrapper whose only child is ds-text', () => {
    const messages = lint(`
      const view = <span class="label"><ds-text as="span">Label</ds-text></span>;
    `);
    assert.equal(messages.filter(message => message.ruleId === 'local/prefer-direct-ds-text').length, 1);
  });

  it('accepts ds-text as the direct layout box', () => {
    const messages = lint(`
      const view = <ds-text class="label" as="span">Label</ds-text>;
    `);
    assert.equal(messages.filter(message => message.ruleId === 'local/prefer-direct-ds-text').length, 0);
  });

  it('accepts a structural wrapper with mixed text and badge content', () => {
    const messages = lint(`
      const view = (
        <span class="label">
          <ds-text as="span">Label</ds-text>
          <ds-badge variant="dot" />
        </span>
      );
    `);
    assert.equal(messages.filter(message => message.ruleId === 'local/prefer-direct-ds-text').length, 0);
  });

  it('flags a content column that only wraps ds-text when subtext is absent', () => {
    const messages = lint(`
      const view = (
        <div class="menu-item__content">
          <ds-text as="span">Label</ds-text>
        </div>
      );
    `);
    assert.equal(messages.filter(message => message.ruleId === 'local/prefer-direct-ds-text').length, 1);
  });

  it('does not flag a wrapper whose second child is a conditional expression', () => {
    // Known false negative: `{cond && <ds-text/>}` is a JSXExpressionContainer at
    // lint time, so optional-subtext stacks are not reported. Keep the structural
    // wrapper; do not "fix" by forcing an eslint-disable that stays unused.
    const messages = lint(`
      const subtext = null;
      const view = (
        <div class="menu-item__content">
          <ds-text as="span">Label</ds-text>
          {subtext && <ds-text as="span">{subtext}</ds-text>}
        </div>
      );
    `);
    assert.equal(messages.filter(message => message.ruleId === 'local/prefer-direct-ds-text').length, 0);
  });
});

describe('local/no-selected-fill-emphasis-change', () => {
  const rule = 'no-selected-fill-emphasis-change';

  it('flags selection-driven emphasis inside the active fill utility', () => {
    const messages = lint(`
      const view = (
        <button class={{
          'ds-interaction-fill': true,
          'ds-interaction-fill--selected': isSelected,
        }}>
          <ds-text emphasis={isSelected} color={isSelected ? 'primary' : 'secondary'}>
            Label
          </ds-text>
        </button>
      );
    `, rule);

    assert.equal(messages.filter(message => message.ruleId === `local/${rule}`).length, 1);
  });

  it('accepts a stable text weight with selected foreground color', () => {
    const messages = lint(`
      const view = (
        <button class={{
          'ds-interaction-fill': true,
          'ds-interaction-fill--selected': isSelected,
        }}>
          <ds-text color={isSelected ? 'primary' : 'secondary'}>Label</ds-text>
        </button>
      );
    `, rule);

    assert.equal(messages.filter(message => message.ruleId === `local/${rule}`).length, 0);
  });

  it('accepts always-emphasis as part of the base control recipe', () => {
    const messages = lint(`
      const view = (
        <button class="ds-interaction-fill ds-interaction-fill--selected">
          <ds-text emphasis>Label</ds-text>
        </button>
      );
    `, rule);

    assert.equal(messages.filter(message => message.ruleId === `local/${rule}`).length, 0);
  });
});
