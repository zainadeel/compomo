import selectorParser from 'postcss-selector-parser';
import {
  longhandSubPropertiesOfShorthandProperties as longhands,
  shorthandToResetToInitialProperty as resets,
} from './css/reference/properties.mjs';

export function canonicalProperty(property) {
  if (property.startsWith('--')) return property;
  return property
    .replace(/^ms(?=[A-Z])/, '-ms')
    .replace(/[A-Z]/g, m => '-' + m.toLowerCase())
    .replace(/^-(webkit|moz|ms|o)-/, '')
    .toLowerCase()
    .replace(
      /border-(start|end)-(start|end)-radius$/,
      (_, block, inline) =>
        `border-${block === 'start' ? 'top' : 'bottom'}-${inline === 'start' ? 'left' : 'right'}-radius`
    )
    .replace(/inline-size$/, 'width')
    .replace(/block-size$/, 'height')
    .replace(/-(inline|block)(-start|-end)?(?=-|$)/g, (_, axis, edge) =>
      edge
        ? axis === 'inline'
          ? edge === '-start'
            ? '-left'
            : '-right'
          : edge === '-start'
            ? '-top'
            : '-bottom'
        : axis === 'inline'
          ? '-left'
          : '-top'
    );
}
function affects(property) {
  const name = canonicalProperty(property);
  const set = new Set([name]);
  for (const child of [...(longhands.get(name) ?? []), ...(resets.get(name) ?? [])])
    set.add(canonicalProperty(child));
  if (name === 'border-radius')
    for (const corner of ['top-left', 'top-right', 'bottom-left', 'bottom-right'])
      set.add('border-' + corner + '-radius');
  return set;
}
export function protectedGroup(contract, property) {
  if (contract.styling.customProperties.some(hook => hook.name === property)) return undefined;
  const actual = affects(property);
  return contract.styling.protected.find(group =>
    group.properties.some(p => {
      if (property === 'all' && !p.startsWith('--')) return true;
      const protectedNames = affects(p);
      return [...actual].some(n => protectedNames.has(n));
    })
  );
}
export function contractMessage(contract, property, group) {
  const choices = group.props.map(name => {
    const values = contract.props[name]?.values;
    return values?.length ? `${name} (${values.join(', ')})` : name;
  });
  return `<${contract.tag}> owns ${property}. ${group.reason}${choices.length ? ' Use ' + choices.join(' or ') + '.' : ''}`;
}
function selectorTargets(selector, inherited, contracts) {
  const compound = [];
  for (const node of selector.nodes) {
    if (node.type === 'combinator') compound.length = 0;
    else compound.push(node);
  }
  if (
    compound.some(
      n =>
        n.type === 'pseudo' &&
        (/^::/.test(n.value) ||
          [':before', ':after', ':first-line', ':first-letter'].includes(n.value))
    )
  )
    return new Set();
  const targets = new Set();
  for (const node of compound) {
    if (node.type === 'tag' && Object.hasOwn(contracts, node.value)) targets.add(node.value);
    if (node.type === 'nesting') for (const tag of inherited) targets.add(tag);
    if (node.type === 'pseudo' && [':is', ':where'].includes(node.value))
      for (const child of node.nodes ?? [])
        for (const tag of selectorTargets(child, inherited, contracts)) targets.add(tag);
  }
  return targets;
}
export function targetsForRule(rule, contracts) {
  let parent = rule.parent;
  while (parent && parent.type !== 'rule') parent = parent.parent;
  const inherited = parent ? targetsForRule(parent, contracts) : new Set();
  try {
    const ast = selectorParser().astSync(rule.selector);
    return new Set(
      ast.nodes.flatMap(selector => [...selectorTargets(selector, inherited, contracts)])
    );
  } catch {
    return new Set();
  } // CSS syntax diagnostics are owned by the CSS checks.
}
