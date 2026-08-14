import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('chrome spacing defines matching padding and gap without owning size', () => {
  const css = read('src/wc/utils/chrome-layout.css');
  const recipes = {
    sm: '050',
    md: '100',
    lg: '200',
  } as const;

  for (const [size, token] of Object.entries(recipes)) {
    assert.match(
      css,
      new RegExp(
        `\\.ds-chrome-space--${size}[\\s\\S]*?--ds-chrome-padding: var\\(--dimension-space-${token}\\);[\\s\\S]*?--ds-chrome-gap: var\\(--dimension-space-${token}\\);`,
      ),
    );
  }

  assert.doesNotMatch(css, /(?:^|[;{]\s*)(?:min-|max-)?(?:width|height)\s*:/m);
  assert.match(css, /box-sizing: border-box/);
  assert.match(css, /\.ds-chrome-row[\s\S]*?flex-direction: row;[\s\S]*?align-items: center;/);
  assert.match(css, /\.ds-chrome-column[\s\S]*?flex-direction: column;/);
  assert.match(css, /\.ds-chrome-grid\s*{[\s\S]*?display: grid;[\s\S]*?align-items: center;/);
});

test('compact headers share one geometry and copy-zone anatomy', () => {
  const css = read('src/wc/utils/chrome-header.css');

  assert.match(css, /@import ['"]\.\/control-density\.css['"];/);

  assert.match(css, /\.ds-chrome-header\s*{[\s\S]*?min-block-size: var\(--dimension-size-600\);/);
  assert.match(css, /\.ds-chrome-header\s*{[\s\S]*?padding: var\(--dimension-space-100\);[\s\S]*?gap: var\(--dimension-space-100\);/);
  assert.match(css, /\.ds-chrome-header--bounded\s*{[\s\S]*?border-block-end: var\(--dimension-stroke-width-012\) solid var\(--color-border-tertiary\);/);
  assert.match(css, /\.ds-chrome-header__copy\s*{[\s\S]*?padding: var\(--ds-control-padding-inline, var\(--dimension-space-075\)\);/);
  assert.match(css, /\.ds-chrome-header__heading,[\s\S]*?\.ds-chrome-header__description\s*{[\s\S]*?padding-inline: var\(--ds-control-label-inset, var\(--dimension-space-025\)\);/);
  assert.match(css, /\.ds-chrome-header__copy--wrapping\s*{[\s\S]*?column-gap: var\(--dimension-space-100\);[\s\S]*?row-gap: var\(--dimension-space-050\);/);
  assert.match(css, /\.ds-chrome-header__copy--stacked\s*{[\s\S]*?flex-direction: column;[\s\S]*?gap: var\(--dimension-space-050\);/);

  assert.match(
    read('src/wc/components/Banner/Banner.tsx'),
    /banner-copy ds-chrome-header__copy ds-chrome-header__copy--wrapping ds-control--md/,
  );
  assert.match(
    read('src/wc/components/Modal/Modal.tsx'),
    /modal-copy ds-chrome-header__copy ds-chrome-header__copy--stacked ds-control--md/,
  );

  const consumers = {
    Banner: /banner-surface ds-chrome-header ds-chrome-header--wrapping/,
    Modal: /modal-header ds-chrome-header ds-chrome-header--bounded/,
    PanelToolHeader: /panel-tool-header ds-chrome-header ds-chrome-header--bounded/,
    BarTitle: /'ds-chrome-header': compact/,
    CardChart: /card-chart__header ds-chrome-header/,
    CardSetting: /card-setting__header ds-chrome-header/,
    Table: /ds-table__footer ds-table__bar ds-chrome-header ds-control--md/,
  } as const;

  for (const [component, contract] of Object.entries(consumers)) {
    const source = read(`src/wc/components/${component}/${component}.tsx`);
    assert.match(source, contract, component);
    assert.match(
      read(`src/wc/components/${component}/${component}.css`),
      /@import ['"]\.\.\/\.\.\/utils\/chrome-header\.css['"];/,
      component,
    );
  }
});

test('migrated chrome consumes shared recipes while retaining nested rhythms', () => {
  const migrations = [
    ['src/wc/components/BarWorkflow/BarWorkflow.tsx', /bar-workflow ds-chrome-row ds-chrome-space--md/],
    ['src/wc/components/BarAction/BarAction.tsx', /ds-chrome-row ds-chrome-space--md ds-control-elevation ds-control-elevation--md/],
    ['src/wc/components/PanelToolSearch/PanelToolSearch.tsx', /panel-tool-search ds-chrome-row ds-chrome-space--md/],
    ['src/wc/components/MobileHeader/MobileHeader.tsx', /mobile-header__primary ds-chrome-grid ds-chrome-space--md/],
    ['src/wc/components/MobileSheetNav/MobileSheetNav.tsx', /mobile-sheet-nav__header ds-chrome-grid ds-chrome-space--md/],
    ['src/wc/components/MobileBarNav/MobileBarNav.tsx', /mobile-bar-nav ds-chrome-row ds-chrome-space--md/],
  ] as const;

  for (const [sourcePath, contract] of migrations) {
    assert.match(read(sourcePath), contract, sourcePath);
  }

  const panelTools = read('src/wc/components/PanelTools/PanelTools.tsx');
  assert.match(panelTools, /'panel-tools__rail-body': true/);
  assert.match(panelTools, /'ds-chrome-column': true/);
  assert.match(panelTools, /'ds-chrome-space--md': true/);
  assert.match(panelTools, /class="panel-tools__rail-actions"/);

  const panelNav = read('src/wc/components/PanelNav/PanelNav.tsx');
  assert.match(panelNav, /'ds-chrome-column': true/);
  assert.match(panelNav, /class="panel-nav__sections"/);

  const mobileSheetNav = read('src/wc/components/MobileSheetNav/MobileSheetNav.tsx');
  const mobileSheetNavCss = read('src/wc/components/MobileSheetNav/MobileSheetNav.css');
  assert.match(mobileSheetNav, /class="mobile-sheet-nav__sections"/);
  assert.match(
    mobileSheetNav,
    /this\.groups[\s\S]*?\.filter\(group => group\.items\.length > 0\)[\s\S]*?group\.items\.map/,
  );
  assert.match(
    mobileSheetNavCss,
    /\.mobile-sheet-nav__sections\s*{[\s\S]*?gap: var\(--dimension-space-400\);/,
  );
  assert.match(
    mobileSheetNavCss,
    /\.mobile-sheet-nav__items\s*{[\s\S]*?gap: var\(--dimension-space-100\);/,
  );

  const modal = read('src/wc/components/Modal/Modal.tsx');
  assert.match(modal, /modal-header ds-chrome-header ds-chrome-header--bounded/);
  assert.match(modal, /modal-copy ds-chrome-header__copy ds-chrome-header__copy--stacked/);
  assert.match(modal, /variant="text-title-small"/);
  assert.match(modal, /class="modal-footer__actions"/);
});

test('choice sections migrate last to the shared sm column recipe', () => {
  for (const component of ['Menu', 'Select']) {
    const source = read(`src/wc/components/${component}/${component}.tsx`);
    assert.match(source, /'ds-choice-section': true,[\s\S]*?'ds-chrome-column': true,[\s\S]*?'ds-chrome-space--sm': true/);
  }

  const css = read('src/wc/utils/choice-list.css');
  assert.match(css, /@import ['"]\.\/chrome-layout\.css['"];/);
  assert.doesNotMatch(css, /\.ds-choice-section\s*{[^}]*(?:gap|padding):/);
});

test('mobile shell owns the top safe area while the primary bottom bar owns the bottom', () => {
  const shellCss = read('src/wc/components/ShellApp/ShellApp.css');
  const mobileBarCss = read('src/wc/components/MobileBarNav/MobileBarNav.css');

  assert.match(
    shellCss,
    /:host\(\.shell-app--mobile\)\s*{[\s\S]*?padding-block-start: env\(safe-area-inset-top\);/,
  );
  assert.doesNotMatch(
    shellCss,
    /:host\(\.shell-app--mobile\) \.shell-app__main\s*{[^}]*padding-block-start:/,
  );
  assert.match(
    mobileBarCss,
    /\.mobile-bar-nav\s*{[\s\S]*?padding-block-end: max\(var\(--ds-chrome-padding\), env\(safe-area-inset-bottom\)\);[\s\S]*?background: var\(--color-background-primary\);/,
  );
});
