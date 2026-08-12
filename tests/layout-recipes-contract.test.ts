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
  assert.match(source, /card-chart__copy ds-chrome-header__copy ds-control--md/);
  assert.match(source, /card-chart__title ds-chrome-header__heading/);
  assert.match(css, /\.card-chart__chart > \*/);
  assert.match(css, /\.card-chart__chart > ds-chart[\s\S]*--ds-chart-container-height:\s*100%/);
  assert.match(css, /padding: var\(--dimension-space-200\) var\(--dimension-space-200\) 0/);
  assert.match(css, /border-radius: var\(--dimension-radius-125\)/);
  assert.match(css, /box-shadow: var\(--effect-shadow-elevated-sm\)/);
  assert.match(css, /overflow:\s*visible/);
  assert.doesNotMatch(css, /box-shadow: 0 0 0 var\(--dimension-stroke-width-012\)/);
  assert.doesNotMatch(source, /chart-donut|dsSliceHover/);
});

test('chart tooltip reuses menu section and medium control anatomy', () => {
  const css = read('src/wc/components/TooltipChart/TooltipChart.css');
  const source = read('src/wc/components/TooltipChart/TooltipChart.tsx');
  const parts = read('src/wc/utils/control-parts.css');
  assert.match(source, /CONTROL_SUPPORTING_TEXT_VARIANT\.md/);
  assert.match(source, /CONTROL_TEXT_VARIANT\.md/);
  assert.match(source, /ds-control-frame ds-control--md/);
  assert.match(source, /ds-control-section-heading ds-control--md/);
  assert.match(source, /ds-control-icon-box/);
  assert.match(source, /ds-control-label-box/);
  assert.match(source, /ds-chrome-column/);
  assert.match(source, /ds-chrome-space--sm/);
  assert.match(source, /usesSwatches/);
  assert.match(css, /chrome-layout\.css/);
  assert.match(css, /\.tooltip-chart__items\s*{\s*display: contents/);
  assert.match(css, /border-radius: var\(--dimension-radius-075\)/);
  assert.match(parts, /\.ds-control-section-heading/);
  assert.doesNotMatch(css, /\.tooltip-chart__heading\s*{/);
});

test('chart chrome lines use subordinate foreground roles', () => {
  const css = read('src/wc/components/Chart/Chart.css');
  const source = read('src/wc/components/Chart/Chart.tsx');
  assert.match(css, /\.chart__axis-line[\s\S]*?stroke: var\(--color-foreground-tertiary\)/);
  assert.match(css, /\.chart__grid[\s\S]*?stroke: var\(--color-foreground-quaternary\)/);
  assert.match(css, /\.chart__plot-boundary[\s\S]*?stroke: var\(--color-foreground-quaternary\)/);
  assert.doesNotMatch(css, /\.chart__(?:axis-line|grid|plot-boundary)[^{]*\{[^}]*foreground-primary/);
  assert.match(source, /applyMeasuredSize\(entry\.contentRect\.width, entry\.contentRect\.height\)/);
  assert.match(source, /var\(--ds-chart-container-height, 320px\)/);
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
