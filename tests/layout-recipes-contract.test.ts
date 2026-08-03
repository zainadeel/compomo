import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('one chart card owns every chart body anatomy', () => {
  const css = read('src/wc/components/CardChart/CardChart.css');
  const source = read('src/wc/components/CardChart/CardChart.tsx');
  assert.match(source, /card-chart__layout/);
  assert.match(source, /card-chart__chart/);
  assert.match(source, /card-chart__legend/);
  assert.match(css, /\.card-chart__chart > \*/);
  assert.doesNotMatch(source, /chart-donut|dsSliceHover/);
});

test('chart chrome lines use subordinate foreground roles', () => {
  const css = read('src/wc/components/Chart/Chart.css');
  assert.match(css, /\.chart__axis-line[\s\S]*?stroke: var\(--color-foreground-tertiary\)/);
  assert.match(css, /\.chart__grid[\s\S]*?stroke: var\(--color-foreground-quaternary\)/);
  assert.doesNotMatch(css, /\.chart__(?:axis-line|grid)[^{]*\{[^}]*foreground-primary/);
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
