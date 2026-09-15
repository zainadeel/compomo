# CSS migration reference

The JSON fixtures record Stylelint 17.14.1 behavior under CompoMo's resolved
configuration before migration. Cases were selected from the corresponding
upstream rule tests (MIT, copyright Maxime Thirouin, David Clark & Richard
Hallows; complete license in lint/css/LICENSE), plus CompoMo policy cases.

css-parity.json records source, normalized diagnostics and fixed output. The
reference is independent of the new ESLint implementations. Every configured
rule has valid and invalid examples; fixable cases are checked for output
parity and idempotence. Fixtures use the ordinary Example component filename.

repository-baseline.json captures the previously linted CSS files. Suppression
comments were subsequently translated to ESLint without changing CSS behavior.
The repository comparison supplements the mutation fixtures; clean files alone
cannot demonstrate rule parity. Do not regenerate expected outcomes from the
implementation being tested.
