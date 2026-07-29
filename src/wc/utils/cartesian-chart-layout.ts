import { resolveCssLengthPx } from './resolve-css-length-px';
import { TOKEN_DEFAULTS } from './token-defaults';

export interface CartesianChartLayout {
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  axisLabelGap: number;
  categoryLabelOffset: number;
}

/** Resolve shared Cartesian chart geometry from TokoMo dimension tokens. */
export function resolveCartesianChartLayout(): CartesianChartLayout {
  const space100 = resolveCssLengthPx(TOKEN_DEFAULTS.space100, 8);
  const space200 = resolveCssLengthPx(TOKEN_DEFAULTS.space200, 16);

  return {
    margin: {
      top: space200,
      right: space200,
      bottom: resolveCssLengthPx(TOKEN_DEFAULTS.space300, 24),
      left: resolveCssLengthPx(TOKEN_DEFAULTS.space400, 32),
    },
    axisLabelGap: space100,
    categoryLabelOffset: space200,
  };
}
