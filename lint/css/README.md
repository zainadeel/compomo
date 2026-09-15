# Native ESLint CSS policy

The rule algorithms and their referenced helpers were adapted from Stylelint
17.14.1 (MIT; see LICENSE) to retain CompoMo's configured checks and safe fixes.
The configured options live in settings.js. No Stylelint engine is imported,
bundled or called. This is not a processor that shells out to another linter.

The duplicate-keyframe-selector check reuses @eslint/css directly; its
configured diagnostics and ranges match the captured fixtures. Other candidate
replacements differed in detection or fixes and retain the ported algorithms.

Each rule exports an ESLint rule with a CSS language visitor. ESLint owns file
selection, configuration, reporting, suppression and fixes. @eslint/css owns the
CSS language. PostCSS supplies a lossless node view for the ported algorithms;
the tree is parsed once per ESLint SourceCode and cloned for each rule. CSS
syntax helpers and reference data remain local to this development entry.

Fix callbacks are replayed on an independent tree. This prevents one proposed
fix from mutating another diagnostic or modifying suppressed declarations.
The math-operator whitespace rule uses independent source edits because its
original tokenizer fixes assumed sequential mutations.

The published bundle includes this license and the complete licenses of bundled
syntax utilities. Lint dependencies never enter browser component bundles.
