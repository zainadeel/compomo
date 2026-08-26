import { expect, type Locator } from '@playwright/test';

/** Covers ordinary fractional CSS-pixel rounding without masking a whole-pixel regression. */
export const SUBPIXEL_TOLERANCE_PX = 0.5;

/**
 * WebKit may report adjacent composited edges up to two CSS pixels apart while
 * a frame settles. Three pixels remains an exclusive ceiling for a visible gap.
 */
export const COMPOSITED_EDGE_CEILING_PX = 3;

type BoundsContract = {
  height?: number;
  label: string;
  tolerance?: number;
  width?: number;
};

type HitTargetContract = {
  label: string;
  minimumHeight: number;
  minimumWidth: number;
  tolerance?: number;
};

export function expectGeometryClose(
  actual: number,
  expected: number,
  label: string,
  tolerance = SUBPIXEL_TOLERANCE_PX
) {
  expect(
    Math.abs(actual - expected),
    `${label} differs by more than ${tolerance} CSS px`
  ).toBeLessThanOrEqual(tolerance);
}

export function expectGeometryBelow(actual: number, ceiling: number, label: string) {
  expect(actual, `${label} must remain below ${ceiling} CSS px`).toBeLessThan(ceiling);
}

export async function expectDefiniteBounds(locator: Locator, contract: BoundsContract) {
  await expect(locator, `${contract.label} must be visible`).toBeVisible();
  const bounds = await locator.boundingBox();
  expect(bounds, `${contract.label} must have rendered bounds`).not.toBeNull();
  if (!bounds) throw new Error(`${contract.label} did not produce rendered bounds`);

  expect(Number.isFinite(bounds.width), `${contract.label} width must be finite`).toBe(true);
  expect(Number.isFinite(bounds.height), `${contract.label} height must be finite`).toBe(true);
  expect(bounds.width, `${contract.label} width must be definite`).toBeGreaterThan(0);
  expect(bounds.height, `${contract.label} height must be definite`).toBeGreaterThan(0);

  if (contract.width !== undefined) {
    expectGeometryClose(
      bounds.width,
      contract.width,
      `${contract.label} width`,
      contract.tolerance
    );
  }
  if (contract.height !== undefined) {
    expectGeometryClose(
      bounds.height,
      contract.height,
      `${contract.label} height`,
      contract.tolerance
    );
  }

  return bounds;
}

export async function expectHitTarget(locator: Locator, contract: HitTargetContract) {
  const bounds = await expectDefiniteBounds(locator, { label: contract.label });
  const tolerance = contract.tolerance ?? SUBPIXEL_TOLERANCE_PX;
  expect(bounds.width, `${contract.label} hit width`).toBeGreaterThanOrEqual(
    contract.minimumWidth - tolerance
  );
  expect(bounds.height, `${contract.label} hit height`).toBeGreaterThanOrEqual(
    contract.minimumHeight - tolerance
  );
  return bounds;
}
