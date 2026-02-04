import { useState, useEffect, useRef, useCallback } from 'react';
import {
  LABEL_SIZES,
  type BarcodeData,
  type BarcodeFormData,
  type LabelSize,
  type LabelColorOption,
} from '../types/barcode';
import type { Item } from '../types';
import { generateBarcode } from '../utils/barcodeGenerator';
import { generateBarcodePDF } from '../utils/barcodePdfExport';
import { countPagesForLabels, getLabelsGroupedByPage } from '../utils/printLayout';
import { storageService } from '../services/storage';
import { useCompanyStore } from '../store/companyStore';
import './BarcodeGenerator.css';

const DEFAULT_HEADER = 'Vyapar tech solutions';
const SEARCH_DEBOUNCE_MS = 300;

function getDefaultLabelSize(): LabelSize {
  const size65 = LABEL_SIZES.find((s) => s.labelCount === 65);
  return size65 ?? LABEL_SIZES[0];
}

export default function BarcodeGenerator() {
  const { company } = useCompanyStore();
  const headerFromCompany = company?.name?.trim() || DEFAULT_HEADER;

  const [printer] = useState('Regular Printer');
  const [labelSize, setLabelSize] = useState<LabelSize>(getDefaultLabelSize());
  const [form, setForm] = useState<BarcodeFormData>({
    itemName: '',
    itemCode: '',
    numberOfLabels: 1,
    header: headerFromCompany,
    mrp: 0,
    salePrice: 0,
    labelSize: getDefaultLabelSize(),
    strikeMrp: false,
    barcodeType: 'CODE128',
    labelColor: 'white',
  });
  const [list, setList] = useState<BarcodeData[]>(() => {
    try {
      const saved = localStorage.getItem('barcode-generator-list');
      if (saved) {
        const parsed = JSON.parse(saved) as (BarcodeData & { lines?: string[]; createdAt?: string })[];
        return parsed.map((b) => {
          const { lines: _lines, ...rest } = b;
          return {
            ...rest,
            createdAt: new Date(b.createdAt || Date.now()),
            labelSize: b.labelSize ?? getDefaultLabelSize(),
            labelColor: (b.labelColor ?? 'white') as LabelColorOption,
          } as BarcodeData;
        });
      }
    } catch {
      /* ignore */
    }
    return [];
  });
  const [showPreview, setShowPreview] = useState(false);
  const [numberOfLabelsInput, setNumberOfLabelsInput] = useState('1');

  // Item search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const previewBarcodeId = useRef('preview-barcode-' + Date.now());

  useEffect(() => {
    setForm((prev) => ({ ...prev, header: headerFromCompany }));
  }, [headerFromCompany]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, labelSize }));
  }, [labelSize]);

  useEffect(() => {
    try {
      localStorage.setItem('barcode-generator-list', JSON.stringify(list));
    } catch {
      /* ignore */
    }
  }, [list]);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const items = await storageService.searchItems(q.trim());
      setSearchResults(items);
      setShowDropdown(true);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    searchTimeoutRef.current = setTimeout(() => {
      runSearch(searchQuery);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, runSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectItem = (item: Item) => {
    const price = Number(item.price) || 0;
    const mrp = item.mrp != null && item.mrp !== '' ? Number(item.mrp) : price;
    setForm((prev) => ({
      ...prev,
      itemName: item.name || item.display_name || '',
      itemCode: (item.barcode || item.code || '').toString().trim(),
      salePrice: price,
      mrp: mrp,
    }));
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const totalLabels = list.reduce((sum, b) => sum + b.numberOfLabels, 0);
  const pageCount =
    totalLabels === 0
      ? 0
      : countPagesForLabels(totalLabels, labelSize.width, labelSize.height);

  const canAdd =
    form.itemName.trim() !== '' &&
    form.numberOfLabels >= 1 &&
    (form.itemCode.trim() !== '' || form.itemName.trim() !== '');

  const barcodeValue = form.itemCode.trim() || form.itemName.trim() || '0';
  useEffect(() => {
    if (barcodeValue && document.getElementById(previewBarcodeId.current)) {
      generateBarcode(
        barcodeValue,
        previewBarcodeId.current,
        form.barcodeType ?? 'CODE128'
      );
    }
  }, [barcodeValue, form.barcodeType]);

  const handleAdd = () => {
    if (!canAdd) return;
    const itemCode = form.itemCode.trim() || String(Date.now()).slice(-8);
    const salePrice = Number(form.salePrice) || 0;
    const mrp = (form.mrp != null && Number(form.mrp) > 0) ? Number(form.mrp) : salePrice;

    const newItem: BarcodeData = {
      id: Date.now().toString(),
      itemName: form.itemName.trim(),
      itemCode,
      numberOfLabels: Math.max(1, form.numberOfLabels),
      header: form.header?.trim() || headerFromCompany,
      mrp,
      salePrice,
      labelSize,
      strikeMrp: form.strikeMrp ?? false,
      barcodeType: form.barcodeType ?? 'CODE128',
      labelColor: form.labelColor ?? 'white',
      createdAt: new Date(),
    };
    setList((prev) => [...prev, newItem]);
    setNumberOfLabelsInput('1');
    setForm((prev) => ({
      ...prev,
      itemName: '',
      itemCode: '',
      numberOfLabels: 1,
      salePrice: 0,
      mrp: 0,
    }));
  };

  const handleDelete = (id: string) => {
    setList((prev) => prev.filter((b) => b.id !== id));
  };

  const handleGenerate = async () => {
    if (list.length === 0) {
      alert('No items to generate. Add items first.');
      return;
    }
    try {
      await generateBarcodePDF(list);
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF.');
    }
  };

  const displayMrp = (form.mrp != null && Number(form.mrp) > 0)
    ? Number(form.mrp).toFixed(2)
    : (Number(form.salePrice) || 0).toFixed(2);
  const displaySale = (Number(form.salePrice) || 0).toFixed(2);

  return (
    <div className="barcode-gen-page">
      <header className="barcode-gen-header">
        <div className="barcode-gen-title-row">
          <h1>Barcode Generator</h1>
          <span className="info-icon" title="Search item by name, code or mapping code. Then add to list and generate PDF for A4 printing.">
            ℹ️
          </span>
        </div>
        <div className="barcode-gen-settings">
          <span className="barcode-gen-setting-label">Printer:</span>
          <select value={printer} aria-label="Printer" readOnly className="barcode-gen-select">
            <option>Regular Printer</option>
          </select>
          <span className="barcode-gen-setting-label">Size:</span>
          <select
            value={labelSize.labelCount}
            onChange={(e) => {
              const size = LABEL_SIZES.find((s) => s.labelCount === Number(e.target.value));
              if (size) setLabelSize(size);
            }}
            aria-label="Label size"
            className="barcode-gen-select"
          >
            {LABEL_SIZES.map((s) => (
              <option key={s.labelCount} value={s.labelCount}>
                {s.label}
              </option>
            ))}
          </select>
          <span className="barcode-gen-setting-label">Color:</span>
          <select
            value={form.labelColor}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, labelColor: e.target.value as LabelColorOption }))
            }
            aria-label="Label color"
            className="barcode-gen-select"
          >
            <option value="white">White</option>
            <option value="blue">Light Blue</option>
            <option value="green">Light Green</option>
            <option value="cream">Cream</option>
            <option value="yellow">Light Yellow</option>
          </select>
        </div>
      </header>

      <div className="barcode-gen-search-section">
        <label className="barcode-gen-search-label">
          Search item (name, code or mapping code)
        </label>
        <div className="barcode-gen-search-wrap" ref={dropdownRef}>
          <input
            type="text"
            className={`barcode-gen-search-input ${searching ? 'searching' : ''}`}
            placeholder="Type name, code or mapping code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
          />
          {searching && <span className="barcode-gen-search-loading">Searching...</span>}
          {showDropdown && searchResults.length > 0 && (
            <ul className="barcode-gen-search-dropdown">
              {searchResults.slice(0, 8).map((item) => (
                <li
                  key={item.id}
                  className="barcode-gen-search-item"
                  onClick={() => selectItem(item)}
                >
                  <span className="barcode-gen-search-item-name">{item.name || item.display_name}</span>
                  <span className="barcode-gen-search-item-meta">
                    Code: {item.code}
                    {item.mapping_code && ` · Map: ${item.mapping_code}`}
                    {item.barcode && ` · Barcode: ${item.barcode}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="barcode-gen-main">
        <div className="barcode-gen-form-card">
          <label>Item Name <span className="required">*</span></label>
          <input
            type="text"
            placeholder="Enter Item Name"
            value={form.itemName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, itemName: e.target.value }))
            }
          />
          <label>Item Code / Barcode (CODE128) <span className="required">*</span></label>
          <input
            type="text"
            placeholder="Used for barcode value"
            value={form.itemCode}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, itemCode: e.target.value }))
            }
          />
          <label>No of Labels <span className="required">*</span></label>
          <input
            type="number"
            min={1}
            value={numberOfLabelsInput}
            placeholder=""
            onChange={(e) => {
              const raw = e.target.value;
              setNumberOfLabelsInput(raw);
              const num = parseInt(raw, 10);
              if (raw === '' || !Number.isFinite(num)) return;
              setForm((prev) => ({ ...prev, numberOfLabels: Math.max(1, num) }));
            }}
            onBlur={() => {
              const num = parseInt(numberOfLabelsInput, 10);
              if (numberOfLabelsInput === '' || !Number.isFinite(num) || num < 1) {
                setNumberOfLabelsInput('1');
                setForm((prev) => ({ ...prev, numberOfLabels: 1 }));
              } else {
                setNumberOfLabelsInput(String(num));
                setForm((prev) => ({ ...prev, numberOfLabels: num }));
              }
            }}
          />
          <label>Company Name (Header)</label>
          <input
            type="text"
            placeholder="Header on label"
            value={form.header}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, header: e.target.value }))
            }
          />
          <label>Sale Price (₹)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={form.salePrice || ''}
            placeholder="0"
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                salePrice: parseFloat(e.target.value) || 0,
              }))
            }
          />
          <label>MRP (₹) — leave blank to use Sale Price</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={form.mrp || ''}
            placeholder="Same as sale if blank"
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                mrp: parseFloat(e.target.value) || 0,
              }))
            }
          />
        </div>

        <div className="barcode-gen-preview-card barcode-gen-preview-card--sample">
          <div className="preview-label-name">{form.itemName?.trim() || 'Item Name'}</div>
          <div className="preview-barcode-wrap preview-barcode-wrap--no-border">
            {barcodeValue ? (
              <img
                id={previewBarcodeId.current}
                alt="Barcode preview"
                style={{ maxHeight: 52 }}
              />
            ) : (
              <span className="preview-placeholder">Enter item name or code</span>
            )}
          </div>
          {barcodeValue && <div className="preview-code-text">{form.itemCode?.trim() || form.itemName?.trim()}</div>}
          <div className="preview-prices">
            <span className="preview-sale" title="Sale price">Sale: &#8377;{displaySale}</span>
            <span className="preview-mrp" title="MRP">MRP: &#8377;{displayMrp}</span>
          </div>
          <div className="preview-shop-name">{form.header?.trim() || headerFromCompany}</div>
          <button
            type="button"
            className="barcode-gen-add-btn"
            onClick={handleAdd}
            disabled={!canAdd}
          >
            + Add for Barcode
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="barcode-gen-empty">
          <p>Added items for Barcode generation will appear here.</p>
          <p className="empty-hint">Search an item or fill the form and click &quot;+ Add for Barcode&quot;.</p>
        </div>
      ) : (
        <div className="barcode-gen-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>No of Labels</th>
                <th>Header</th>
                <th>Sale Price</th>
                <th>MRP</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id}>
                  <td>{row.itemName}</td>
                  <td>{row.numberOfLabels}</td>
                  <td>{row.header}</td>
                  <td>₹{Number(row.salePrice).toFixed(2)}</td>
                  <td>₹{Number(row.mrp).toFixed(2)}</td>
                  <td>
                    <button
                      type="button"
                      className="barcode-gen-delete-btn"
                      onClick={() => handleDelete(row.id)}
                      aria-label="Delete"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="barcode-gen-footer">
        <div className="page-info">
          <span>
            {pageCount > 0
              ? `You will need ${pageCount} page${pageCount !== 1 ? 's' : ''} for printing.`
              : 'Add items to see page count.'}
          </span>
          <span>Paper Size: A4</span>
        </div>
        <div className="footer-actions">
          <button
            type="button"
            className="barcode-gen-preview-btn"
            onClick={() => setShowPreview(true)}
            disabled={list.length === 0}
          >
            👁 Preview
          </button>
          <button
            type="button"
            className="barcode-gen-generate-btn"
            onClick={handleGenerate}
            disabled={list.length === 0}
          >
            Generate
          </button>
        </div>
      </div>

      {showPreview && (
        <PreviewModal list={list} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}

function PreviewModal({
  list,
  onClose,
}: {
  list: BarcodeData[];
  onClose: () => void;
}) {
  const pages = getLabelsGroupedByPage(list);
  return (
    <div
      className="barcode-gen-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div className="barcode-gen-modal barcode-gen-modal--a4">
        <div className="barcode-gen-modal-header">
          <h2 id="preview-modal-title">Preview (A4)</h2>
          <button
            type="button"
            className="barcode-gen-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="barcode-gen-modal-body barcode-gen-modal-body--a4">
          {pages.map((page) => (
            <div
              key={page.pageIndex}
              className="barcode-preview-a4-page"
              style={{ width: '210mm', height: '297mm' }}
            >
              {page.labels.map(({ barcode, x, y, width, height }, idx) => (
                <PreviewLabelCell
                  key={`${barcode.id}-${page.pageIndex}-${idx}`}
                  barcode={barcode}
                  id={`preview-modal-barcode-${barcode.id}-${page.pageIndex}-${idx}`}
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewLabelCell({
  barcode,
  id,
  x,
  y,
  width,
  height,
}: {
  barcode: BarcodeData;
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && barcode.itemCode && document.getElementById(id)) {
      generateBarcode(barcode.itemCode, id, barcode.barcodeType ?? 'CODE128');
    }
  }, [mounted, barcode.itemCode, barcode.barcodeType, id]);

  return (
    <div
      className="barcode-preview-cell"
      style={{
        position: 'absolute',
        left: `${x}mm`,
        top: `${y}mm`,
        width: `${width}mm`,
        height: `${height}mm`,
      }}
    >
      <div
        className="barcode-preview-label barcode-preview-label--sample"
        style={{
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <div className="barcode-preview-label-name">
          {barcode.itemName.length > 28 ? barcode.itemName.slice(0, 26) + '…' : barcode.itemName}
        </div>
        <div className="barcode-preview-label-barcode barcode-preview-label-barcode--no-border">
          <img id={id} alt="" />
        </div>
        <div className="barcode-preview-label-code">{barcode.itemCode}</div>
        <div className="barcode-preview-label-prices">
          <span className="barcode-preview-label-sale">Sale: &#8377;{Number(barcode.salePrice).toFixed(2)}</span>
          <span className="barcode-preview-label-mrp">MRP: &#8377;{(barcode.mrp != null && Number(barcode.mrp) > 0 ? Number(barcode.mrp) : Number(barcode.salePrice)).toFixed(2)}</span>
        </div>
        <div className="barcode-preview-label-shop">
          {(barcode.header || 'Company').length > 24 ? (barcode.header || 'Company').slice(0, 22) + '…' : (barcode.header || 'Company')}
        </div>
      </div>
    </div>
  );
}
