import stylelint from 'stylelint';

const ruleName = 'local/no-ds-text-metric-overrides';

const messages = stylelint.utils.ruleMessages(ruleName, {
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

const ruleFunction = primaryOption => (root, result) => {
  if (primaryOption !== true) return;

  const filename = root.source?.input.file?.replace(/\\/g, '/') ?? '';
  const isTextOwner =
    filename.includes('/components/Text/') || filename.endsWith('/utils/typography.css');
  if (isTextOwner) return;

  root.walkRules(rule => {
    if (!targetsDsText(rule.selector)) return;

    rule.walkDecls(declaration => {
      if (!METRIC_PROPERTIES.has(declaration.prop.toLowerCase())) return;

      stylelint.utils.report({
        ruleName,
        result,
        node: declaration,
        message: messages.rejected(declaration.prop),
      });
    });
  });
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;

export default stylelint.createPlugin(ruleName, ruleFunction);
export { messages, ruleName };
