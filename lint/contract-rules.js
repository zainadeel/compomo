import { executeRule } from './css/runtime.js';
import report from './css/utils/report.mjs';
import { protectedGroup, contractMessage, targetsForRule } from './contracts-policy.js';

export function cssContractRule(contracts) {
  return {
    meta: { type: 'problem', schema: [] },
    create(context) {
      return {
        'StyleSheet:exit'() {
          executeRule(context, (root, result) =>
            root.walkDecls(decl => {
              let owner = decl.parent;
              while (owner && owner.type !== 'rule') owner = owner.parent;
              if (!owner) return;
              for (const tag of targetsForRule(owner, contracts)) {
                const contract = contracts[tag];
                const group = protectedGroup(contract, decl.prop);
                if (group)
                  report({
                    node: decl,
                    result,
                    message: contractMessage(contract, decl.prop, group),
                    word: decl.prop,
                  });
              }
            })
          );
        },
      };
    },
  };
}

export function jsxContractRule(contracts) {
  const exported = new Map(Object.values(contracts).map(c => [c.reactName, c]));
  return {
    meta: { type: 'problem', schema: [] },
    create(context) {
      // Resolve actual lexical import bindings; a shadowing local with the same
      // name is not the imported component.
      function imported(name, node) {
        let scope = context.sourceCode.getScope(node);
        while (scope) {
          const variable = scope.set.get(name);
          if (variable) {
            const def = variable.defs.find(d => d.type === 'ImportBinding');
            if (!def || def.parent.source.value !== '@ds-mo/ui/react') return undefined;
            return def.node;
          }
          scope = scope.upper;
        }
      }
      function component(name, node) {
        if (name.type === 'JSXIdentifier') {
          if (Object.hasOwn(contracts, name.name)) return contracts[name.name];
          const binding = imported(name.name, node);
          return binding?.type === 'ImportSpecifier'
            ? exported.get(binding.imported.name ?? binding.imported.value)
            : undefined;
        }
        if (name.type === 'JSXMemberExpression' && name.object.type === 'JSXIdentifier') {
          const binding = imported(name.object.name, node);
          if (binding?.type === 'ImportNamespaceSpecifier') return exported.get(name.property.name);
        }
      }
      return {
        JSXOpeningElement(node) {
          const contract = component(node.name, node);
          if (!contract) return;
          for (const attr of node.attributes) {
            if (
              attr.type !== 'JSXAttribute' ||
              attr.name.name !== 'style' ||
              attr.value?.type !== 'JSXExpressionContainer'
            )
              continue;
            const expression = attr.value.expression;
            if (expression.type !== 'ObjectExpression') continue;
            for (const property of expression.properties) {
              if (property.type !== 'Property' || property.computed) continue;
              const name =
                property.key.type === 'Identifier' ? property.key.name : property.key.value;
              if (typeof name !== 'string') continue;
              const group = protectedGroup(contract, name);
              if (group)
                context.report({
                  node: property.key,
                  message: contractMessage(contract, name, group),
                });
            }
          }
        },
      };
    },
  };
}
