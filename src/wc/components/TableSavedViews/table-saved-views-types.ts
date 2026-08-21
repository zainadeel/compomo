export interface TableSavedView {
  id: string;
  label: string;
}

export interface TableSavedViewChangeDetail {
  viewId: string;
}

export interface TableSavedViewCreateDetail {
  name: string;
}

export interface TableSavedViewRenameDetail {
  viewId: string;
  name: string;
}

export interface TableSavedViewRemoveDetail {
  viewId: string;
}

export interface TableSavedViewSaveDetail {
  viewId: string;
}

export interface TableSavedViewDiscardDetail {
  viewId: string;
}
