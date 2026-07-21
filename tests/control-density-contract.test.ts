import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');

const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('all control densities share one default radius declaration', () => {
  const css = read('src/wc/utils/control-density.css');
  assert.equal(
    css.match(/--ds-control-radius:\s*var\(--dimension-radius-025\);/g)?.length,
    1,
  );
  for (const size of ['md', 'sm', 'xs']) {
    assert.match(css, new RegExp(`:host\\(\\.ds-control--${size}\\)[\\s\\S]*?--ds-control-radius`));
  }
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
      name: 'TabGroup sm tabs',
      css: read('src/wc/components/TabGroup/TabGroup.css'),
      source: read('src/wc/components/TabGroup/TabGroup.tsx'),
      sizeClass: /['"]ds-control--sm['"]: true/,
    },
  ];

  for (const row of cases) {
    assert.match(row.css, /@import ['"]\.\.\/\.\.\/utils\/control-density\.css['"];/, `${row.name} imports the recipe`);
    assert.match(row.source, row.sizeClass, `${row.name} applies its density class`);
    assert.match(row.css, /var\(--ds-control-height\)/, `${row.name} consumes shared height`);
    assert.match(row.css, /var\(--ds-control-padding-inline\)/, `${row.name} consumes shared row padding`);
    assert.match(row.css, /var\(--ds-control-label-inset\)/, `${row.name} consumes shared label inset`);
    assert.match(row.css, /var\(--ds-control-gap\)/, `${row.name} consumes shared content gap`);
  }
});

test('PanelNav text hosts consume the shared md label inset without coupling row geometry', () => {
  const css = read('src/wc/components/PanelNav/PanelNav.css');
  const source = read('src/wc/components/PanelNav/PanelNav.tsx');

  assert.match(css, /@import ['"]\.\.\/\.\.\/utils\/control-density\.css['"];/);
  assert.match(source, /['"]ds-control--md['"]: true/);
  assert.match(
    css,
    /\.panel-nav__header-btn\s*{[\s\S]*?border-radius: var\(--ds-control-radius,/,
  );
  assert.match(
    css,
    /\.panel-nav__item\s*{[\s\S]*?border-radius: var\(--ds-control-radius,/,
  );
  assert.match(css, /\.panel-nav__item-label-text\s*{[\s\S]*?padding: 0 var\(--ds-control-label-inset\);/);
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
    /:host\(\.skeleton--control\) \.skeleton__shape\s*{[\s\S]*?border-radius: var\(--ds-control-radius,/,
  );
});

test('read-only tool titles use the same md density variables as their actions', () => {
  const panelToolsSource = read('src/wc/components/PanelTools/PanelTools.tsx');
  const headerCss = read('src/wc/components/PanelToolHeader/PanelToolHeader.css');
  const headerSource = read('src/wc/components/PanelToolHeader/PanelToolHeader.tsx');

  assert.match(panelToolsSource, /<ds-panel-tool-header/);
  assert.match(headerCss, /@import ['"]\.\.\/\.\.\/utils\/control-density\.css['"];/);
  assert.match(headerSource, /class="panel-tool-header__heading ds-control--md"/);
  assert.match(headerCss, /height: var\(--ds-control-height\);/);
  assert.match(
    headerCss,
    /padding-inline: calc\(var\(--ds-control-padding-inline\) \+ var\(--ds-control-label-inset\)\);/,
  );
  assert.match(headerSource, /<ds-button-unfilled[\s\S]*?size="md"/);
});

test('PanelTools search uses the shared Select search control at md density', () => {
  const source = read('src/wc/components/PanelToolSearch/PanelToolSearch.tsx');
  const css = read('src/wc/components/PanelToolSearch/PanelToolSearch.css');
  const selectCss = read('src/wc/components/Select/Select.css');
  const searchParts = read('src/wc/utils/choice-list-parts.tsx');
  const panelToolsCss = read('src/wc/components/PanelTools/PanelTools.css');

  assert.match(source, /<ChoiceSearch/);
  assert.match(searchParts, /class="select-search__control ds-control--md"/);
  assert.match(searchParts, /onDsChange={event => event\.stopPropagation\(\)}/);
  assert.match(
    read('src/wc/utils/search-control.css'),
    /\.select-search__control > ds-icon\s*{[\s\S]*?color: var\(--color-foreground-secondary\);/,
  );
  assert.match(css, /height: var\(--dimension-size-600\);/);
  assert.match(css, /padding: var\(--dimension-space-100\);/);
  assert.match(css, /@import ['"]\.\.\/\.\.\/utils\/control-density\.css['"];/);
  assert.match(css, /@import ['"]\.\.\/\.\.\/utils\/search-control\.css['"];/);
  assert.match(css, /@import ['"]\.\.\/\.\.\/utils\/typography\.css['"];/);
  assert.match(
    css,
    /\.panel-tool-search::after\s*{[\s\S]*?height: var\(--dimension-stroke-width-012\);[\s\S]*?background-color: var\(--color-border-tertiary\);/,
  );
  assert.match(source, /<ds-divider[\s\S]*?orientation="vertical"/);
  assert.match(
    source,
    /<ds-button-unfilled[\s\S]*?icon="Filters"[\s\S]*?size="md"[\s\S]*?hasBorder={false}/,
  );
  assert.match(selectCss, /@import ['"]\.\.\/\.\.\/utils\/search-control\.css['"];/);
  assert.doesNotMatch(panelToolsCss, /background-color: var\(--color-background-(?:primary|secondary)\)/);
});
