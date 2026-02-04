import { jsPDF } from 'jspdf';
import type { BarcodeData, LabelColorOption } from '../types/barcode';
import { generateBarcodeToCanvas } from './barcodeGenerator';
import { A4_WIDTH_MM, A4_HEIGHT_MM, A4_MARGIN_MM } from './printLayout';

const LABEL_COLOR_RGB: Record<LabelColorOption, { r: number; g: number; b: number }> = {
  white: { r: 255, g: 255, b: 255 },
  blue: { r: 232, g: 242, b: 252 },
  green: { r: 236, g: 253, b: 244 },
  cream: { r: 255, g: 253, b: 231 },
  yellow: { r: 254, g: 252, b: 232 },
};

// Light blue border to match screenshot (thin frame)
const LABEL_BORDER = { r: 180, g: 220, b: 255 };
// jsPDF default font (Helvetica) does not support ₹; use "Rs." so currency shows in PDF
const CURRENCY_PDF = 'Rs.';
// Questrial TTF (same as preview) – CORS-friendly CDN
const QUESTRIAL_FONT_URL = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/questrial/Questrial-Regular.ttf';

async function loadQuestrialFont(pdf: jsPDF): Promise<boolean> {
  try {
    const res = await fetch(QUESTRIAL_FONT_URL);
    if (!res.ok) return false;
    const blob = await res.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.split(',')[1] ?? '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    if (!base64) return false;
    pdf.addFileToVFS('Questrial-Regular.ttf', base64);
    pdf.addFont('Questrial-Regular.ttf', 'Questrial', 'normal');
    return true;
  } catch {
    return false;
  }
}

export async function generateBarcodePDF(barcodes: BarcodeData[]): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const useQuestrial = await loadQuestrialFont(pdf);
  const fontFamily = useQuestrial ? 'Questrial' : 'helvetica';

  const margin = A4_MARGIN_MM;
  const spacing = 2;
  let currentY = margin;
  let currentX = margin;

  for (const barcode of barcodes) {
    const labelWidth = barcode.labelSize?.width ?? 80;
    const labelHeight = barcode.labelSize?.height ?? 50;
    const rowHeight = labelHeight + spacing;
    const padding = 1.5;
    const bottomBandHeight = Math.max(4, labelHeight * 0.14);
    const innerPadding = 2; // extra padding so Sale/MRP don't touch border

    const barcodeCanvas = generateBarcodeToCanvas(
      barcode.itemCode,
      barcode.barcodeType ?? 'CODE128'
    );
    if (!barcodeCanvas) continue;

    const barcodeDataUrl = barcodeCanvas.toDataURL('image/png');
    const isSmallLabel = labelHeight < 25;
    const textFontSize = isSmallLabel
      ? Math.max(5.5, Math.min(7, labelHeight * 0.14))
      : Math.max(6.5, Math.min(8.5, labelHeight * 0.14));
    const shopFontSize = Math.max(5.5, Math.min(textFontSize + 1, labelHeight * 0.18));

    const contentHeight = labelHeight - bottomBandHeight - padding * 2;
    const barcodeImgHeight = Math.max(6, Math.min(contentHeight * 0.4, labelHeight * 0.32));
    const barcodeImgWidth = labelWidth - padding * 4;

    for (let labelIndex = 0; labelIndex < barcode.numberOfLabels; labelIndex++) {
      if (currentY + labelHeight > A4_HEIGHT_MM - margin) {
        pdf.addPage();
        currentY = margin;
        currentX = margin;
      }

      const x = currentX;
      const y = currentY;

      const bg = LABEL_COLOR_RGB[barcode.labelColor ?? 'white'];
      pdf.setFillColor(bg.r, bg.g, bg.b);
      pdf.rect(x, y, labelWidth, labelHeight, 'F');
      pdf.setDrawColor(LABEL_BORDER.r, LABEL_BORDER.g, LABEL_BORDER.b);
      pdf.setLineWidth(0.35);
      pdf.rect(x, y, labelWidth, labelHeight);

      pdf.setFont(fontFamily, 'normal');
      pdf.setFontSize(textFontSize);
      pdf.setTextColor(0, 0, 0);

      const topMargin = 0.8;
      let yPos = y + padding + topMargin;

      // 1. Item name – center
      const itemName = barcode.itemName.length > 28 ? barcode.itemName.slice(0, 26) + '…' : barcode.itemName;
      const itemNameW = pdf.getTextWidth(itemName);
      pdf.text(itemName, x + labelWidth / 2 - itemNameW / 2, yPos);
      yPos += textFontSize * 0.5 + 0.5;

      // 2. Barcode image – center
      const barcodeY = yPos;
      const barcodeX = x + (labelWidth - barcodeImgWidth) / 2;
      pdf.addImage(barcodeDataUrl, 'PNG', barcodeX, barcodeY, barcodeImgWidth, barcodeImgHeight);
      yPos += barcodeImgHeight + 0.4;

      // 3. Barcode number – center
      const codeW = pdf.getTextWidth(barcode.itemCode);
      pdf.text(barcode.itemCode, x + labelWidth / 2 - codeW / 2, yPos);
      yPos += textFontSize * 0.5 + 0.4;

      // 4. Sale (left) and MRP (right) – inner padding so they don't touch border
      const salePrice = barcode.salePrice ?? 0;
      const mrpPrice = (barcode.mrp != null && Number(barcode.mrp) > 0) ? Number(barcode.mrp) : salePrice;
      const saleText = `Sale: ${CURRENCY_PDF}${Number(salePrice).toFixed(2)}`;
      const mrpText = `MRP: ${CURRENCY_PDF}${Number(mrpPrice).toFixed(2)}`;
      const availableWidth = labelWidth - innerPadding * 2;
      const minGap = 2;
      let fitFontSize = textFontSize;
      let saleW = 0;
      let mrpW = 0;
      for (let fs = textFontSize; fs >= 4; fs -= 0.5) {
        pdf.setFontSize(fs);
        saleW = pdf.getTextWidth(saleText);
        mrpW = pdf.getTextWidth(mrpText);
        if (saleW + minGap + mrpW <= availableWidth) {
          fitFontSize = fs;
          break;
        }
      }
      pdf.setFontSize(fitFontSize);
      saleW = pdf.getTextWidth(saleText);
      mrpW = pdf.getTextWidth(mrpText);
      pdf.text(saleText, x + innerPadding, yPos);
      pdf.text(mrpText, x + labelWidth - innerPadding - mrpW, yPos);
      yPos += fitFontSize * 0.5 + 0.3;

      // 5. Bottom band – shop/company name
      const bandY = y + labelHeight - bottomBandHeight;
      pdf.setFillColor(100, 130, 200);
      pdf.rect(x, bandY, labelWidth, bottomBandHeight, 'F');
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.2);
      pdf.rect(x, bandY, labelWidth, bottomBandHeight);
      const shopName = (barcode.header || 'Company').length > 24 ? (barcode.header || 'Company').slice(0, 22) + '…' : (barcode.header || 'Company');
      pdf.setFontSize(shopFontSize);
      pdf.setFont(fontFamily, useQuestrial ? 'normal' : 'bold');
      pdf.setTextColor(255, 255, 255);
      const shopW = pdf.getTextWidth(shopName);
      pdf.text(shopName, x + labelWidth / 2 - shopW / 2, bandY + bottomBandHeight * 0.65);
      pdf.setTextColor(0, 0, 0);

      currentX += labelWidth + spacing;
      if (currentX + labelWidth > A4_WIDTH_MM - margin) {
        currentX = margin;
        currentY += rowHeight;
      }
    }
  }

  pdf.save('barcodes.pdf');
}
