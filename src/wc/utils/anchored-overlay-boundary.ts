import type { AnchoredCollisionRect } from './anchored-position';

/** Attribute placed on a page or panel whose visible rectangle owns anchored overlays. */
export const ANCHORED_OVERLAY_BOUNDARY_ATTRIBUTE = 'data-ds-overlay-boundary';

function composedParentElement(element: Element): Element | null {
  if (element.assignedSlot) return element.assignedSlot;
  if (element.parentElement) return element.parentElement;
  const root = element.getRootNode();
  return root instanceof ShadowRoot ? root.host : null;
}

/**
 * Find the nearest collision owner through light DOM, assigned slots, and open
 * shadow roots. The popup may live in the top layer or a body portal; ownership
 * follows its anchor instead of the popup's rendering location.
 */
export function findAnchoredOverlayBoundary(anchor: Element): HTMLElement | null {
  let current: Element | null = anchor;
  while (current) {
    if (
      current instanceof HTMLElement &&
      current.hasAttribute(ANCHORED_OVERLAY_BOUNDARY_ATTRIBUTE)
    ) {
      return current;
    }
    current = composedParentElement(current);
  }
  return null;
}

/** Resolve an explicit owner first, then the nearest composed-tree boundary. */
export function resolveAnchoredOverlayBoundaryRect(
  anchor: Element,
  explicitBoundary?: HTMLElement,
): AnchoredCollisionRect | undefined {
  return (explicitBoundary ?? findAnchoredOverlayBoundary(anchor))?.getBoundingClientRect();
}
