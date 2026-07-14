import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCssTimeMs,
  prefersReducedMotion,
  resolveCssTimeMs,
  resolveMotionTimeMs,
} from '../src/wc/utils/resolve-css-time-ms';
import { TOKEN_DEFAULTS } from '../src/wc/utils/token-defaults';

describe('parseCssTimeMs', () => {
  it('parses millisecond values', () => {
    assert.equal(parseCssTimeMs('200ms', 0), 200);
    assert.equal(parseCssTimeMs('0ms', 99), 0);
  });

  it('parses second values', () => {
    assert.equal(parseCssTimeMs('0.75s', 0), 750);
    assert.equal(parseCssTimeMs('1s', 0), 1000);
  });

  it('reads the first token from motion shorthand', () => {
    assert.equal(parseCssTimeMs('200ms ease-in-out', 0), 200);
    assert.equal(parseCssTimeMs('300ms cubic-bezier(0,0,1,1)', 0), 300);
  });

  it('returns fallback for invalid values', () => {
    assert.equal(parseCssTimeMs('', 120), 120);
    assert.equal(parseCssTimeMs('not-a-time', 42), 42);
  });
});

describe('resolveCssTimeMs', () => {
  const originalGetComputedStyle = globalThis.getComputedStyle;
  const originalDocument = globalThis.document;

  before(() => {
    if (typeof globalThis.document === 'undefined') {
      globalThis.document = { documentElement: {} } as Document;
    }

    globalThis.getComputedStyle = (() => {
      const tokenValues: Record<string, string> = {
        [TOKEN_DEFAULTS.animationDurationShort3]: '200ms',
        [TOKEN_DEFAULTS.motionShort3]: '200ms ease-in-out',
        [TOKEN_DEFAULTS.animationDelayMedium1]: '500ms',
      };

      return {
        getPropertyValue: (name: string) => tokenValues[name] ?? '',
      } as CSSStyleDeclaration;
    }) as typeof getComputedStyle;
  });

  after(() => {
    globalThis.getComputedStyle = originalGetComputedStyle;
    if (originalDocument === undefined) {
      // @ts-expect-error restore non-DOM test environment
      delete globalThis.document;
    } else {
      globalThis.document = originalDocument;
    }
  });

  it('passes numbers through unchanged', () => {
    assert.equal(resolveCssTimeMs(600, TOKEN_DEFAULTS.animationDelayMedium1), 600);
  });

  it('parses raw time strings', () => {
    assert.equal(resolveCssTimeMs('0.75s', TOKEN_DEFAULTS.animationDurationShort3), 750);
  });

  it('resolves var(--effect-motion-short-3) from computed style', () => {
    assert.equal(
      resolveCssTimeMs(TOKEN_DEFAULTS.motionShort3, TOKEN_DEFAULTS.animationDurationShort3),
      200,
    );
  });

  it('resolves var(--effect-animation-delay-medium-1) from computed style', () => {
    assert.equal(
      resolveCssTimeMs(TOKEN_DEFAULTS.animationDelayMedium1, TOKEN_DEFAULTS.animationDelayMedium1),
      500,
    );
  });
});

describe('reduced motion helpers', () => {
  const originalWindow = globalThis.window;

  after(() => {
    if (originalWindow === undefined) {
      // @ts-expect-error restore non-DOM test environment
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  });

  it('detects the reduced-motion media query and zeroes motion durations', () => {
    globalThis.window = {
      matchMedia: (query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
      }),
    } as Window & typeof globalThis;

    assert.equal(prefersReducedMotion(), true);
    assert.equal(resolveMotionTimeMs(600, TOKEN_DEFAULTS.animationDelayMedium1), 0);
  });

  it('preserves resolved durations when reduced motion is not requested', () => {
    globalThis.window = {
      matchMedia: () => ({ matches: false }),
    } as Window & typeof globalThis;

    assert.equal(prefersReducedMotion(), false);
    assert.equal(resolveMotionTimeMs(600, TOKEN_DEFAULTS.animationDelayMedium1), 600);
  });
});
