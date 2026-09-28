import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import mdxLoader from '@storybook/addon-docs/mdx-loader';

const require = createRequire(import.meta.url);

test('compiled Modal docs isolate every rendered example in an iframe', async () => {
  const filename = 'src/wc/components/Modal/Modal.docs.mdx';
  const compiled = await new Promise<string>((resolve, reject) => {
    void mdxLoader.call(
      {
        resourcePath: filename,
        getOptions: () => ({}),
        async: () => (error: Error | null, code: string) => (error ? reject(error) : resolve(code)),
      },
      readFileSync(filename, 'utf8')
    );
  });
  // Execute the real MDX compiler output and capture Canvas configuration. The
  // story namespace is opaque here: its browser component imports need no DOM.
  const examples: Array<{ of: unknown; story?: { inline?: boolean; height?: string } }> = [];
  const blocks = {
    Canvas: (props: (typeof examples)[number]) => {
      examples.push(props);
      return null;
    },
    Controls: () => null,
    Description: () => null,
    Meta: () => null,
    Title: () => null,
  };
  const stories = new Proxy(
    { __esModule: true },
    { get: (_, name) => (name === '__esModule' ? true : name) }
  );
  const output = ts.transpileModule(compiled, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} as { default: ComponentType } };
  new Function('require', 'module', 'exports', output)(
    (id: string) =>
      id === '@storybook/addon-docs/blocks'
        ? blocks
        : id === './Modal.stories'
          ? stories
          : require(id),
    module,
    module.exports
  );
  renderToStaticMarkup(createElement(module.exports.default));
  assert.ok(examples.length > 0, 'docs must render at least one example');
  for (const example of examples) {
    assert.ok(example.of, 'Canvas must reference a story');
    assert.equal(
      example.story?.inline,
      false,
      `${String(example.of)} must be isolated from the docs page`
    );
    assert.ok(example.story?.height, `${String(example.of)} needs an explicit preview height`);
  }
});
