/**
 * Local ESLint plugin — CompoMo primitive conventions (warn-only).
 * @type {import('eslint').ESLint.Plugin}
 */

const TOKOMO_TEXT_CLASS =
  /\btext-(?:display|title|body)-(?:medium|small|large)(?:-emphasis)?\b|\btext-caption(?:-emphasis)?\b/;

/** Paths where TokoMo text utility classes (or variant name strings) are expected. */
function isTextAllowlisted(filename) {
  const f = filename.replace(/\\/g, '/');
  return (
    f.includes('/components/Text/') ||
    f.endsWith('/utils/control-text.ts') ||
    f.includes('/stories/Typography.stories.') ||
    f.includes('/Foundation/Typography.stories.')
  );
}

/** Paths where raw <svg> or @ds-mo/icons imports are expected. */
function isIconAllowlisted(filename) {
  const f = filename.replace(/\\/g, '/');
  return (
    f.includes('/components/Icon/') ||
    f.includes('/components/Loader/') ||
    f.includes('/components/ChartDonut/') ||
    f.includes('/components/ChartBar/') ||
    f.includes('/components/ChartLine/') ||
    // Brand M mark — structural chrome, not an IcoMo glyph.
    f.includes('/components/PanelNav/') ||
    f.includes('/stories/Icons.stories.') ||
    f.includes('/Foundation/Icons.stories.')
  );
}

function isClassAttribute(node) {
  return (
    node.type === 'JSXAttribute' &&
    node.name.type === 'JSXIdentifier' &&
    (node.name.name === 'class' || node.name.name === 'className')
  );
}

function literalHasTokomoTextClass(node) {
  return typeof node.value === 'string' && TOKOMO_TEXT_CLASS.test(node.value);
}

function reportTokomoText(context, node, snippet) {
  context.report({
    node,
    message:
      `Prefer <ds-text variant="…"> over TokoMo utility class "${snippet}". ` +
      `Use the emphasis prop instead of *-emphasis class names.`,
  });
}

/** Walk an expression tree and report TokoMo text class string literals. */
function checkClassExpression(context, node, seen) {
  if (!node || seen.has(node)) return;
  seen.add(node);

  if (node.type === 'Literal' && literalHasTokomoTextClass(node)) {
    const m = String(node.value).match(TOKOMO_TEXT_CLASS);
    reportTokomoText(context, node, m?.[0] ?? 'text-*');
    return;
  }

  if (node.type === 'TemplateLiteral') {
    for (const part of node.quasis) {
      if (TOKOMO_TEXT_CLASS.test(part.value.cooked ?? '')) {
        const m = (part.value.cooked ?? '').match(TOKOMO_TEXT_CLASS);
        reportTokomoText(context, part, m?.[0] ?? 'text-*');
      }
    }
    for (const expr of node.expressions) checkClassExpression(context, expr, seen);
    return;
  }

  if (node.type === 'ConditionalExpression') {
    checkClassExpression(context, node.consequent, seen);
    checkClassExpression(context, node.alternate, seen);
    return;
  }

  if (node.type === 'LogicalExpression') {
    checkClassExpression(context, node.left, seen);
    checkClassExpression(context, node.right, seen);
    return;
  }

  if (node.type === 'BinaryExpression' && node.operator === '+') {
    checkClassExpression(context, node.left, seen);
    checkClassExpression(context, node.right, seen);
    return;
  }

  if (node.type === 'ObjectExpression') {
    for (const prop of node.properties) {
      if (prop.type !== 'Property' || prop.computed) continue;
      const key =
        prop.key.type === 'Literal'
          ? prop.key.value
          : prop.key.type === 'Identifier'
            ? prop.key.name
            : null;
      if (typeof key === 'string' && TOKOMO_TEXT_CLASS.test(key)) {
        reportTokomoText(context, prop.key, key.match(TOKOMO_TEXT_CLASS)?.[0] ?? key);
      }
    }
  }
}

/** @type {import('eslint').Rule.RuleModule} */
const preferDsText = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer ds-text over TokoMo typography utility classes (text-body-*, text-caption*, …).',
    },
    schema: [],
    messages: {},
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (isTextAllowlisted(filename)) return {};

    return {
      // class="… text-body-medium …" / class={{ … }} / class={cond ? '…' : '…'}
      JSXAttribute(node) {
        if (!isClassAttribute(node) || !node.value) return;

        if (node.value.type === 'Literal' && literalHasTokomoTextClass(node.value)) {
          const m = String(node.value.value).match(TOKOMO_TEXT_CLASS);
          reportTokomoText(context, node.value, m?.[0] ?? 'text-*');
          return;
        }

        if (node.value.type === 'JSXExpressionContainer') {
          checkClassExpression(context, node.value.expression, new Set());
        }
      },
    };
  },
};

/** @type {import('eslint').Rule.RuleModule} */
const preferDsIcon = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer ds-icon over raw <svg> markup or direct @ds-mo/icons imports in components.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (isIconAllowlisted(filename)) return {};

    return {
      JSXOpeningElement(node) {
        if (node.name.type === 'JSXIdentifier' && node.name.name === 'svg') {
          context.report({
            node,
            message:
              'Prefer <ds-icon name="…"> over raw <svg>. ' +
              'Inline SVG is reserved for charts, loader, and Icon internals.',
          });
        }
      },

      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source !== 'string' || !source.startsWith('@ds-mo/icons')) return;
        context.report({
          node,
          message:
            'Prefer <ds-icon> (or registerIcons from @ds-mo/ui/utils) over importing @ds-mo/icons in components. ' +
            'Direct icon imports belong in Icon internals / app preload call sites.',
        });
      },

      // Imperative createElement('svg') outside allowlisted Icon/chart code
      CallExpression(node) {
        const callee = node.callee;
        const isCreateElement =
          (callee.type === 'MemberExpression' &&
            !callee.computed &&
            callee.property.type === 'Identifier' &&
            callee.property.name === 'createElement' &&
            callee.object.type === 'Identifier' &&
            (callee.object.name === 'document' || callee.object.name === 'React')) ||
          (callee.type === 'Identifier' && callee.name === 'createElement');

        if (!isCreateElement || node.arguments.length === 0) return;
        const first = node.arguments[0];
        if (first.type === 'Literal' && first.value === 'svg') {
          context.report({
            node: first,
            message:
              'Prefer <ds-icon name="…"> over createElement("svg"). ' +
              'Inline SVG is reserved for charts, loader, and Icon internals.',
          });
        }
      },
    };
  },
};

export default {
  meta: { name: 'eslint-plugin-local', version: '1.0.0' },
  rules: {
    'prefer-ds-text': preferDsText,
    'prefer-ds-icon': preferDsIcon,
  },
};
