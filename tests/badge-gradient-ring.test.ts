import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  badgeGradientPosition,
  findGradientSurface,
  isShellGradientActive,
  parseCssBackgroundPosition,
  BADGE_GRADIENT_POSITION_VAR,
  syncBadgeGradientPosition,
} from '../src/wc/shell/badge-gradient-ring';
import { SHELL_GRADIENT_POSITION_BAR_VAR } from '../src/wc/shell/shell-gradient';

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

  it('returns true when ancestor shell has a wash preset', () => {
    const shell = { getAttribute: (name: string) => name === 'gradient-preset' ? 'neutral' : null };
    const el = {
      closest: (tag: string) => (tag === 'ds-app-shell' ? shell : null),
    } as unknown as HTMLElement;
    assert.equal(isShellGradientActive(el), true);
  });

  it('returns false when ancestor shell uses solid chrome', () => {
    const shell = { getAttribute: () => 'none' };
    const el = {
      closest: (tag: string) => (tag === 'ds-app-shell' ? shell : null),
    } as unknown as HTMLElement;
    assert.equal(isShellGradientActive(el), false);
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
  it('stamps 0 0 when gradient shell is active', () => {
    const badgeHost = {
      style: { getPropertyValue: () => '', setProperty: () => {}, removeProperty: () => {} },
      closest: (tag: string) =>
        tag === 'ds-app-shell' ? { getAttribute: () => 'neutral' } : null,
    } as unknown as HTMLElement;

    const setCalls: string[] = [];
    badgeHost.style.setProperty = (name: string, value: string) => {
      setCalls.push(`${name}=${value}`);
    };

    syncBadgeGradientPosition(badgeHost);
    assert.equal(setCalls.length, 1);
    assert.equal(setCalls[0], '--_badge-gradient-position=0 0');
  });

  it('clears position outside a gradient shell', () => {
    const badgeHost = {
      style: { getPropertyValue: () => '', setProperty: () => {}, removeProperty: () => {} },
      closest: () => null,
    } as unknown as HTMLElement;

    let removed = false;
    badgeHost.style.removeProperty = () => {
      removed = true;
    };

    syncBadgeGradientPosition(badgeHost);
    assert.equal(removed, true);
  });
});
