/** Options for the opt-in CompoMo ESLint flat configuration. */
export interface LintOptions {
  /** Consumer policy is the default; authoring preserves library exceptions. */
  mode?: 'authoring' | 'consumer';
  /** Promote consumer findings to errors without enabling additional rules. */
  strict?: boolean;
  /** Defaults to all CSS files. An empty array disables CSS checks. */
  cssFiles?: string[];
  /** Defaults to JS/JSX/TS/TSX. An empty array enables CSS-only adoption. */
  jsxFiles?: string[];
  /** Ignore patterns local to these presets, not the application's other rules. */
  ignores?: string[];
}
