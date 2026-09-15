import { executeRule } from '../../runtime.js';
import { isRegExp, isString } from '../../utils/validateTypes.mjs';
import { declarationValueIndex } from '../../utils/nodeFieldIndices.mjs';
import matchesStringOrRegExp from '../../utils/matchesStringOrRegExp.mjs';
import optionsMatches from '../../utils/optionsMatches.mjs';
import report from '../../utils/report.mjs';
import ruleMessages from '../../utils/ruleMessages.mjs';
import validateObjectWithArrayProps from '../../utils/validateObjectWithArrayProps.mjs';
import validateOptions from '../../utils/validateOptions.mjs';

const ruleName = 'declaration-property-value-disallowed-list';

const messages = ruleMessages(ruleName, {
  rejected: (property, value) => `Disallowed value "${value}" for property "${property}"`,
});

const meta = {
  url: 'https://stylelint.io/user-guide/rules/declaration-property-value-disallowed-list',
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
            possible: [validateObjectWithArrayProps(isString, isRegExp)],
          });

          if (!validOptions) {
            return;
          }

          const propKeys = Object.keys(primary);

          root.walkDecls(decl => {
            const { prop, value } = decl;

            const propPatterns = propKeys.filter(key => matchesStringOrRegExp(prop, key));

            if (propPatterns.length === 0) {
              return;
            }

            if (propPatterns.every(pattern => !optionsMatches(primary, pattern, value))) {
              return;
            }

            const index = declarationValueIndex(decl);
            const endIndex = index + decl.value.length;

            report({
              message: messages.rejected,
              messageArgs: [prop, value],
              node: decl,
              index,
              endIndex,
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
