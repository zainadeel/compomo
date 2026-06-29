import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  badgeGradientPosition,
  findGradientSurface,
  isShellGradientActive,
  parseCssBackgroundPosition,
  BADGE_GRADIENT_POSITION_VAR,
  syncBadgeGradientPosition,
} from '../src/wc/nav/badge-gradient-ring';
import { SHELL_GRADIENT_POSITION_BAR_VAR } from '../src/wc/nav/shell-gradient';

describe('parseCssBackgroundPosition', () => {
  it('parses pixel pairs', () => {
    assert.deepEqual(parseCssBackgroundPosition('-200px 0'), { x: -200, y: 0 });
    assert.deepEqual(parseCssBackgroundPosition('12px -4px'), { x: 12, y: -4 });
  });

  it('defaults missing values to zero', () => {
    assert.deepEqual(parseCssBackgroundPosition(''), { x: 0, y: 0 });
    assert.deepEqual(parseCssBackgroundPosition('-8px'), { x: -8, y: 0 });
  });
});

describe('badgeGradientPosition', () => {
  it('offsets shell position by badge center within the chrome surface', () => {
    const badgeHost = {
      getBoundingClientRect: () => ({
        left: 1100,
        top: 20,
        width: 6,
        height: 6,
        right: 1106,
        bottom: 26,
      }),
    } as HTMLElement;

    const surface = {
      element: {
        getBoundingClientRect: () => ({
          left: 1000,
          top: 0,
          width: 800,
          height: 48,
          right: 1800,
          bottom: 48,
        }),
      },
      chromeHost: {} as HTMLElement,
      positionVar: '--ds-shell-gradient-position-bar',
    };

    const position = badgeGradientPosition(badgeHost, surface, '-200px 0');
    assert.equal(position, '-303px -23px');
  });
});

describe('isShellGradientActive', () => {
  it('returns false without a gradient shell ancestor', () => {
    const el = { closest: () => null } as unknown as HTMLElement;
    assert.equal(isShellGradientActive(el), false);
  });

  it('returns true when ancestor shell has gradient', () => {
    const shell = { hasAttribute: (name: string) => name === 'gradient' };
    const el = {
      closest: (tag: string) => (tag === 'ds-app-shell' ? shell : null),
    } as unknown as HTMLElement;
    assert.equal(isShellGradientActive(el), true);
  });
});

describe('findGradientSurface', () => {
  it('finds .bar-nav in light DOM when shadowRoot is absent', () => {
    const barNav = {} as HTMLElement;
    const host = {
      shadowRoot: null,
      querySelector: (sel: string) => (sel === '.bar-nav' ? barNav : null),
    } as unknown as HTMLElement;

    const badge = {
      closest: (tag: string) => (tag === 'ds-bar-nav' ? host : null),
    } as unknown as HTMLElement;

    const surface = findGradientSurface(badge);
    assert.ok(surface);
    assert.equal(surface!.element, barNav);
    assert.equal(surface!.chromeHost, host);
    assert.equal(surface!.positionVar, SHELL_GRADIENT_POSITION_BAR_VAR);
  });
});

describe('syncBadgeGradientPosition', () => {
  it('stamps --_badge-gradient-position when chrome surface resolves', () => {
    const barSurface = {
      getBoundingClientRect: () => ({
        left: 200,
        top: 0,
        width: 800,
        height: 48,
        right: 1000,
        bottom: 48,
      }),
    } as HTMLElement;

    const barNav = {
      shadowRoot: null,
      querySelector: () => barSurface,
    } as unknown as HTMLElement;

    const badgeHost = {
      style: { getPropertyValue: () => '', setProperty: () => {}, removeProperty: () => {} },
      closest: (tag: string) => (tag === 'ds-bar-nav' ? barNav : null),
      getBoundingClientRect: () => ({
        left: 1100,
        top: 20,
        width: 6,
        height: 6,
        right: 1106,
        bottom: 26,
      }),
    } as unknown as HTMLElement;

    const setCalls: string[] = [];
    badgeHost.style.setProperty = (name: string, value: string) => {
      setCalls.push(`${name}=${value}`);
    };

    const originalGetComputedStyle = globalThis.getComputedStyle;
    globalThis.getComputedStyle = ((el: Element) => {
      if (el === barNav) {
        return {
          getPropertyValue: (name: string) =>
            name === SHELL_GRADIENT_POSITION_BAR_VAR ? '-200px 0' : '',
        } as CSSStyleDeclaration;
      }
      return originalGetComputedStyle(el);
    }) as typeof getComputedStyle;

    try {
      syncBadgeGradientPosition(badgeHost);
      assert.equal(setCalls.length, 1);
      assert.equal(setCalls[0], '--_badge-gradient-position=-1103px -23px');
    } finally {
      globalThis.getComputedStyle = originalGetComputedStyle;
    }
  });
});
