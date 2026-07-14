import stylelint from 'stylelint';

const reducedMotionRuleName = 'local/require-reduced-motion';

const reducedMotionMessages = stylelint.utils.ruleMessages(reducedMotionRuleName, {
  rejected: property =>
    `${property} introduces infinite, spatial, layout, or opacity motion without a ` +
    '`prefers-reduced-motion: reduce` override in the same stylesheet.',
});

const MOTION_PROPERTY = /(?:^|[\s,])(transform|opacity|width|height|max-width|max-height|min-width|min-height|top|right|bottom|left|inset|clip-path|mask(?:-position)?)(?:\s|,|$)/i;

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

const reducedMotionRule = primaryOption => (root, result) => {
  if (primaryOption !== true) return;

  let hasReducedMotionOverride = false;
  root.walkAtRules('media', atRule => {
    if (atRule.params.includes('prefers-reduced-motion') && atRule.params.includes('reduce')) {
      hasReducedMotionOverride = true;
    }
  });
  if (hasReducedMotionOverride) return;

  root.walkDecls(declaration => {
    if (!isMotionDeclaration(declaration)) return;
    stylelint.utils.report({
      ruleName: reducedMotionRuleName,
      result,
      node: declaration,
      message: reducedMotionMessages.rejected(declaration.prop),
    });
  });
};

reducedMotionRule.ruleName = reducedMotionRuleName;
reducedMotionRule.messages = reducedMotionMessages;

export default stylelint.createPlugin(reducedMotionRuleName, reducedMotionRule);
export { reducedMotionMessages, reducedMotionRuleName };
