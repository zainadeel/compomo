import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SHELL_BAR_NAV_VT_NAME,
  SHELL_NAV_REVEAL_DURATION_VAR,
  SHELL_NAV_REVEAL_EASING_VAR,
  animateShellNavRadialReveal,
  ensureShellNavVtStyle,
  runShellNavStyleRevealOnReady,
} from '../src/wc/nav/shell-view-transition';

describe('SHELL_BAR_NAV_VT_NAME', () => {
  it('matches ds-bar-nav view-transition-name', () => {
    assert.equal(SHELL_BAR_NAV_VT_NAME, 'ds-shell-bar-nav');
  });
});

describe('shell nav reveal motion tokens', () => {
  it('uses medium-3 duration and ease-in-out easing vars', () => {
    assert.equal(SHELL_NAV_REVEAL_DURATION_VAR, '--effect-animation-duration-medium-3');
    assert.equal(SHELL_NAV_REVEAL_EASING_VAR, '--effect-animation-easing-ease-in-out');
  });
});

describe('ensureShellNavVtStyle', () => {
  it('pins new bar-nav snapshot to a zero-radius circle for WAAPI reveal', () => {
    const styles: { id: string; textContent: string }[] = [];
    const doc = {
      getElementById: (id: string) => styles.find(s => s.id === id) ?? null,
      createElement: () => ({ id: '', textContent: '' }),
      head: {
        appendChild(el: { id: string; textContent: string }) {
          styles.push(el);
        },
      },
    };
    (globalThis as { document?: typeof doc }).document = doc;
    ensureShellNavVtStyle();
    const css = styles[0]?.textContent ?? '';
    assert.match(css, /view-transition-new\(ds-shell-bar-nav\)\{z-index:2;clip-path:circle\(0px/);
    assert.match(css, /view-transition-old\(ds-shell-bar-nav\)\{z-index:1\}/);
    delete (globalThis as { document?: typeof doc }).document;
  });

  it('leaves snapshots at their final state and skips WAAPI under reduced motion', () => {
    const styles: { id: string; textContent: string }[] = [];
    let animationCount = 0;
    const doc = {
      documentElement: {
        animate: () => { animationCount += 1; },
      },
      getElementById: (id: string) => styles.find(s => s.id === id) ?? null,
      createElement: () => ({ id: '', textContent: '' }),
      head: {
        appendChild(el: { id: string; textContent: string }) {
          styles.push(el);
        },
      },
    };
    const win = {
      matchMedia: () => ({ matches: true }),
    };
    (globalThis as { document?: typeof doc }).document = doc;
    (globalThis as { window?: typeof win }).window = win;

    runShellNavStyleRevealOnReady({ ready: Promise.resolve() });

    assert.doesNotMatch(styles[0]?.textContent ?? '', /clip-path:circle\(0px/);
    assert.equal(animationCount, 0);
    delete (globalThis as { document?: typeof doc }).document;
    delete (globalThis as { window?: typeof win }).window;
  });

  it('removes a pending reveal clip if motion preference changes before animation', () => {
    const styles: { id: string; textContent: string }[] = [];
    let reduceMotion = false;
    let animationCount = 0;
    const doc = {
      documentElement: {
        animate: () => { animationCount += 1; },
      },
      getElementById: (id: string) => styles.find(s => s.id === id) ?? null,
      createElement: () => ({ id: '', textContent: '' }),
      head: {
        appendChild(el: { id: string; textContent: string }) {
          styles.push(el);
        },
      },
    };
    const win = {
      matchMedia: () => ({ matches: reduceMotion }),
    };
    (globalThis as { document?: typeof doc }).document = doc;
    (globalThis as { window?: typeof win }).window = win;

    ensureShellNavVtStyle();
    assert.match(styles[0]?.textContent ?? '', /clip-path:circle\(0px/);
    reduceMotion = true;
    animateShellNavRadialReveal({ x: 0, y: 0, maxRadius: 100 });

    assert.doesNotMatch(styles[0]?.textContent ?? '', /clip-path:circle\(0px/);
    assert.equal(animationCount, 0);
    delete (globalThis as { document?: typeof doc }).document;
    delete (globalThis as { window?: typeof win }).window;
  });
});
