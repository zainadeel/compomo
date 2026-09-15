import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import css from '@eslint/css';
import { plugin, createConfig } from '../lint/index.js';
import contracts from '../lint/contracts.js';
import { canonicalProperty } from '../lint/contracts-policy.js';
const linter = new Linter();
function lintCss(code: string, strict = false) {
  return linter.verify(code, createConfig({ strict, jsxFiles: [] }), { filename: 'app.css' });
}
function cssContract(code: string) {
  return linter.verify(
    code,
    [
      {
        files: ['**/*.css'],
        language: 'css/css',
        plugins: { css, compomo: plugin },
        rules: { 'compomo/no-component-restyle': 'warn' },
      },
    ] as any,
    { filename: 'app.css' }
  );
}
function lintJsx(code: string, strict = false) {
  return linter.verify(
    code,
    [
      {
        files: ['**/*.tsx'],
        languageOptions: {
          parser: tseslint.parser,
          parserOptions: { ecmaFeatures: { jsx: true } },
        },
      },
      ...createConfig({ strict, cssFiles: [] }),
    ],
    { filename: 'app.tsx' }
  );
}
const contractMessages = (messages: any[]) => messages.filter(m => m.ruleId?.includes('restyle'));
describe('consumer contracts cover the public source inventory', () => {
  for (const contract of Object.values(contracts) as any[]) {
    it(contract.tag, () => {
      assert.ok(contract.styling.rationale.trim());
      assert.deepEqual(cssContract(`${contract.tag} { margin: 0; }`), []);
      for (const group of contract.styling.protected) {
        for (const property of group.properties) {
          const messages = cssContract(`${contract.tag} { ${property}: inherit; }`);
          assert.equal(messages.length, 1, property);
          assert.match(messages[0].message, new RegExp(contract.tag));
          const jsxProperty = property.replace(/-([a-z])/g, (_: string, c: string) =>
            c.toUpperCase()
          );
          const jsxMessages = contractMessages(
            lintJsx(
              `import {${contract.reactName} as Example} from '@ds-mo/ui/react'; const view=<Example style={{${jsxProperty}: 'inherit'}}/>;`
            )
          );
          assert.equal(jsxMessages.length, 1, property);
        }
      }
      for (const hook of contract.styling.customProperties)
        assert.deepEqual(cssContract(`${contract.tag} { ${hook.name}: initial; }`), []);
      assert.deepEqual(
        contractMessages(
          lintJsx(
            `import {${contract.reactName}} from '@ds-mo/ui/react'; const view=<${contract.reactName} style={{margin: 0}}/>;`
          )
        ),
        []
      );
    });
  }
});
describe('direct targeting and safe boundaries', () => {
  it('targets selectors, states, selector lists and nested ampersands', () => {
    for (const selector of [
      'ds-text.title',
      'ds-text:hover',
      ':is(ds-text, .title)',
      ':where(ds-text)',
      '.page > ds-text',
    ])
      assert.equal(cssContract(`${selector}{font-size:inherit}`).length, 1, selector);
    assert.equal(cssContract('ds-text { &:hover {font-size:inherit} }').length, 1);
    assert.equal(cssContract('ds-text { @media (width > 20px) {font-size:inherit} }').length, 1);
  });
  it('does not mistake ancestors, negation, relational matches or pseudo-elements for targets', () => {
    for (const selector of [
      'ds-text .child',
      'ds-text > span',
      ':not(ds-text)',
      ':has(ds-text)',
      'ds-text::before',
    ])
      assert.deepEqual(cssContract(`${selector}{font-size:inherit}`), [], selector);
    assert.deepEqual(
      cssContract('ds-text { & .child {font-size:inherit} .child {font-size:inherit} }'),
      []
    );
  });
  it('expands shorthands and logical properties', () => {
    for (const property of [
      'padding-inline-start',
      'padding-block',
      'block-size',
      'border-top-left-radius',
      'border-start-start-radius',
      'border-inline-start-color',
      'all',
    ])
      assert.equal(cssContract(`ds-button-filled {${property}:inherit}`).length, 1, property);
    assert.equal(canonicalProperty('minBlockSize'), 'min-height');
  });
  it('allows application classes and documented customizable recipes', () => {
    assert.deepEqual(
      cssContract(
        '.button {padding:inherit} ds-table {color:inherit} ds-markdown {font-size:inherit}'
      ),
      []
    );
  });
  it('recognizes literal tags, aliases and namespace imports', () => {
    for (const code of [
      'const x=<ds-text style={{fontSize: 10}}/>;',
      "import {DsText as Heading} from '@ds-mo/ui/react';const x=<Heading style={{fontSize:10}}/>;",
      "import * as UI from '@ds-mo/ui/react';const x=<UI.DsText style={{fontSize:10}}/>;",
    ])
      assert.equal(contractMessages(lintJsx(code)).length, 1);
  });
  it('does not infer wrappers, unrelated imports or shadowed names', () => {
    for (const code of [
      "import {DsText} from 'other-ui';const x=<DsText style={{fontSize:10}}/>;",
      "import {DsText} from '@ds-mo/ui/react';function X(DsText){return <DsText style={{fontSize:10}}/>}",
      "import {DsText} from './wrapper';const x=<DsText style={{fontSize:10}}/>;",
    ])
      assert.deepEqual(contractMessages(lintJsx(code)), []);
  });
  it('checks known property keys without evaluating dynamic values or spreads', () => {
    assert.equal(
      contractMessages(lintJsx('const x=<ds-text style={{...unknown, fontSize: dynamic}}/>;'))
        .length,
      1
    );
    assert.deepEqual(
      contractMessages(lintJsx('const x=<ds-text style={{[key]:value,...unknown}}/>;')),
      []
    );
    assert.deepEqual(contractMessages(lintJsx('const x=<ds-text style={unknown}/>;')), []);
  });
  it('warns by default, promotes the same findings in strict mode, and reports typography once', () => {
    const code = 'ds-text {font-size:inherit}';
    const ordinary = lintCss(code);
    const strict = lintCss(code, true);
    assert.equal(ordinary.length, 1);
    assert.equal(ordinary[0].severity, 1);
    assert.equal(strict[0].severity, 2);
    assert.equal(ordinary[0].message, strict[0].message);
  });
  it('supports suppression and never rewrites component contracts', () => {
    const code =
      '/* eslint-disable-next-line compomo/no-component-restyle -- reviewed */\nds-text {font-size:inherit}';
    assert.deepEqual(lintCss(code), []);
    const original = 'ds-text {font-size:inherit}';
    assert.equal(
      linter.verifyAndFix(original, createConfig({ jsxFiles: [] }), { filename: 'app.css' }).output,
      original
    );
  });
  it('does not apply library-owned filename exceptions to consumers', () => {
    const config = [
      {
        files: ['**/*.tsx'],
        languageOptions: {
          parser: tseslint.parser,
          parserOptions: { ecmaFeatures: { jsx: true } },
        },
      },
      ...createConfig({ cssFiles: [] }),
    ];
    assert.ok(
      linter
        .verify('const x=<svg/>;', config, { filename: 'components/Icon/Icon.tsx' })
        .some(m => m.ruleId === 'compomo/prefer-ds-icon')
    );
  });
});

it('ignores object prototype names instead of treating them as components', () => {
  assert.deepEqual(cssContract('constructor {font-size:inherit} toString {color:inherit}'), []);
  assert.deepEqual(contractMessages(lintJsx('const x=<constructor style={{fontSize:12}}/>')), []);
});
it('supports configuring exported CSS rules without repeating preset options', () => {
  const config = [
    {
      language: 'css/css',
      plugins: { css, compomo: plugin },
      rules: { 'compomo/color-no-hex': 'warn' },
    },
  ];
  assert.equal(linter.verify('a {color:#fff}', config as any).length, 1);
});
