import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  CONTROL_SUPPORTING_TEXT_VARIANT,
  CONTROL_TEXT_VARIANT,
} from '../src/wc/utils/control-text';

const root = path.resolve(import.meta.dirname, '..');

const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('all control densities share one default radius declaration', () => {
  const css = read('src/wc/utils/control-density.css');
  assert.equal(css.match(/--ds-control-radius:\s*var\(--ds-radius-control\);/g)?.length, 1);
  for (const size of ['lg', 'md', 'sm', 'xs']) {
    assert.match(css, new RegExp(`:host\\(\\.ds-control--${size}\\)[\\s\\S]*?--ds-control-radius`));
  }
});

test('lg resolves one complete 40px control recipe', () => {
  const css = read('src/wc/utils/control-density.css');
  assert.match(
    css,
    /:host\(\.ds-control--lg\),\s*\.ds-control--lg\s*{[\s\S]*?--ds-control-height: var\(--dimension-size-500\);[\s\S]*?--ds-control-icon: var\(--dimension-iconography-lg\);[\s\S]*?--ds-control-padding-inline: var\(--dimension-space-100\);[\s\S]*?--ds-control-label-inset: var\(--dimension-space-050\);[\s\S]*?--ds-control-gap: var\(--dimension-space-050\);[\s\S]*?}/
  );
  assert.equal(CONTROL_TEXT_VARIANT.lg, 'text-body-large');
});

test('inset density reduces only same-size outer geometry', () => {
  const css = read('src/wc/utils/control-density-inset.css');
  const cases = [
    {
      size: 'lg',
      height: '500',
      padding: '100',
    },
    {
      size: 'md',
      height: '400',
      padding: '075',
    },
    {
      size: 'sm',
      height: '300',
      padding: '050',
    },
    {
      size: 'xs',
      height: '200',
      padding: '025',
    },
  ];

  for (const density of cases) {
    assert.match(
      css,
      new RegExp(
        `:host\\(\\.ds-control--${density.size}\\.ds-control--inset\\),[\\s\\S]*?` +
          `--ds-control-height: calc\\(var\\(--dimension-size-${density.height}\\) - var\\(--dimension-space-050\\)\\);[\\s\\S]*?` +
          `--ds-control-padding-inline: calc\\([\\s\\S]*?var\\(--dimension-space-${density.padding}\\) - var\\(--dimension-space-025\\)[\\s\\S]*?\\);`
      )
    );
  }

  assert.doesNotMatch(css, /--ds-control-(?:icon|label-inset|gap|radius):/);

  for (const density of cases.slice(0, 3)) {
    assert.match(
      css,
      new RegExp(
        `:host\\(\\.ds-control--${density.size}\\.ds-control--inset-double\\),[\\s\\S]*?` +
          `--ds-control-height: calc\\(var\\(--dimension-size-${density.height}\\) - var\\(--dimension-space-100\\)\\);[\\s\\S]*?` +
          `--ds-control-padding-inline: calc\\([\\s\\S]*?var\\(--dimension-space-${density.padding}\\) - var\\(--dimension-space-050\\)[\\s\\S]*?\\);`
      )
    );
  }
  assert.doesNotMatch(css, /ds-control--xs\.ds-control--inset-double/);

  const tagCss = read('src/wc/components/Tag/Tag.css');
  const tagSource = read('src/wc/components/Tag/Tag.tsx');
  const utilityStoryCss = read('src/wc/stories/Utility/utility-demo.css');
  assert.match(tagCss, /@import ['"]\.\.\/\.\.\/utils\/control-density-inset\.css['"];/);
  assert.match(utilityStoryCss, /@import ['"]\.\.\/\.\.\/utils\/control-density-inset\.css['"];/);
  assert.match(tagSource, /@Prop\(\) isInset: boolean = false/);
  assert.match(tagSource, /['"]ds-control--inset['"]: this\.isInset && !doubleInset/);
  assert.match(tagSource, /['"]ds-control--inset-double['"]: doubleInset/);

  const buttonBaseCss = read('src/wc/utils/button-base.css');
  assert.match(buttonBaseCss, /@import ['"]\.\/control-density-inset\.css['"];/);
  for (const component of ['ButtonFilled', 'ButtonUnfilled']) {
    const source = read(`src/wc/components/${component}/${component}.tsx`);
    assert.match(source, /@Prop\(\) isInset: boolean = false/);
    assert.equal(
      source.match(/['"]ds-control--inset['"]: this\.isInset && !this\.doubleInset/g)?.length,
      2
    );
    assert.equal(source.match(/['"]ds-control--inset-double['"]: this\.doubleInset/g)?.length, 2);
  }

  const tabGroupCss = read('src/wc/components/TabGroup/TabGroup.css');
  const tabGroupSource = read('src/wc/components/TabGroup/TabGroup.tsx');
  assert.match(tabGroupCss, /@import ['"]\.\.\/\.\.\/utils\/control-density-inset\.css['"];/);
  assert.match(tabGroupSource, /\[`ds-control--\$\{this\.size\}`\]: true/);
  assert.match(tabGroupSource, /['"]ds-control--inset['"]: this\.presentation !== ['"]tabs['"]/);

  const selectCss = read('src/wc/components/Select/Select.css');
  const selectSource = read('src/wc/components/Select/Select.tsx');
  const selectHostClass = selectSource.match(/<Host\s+class=\{\{([\s\S]*?)\}\}/)?.[1];
  assert.match(selectCss, /@import ['"]\.\.\/\.\.\/utils\/control-density-inset\.css['"];/);
  assert.match(selectSource, /@Prop\(\) isInset: boolean = false/);
  assert.match(selectSource, /@Prop\(\) insetDepth: ControlInsetDepth = 'single'/);
  assert.match(selectSource, /@Prop\(\) rounded: boolean = false/);
  assert.match(selectSource, /['"]trigger--rounded['"]: this\.rounded/);
  assert.match(
    selectSource,
    /private get doubleInset\(\): boolean \{\s*return this\.isInset && this\.insetDepth === 'double' && this\.size !== 'xs';/
  );
  assert.equal(
    selectSource.match(/['"]ds-control--inset['"]: this\.isInset && !this\.doubleInset/g)?.length,
    1
  );
  assert.equal(
    selectSource.match(/['"]ds-control--inset-double['"]: this\.doubleInset/g)?.length,
    1
  );
  assert.ok(selectHostClass);
  assert.doesNotMatch(selectHostClass, /ds-control--inset/);
});

test('choice rows derive primary and supporting type from control density', () => {
  assert.deepEqual(CONTROL_TEXT_VARIANT, {
    lg: 'text-body-large',
    md: 'text-body-medium',
    sm: 'text-body-small',
    xs: 'text-caption',
  });
  assert.deepEqual(CONTROL_SUPPORTING_TEXT_VARIANT, {
    lg: 'text-body-medium',
    md: 'text-body-small',
    sm: 'text-caption',
    xs: 'text-caption',
  });

  const parts = read('src/wc/utils/choice-list-parts.tsx');
  assert.match(parts, /\[`ds-control--\$\{size\}`\]: true/);
  assert.match(parts, /variant={CONTROL_TEXT_VARIANT\[size\]}/);
  assert.match(parts, /variant={CONTROL_SUPPORTING_TEXT_VARIANT\[size\]}/);
});

test('menu switch suffix keeps the 8px label gap without overriding the density prefix gap', () => {
  const css = read('src/wc/components/Menu/Menu.css');
  assert.doesNotMatch(css, /\.menu-item--switch\s*{[^}]*\bgap:/);
  assert.match(
    css,
    /\.menu-item__switch\s*{[\s\S]*?margin-inline-start: calc\(\s*var\(--dimension-space-100\) - var\(--ds-control-gap/
  );
});

test('shell navigation rows consume the shared control-density recipe', () => {
  const cases = [
    {
      name: 'BarNav md tabs',
      css: read('src/wc/components/BarNav/BarNav.css'),
      source: read('src/wc/components/BarNav/BarNav.tsx'),
      sizeClass: /['"]ds-control--md['"]: true/,
    },
    {
      name: 'TabGroup density-matched tabs',
      css: read('src/wc/components/TabGroup/TabGroup.css'),
      source: read('src/wc/components/TabGroup/TabGroup.tsx'),
      sizeClass: /\[`ds-control--\$\{this\.size\}`\]: true/,
    },
    {
      name: 'MobileSheetNav lg destinations',
      css: read('src/wc/components/MobileSheetNav/MobileSheetNav.css'),
      source: read('src/wc/components/MobileSheetNav/MobileSheetNav.tsx'),
      sizeClass: /['"]ds-control--lg['"]: true/,
    },
  ];

  for (const row of cases) {
    assert.match(
      row.css,
      /@import ['"]\.\.\/\.\.\/utils\/control-density\.css['"];/,
      `${row.name} imports the recipe`
    );
    assert.match(row.source, row.sizeClass, `${row.name} applies its density class`);
    assert.match(row.css, /var\(--ds-control-height\)/, `${row.name} consumes shared height`);
    assert.match(
      row.css,
      /var\(--ds-control-padding-inline\)/,
      `${row.name} consumes shared row padding`
    );
    assert.match(
      row.css,
      /var\(--ds-control-label-inset\)/,
      `${row.name} consumes shared label inset`
    );
    assert.match(row.css, /var\(--ds-control-gap\)/, `${row.name} consumes shared content gap`);
  }
});

test('PanelNav text hosts consume the shared md label inset without coupling row geometry', () => {
  const css = read('src/wc/components/PanelNav/PanelNav.css');
  const source = read('src/wc/components/PanelNav/PanelNav.tsx');

  assert.match(css, /@import ['"]\.\.\/\.\.\/utils\/control-density\.css['"];/);
  assert.match(source, /['"]ds-control--md['"]: true/);
  assert.match(css, /\.panel-nav__header-btn\s*{[\s\S]*?border-radius: var\(--ds-control-radius,/);
  assert.match(css, /\.panel-nav__item\s*{[\s\S]*?border-radius: var\(--ds-control-radius,/);
  assert.match(
    css,
    /\.panel-nav__item-label-text\s*{[\s\S]*?padding: 0 var\(--ds-control-label-inset\);/
  );
  assert.match(source, /panel-nav__footer-user-label panel-nav__item-label-text ds-control--md/);
  assert.match(source, /panel-nav__item-label panel-nav__item-label-text ds-control--md/);
  assert.match(source, /panel-nav__group-label ds-control--md/);
  assert.doesNotMatch(css, /height: var\(--ds-control-height\);/);
  assert.doesNotMatch(css, /gap: var\(--ds-control-gap\);/);
});

test('Skeleton control placeholders consume the selected density radius', () => {
  const css = read('src/wc/components/Skeleton/Skeleton.css');
  const source = read('src/wc/components/Skeleton/Skeleton.tsx');

  assert.match(source, /\[`ds-control--\$\{this\.controlSize\}`\]: this\.variant === 'control'/);
  assert.match(
    css,
    /:host\(\.skeleton--control\) \.skeleton__shape\s*{[\s\S]*?border-radius: var\(--ds-control-radius,/
  );
});

test('read-only tool titles use the same md density variables as their actions', () => {
  const panelToolsSource = read('src/wc/components/PanelTools/PanelTools.tsx');
  const headerCss = read('src/wc/components/PanelToolHeader/PanelToolHeader.css');
  const headerSource = read('src/wc/components/PanelToolHeader/PanelToolHeader.tsx');

  assert.match(panelToolsSource, /<ds-panel-tool-header/);
  assert.match(headerCss, /@import ['"]\.\.\/\.\.\/utils\/control-density\.css['"];/);
  assert.match(headerCss, /@import ['"]\.\.\/\.\.\/utils\/chrome-header\.css['"];/);
  assert.match(
    headerSource,
    /class="panel-tool-header__heading ds-chrome-header__heading ds-control--md"/
  );
  assert.match(headerCss, /height: var\(--ds-control-height\);/);
  assert.match(
    headerCss,
    /padding-inline: calc\(var\(--ds-control-padding-inline\) \+ var\(--ds-control-label-inset\)\);/
  );
  assert.match(headerSource, /<ds-button-unfilled[\s\S]*?size="md"/);
});

test('PanelTools search uses the shared Select search control at md density', () => {
  const source = read('src/wc/components/PanelToolSearch/PanelToolSearch.tsx');
  const css = read('src/wc/components/PanelToolSearch/PanelToolSearch.css');
  const selectCss = read('src/wc/components/Select/Select.css');
  const inputCss = read('src/wc/components/Input/Input.css');
  const searchParts = read('src/wc/utils/choice-list-parts.tsx');
  const panelToolsCss = read('src/wc/components/PanelTools/PanelTools.css');

  assert.match(source, /<ChoiceSearch/);
  assert.match(searchParts, /<ds-input[\s\S]*?class="select-search__control"[\s\S]*?size={size}/);
  assert.match(
    searchParts,
    /onDsChange={\(event: CustomEvent<string>\) => {[\s\S]*?event\.stopPropagation\(\)/
  );
  assert.match(searchParts, /icon="MagnifyingGlass"/);
  assert.match(inputCss, /--ds-input-adornment-fg: var\(--color-foreground-secondary\);/);
  assert.match(inputCss, /\.input-control__prefix-text--empty/);
  assert.match(read('src/wc/components/Input/Input.tsx'), /<slot name="prefix"/);
  assert.match(
    read('src/wc/components/Input/Input.tsx'),
    /'input-control__prefix-text': true,[\s\S]*?'ds-control-label-box': !this\.hasPrefixControl/
  );
  assert.match(
    read('src/wc/components/Input/Input.tsx'),
    /'input-control__suffix': true,[\s\S]*?'ds-control-label-box': !this\.hasSuffixControl/
  );
  assert.match(inputCss, /\.input-control--prefix-control/);
  assert.match(inputCss, /\.input-control--suffix-control/);
  assert.match(inputCss, /gap: var\(--dimension-space-025\)/);
  assert.match(
    inputCss,
    /margin-inline-end: calc\(var\(--ds-control-padding-inline\) - var\(--ds-control-gap\)\)/
  );
  assert.match(
    read('src/wc/components/Input/Input.tsx'),
    /<ds-divider[\s\S]*?orientation="vertical"[\s\S]*?length="var\(--ds-control-icon\)"/
  );
  assert.match(inputCss, /padding-inline-start: var\(--dimension-space-025\)/);
  assert.match(read('src/wc/components/Input/Input.tsx'), /ds-select, ds-button-unfilled/);
  assert.match(css, /height: var\(--dimension-size-600\);/);
  assert.match(source, /panel-tool-search ds-chrome-row ds-chrome-space--md/);
  assert.match(css, /@import ['"]\.\.\/\.\.\/utils\/chrome-layout\.css['"];/);
  assert.match(css, /@import ['"]\.\.\/\.\.\/utils\/control-density\.css['"];/);
  assert.match(css, /@import ['"]\.\.\/\.\.\/utils\/search-control\.css['"];/);
  assert.match(inputCss, /@import ['"]\.\.\/\.\.\/utils\/typography\.css['"];/);
  assert.match(
    css,
    /\.panel-tool-search::after\s*{[\s\S]*?height: var\(--dimension-stroke-width-012\);[\s\S]*?background-color: var\(--color-border-tertiary\);/
  );
  assert.match(source, /<ds-divider[\s\S]*?orientation="vertical"/);
  assert.match(
    source,
    /<ds-button-unfilled[\s\S]*?icon="Filters"[\s\S]*?size="md"[\s\S]*?hasBorder={false}/
  );
  assert.match(selectCss, /@import ['"]\.\.\/\.\.\/utils\/search-control\.css['"];/);
  assert.doesNotMatch(
    panelToolsCss,
    /background-color: var\(--color-background-(?:primary|secondary)\)/
  );
});

test('date and time inputs share Input density, typography, and picker chrome', () => {
  const dateSource = read('src/wc/components/InputDate/InputDate.tsx');
  const timeSource = read('src/wc/components/InputTime/InputTime.tsx');
  const dateCss = read('src/wc/components/InputDate/InputDate.css');
  const timeCss = read('src/wc/components/InputTime/InputTime.css');
  const timePickerCss = read('src/wc/components/TimePicker/TimePicker.css');
  const timePickerSource = read('src/wc/components/TimePicker/TimePicker.tsx');
  const filterMenuCss = read('src/wc/components/FilterMenu/FilterMenu.css');
  const datetimeCss = read('src/wc/utils/datetime-input-control.css');

  assert.match(dateCss, /@import ['"]\.\.\/\.\.\/utils\/datetime-input-control\.css['"];/);
  assert.match(dateCss, /@import ['"]\.\.\/\.\.\/utils\/choice-popup\.css['"];/);
  assert.match(dateCss, /@import ['"]\.\.\/\.\.\/utils\/chrome-layout\.css['"];/);
  assert.match(dateCss, /--ds-calendar-padding: 0;/);
  assert.match(dateCss, /padding: var\(--dimension-space-050\);/);
  assert.match(timeCss, /@import ['"]\.\.\/\.\.\/utils\/datetime-input-control\.css['"];/);
  assert.match(timeCss, /@import ['"]\.\.\/\.\.\/utils\/choice-popup\.css['"];/);
  assert.match(timeCss, /@import ['"]\.\.\/\.\.\/utils\/chrome-layout\.css['"];/);
  assert.match(timeCss, /--ds-time-picker-padding: 0;/);
  assert.match(timeCss, /padding: var\(--dimension-space-050\);/);
  assert.match(datetimeCss, /@import ['"]\.\/typography\.css['"];/);
  assert.match(datetimeCss, /@import ['"]\.\/control-density\.css['"];/);
  assert.match(datetimeCss, /::-webkit-calendar-picker-indicator/);
  assert.match(datetimeCss, /::-webkit-datetime-edit/);
  assert.match(dateSource, /CONTROL_TEXT_VARIANT\[this\.size\]/);
  assert.match(timeSource, /CONTROL_TEXT_VARIANT\[this\.size\]/);
  assert.match(dateSource, /type="text"/);
  assert.match(dateSource, /formatIsoCalendarDateLabel/);
  assert.match(dateSource, /<ds-calendar[\s\S]*?selectionMode="single"/);
  assert.match(timeSource, /<ds-time-picker[\s\S]*?step=\{this\.step\}/);
  assert.match(dateSource, /'ds-chrome-space--sm': true/);
  assert.match(timeSource, /'ds-chrome-space--sm': true/);
  assert.match(timePickerSource, /'ds-interaction-fill--selected': selected && !disabled/);
  assert.doesNotMatch(filterMenuCss, /ds-calendar-padding/);
  const calendarCss = read('src/wc/components/Calendar/Calendar.css');
  assert.match(
    calendarCss,
    /min-width: calc\(\s*\(var\(--dimension-size-400\) \* 7\) \+ \(var\(--dimension-space-050\) \* 6\) \+\s*\(var\(--dimension-space-100\) \* 2\)\s*\)/
  );
  assert.match(calendarCss, /\.calendar-day--in-range\s*\{[\s\S]*?color-background-faint-brand/);
  assert.match(
    calendarCss,
    /calendar-day--range-preview:not\(:disabled\)::after[\s\S]*?--ds-interaction-hover/
  );
  assert.match(
    calendarCss,
    /calendar-day--range-preview:active:not\(:disabled\)::after[\s\S]*?--ds-interaction-pressed/
  );
  assert.doesNotMatch(calendarCss, /calendar-day--selected[\s\S]*?color-background-bold-brand/);
  assert.doesNotMatch(
    calendarCss,
    /\.calendar-day--range-preview\s*\{[\s\S]*?color-background-faint-brand/
  );
  assert.match(
    read('src/wc/components/Calendar/Calendar.tsx'),
    /'ds-interaction-fill--surface-open':[\s\S]*pendingStartDay && !this\.isDisabled\(day\.value\)/
  );
  assert.match(
    read('src/wc/components/Calendar/Calendar.tsx'),
    /'ds-interaction-fill--selected': selected && !this\.isDisabled\(day\.value\)/
  );
  assert.match(timeSource, /formatClockTimeLabel/);
  assert.match(datetimeCss, /input-control__datetime-action/);
  assert.match(datetimeCss, /padding-inline-end: var\(--dimension-space-025\)/);
  assert.match(
    datetimeCss,
    /:host\(\.ds-control-inactive\) \.input-control > \.input-control__datetime-action/
  );
  assert.match(dateSource, /class="input-control__datetime-action"/);
  assert.match(timeSource, /class="input-control__datetime-action"/);
  assert.match(timeSource, /type="text"/);
  assert.match(timePickerCss, /height: var\(--dimension-size-400\)/);
  assert.match(timePickerCss, /overscroll-behavior: contain/);
  assert.match(timePickerCss, /ds-time-picker-padding/);
  assert.doesNotMatch(timePickerCss, /color-background-faint-brand/);
  assert.match(
    dateSource,
    /<ds-button-unfilled[\s\S]*?icon="Calendar"[\s\S]*?hasBorder={false}[\s\S]*?isInset/
  );
  assert.match(
    timeSource,
    /<ds-button-unfilled[\s\S]*?icon="Clock"[\s\S]*?hasBorder={false}[\s\S]*?isInset/
  );
  assert.doesNotMatch(dateSource, /CALENDAR_BUTTON_SIZE/);
  assert.doesNotMatch(dateSource, /rounded/);
  assert.doesNotMatch(timeSource, /ICON_SIZE/);
  assert.doesNotMatch(timeSource, /rounded/);
  const inputSource = read('src/wc/components/Input/Input.tsx');
  const inputFieldCss = read('src/wc/components/Input/Input.css');
  assert.match(
    inputSource,
    /<ds-button-unfilled[\s\S]*?icon=\{this\.passwordRevealed \? 'EyeDisabled' : 'Eye'\}[\s\S]*?hasBorder=\{false\}[\s\S]*?isInset/
  );
  assert.match(inputFieldCss, /input-control__trailing-action/);
  assert.match(inputFieldCss, /padding-inline-end: var\(--dimension-space-025\)/);
});
