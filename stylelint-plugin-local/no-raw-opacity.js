import stylelint from 'stylelint';

const rawOpacityRuleName = 'local/no-raw-opacity';

const rawOpacityMessages = stylelint.utils.ruleMessages(rawOpacityRuleName, {
  rejected: value =>
    `Unexpected raw opacity ${JSON.stringify(value)}. Use 0 or 1 for structural visibility, ` +
    'or a TokoMo/custom-property token for intermediate opacity.',
});

const GLOBAL_VALUES = new Set(['inherit', 'initial', 'revert', 'revert-layer', 'unset']);

function isAllowedOpacity(value) {
  const normalized = value.trim().toLowerCase();
  return normalized === '0' ||
    normalized === '1' ||
    GLOBAL_VALUES.has(normalized) ||
    (normalized.startsWith('var(') && normalized.endsWith(')'));
}

const rawOpacityRule = primaryOption => (root, result) => {
  if (primaryOption !== true) return;

  root.walkDecls(/^opacity$/i, declaration => {
    if (isAllowedOpacity(declaration.value)) return;
    stylelint.utils.report({
      ruleName: rawOpacityRuleName,
      result,
      node: declaration,
      message: rawOpacityMessages.rejected(declaration.value),
    });
  });
};

rawOpacityRule.ruleName = rawOpacityRuleName;
rawOpacityRule.messages = rawOpacityMessages;

export default stylelint.createPlugin(rawOpacityRuleName, rawOpacityRule);
export { rawOpacityMessages, rawOpacityRuleName };
