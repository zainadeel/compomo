import postcss from 'postcss';
import getLexer from './utils/getLexer.mjs';

// The ported algorithms use PostCSS's lossless node utilities for source ranges
// and edits. ESLint's CSS language owns parsing/visitation and all diagnostics.
// This cache is scoped to a SourceCode object, never a filename or process run.
const trees = new WeakMap();
export function createRuleState(context) {
  let tree = trees.get(context.sourceCode);
  if (!tree) {
    tree = postcss.parse(context.sourceCode.text, { from: context.filename });
    trees.set(context.sourceCode, tree);
  }
  const root = tree.clone();
  const result = {
    context,
    root,
    policy: { config: { validate: true }, lexer: getLexer({}), referenceRoots: [] },
    warn(message) {
      throw new Error(message);
    },
  };
  return { root, result };
}

export function replacement(before, after) {
  if (before === after) return undefined;
  let start = 0,
    end = before.length,
    afterEnd = after.length;
  while (start < end && start < afterEnd && before[start] === after[start]) start++;
  while (end > start && afterEnd > start && before[end - 1] === after[afterEnd - 1]) {
    end--;
    afterEnd--;
  }
  return { range: [start, end], text: after.slice(start, afterEnd) };
}

class FinishedFix extends Error {}
export function executeRule(context, visit) {
  const { root, result } = createRuleState(context);
  result.visit = visit;
  result.index = 0;
  visit(root, result);
}

export function replayFix(result, index) {
  const state = createRuleState(result.context);
  state.result.index = 0;
  state.result.fixTarget = index;
  try {
    result.visit(state.root, state.result);
  } catch (error) {
    if (!(error instanceof FinishedFix)) throw error;
  }
  return state.result.edit;
}

export function finishFix(result, apply) {
  const before = result.root.toString();
  apply();
  result.edit = replacement(before, result.root.toString());
  throw new FinishedFix();
}
