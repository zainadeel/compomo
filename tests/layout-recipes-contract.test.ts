import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('one data-viz card owns every chart body anatomy', () => {
  const css = read('src/wc/components/CardDataViz/CardDataViz.css');
  const source = read('src/wc/components/CardDataViz/CardDataViz.tsx');
  assert.match(source, /card-data-viz__layout/);
  assert.match(source, /card-data-viz__chart/);
  assert.match(source, /card-data-viz__legend/);
  assert.match(css, /\.card-data-viz__chart--fill/);
});

test('primary controls consume shared frame, icon, and label anatomy', () => {
  for (const name of ['Input', 'Select']) {
    const css = read(`src/wc/components/${name}/${name}.css`);
    assert.match(css, /control-parts\.css/);
  }

  for (const name of ['Input', 'Select']) {
    const source = read(`src/wc/components/${name}/${name}.tsx`);
    assert.match(source, /ds-control-frame/);
    assert.match(source, /ds-control-label-box/);
  }

  for (const name of ['ButtonFilled', 'ButtonUnfilled']) {
    const css = read(`src/wc/components/${name}/${name}.css`);
    const source = read(`src/wc/components/${name}/${name}.tsx`);
    assert.match(css, /button-base\.css/);
    assert.match(source, /renderButtonContent/);
    assert.match(source, /ds-control-frame/);
  }

  const renderer = read('src/wc/utils/button-render.tsx');
  assert.match(renderer, /ds-control-label-box/);
  assert.match(renderer, /ds-control-icon-box/);
});

test('field owners consume one vertical field flow recipe', () => {
  for (const name of ['Field', 'Input', 'Select', 'Slider']) {
    const css = read(`src/wc/components/${name}/${name}.css`);
    assert.match(css, /field-stack\.css/);
    const source = read(`src/wc/components/${name}/${name}.tsx`);
    assert.match(source, /ds-field-stack/);
  }
});

test('both Select cardinality modes delegate interaction behavior to SelectController', () => {
  const source = read('src/wc/components/Select/Select.tsx');
  assert.match(source, /new SelectController/);
  assert.match(source, /multiple/);
  assert.doesNotMatch(source, /addEventListener\('mousedown'/);
  assert.doesNotMatch(source, /findChoiceTypeaheadMatch/);
});
