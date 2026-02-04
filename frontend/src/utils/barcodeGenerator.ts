import JsBarcode from 'jsbarcode';
import type { BarcodeType } from '../types/barcode';

export const generateBarcode = (
  value: string,
  elementId: string,
  barcodeType: BarcodeType = 'CODE128'
): void => {
  try {
    const canvas = document.createElement('canvas');
    const JsBarcodeLib = (JsBarcode as { default?: typeof JsBarcode }).default ?? JsBarcode;

    const options: Record<string, unknown> = {
      format: barcodeType,
      width: 2,
      height: 60,
      displayValue: false,
      fontSize: 14,
      margin: 10,
    };

    if (barcodeType === 'EAN13') {
      (options as Record<string, boolean>).flat = true;
    }

    JsBarcodeLib(canvas, value, options);

    const img = document.getElementById(elementId) as HTMLImageElement | null;
    if (img) {
      img.src = (canvas as HTMLCanvasElement).toDataURL('image/png');
    }
  } catch (error) {
    console.error('Error generating barcode:', error);
  }
};

export const generateBarcodeToCanvas = (
  value: string,
  barcodeType: BarcodeType = 'CODE128'
): HTMLCanvasElement | null => {
  try {
    const canvas = document.createElement('canvas');
    const JsBarcodeLib = (JsBarcode as { default?: typeof JsBarcode }).default ?? JsBarcode;

    const options: Record<string, unknown> = {
      format: barcodeType,
      width: 2,
      height: 60,
      displayValue: false,
      fontSize: 14,
      margin: 10,
    };

    if (barcodeType === 'EAN13') {
      (options as Record<string, boolean>).flat = true;
    }

    JsBarcodeLib(canvas, value, options);
    return canvas as HTMLCanvasElement;
  } catch (error) {
    console.error('Error generating barcode:', error);
    return null;
  }
};
