const nameOf = node =>
  node?.type === 'Identifier' || node?.type === 'JSXIdentifier'
    ? node.name
    : node?.type === 'Literal'
      ? node.value
      : undefined;
const memberName = node =>
  node?.type === 'MemberExpression' && (!node.computed || node.property.type === 'Literal')
    ? nameOf(node.property)
    : undefined;
const unsafeAttributes = new Set([
  'innerHTML',
  'outerHTML',
  'srcdoc',
  'srcDoc',
  'dangerouslySetInnerHTML',
]);

export const noMarkupSinks = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      unsafe:
        'Render text or Stencil nodes, or construct validated DOM nodes. Do not introduce a browser markup sink.',
    },
  },
  create(context) {
    const report = node => context.report({ node, messageId: 'unsafe' });
    return {
      AssignmentExpression(node) {
        if (unsafeAttributes.has(memberName(node.left))) report(node);
      },
      JSXAttribute(node) {
        if (unsafeAttributes.has(nameOf(node.name))) report(node);
      },
      Property(node) {
        if (
          unsafeAttributes.has(nameOf(node.key)) &&
          node.parent?.parent?.type === 'CallExpression' &&
          nameOf(node.parent.parent.callee) === 'h'
        )
          report(node);
      },
      CallExpression(node) {
        const name = memberName(node.callee);
        if (['insertAdjacentHTML', 'parseFromString', 'createContextualFragment'].includes(name))
          report(node);
        if (
          ['write', 'writeln'].includes(name) &&
          (nameOf(node.callee.object) === 'document' ||
            memberName(node.callee.object) === 'document')
        )
          report(node);
        if (name === 'setAttribute' || name === 'setAttributeNS') {
          const attribute = nameOf(node.arguments[name === 'setAttribute' ? 0 : 1]);
          if (
            typeof attribute === 'string' &&
            (/^on/i.test(attribute) || attribute.toLowerCase() === 'srcdoc')
          )
            report(node);
        }
      },
    };
  },
};

export const componentConventions = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      inheritance:
        'Compose shared controllers or utilities; Stencil components must not inherit component behavior.',
      isolation: 'Choose scoped: true, or shadow: true when implementation isolation requires it.',
      title:
        'Do not declare a Stencil title prop; use a semantic name that does not collide with the native attribute.',
    },
  },
  create(context) {
    const imports = new Map();
    const decorator = (node, imported) =>
      node.decorators?.find(
        entry =>
          entry.expression.type === 'CallExpression' &&
          imports.get(nameOf(entry.expression.callee)) === imported
      );
    return {
      ImportDeclaration(node) {
        if (node.source.value !== '@stencil/core') return;
        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportSpecifier')
            imports.set(specifier.local.name, nameOf(specifier.imported));
        }
      },
      ClassDeclaration(node) {
        const component = decorator(node, 'Component');
        if (!component) return;
        if (node.superClass) context.report({ node: node.superClass, messageId: 'inheritance' });
        const options = component.expression.arguments[0];
        const isolated =
          options?.type === 'ObjectExpression' &&
          options.properties.some(
            property =>
              property.type === 'Property' &&
              ['scoped', 'shadow'].includes(nameOf(property.key)) &&
              property.value.value === true
          );
        if (!isolated) context.report({ node: component, messageId: 'isolation' });
        for (const member of node.body.body) {
          if (nameOf(member.key) === 'title' && decorator(member, 'Prop'))
            context.report({ node: member, messageId: 'title' });
        }
      },
    };
  },
};

export default {
  rules: { 'no-markup-sinks': noMarkupSinks, 'component-conventions': componentConventions },
};
