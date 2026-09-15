import type { ESLint, Linter } from 'eslint';
import type { LintOptions } from './types.js';
export type { LintOptions } from './types.js';
/** CompoMo CSS and JSX rules. Does not activate linting until configured. */
export declare const plugin: ESLint.Plugin;
/** Compose CompoMo policy with an application's existing ESLint configuration. */
export declare function createConfig(options?: LintOptions): Linter.Config[];
