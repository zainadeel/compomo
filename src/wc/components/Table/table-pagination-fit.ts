export interface TableFitPageSizeInput {
  viewportBlockSize: number;
  headerBlockSize: number;
  itemBlockSize: number;
}

/** Resolve how many complete top-level rows or group headers fit below the column header. */
export function resolveTableFitPageSize(input: TableFitPageSizeInput): number | undefined {
  if (
    !Number.isFinite(input.viewportBlockSize) ||
    !Number.isFinite(input.headerBlockSize) ||
    !Number.isFinite(input.itemBlockSize) ||
    input.viewportBlockSize <= 0 ||
    input.itemBlockSize <= 0
  ) {
    return undefined;
  }
  const availableBlockSize = Math.max(0, input.viewportBlockSize - input.headerBlockSize);
  return Math.max(1, Math.floor((availableBlockSize + 0.5) / input.itemBlockSize));
}
