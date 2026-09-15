import { replayFix, finishFix } from '../runtime.js';

// Native ESLint reporting: no Stylelint runner, result processing, suppression
// handling or fix engine is retained. ESLint applies and suppresses these edits.
export default function report(problem) {
  const { node, result, message, messageArgs = [], fix } = problem;
  const { context } = result;
  const index = result.index++;
  const apply = typeof fix === 'function' ? fix : fix?.apply;
  if (result.fixTarget !== undefined) {
    if (index === result.fixTarget && apply) finishFix(result, apply);
    return;
  }
  const range =
    problem.start && problem.end
      ? { start: problem.start, end: problem.end }
      : node.rangeBy(
          problem.index !== undefined
            ? { index: problem.index, endIndex: problem.endIndex }
            : problem.word
              ? { word: problem.word }
              : {}
        );
  let rendered = typeof message === 'function' ? message(...messageArgs) : message;
  if (typeof message === 'string')
    for (const arg of messageArgs) rendered = rendered.replace(/%[ds]/, String(arg));
  const loc = {
    start: { line: range.start.line, column: range.start.column },
    end: { line: range.end.line, column: range.end.column },
  };
  const disabled = context.options[1]?.disableFix;
  context.report({
    loc,
    message: rendered,
    ...(apply && !disabled
      ? {
          fix(fixer) {
            // The math tokenizer's original mutating fix requires preceding fixes.
            // ESLint fixes are independent: insert at the reported operator instead.
            if (problem.ruleName === 'function-calc-no-unspaced-operator') {
              const offset =
                node.source.start.offset + problem.index + (rendered.includes('after') ? 1 : 0);
              let start = offset,
                end = offset;
              if (rendered.includes('after')) {
                while (
                  /\s/.test(context.sourceCode.text[end] ?? '') &&
                  end < context.sourceCode.text.length
                )
                  end++;
              } else {
                while (start > 0 && /\s/.test(context.sourceCode.text[start - 1])) start--;
              }
              const whitespace = context.sourceCode.text.slice(start, end);
              const newline = whitespace.search(/\n|\r\n/);
              return fixer.replaceTextRange(
                [start, end],
                newline < 0 ? ' ' : whitespace.slice(newline)
              );
            }
            const edit = replayFix(result, index);
            return edit ? fixer.replaceTextRange(edit.range, edit.text) : null;
          },
        }
      : {}),
  });
}
