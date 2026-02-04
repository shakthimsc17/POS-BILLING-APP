export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const A4_MARGIN_MM = 10;
/** Gap (mm) between label edge and dotted cut line for cutting guide */
export const CUT_GAP_MM = 3;

export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;
export const A4_MARGIN_PX = 38;

export interface GridLayout {
  rows: number;
  cols: number;
  labelWidth: number;
  labelHeight: number;
}

export function countPagesForLabels(
  totalLabels: number,
  labelWidthMm: number,
  labelHeightMm: number
): number {
  const margin = A4_MARGIN_MM;
  const spacing = 2;
  const availableWidth = A4_WIDTH_MM - margin * 2;
  const availableHeight = A4_HEIGHT_MM - margin * 2;
  const maxCols = Math.floor((availableWidth + spacing) / (labelWidthMm + spacing));
  const maxRows = Math.floor((availableHeight + spacing) / (labelHeightMm + spacing));
  const labelsPerPage = maxCols * maxRows;
  if (labelsPerPage <= 0) return 1;
  return Math.ceil(totalLabels / labelsPerPage);
}

/** Flatten to one array of { barcode, x, y, width, height } and group by page (A4). */
export function getLabelsGroupedByPage<T extends { labelSize?: { width: number; height: number }; numberOfLabels: number }>(
  barcodes: T[]
): { pageIndex: number; labels: { barcode: T; x: number; y: number; width: number; height: number }[] }[] {
  const margin = A4_MARGIN_MM;
  const spacing = 2;
  const pages: { pageIndex: number; labels: { barcode: T; x: number; y: number; width: number; height: number }[] }[] = [];
  let currentPage: { barcode: T; x: number; y: number; width: number; height: number }[] = [];
  let currentY = margin;
  let currentX = margin;
  let pageIndex = 0;

  for (const barcode of barcodes) {
    const labelWidth = barcode.labelSize?.width ?? 80;
    const labelHeight = barcode.labelSize?.height ?? 50;
    const rowHeight = labelHeight + spacing;

    for (let i = 0; i < barcode.numberOfLabels; i++) {
      if (currentY + labelHeight > A4_HEIGHT_MM - margin) {
        pages.push({ pageIndex, labels: currentPage });
        currentPage = [];
        pageIndex++;
        currentY = margin;
        currentX = margin;
      }
      currentPage.push({
        barcode,
        x: currentX,
        y: currentY,
        width: labelWidth,
        height: labelHeight,
      });
      currentX += labelWidth + spacing;
      if (currentX + labelWidth > A4_WIDTH_MM - margin) {
        currentX = margin;
        currentY += rowHeight;
      }
    }
  }
  if (currentPage.length > 0) pages.push({ pageIndex, labels: currentPage });
  return pages;
}
