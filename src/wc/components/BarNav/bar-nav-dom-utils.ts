export type QueryableHost = {
  shadowRoot?: ShadowRoot | null;
  querySelector: (selectors: string) => Element | null;
};

/**
 * Query within a Stencil custom-element host (light DOM today, shadow DOM–safe).
 * Use for child nodes owned by ds-tab-group and similar components.
 */
export function queryWithinComponentHost(
  host: QueryableHost | null | undefined,
  selector: string,
): HTMLElement | null {
  if (!host) return null;
  const root = host.shadowRoot ?? host;
  return root.querySelector(selector) as HTMLElement | null;
}

export function getTabListFromTabGroup(
  tabGroupEl: QueryableHost | null | undefined,
): HTMLElement | null {
  return queryWithinComponentHost(tabGroupEl, '[role="tablist"]');
}
