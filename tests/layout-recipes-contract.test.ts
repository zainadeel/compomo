import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('data-viz cards consume one shared body anatomy', () => {
  for (const name of ['Bar', 'Line', 'Donut']) {
    const css = read(`src/wc/components/CardDataViz${name}/CardDataViz${name}.css`);
    const source = read(`src/wc/components/CardDataViz${name}/CardDataViz${name}.tsx`);
    assert.match(css, /data-viz-card-layout\.css/);
    assert.match(source, /ds-data-viz-card-layout/);
    assert.match(source, /ds-data-viz-card-chart/);
    assert.match(source, /ds-data-viz-card-legend/);
  }
});

test('primary controls consume shared frame, icon, and label anatomy', () => {
  for (const name of ['ButtonFilled', 'ButtonUnfilled', 'Input', 'Select']) {
    const css = read(`src/wc/components/${name}/${name}.css`);
    assert.match(css, /control-parts\.css/);
  }

  for (const name of ['ButtonFilled', 'ButtonUnfilled', 'Input', 'Select', 'SelectMulti']) {
    const source = read(`src/wc/components/${name}/${name}.tsx`);
    assert.match(source, /ds-control-frame/);
    assert.match(source, /ds-control-label-box/);
  }
});

test('field owners consume one vertical field flow recipe', () => {
  for (const name of ['Field', 'Input', 'Select', 'Slider']) {
    const css = read(`src/wc/components/${name}/${name}.css`);
    assert.match(css, /field-stack\.css/);
    const source = read(`src/wc/components/${name}/${name}.tsx`);
    assert.match(source, /ds-field-stack/);
  }
});

test('Select and SelectMulti delegate interaction behavior to SelectController', () => {
  for (const name of ['Select', 'SelectMulti']) {
    const source = read(`src/wc/components/${name}/${name}.tsx`);
    assert.match(source, /new SelectController/);
    assert.doesNotMatch(source, /addEventListener\('mousedown'/);
    assert.doesNotMatch(source, /findChoiceTypeaheadMatch/);
  }
});
