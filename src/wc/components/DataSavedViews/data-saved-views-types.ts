export interface DataSavedView {
  id: string;
  label: string;
}

export interface DataSavedViewChangeDetail {
  viewId: string;
}

export interface DataSavedViewCreateDetail {
  name: string;
}

export interface DataSavedViewRenameDetail {
  viewId: string;
  name: string;
}

export interface DataSavedViewRemoveDetail {
  viewId: string;
}

export interface DataSavedViewSaveDetail {
  viewId: string;
}

export interface DataSavedViewDiscardDetail {
  viewId: string;
}
