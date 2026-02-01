export interface LabelSize {
  labelCount: number;
  width: number; // in mm
  height: number; // in mm
  label: string;
}

// Professional A4 label sizes for inkjet printing (210×297mm, 10mm margins)
export const LABEL_SIZES: LabelSize[] = [
  { labelCount: 12, width: 94, height: 44.5, label: '12 labels (94×45mm)' },
  { labelCount: 24, width: 62, height: 32.9, label: '24 labels (62×33mm)' },
  { labelCount: 32, width: 46, height: 32.9, label: '32 labels (46×33mm)' },
  { labelCount: 40, width: 36.4, height: 32.9, label: '40 labels (36×33mm)' },
  { labelCount: 48, width: 46, height: 21.3, label: '48 labels (46×21mm)' },
  { labelCount: 65, width: 38, height: 21, label: '65 labels (38×21mm)' },
  { labelCount: 72, width: 30, height: 21.3, label: '72 labels (30×21mm)' },
];

export type BarcodeType = 'CODE128' | 'EAN13';

export type LabelColorOption = 'white' | 'blue' | 'green' | 'cream' | 'yellow';

export interface BarcodeData {
  id: string;
  itemName: string;
  itemCode: string;
  numberOfLabels: number;
  header: string;
  mrp: number;
  salePrice: number;
  labelSize: LabelSize;
  strikeMrp: boolean;
  barcodeType: BarcodeType;
  labelColor: LabelColorOption;
  createdAt: Date;
}

export interface BarcodeFormData {
  itemName: string;
  itemCode: string;
  numberOfLabels: number;
  header: string;
  mrp: number;
  salePrice: number;
  labelSize: LabelSize;
  strikeMrp: boolean;
  barcodeType: BarcodeType;
  labelColor: LabelColorOption;
}
