const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

type FocusableAnchor = HTMLElement & {
  setFocus?: () => Promise<void> | void;
};

export interface AnchoredOverlayInteractionOptions {
  getAnchor: () => HTMLElement | null;
  getPopup: () => HTMLElement | null;
  onOutsideActivation: () => void;
}

function composedChildren(node: Node): Node[] {
  if (node instanceof HTMLSlotElement) {
    const assigned = node.assignedNodes({ flatten: true });
    return assigned.length > 0 ? assigned : Array.from(node.childNodes);
  }
  if (node instanceof Element && node.shadowRoot) {
    return Array.from(node.shadowRoot.childNodes);
  }
  return Array.from(node.childNodes);
}

function composedParent(node: Node): Node | null {
  if (node instanceof Element && node.assignedSlot) return node.assignedSlot;
  const parent = node.parentNode;
  return parent instanceof ShadowRoot ? parent.host : parent;
}

function hasComposedInertAncestor(element: HTMLElement): boolean {
  let current: Node | null = element;
  while (current) {
    if (current instanceof HTMLElement && current.inert) return true;
    current = composedParent(current);
  }
  return false;
}

function isTabbable(element: HTMLElement): boolean {
  if (!element.matches(FOCUSABLE_SELECTOR) || element.tabIndex < 0) return false;
  if (hasComposedInertAncestor(element) || element.getClientRects().length === 0) return false;
  return getComputedStyle(element).visibility !== 'hidden';
}

function composedFocusableElements(root: Node, excludedRoot?: HTMLElement | null): HTMLElement[] {
  const focusables: HTMLElement[] = [];
  const visited = new Set<Node>();
  const stack: Node[] = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    if (current === excludedRoot) continue;

    if (current instanceof HTMLElement && isTabbable(current)) focusables.push(current);
    const children = composedChildren(current);
    for (let index = children.length - 1; index >= 0; index -= 1) {
      stack.push(children[index]);
    }
  }

  const domOrder = new Map(focusables.map((element, index) => [element, index]));
  return focusables.sort((left, right) => {
    const leftTabIndex = left.tabIndex;
    const rightTabIndex = right.tabIndex;
    if (leftTabIndex > 0 || rightTabIndex > 0) {
      if (leftTabIndex === 0) return 1;
      if (rightTabIndex === 0) return -1;
      if (leftTabIndex !== rightTabIndex) return leftTabIndex - rightTabIndex;
    }
    return (domOrder.get(left) ?? 0) - (domOrder.get(right) ?? 0);
  });
}

/** Whether an event originated from a boundary, including through open shadow roots. */
export function eventIntersectsComposedBoundary(event: Event, boundary: HTMLElement): boolean {
  return event
    .composedPath()
    .some(node => node === boundary || (node instanceof Node && boundary.contains(node)));
}

/**
 * Owns the non-visual interaction boundary shared by externally anchored
 * overlays: composed outside activation, focus return, and Tab continuation.
 */
export class AnchoredOverlayInteractionController {
  private ownerDocument: Document | null = null;
  private readonly outsideHandler = (event: MouseEvent) => {
    const anchor = this.options.getAnchor();
    const popup = this.options.getPopup();
    if (
      (anchor && eventIntersectsComposedBoundary(event, anchor)) ||
      (popup && eventIntersectsComposedBoundary(event, popup))
    ) {
      return;
    }
    this.options.onOutsideActivation();
  };

  constructor(private readonly options: AnchoredOverlayInteractionOptions) {}

  connect(): void {
    this.disconnect();
    const boundary = this.options.getPopup() ?? this.options.getAnchor();
    this.ownerDocument = boundary?.ownerDocument ?? null;
    this.ownerDocument?.addEventListener('mousedown', this.outsideHandler, true);
  }

  disconnect(): void {
    this.ownerDocument?.removeEventListener('mousedown', this.outsideHandler, true);
    this.ownerDocument = null;
  }

  focusAnchor(): void {
    const anchor = this.options.getAnchor() as FocusableAnchor | null;
    if (anchor?.setFocus) {
      void anchor.setFocus();
      return;
    }
    this.anchorFocusTarget?.focus();
  }

  tabLeavesPopup(event: KeyboardEvent): boolean {
    const popup = this.options.getPopup();
    if (!popup) return true;
    const focusables = composedFocusableElements(popup);
    const currentIndex = focusables.findIndex(element =>
      event.composedPath().includes(element)
    );
    if (currentIndex < 0) return true;
    return event.shiftKey
      ? currentIndex === 0
      : currentIndex === focusables.length - 1;
  }

  moveFocusAfterTab(backwards: boolean): void {
    if (backwards) {
      this.focusAnchor();
      return;
    }

    const anchor = this.options.getAnchor();
    const anchorFocusTarget = this.anchorFocusTarget;
    if (!anchor || !anchorFocusTarget) return;
    const candidates = composedFocusableElements(anchor.ownerDocument, this.options.getPopup());
    const anchorIndex = candidates.indexOf(anchorFocusTarget);
    if (anchorIndex < 0 || candidates.length === 0) {
      this.focusAnchor();
      return;
    }
    candidates[(anchorIndex + 1) % candidates.length]?.focus();
  }

  private get anchorFocusTarget(): HTMLElement | null {
    const anchor = this.options.getAnchor();
    if (!anchor) return null;
    if (isTabbable(anchor)) return anchor;
    return composedFocusableElements(anchor)[0] ?? anchor;
  }
}
