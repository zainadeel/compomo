import css from '@eslint/css';

// The native ESLint rule matches the configured detection, ranges and fix
// behavior captured by the migration fixtures. Preserve the public option slot.
const native = css.rules['no-duplicate-keyframe-selectors'];
export default {
  ...native,
  meta: { ...native.meta, schema: [{ const: true }, {}] },
};
