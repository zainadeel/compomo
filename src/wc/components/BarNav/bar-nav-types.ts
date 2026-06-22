import type { TabItem } from '../TabGroup/tab-item-utils';

export type BarNavTab = TabItem;

export interface BarNavActionItem {
  id: string;
  /** Icon name for <ds-icon>. */
  icon: string;
  /** Whether this action button is currently pressed/active. */
  selected?: boolean;
  /** Show a notification dot. */
  dot?: boolean;
  inactive?: boolean;
  ariaLabel?: string;
}
