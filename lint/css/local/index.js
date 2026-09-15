import { executeRule } from '../runtime.js';
import report from '../utils/report.mjs';
import ruleMessages from '../utils/ruleMessages.mjs';

const ruleName = 'local/no-ds-text-metric-overrides';

const messages = ruleMessages(ruleName, {
  rejected: property =>
    `Unexpected ${property} override on ds-text. Select a ds-text variant/emphasis instead; ` +
    'consumer CSS may control layout but must not split the atomic typography recipe.',
});

const METRIC_PROPERTIES = new Set([
  'font',
  'font-size',
  'font-weight',
  'letter-spacing',
  'line-height',
]);

function targetsDsText(selector) {
  return /(^|[^a-zA-Z0-9_-])(?:ds-text|\.ds-text(?:--|__))/.test(selector);
}

const ruleFunction = {
  meta: { type: 'problem', schema: [{ type: 'boolean' }, {}] },
  create(context) {
    const primaryOption = context.options[0];
    return {
      'StyleSheet:exit'() {
        return executeRule(context, (root, result) => {
          if (primaryOption !== true) return;

          const filename = root.source?.input.file?.replace(/\\/g, '/') ?? '';
          const isTextOwner =
            filename.includes('/components/Text/') || filename.endsWith('/utils/typography.css');
          if (isTextOwner) return;

          root.walkRules(rule => {
            if (!targetsDsText(rule.selector)) return;

            rule.walkDecls(declaration => {
              if (!METRIC_PROPERTIES.has(declaration.prop.toLowerCase())) return;

              report({
                ruleName,
                result,
                node: declaration,
                message: messages.rejected(declaration.prop),
              });
            });
          });
        });
      },
    };
  },
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;

export default ruleFunction;
export { messages, ruleName };
