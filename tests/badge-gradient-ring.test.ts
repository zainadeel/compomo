import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  badgeGradientPosition,
  parseCssBackgroundPosition,
} from '../src/wc/nav/badge-gradient-ring';

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
