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
  assert.match(css, /border-radius: var\(--ds-radius-card\)/);
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
  assert.match(css, /border-radius: var\(--ds-radius-tooltip-menu\)/);
  assert.match(parts, /\.ds-control-section-heading/);
  assert.doesNotMatch(css, /\.tooltip-chart__heading\s*{/);
});

test('chart chrome lines use subordinate foreground roles', () => {
  const css = read('src/wc/components/Chart/Chart.css');
  const source = read('src/wc/components/Chart/Chart.tsx');
  assert.match(css, /\.chart__axis-line[\s\S]*?stroke: var\(--color-foreground-tertiary\)/);
  assert.match(css, /\.chart__grid[\s\S]*?stroke: var\(--color-foreground-quaternary\)/);
  assert.match(css, /\.chart__plot-boundary[\s\S]*?stroke: var\(--color-foreground-quaternary\)/);
  assert.doesNotMatch(
    css,
    /\.chart__(?:axis-line|grid|plot-boundary)[^{]*\{[^}]*foreground-primary/
  );
  assert.match(
    source,
    /applyMeasuredSize\(entry\.contentRect\.width, entry\.contentRect\.height\)/
  );
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

test('borderless field stacks inset supporting copy to the control text origin', () => {
  const css = read('src/wc/utils/field-stack.css');
  assert.match(css, /ds-field-stack--supporting-inset/);
  assert.match(css, /--ds-control-padding-inline/);
  assert.match(css, /--ds-control-label-inset/);

  for (const name of ['Input', 'Select', 'Textarea', 'InputDate', 'InputTime']) {
    const source = read(`src/wc/components/${name}/${name}.tsx`);
    assert.match(source, /ds-field-stack--supporting-inset['"]:\s*!this\.hasBorder/);
  }

  const field = read('src/wc/components/Field/Field.tsx');
  assert.match(field, /ds-field-stack--supporting-inset/);
  assert.match(field, /controlBorderless/);
});

test('settings rows share one CardSetting inset and nested-control origin', () => {
  const css = read('src/wc/utils/settings-row.css');
  assert.match(css, /padding-block: var\(--dimension-space-100\)/);
  assert.match(css, /padding-inline: var\(--dimension-space-200\)/);
  assert.match(css, /--ds-settings-row-control-padding-inline: 0px/);

  for (const name of ['SettingRowToggle', 'SettingRowRadio', 'SettingRowCheckbox']) {
    const rowCss = read(`src/wc/components/${name}/${name}.css`);
    assert.match(rowCss, /settings-row\.css/);
    assert.doesNotMatch(
      rowCss,
      /padding: var\(--dimension-space-100\) var\(--dimension-space-200\)/
    );
  }

  const toggle = read('src/wc/components/SettingRowToggle/SettingRowToggle.tsx');
  assert.match(
    toggle,
    /this\.variant === 'non-emphasis' && !hasDescription \? 'secondary' : 'primary'/
  );
  assert.match(toggle, /variant=\{CONTROL_SUPPORTING_TEXT_VARIANT\.md\}/);
  assert.doesNotMatch(
    toggle,
    /this\.variant === 'emphasis' \? 'text-body-medium' : 'text-body-small'/
  );

  const radio = read('src/wc/components/Radio/Radio.css');
  assert.match(radio, /--ds-settings-row-control-padding-inline/);
  assert.match(
    radio,
    /ds-text\.radio__group-label[\s\S]*padding-inline:\s*var\(\s*--ds-settings-row-control-padding-inline/
  );
  assert.doesNotMatch(
    radio,
    /--ds-settings-row-control-padding-inline, var\(--ds-control-padding-inline\)\) \+\s*var\(--ds-control-label-inset\)/
  );

  const radioRow = read('src/wc/components/SettingRowRadio/SettingRowRadio.tsx');
  const radioRowCss = read('src/wc/components/SettingRowRadio/SettingRowRadio.css');
  const radioSource = read('src/wc/components/Radio/Radio.tsx');
  assert.match(radioRow, /variant=\{CONTROL_TEXT_VARIANT\.md\}/);
  assert.match(radioRow, /variant=\{CONTROL_SUPPORTING_TEXT_VARIANT\.md\}/);
  assert.match(radioRow, /setting-row-radio__heading/);
  assert.match(radioRow, /key="setting-row-radio-heading"/);
  assert.match(radioRow, /setting-row-radio__choice/);
  assert.match(radioRow, /@Prop\(\{ reflect: true \}\) presentation/);
  assert.doesNotMatch(radioRow, /setting-row-radio__control/);
  assert.doesNotMatch(radioRow, /hidden=\{/);
  assert.doesNotMatch(radioRow, /this\.presentation === 'view' \?/);
  assert.match(radioRow, /radio\.groupLabel = ''/);
  assert.doesNotMatch(radioRow, /ds-control-section-heading/);
  assert.doesNotMatch(radioRow, /groupLabelVariant/);
  assert.doesNotMatch(radioRowCss, /control-parts\.css/);
  assert.match(radioRowCss, /height: var\(--dimension-size-400\)/);
  assert.match(radioRowCss, /padding-block: 0;/);
  assert.match(radioRowCss, /padding-block: var\(--dimension-space-075\)/);
  assert.match(radioRowCss, /:host ::slotted\(ds-radio\)/);
  assert.match(radioRowCss, /:host\(\[presentation='view'\]\) ::slotted\(ds-radio\)/);
  assert.match(radioRowCss, /:host\(\[presentation='edit'\]\) \.setting-row-radio__choice/);
  assert.doesNotMatch(radioRowCss, /:host > ds-radio/);
  assert.doesNotMatch(radioRowCss, /:host\(\[presentation='view'\]\) > ds-radio/);
  assert.match(radioSource, /<div key="radio-options" class="radio__options">/);
  assert.doesNotMatch(radioSource, /this\.showGroupLabel \? \(\s*<div class="radio__options">/);
  assert.match(radioSource, /closest\('ds-setting-row-radio'\)/);
  assert.match(radioSource, /variant="text-body-small"/);
  assert.doesNotMatch(radioSource, /groupLabelVariant/);

  const checkbox = read('src/wc/components/Checkbox/Checkbox.css');
  assert.match(checkbox, /--ds-settings-row-control-padding-inline/);

  const checkboxRow = read('src/wc/components/SettingRowCheckbox/SettingRowCheckbox.tsx');
  const checkboxRowCss = read('src/wc/components/SettingRowCheckbox/SettingRowCheckbox.css');
  const checkboxGroupSource = read('src/wc/components/CheckboxGroup/CheckboxGroup.tsx');
  assert.match(checkboxRow, /variant=\{CONTROL_TEXT_VARIANT\.md\}/);
  assert.match(checkboxRow, /this\.description\?\.trim\(\)/);
  assert.match(checkboxRow, /setting-row-checkbox__heading/);
  assert.match(checkboxRow, /key="setting-row-checkbox-heading"/);
  assert.match(checkboxRow, /setting-row-checkbox__choice/);
  assert.match(checkboxRow, /@Prop\(\{ reflect: true \}\) presentation/);
  assert.doesNotMatch(checkboxRow, /setting-row-checkbox__control/);
  assert.doesNotMatch(checkboxRow, /hidden=\{/);
  assert.doesNotMatch(checkboxRow, /this\.presentation === 'view' \?/);
  assert.match(checkboxRow, /group\.label = ''/);
  assert.doesNotMatch(checkboxRow, /ds-control-section-heading/);
  assert.doesNotMatch(checkboxRowCss, /control-parts\.css/);
  assert.match(checkboxRowCss, /height: var\(--dimension-size-400\)/);
  assert.match(checkboxRowCss, /padding-block: 0;/);
  assert.match(checkboxRowCss, /padding-block: var\(--dimension-space-075\)/);
  assert.match(checkboxRowCss, /:host ::slotted\(ds-checkbox-group\)/);
  assert.match(checkboxRowCss, /:host\(\[presentation='view'\]\) ::slotted\(ds-checkbox-group\)/);
  assert.match(checkboxRowCss, /:host\(\[presentation='edit'\]\) \.setting-row-checkbox__choice/);
  assert.doesNotMatch(checkboxRowCss, /:host > ds-checkbox-group/);
  assert.doesNotMatch(checkboxRowCss, /:host\(\[presentation='view'\]\) > ds-checkbox-group/);
  assert.match(
    checkboxGroupSource,
    /<div key="checkbox-group-options" class="checkbox-group__options">/
  );
  assert.doesNotMatch(
    checkboxGroupSource,
    /this\.showGroupLabel \? \(\s*<div class="checkbox-group__options">/
  );
  assert.match(checkboxGroupSource, /closest\('ds-setting-row-checkbox'\)/);
  assert.match(checkboxGroupSource, /variant="text-body-small"/);
});

test('both Select cardinality modes delegate interaction behavior to SelectController', () => {
  const source = read('src/wc/components/Select/Select.tsx');
  assert.match(source, /new SelectController/);
  assert.match(source, /multiple/);
  assert.doesNotMatch(source, /addEventListener\('mousedown'/);
  assert.doesNotMatch(source, /findChoiceTypeaheadMatch/);
});
