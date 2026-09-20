import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import { componentConventions, noMarkupSinks } from '../scripts/authoring-rules.mjs';

const tester = new RuleTester({
  languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
});
tester.run('no-markup-sinks', noMarkupSinks, {
  valid: [
    'node.textContent = text;',
    'node.replaceChildren(document.createTextNode(text));',
    'xml.write(svg).close();',
    'const result = element.innerHTML;',
    'const view = <div>{content}</div>;',
    'node.setAttribute("aria-label", text);',
  ],
  invalid: [
    'node.innerHTML = content;',
    'node["outerHTML"] = content;',
    'node.insertAdjacentHTML("beforeend", content);',
    'new DOMParser().parseFromString(content, "image/svg+xml");',
    'document.write(content);',
    'window.document.writeln(content);',
    'range.createContextualFragment(content);',
    'const view = <div innerHTML={content}/>;',
    'const view = <iframe srcDoc={content}/>;',
    'const view = <div dangerouslySetInnerHTML={{__html: content}}/>;',
    'h("div", {innerHTML: content});',
    'node.setAttribute("ONLOAD", content);',
    'node.setAttributeNS(null, "srcdoc", content);',
  ].map(code => ({ code, errors: [{ messageId: 'unsafe' }] })),
});
tester.run('component-conventions', componentConventions, {
  valid: [
    'import {Component} from "@stencil/core"; @Component({tag:"ds-demo", scoped:true}) class Demo {}',
    'import {Component} from "@stencil/core"; @Component({tag:"ds-demo", shadow:true}) class Demo {}',
    'class Controller extends Base {}',
    'import {Component} from "@stencil/core"; @Component({scoped:true}) class Demo { private title = ""; }',
  ],
  invalid: [
    {
      code: 'import {Component} from "@stencil/core"; @Component({scoped:true}) class Demo extends Base {}',
      errors: [{ messageId: 'inheritance' }],
    },
    {
      code: 'import {Component} from "@stencil/core"; @Component({tag:"ds-demo"}) class Demo {}',
      errors: [{ messageId: 'isolation' }],
    },
    {
      code: 'import {Component as C, Prop as P} from "@stencil/core"; @C({scoped:true}) class Demo { @P() title = ""; }',
      errors: [{ messageId: 'title' }],
    },
  ],
});
