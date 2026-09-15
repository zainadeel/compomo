import { executeRule } from '../../runtime.js';
import { isRoot } from '../../utils/typeGuards.mjs';
import isStandardSyntaxRule from '../../utils/isStandardSyntaxRule.mjs';
import report from '../../utils/report.mjs';
import ruleMessages from '../../utils/ruleMessages.mjs';
import validateOptions from '../../utils/validateOptions.mjs';

const ruleName = 'block-no-redundant-nested-style-rules';

const messages = ruleMessages(ruleName, {
  rejected: 'Redundant nested style rule',
});

const meta = {
  url: 'https://stylelint.io/user-guide/rules/block-no-redundant-nested-style-rules',
};

/** @type {import('stylelint').CoreRules[ruleName]} */
const rule = {
  meta: {
    type: 'problem',
    docs: { url: meta.url },
    schema: [{}, {}],
    ...(meta.fixable ? { fixable: 'code' } : {}),
  },
  create(eslintContext) {
    const primary = eslintContext.options[0];

    return {
      'StyleSheet:exit'() {
        return executeRule(eslintContext, (root, result) => {
          const validOptions = validateOptions(result, ruleName, {
            actual: primary,
            possible: [true],
          });

          if (!validOptions) return;

          root.walkRules(ruleNode => {
            if (!isStandardSyntaxRule(ruleNode)) return;

            const { parent, selector } = ruleNode;

            if (selector !== '&') return;

            if (!parent) return;

            if (isRoot(parent)) return;

            report({
              message: messages.rejected,
              messageArgs: [],
              node: ruleNode,
              result,
              ruleName,
            });
          });
        });
      },
    };
  },
};

rule.ruleName = ruleName;
rule.messages = messages;

export default rule;
