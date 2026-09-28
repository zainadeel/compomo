import assert from 'node:assert/strict';
import postcss, { type Declaration, type Root, type Rule } from 'postcss';
import selectorParser from 'postcss-selector-parser';
import valueParser from 'postcss-value-parser';

// These helpers inspect authored recipes, not computed layout. Browser tests own the cascade.
export function parseCss(source: string): Root {
  return postcss.parse(source);
}

/** Public recipe classes stay at zero specificity so consumer styles can override them. */
export function assertClassesInWhere(css: Root, prefix: string): Set<string> {
  const classes = new Set<string>();
  css.walkRules(rule => {
    selectorParser(selectors => {
      selectors.walkClasses(node => {
        if (!node.value.startsWith(prefix)) return;
        classes.add(node.value);
        let withinWhere = false;
        for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
          if (ancestor.type === 'pseudo' && ancestor.value === ':where') withinWhere = true;
        }
        assert.ok(withinWhere, `${rule.selector} must keep .${node.value} inside :where()`);
      });
    }).processSync(rule.selector);
  });
  assert.ok(classes.size > 0, `Expected public recipe classes starting with ${prefix}`);
  return classes;
}

function selectorKey(selector: string): string {
  return selectorParser(selectors => {
    selectors.walkComments(comment => {
      comment.remove();
    });
    selectors.walkAttributes(attribute => {
      if (attribute.value !== undefined) attribute.setValue(attribute.value, { quoteMark: '"' });
    });
  }).processSync(selector, { lossless: false });
}

function valueKey(value: string): unknown {
  function tokens(nodes: valueParser.Node[]): unknown[] {
    return nodes.flatMap(node => {
      if (node.type === 'space' || node.type === 'comment') return [];
      return [
        {
          type: node.type,
          value: node.value,
          ...(node.type === 'function' ? { nodes: tokens(node.nodes) } : {}),
        },
      ];
    });
  }
  return tokens(valueParser(value).nodes);
}

/** Match a selector in an exact at-rule scope; never borrow declarations from another rule. */
export function cssRules(css: Root, selector: string, scope: string[] = []): Rule[] {
  const key = selectorKey(selector);
  const matches: Rule[] = [];
  css.walkRules(rule => {
    if (!rule.selectors.some(candidate => selectorKey(candidate) === key)) return;
    const ancestors: string[] = [];
    for (let parent = rule.parent; parent && parent.type !== 'root'; parent = parent.parent) {
      if (parent.type === 'atrule') ancestors.unshift(`@${parent.name} ${parent.params}`);
      else return;
    }
    if (JSON.stringify(ancestors.map(valueKey)) === JSON.stringify(scope.map(valueKey)))
      matches.push(rule);
  });
  return matches;
}

/** Follow declaration order for repeated exact selectors; this does not compute the cascade. */
export function cssDeclarations(css: Root, selector: string, scope: string[] = []) {
  const declarations = new Map<string, Declaration>();
  for (const rule of cssRules(css, selector, scope)) {
    for (const node of rule.nodes) {
      if (node.type !== 'decl') continue;
      if (!declarations.get(node.prop)?.important || node.important)
        declarations.set(node.prop, node);
    }
  }
  return declarations;
}

export function assertDeclarations(
  css: Root,
  selector: string,
  expected: Record<string, string>,
  scope: string[] = []
): void {
  const declarations = cssDeclarations(css, selector, scope);
  for (const [property, value] of Object.entries(expected)) {
    const actual = declarations.get(property);
    assert.ok(actual, `${selector} must declare ${property}`);
    assert.equal(actual.important, undefined, `${selector}: ${property} must remain overrideable`);
    assert.deepEqual(valueKey(actual.value), valueKey(value), `${selector}: ${property}`);
  }
}

export function cssImports(css: Root): Set<string> {
  const imports = new Set<string>();
  css.walkAtRules('import', rule => {
    const first = valueParser(rule.params).nodes.find(
      node => node.type !== 'space' && node.type !== 'comment'
    );
    const path = first?.type === 'function' && first.value === 'url' ? first.nodes[0] : first;
    if (path?.type === 'string' || path?.type === 'word') imports.add(path.value);
  });
  return imports;
}
