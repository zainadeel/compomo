const DIRECTIONAL_TAGS = new Set([
  'DS-SELECT',
  'DS-MENU',
  'DS-FILTER-MENU',
  'INPUT',
  'SELECT',
  'TEXTAREA',
]);

const DIRECTIONAL_ROLES = new Set(['slider', 'combobox', 'listbox']);

interface ShortcutPathNode {
  tagName?: string;
  nodeType?: number;
  isContentEditable?: boolean;
  assignedSlot?: unknown;
  parentNode?: unknown;
  getRootNode?: () => unknown;
  getAttribute?: (name: string) => string | null;
}

/** True when Left/Right should stay with an editable or choice control. */
export function paginationShortcutBlockedByPath(path: readonly unknown[]): boolean {
  return path.some(node => {
    if (!node || typeof node !== 'object') return false;
    const element = node as ShortcutPathNode;
    if (element.tagName && DIRECTIONAL_TAGS.has(element.tagName)) return true;
    if (element.isContentEditable) return true;
    const role = element.getAttribute?.('role');
    return role != null && DIRECTIONAL_ROLES.has(role);
  });
}

export function isDocumentRootNode(node: unknown): boolean {
  if (!node || typeof node !== 'object') return false;
  const element = node as ShortcutPathNode;
  if (element.nodeType === 9) return true;
  return element.tagName === 'BODY' || element.tagName === 'HTML';
}

/** True when `ancestor` contains `descendant` in the composed tree, including slots. */
export function composedContains(ancestor: unknown, descendant: unknown): boolean {
  if (!ancestor || !descendant || ancestor === descendant) return false;
  const seen = new Set<unknown>();
  let current: unknown = descendant;
  while (current && !seen.has(current)) {
    seen.add(current);
    if (current === ancestor) return true;
    current = composedParent(current);
  }
  return false;
}

/**
 * Window-level pagination arrows apply when focus is inside the table or on a
 * containing page scroller (for example ShellApp's routed-content region).
 * Document body stays with the host app so it can forward a single event.
 */
export function shouldHandleContainingPagePaginationShortcut(input: {
  origin: unknown;
  table: unknown;
  eventPath: readonly unknown[];
}): boolean {
  if (isDocumentRootNode(input.origin)) return false;
  if (input.eventPath.includes(input.table) || composedContains(input.table, input.origin)) {
    return true;
  }
  return composedContains(input.origin, input.table);
}

function composedParent(node: unknown): unknown {
  if (!node || typeof node !== 'object') return null;
  if (typeof ShadowRoot !== 'undefined' && node instanceof ShadowRoot) {
    return node.host;
  }
  const element = node as ShortcutPathNode;
  if (element.assignedSlot) return element.assignedSlot;
  if (element.parentNode) return element.parentNode;
  const root = element.getRootNode?.();
  if (root && typeof root === 'object' && 'host' in root) {
    return (root as { host?: unknown }).host ?? null;
  }
  return null;
}
