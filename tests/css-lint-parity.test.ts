import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Linter } from 'eslint';
import css from '@eslint/css';
import rules from '../lint/css/plugin.js';
import settings from '../lint/css/settings.js';
const fixtures = JSON.parse(
  fs.readFileSync(new URL('./fixtures/lint/css-parity.json', import.meta.url), 'utf8')
);
const linter = new Linter();
function config(name: string) {
  const entry = settings[name];
  return [
    {
      files: ['**/*.css'],
      language: 'css/css',
      languageOptions: { tolerant: true },
      plugins: { css, compomo: { rules } },
      rules: {
        ['compomo/' + name.replace('local/', '')]: [
          entry[1]?.severity === 'error' ? 2 : 1,
          ...entry,
        ],
      },
    },
  ];
}
function normalize(messages: any[], name: string) {
  return messages.map(m => ({
    rule: name,
    severity: m.severity === 2 ? 'error' : 'warning',
    line: m.line,
    column: m.column,
    endLine: m.endLine,
    endColumn: m.endColumn,
  }));
}
describe('configured CSS parity', () => {
  for (const name of Object.keys(settings)) {
    const cases = fixtures.filter((f: any) => f.rule === name);
    it(name, () => {
      assert.ok(
        cases.some((f: any) => f.warnings.length > 0),
        'missing invalid case'
      );
      assert.ok(
        cases.some((f: any) => f.warnings.length === 0),
        'missing valid case'
      );
      for (const f of cases) {
        const options = { filename: 'src/wc/components/Example/Example.css' };
        const messages = linter.verify(f.code, config(name) as any, options);
        assert.deepEqual(
          normalize(messages, name),
          f.warnings,
          JSON.stringify({ code: f.code, messages })
        );
        const fixed = linter.verifyAndFix(f.code, config(name) as any, options);
        assert.equal(
          fixed.output,
          f.fixed,
          JSON.stringify({ code: f.code, messages: fixed.messages })
        );
        assert.equal(
          linter.verifyAndFix(fixed.output, config(name) as any, options).output,
          fixed.output,
          'fix is not idempotent'
        );
      }
    });
  }
});

it('keeps suppressed fixes isolated from adjacent active fixes', () => {
  const name = 'selector-no-vendor-prefix';
  const code =
    '/* eslint-disable-next-line compomo/selector-no-vendor-prefix -- browser fallback */\n:-ms-fullscreen,\n:-ms-fullscreen {}';
  const fixed = linter.verifyAndFix(code, config(name) as any, { filename: 'app.css' });
  assert.equal(
    fixed.output,
    '/* eslint-disable-next-line compomo/selector-no-vendor-prefix -- browser fallback */\n:-ms-fullscreen,\n:fullscreen {}'
  );
});
it('preserves CSS block, next-line and line suppressions', () => {
  const name = 'color-no-hex';
  const code =
    '/* eslint-disable compomo/color-no-hex -- mask */\na{color:#fff}\n/* eslint-enable compomo/color-no-hex */\na{color:#fff} /* eslint-disable-line compomo/color-no-hex */\n/* eslint-disable-next-line compomo/color-no-hex -- mask */\na{color:#fff}\na{color:#fff}';
  const messages = linter.verify(code, config(name) as any, { filename: 'app.css' });
  assert.equal(messages.length, 1);
  assert.equal(messages[0].line, 7);
});
