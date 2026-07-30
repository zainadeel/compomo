import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('shared press utility owns scale, eligibility, motion, and reduced motion', () => {
  const css = read('src/wc/utils/control-press.css');

  assert.doesNotMatch(
    css,
    /\.ds-control-press-scale\s*{[^}]*\bscale\s*:/,
    'resting controls must not create a transformed containing block',
  );
  assert.match(css, /transition: scale var\(--effect-motion-short-2\)/);
  assert.match(
    css,
    /\.ds-control-press-scale:active:not\(:disabled\):not\(\.ds-control-inactive\):not\(\[aria-busy='true'\]\)\s*{[\s\S]*?scale: var\(--ds-control-press-active-scale, var\(--dimension-scale-subtle\)\)/,
  );
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)\s*{[\s\S]*?\.ds-control-press-scale:active:not\(:disabled\):not\(\.ds-control-inactive\):not\(\[aria-busy='true'\]\)[\s\S]*?scale: none;[\s\S]*?transition: none;/,
  );
  assert.doesNotMatch(css, /\btransform\s*:/);
});

test('only filled and unfilled buttons opt into press scaling', () => {
  const componentRoot = path.join(root, 'src/wc/components');
  const sourceFiles = fs
    .readdirSync(componentRoot, { recursive: true })
    .filter(file => typeof file === 'string' && file.endsWith('.tsx'));
  const consumers = sourceFiles
    .filter(file => read(path.join('src/wc/components', file)).includes("'ds-control-press-scale'"))
    .sort();

  assert.deepEqual(consumers, [
    'ButtonFilled/ButtonFilled.tsx',
    'ButtonUnfilled/ButtonUnfilled.tsx',
  ]);
});

test('policy matrix covers every authored interactive component', () => {
  const componentRoot = path.join(root, 'src/wc/components');
  const policy = read('docs/control-press-policy.md');
  const interactiveMarkup =
    /<(?:button|a|input|textarea|summary)\b|role=["'{](?:button|checkbox|radio|switch|slider|tab|option|menuitem)|tabIndex=|button,a,input,textarea/;

  const interactiveComponents = fs
    .readdirSync(componentRoot)
    .filter(component => {
      const sourcePath = path.join(componentRoot, component, `${component}.tsx`);
      return fs.existsSync(sourcePath) && interactiveMarkup.test(fs.readFileSync(sourcePath, 'utf8'));
    });

  for (const component of interactiveComponents) {
    assert.match(
      policy,
      new RegExp(`\\\`${component}\\\``),
      `${component} must select a physical-press policy in docs/control-press-policy.md`,
    );
  }

  // ChartLegend selects an interactive tag dynamically rather than with JSX
  // interactive markup, so keep it as an explicit audit target.
  assert.match(policy, /`ChartLegend`/);
});

test('component CSS cannot introduce local active scale or transform feedback', () => {
  const componentRoot = path.join(root, 'src/wc/components');
  const cssFiles = fs
    .readdirSync(componentRoot, { recursive: true })
    .filter(file => typeof file === 'string' && file.endsWith('.css'));

  for (const file of cssFiles) {
    const css = read(path.join('src/wc/components', file));
    assert.doesNotMatch(
      css,
      /:active[^{]*\{[^}]*(?:\bscale|\btransform)\s*:/s,
      `${file} must use the shared press policy or a documented component-specific exception`,
    );
  }
});

test('component scale declarations remain limited to documented non-press animation owners', () => {
  const componentRoot = path.join(root, 'src/wc/components');
  const cssFiles = fs
    .readdirSync(componentRoot, { recursive: true })
    .filter(file => typeof file === 'string' && file.endsWith('.css'));
  const scaleOwners = cssFiles
    .filter(file => /\b(?:scale|transform)\s*:[^;{}]*\bscale\(/.test(
      read(path.join('src/wc/components', file)),
    ))
    .sort();

  assert.deepEqual(scaleOwners, [
    'Modal/Modal.css',
    'SwatchPicker/SwatchPicker.css',
  ]);
});
