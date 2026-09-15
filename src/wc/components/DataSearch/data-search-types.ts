export interface DataSearchField {
  /** Stable application-owned field identity used to scope filtering. */
  id: string;
  /** Visible field label shown in the slash menu and selected Tag. */
  label: string;
}

export interface DataSearchFieldsChangeDetail {
  selectedFieldIds: string[];
}
