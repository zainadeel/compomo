export interface PanelSubNavItem {
  /** Unique tab id. Also used by the controlled panel's aria-labelledby. */
  id: string;
  label: string;
  /** ID of the tabpanel controlled by this item. */
  panelId: string;
  /** Prevent selection and remove the item from keyboard navigation. */
  isInactive?: boolean;
}
