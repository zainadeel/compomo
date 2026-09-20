# Design-system linting

CompoMo uses ESLint for CSS, TypeScript and JSX. Prettier remains the formatter.
Run `npm run lint` for the repository or `npm run lint:css` for its component,
shared-style and utility CSS. CSS syntax is supplied by `@eslint/css`.

## Ownership

- `lint/` owns the shared ESLint plugin and configuration factory.
- Co-located component agent metadata owns styling intent.
- Stencil compiler metadata owns prop names and supported values.
- The package build combines these into the optional `@ds-mo/ui/lint` entry.
- Applications opt in; installing the component package never activates linting.

The authoring preset preserves the original CSS severities, including an error
for raw intermediate opacity, and the existing JSX implementation exceptions.
The consumer preset warns by default; `strict: true` promotes the same enabled
findings to errors. Invalid source syntax can still be a parser error.

Do not use authoring mode in consuming apps. It exists for the library's
primitive implementations and their narrow source-path exceptions.

## Repository authoring checks

`scripts/authoring-rules.mjs` adds local error-level checks for component source:
explicit style isolation, composition instead of component inheritance, no
Stencil `title` prop, and no direct browser markup sinks. Render text or Stencil
nodes; the SVG boundary constructs validated DOM nodes. These rules apply to
library implementation files, not stories or the published consumer preset.

The sink rule checks direct property writes, JSX attributes, literal Stencil
`h` properties and common DOM parsing/insertion calls. It does not trace aliases,
spreads, dynamic property names or transitive dependencies. Keep the rendered
security tests when changing a parser or bundler: source lint cannot prove a
dependency's browser export is safe under Trusted Types enforcement.

`npm run verify:authoring` checks the four authored artifacts and agent schema
before typechecking. The scaffold and these checks share the existing source
inventory and metadata schema; neither maintains a second component catalog.

## Optional application setup

Install the lint tools as development dependencies in the consuming app:

```bash
npm install -D eslint @eslint/css
```

Add the preset to the application's ESLint flat configuration:

```js
// eslint.config.mjs
import { createConfig } from '@ds-mo/ui/lint';

export default [
  // The application's existing JS/TS parser and rules go here.
  ...createConfig({
    cssFiles: ['src/**/*.css'],
    jsxFiles: ['src/**/*.{jsx,tsx}'],
  }),
];
```

The preset does not install or replace a TypeScript parser. Keep the application's
existing parser configuration for TSX. Run ESLint over the selected files, for
example `eslint src/`. Ensure existing JS-only config blocks have JS/TS file
globs so their parsers and rules do not apply to CSS.

For an Angular application that wants standalone CSS checks only:

```js
...createConfig({ cssFiles: ['src/**/*.css'], jsxFiles: [] })
```

Angular templates, Vue templates, standalone HTML, embedded stylesheets and
cross-file class tracing are not checked in this version. Framework-neutral
standalone CSS remains supported in those applications. This setup does not
modify any framework builder configuration; make sure the app's lint command
actually includes its CSS files.

`ignores` applies to the CompoMo presets only. Pass `strict: true` when an app is
ready for findings to fail lint. Ordinary ESLint rule overrides can change
individual severities or disable a rule. Import `plugin` to configure rules
individually; the migrated CSS rules accept their preserved primary and
secondary options, which the factory supplies automatically.

## Consumer styling contracts

Each public component's `styling` metadata declares protected property groups,
their ownership reason, relevant public props and deliberately customizable
custom properties. An empty restriction list has an explicit rationale.
Unspecified properties stay available to applications. Public Table and prose
recipes retain their documented customization.

A consumer may position Text through margins, while changing `font-size` directly
reports its atomic typography contract and points to `variant` and `emphasis`.
Controls point to their size, inset and semantic presentation props. Contract
findings provide guidance and do not automatically rewrite component usage.

CSS checks recognize direct `ds-*` selectors, qualified selectors, relevant
`:is()`/`:where()` branches and nested ampersands. A component that is only an
ancestor, a negated/relational match or a pseudo-element does not establish an
ownership target. Arbitrary class-only selectors are not connected to components.

JSX checks recognize custom-element tags and actual imports from
`@ds-mo/ui/react`, including aliases and namespace imports. They inspect known
keys in literal inline style objects, even if a value is dynamic. They do not
execute code, follow application wrappers, resolve spreads or infer computed
keys. A clean result means no detected violations in this supported syntax;
it does not prove all runtime styling follows the contract.

## Exceptions and editor feedback

Keep an exception beside the code and explain why it is needed:

```css
/* eslint-disable-next-line compomo/color-no-hex -- mask luminance, not a theme color */
.mask {
  background: #fff;
}
```

Use ESLint disable/enable comments for both CSS and JSX. Authoring CSS retains
its previous behavior of not reporting unused suppression comments. Applications
can override `linterOptions.reportUnusedDisableDirectives` after the preset.

For the VS Code ESLint extension, include CSS in the configured validation
languages alongside the application's existing languages. For other editors,
include `*.css` in the ESLint scope. No Stylelint extension is required.

## Maintaining the rules

The CSS migration preserves the configured Stylelint checks as native ESLint
rules. The adapted algorithms and relevant helper data retain upstream license
attribution in `lint/css/LICENSE`; `lint/css/README.md` describes the port boundary.
They do not invoke Stylelint. ESLint owns rule execution, suppression, severity,
reporting and application of fixes. Lossless PostCSS node utilities support the
ported algorithms' precise ranges and edits.

The parity fixture captures valid/invalid cases and expected fix output from the
previous configuration. Keep it as regression evidence; update expected policy
only through a reviewed intentional rule change. Test fixes for idempotence and
for suppression isolation. Do not weaken checks merely to remove a warning.

For component contracts, update the source metadata and validate public prop
references and actual hook consumption. The build generates its packaged
snapshot; never hand-edit generated registry or package files. New public
components require a contract, including an explicit rationale if unrestricted.

Run focused lint tests, the repository lint command, build, agent validation and
package verification. Follow the full local pre-PR gate in the testing strategy.
The packed-package smoke tests prove both ordinary consumption without lint
peers and explicit opt-in with CSS and JSX.
