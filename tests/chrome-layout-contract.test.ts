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

test('CardSetting pilots md row chrome while retaining explicit 48px ownership', () => {
  const source = read('src/wc/components/CardSetting/CardSetting.tsx');
  const css = read('src/wc/components/CardSetting/CardSetting.css');

  assert.match(source, /card-setting__header ds-chrome-row ds-chrome-space--md/);
  assert.match(css, /@import ['"]\.\.\/\.\.\/utils\/chrome-layout\.css['"];/);
  assert.match(
    css,
    /\.card-setting__header\s*{[\s\S]*?height: var\(--dimension-size-600\);/,
  );
  assert.doesNotMatch(
    css,
    /\.card-setting__header\s*{[^}]*(?:padding|gap): var\(--dimension-space-100\);/,
  );
});

test('migrated chrome consumes shared recipes while retaining nested rhythms', () => {
  const migrations = [
    ['src/wc/components/CardShellDataViz/CardShellDataViz.tsx', /card-shell-data-viz__header ds-chrome-row ds-chrome-space--md/],
    ['src/wc/components/BarWorkflow/BarWorkflow.tsx', /bar-workflow ds-chrome-row ds-chrome-space--md/],
    ['src/wc/components/PanelToolSearch/PanelToolSearch.tsx', /panel-tool-search ds-chrome-row ds-chrome-space--md/],
    ['src/wc/components/PanelToolHeader/PanelToolHeader.tsx', /panel-tool-header ds-chrome-row ds-chrome-space--md/],
    ['src/wc/components/MobileHeader/MobileHeader.tsx', /mobile-header__primary ds-chrome-grid ds-chrome-space--md/],
    ['src/wc/components/MobileSheetNav/MobileSheetNav.tsx', /mobile-sheet-nav__header ds-chrome-grid ds-chrome-space--md/],
    ['src/wc/components/MobileBarNav/MobileBarNav.tsx', /mobile-bar-nav ds-chrome-row ds-chrome-space--md/],
  ] as const;

  for (const [sourcePath, contract] of migrations) {
    assert.match(read(sourcePath), contract, sourcePath);
  }

  const panelTools = read('src/wc/components/PanelTools/PanelTools.tsx');
  assert.match(panelTools, /panel-tools__rail-body ds-chrome-column ds-chrome-space--md/);
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
  assert.match(modal, /modal-header ds-chrome-row ds-chrome-space--lg/);
  assert.match(modal, /class="modal-footer__actions"/);
});

test('choice sections migrate last to the shared sm column recipe', () => {
  for (const component of ['Menu', 'Select', 'SelectMulti']) {
    const source = read(`src/wc/components/${component}/${component}.tsx`);
    assert.match(source, /'ds-choice-section': true,[\s\S]*?'ds-chrome-column': true,[\s\S]*?'ds-chrome-space--sm': true/);
  }

  const css = read('src/wc/utils/choice-list.css');
  assert.match(css, /@import ['"]\.\/chrome-layout\.css['"];/);
  assert.doesNotMatch(css, /\.ds-choice-section\s*{[^}]*(?:gap|padding):/);
});

test('mobile shell owns the top safe area while the secondary bottom bar owns the bottom', () => {
  const shellCss = read('src/wc/components/ShellApp/ShellApp.css');
  const mobileBarCss = read('src/wc/components/MobileBarNav/MobileBarNav.css');

  assert.match(
    shellCss,
    /:host\(\.shell-app--mobile\) \.shell-app__main\s*{[\s\S]*?padding-block-start: env\(safe-area-inset-top\);[\s\S]*?box-sizing: border-box;/,
  );
  assert.match(
    mobileBarCss,
    /\.mobile-bar-nav\s*{[\s\S]*?padding-block-end: max\(var\(--ds-chrome-padding\), env\(safe-area-inset-bottom\)\);[\s\S]*?background: var\(--color-background-secondary\);/,
  );
});
