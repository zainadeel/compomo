import { executeRule } from '../runtime.js';
import report from '../utils/report.mjs';
import ruleMessages from '../utils/ruleMessages.mjs';

const reducedMotionRuleName = 'local/require-reduced-motion';

const reducedMotionMessages = ruleMessages(reducedMotionRuleName, {
  rejected: property =>
    `${property} introduces infinite, spatial, layout, or opacity motion without a ` +
    '`prefers-reduced-motion: reduce` override in the same stylesheet.',
});

const MOTION_PROPERTY =
  /(?:^|[\s,])(transform|opacity|width|height|max-width|max-height|min-width|min-height|top|right|bottom|left|inset|clip-path|mask(?:-position)?)(?:\s|,|$)/i;

function isMotionDeclaration(declaration) {
  const property = declaration.prop.toLowerCase();
  const value = declaration.value.toLowerCase();

  if ((property === 'animation' || property === 'animation-name') && value !== 'none') {
    return true;
  }

  if (property === 'transition-property') return MOTION_PROPERTY.test(value);
  if (property === 'transition') return MOTION_PROPERTY.test(value);
  return false;
}

const reducedMotionRule = {
  meta: { type: 'problem', schema: [{ type: 'boolean' }, {}] },
  create(context) {
    const primaryOption = context.options[0];
    return {
      'StyleSheet:exit'() {
        return executeRule(context, (root, result) => {
          if (primaryOption !== true) return;

          let hasReducedMotionOverride = false;
          root.walkAtRules('media', atRule => {
            if (
              atRule.params.includes('prefers-reduced-motion') &&
              atRule.params.includes('reduce')
            ) {
              hasReducedMotionOverride = true;
            }
          });
          if (hasReducedMotionOverride) return;

          root.walkDecls(declaration => {
            if (!isMotionDeclaration(declaration)) return;
            report({
              ruleName: reducedMotionRuleName,
              result,
              node: declaration,
              message: reducedMotionMessages.rejected(declaration.prop),
            });
          });
        });
      },
    };
  },
};

reducedMotionRule.ruleName = reducedMotionRuleName;
reducedMotionRule.messages = reducedMotionMessages;

export default reducedMotionRule;
export { reducedMotionMessages, reducedMotionRuleName };
