import { useState, useEffect } from 'react';
import { useInventoryStore } from '../store/inventoryStore';
import { Category, Item } from '../types';
import './Import.css';

interface CSVRow {
  [key: string]: string;
}

export default function Import() {
  const [importType, setImportType] = useState<'categories' | 'items'>('categories');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const { categories, loadCategories, addCategory, addItem } = useInventoryStore();

  useEffect(() => {
    // Load categories when component mounts (needed for item import)
    loadCategories();
  }, [loadCategories]);

  // Helper to find category ID by name (and optionally subcategory)
  const findCategoryId = (categoryName?: string, subcategoryName?: string): string | undefined => {
    if (!categoryName) return undefined;
    
    // First try to find exact match with subcategory
    if (subcategoryName) {
      const category = categories.find(
        c => c.name === categoryName.trim() && c.subcategory === subcategoryName.trim()
      );
      if (category) return category.id;
    }
    
    // Then try to find main category (no subcategory)
    const mainCategory = categories.find(
      c => c.name === categoryName.trim() && !c.subcategory
    );
    if (mainCategory) return mainCategory.id;
    
    // If no exact match, return first category with matching name
    const anyCategory = categories.find(c => c.name === categoryName.trim());
    return anyCategory?.id;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setPreview([]);
    setResults(null);

    // Read and preview CSV
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseCSV(text);
      setTotalRows(rows.length);
      setPreview(rows.slice(0, 5)); // Show first 5 rows as preview
    };
    reader.readAsText(selectedFile);
  };

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    // Parse header
    const headers = parseCSVLine(lines[0]);
    const rows: CSVRow[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const row: CSVRow = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || '';
      });
      rows.push(row);
    }

    return rows;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const validateCategoryRow = (row: CSVRow, index: number): { valid: boolean; error?: string } => {
    if (!row.name || !row.name.trim()) {
      return { valid: false, error: `Row ${index + 1}: Category name is required` };
    }
    return { valid: true };
  };

  const validateItemRow = (row: CSVRow, index: number): { valid: boolean; error?: string } => {
    if (!row.name || !row.name.trim()) {
      return { valid: false, error: `Row ${index + 1}: Item name is required` };
    }
    if (!row.code || !row.code.trim()) {
      return { valid: false, error: `Row ${index + 1}: Item code is required` };
    }
    if (!row.price || isNaN(parseFloat(row.price))) {
      return { valid: false, error: `Row ${index + 1}: Valid price is required` };
    }
    if (!row.cost || isNaN(parseFloat(row.cost))) {
      return { valid: false, error: `Row ${index + 1}: Valid cost is required` };
    }
    return { valid: true };
  };

  const handleImport = async () => {
    if (!file) {
      alert('Please select a CSV file first');
      return;
    }

    setImporting(true);
    setResults(null);
    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        alert('CSV file is empty or invalid');
        setImporting(false);
        return;
      }

      setProgress({ current: 0, total: rows.length });

      if (importType === 'categories') {
        // Import categories
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          setProgress({ current: i + 1, total: rows.length });

          const validation = validateCategoryRow(row, i);
          if (!validation.valid) {
            errors.push(validation.error || `Row ${i + 1}: Validation failed`);
            failedCount++;
            continue;
          }

          try {
            await addCategory({
              name: row.name.trim(),
              subcategory: row.subcategory?.trim() || undefined,
              brand: row.brand?.trim() || undefined,
            });
            successCount++;
          } catch (error: any) {
            errors.push(`Row ${i + 1}: ${error.message || 'Failed to import'}`);
            failedCount++;
          }
        }
      } else {
        // Import items
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          setProgress({ current: i + 1, total: rows.length });

          const validation = validateItemRow(row, i);
          if (!validation.valid) {
            errors.push(validation.error || `Row ${i + 1}: Validation failed`);
            failedCount++;
            continue;
          }

          try {
            // Try to find category by name if category_id is not provided
            let categoryId = row.category_id?.trim();
            if (!categoryId && row.category_name) {
              categoryId = findCategoryId(row.category_name, row.subcategory);
              if (!categoryId) {
                errors.push(`Row ${i + 1}: Category "${row.category_name}" not found`);
                failedCount++;
                continue;
              }
            }

            await addItem({
              name: row.name.trim(),
              code: row.code.trim(),
              barcode: row.barcode?.trim() || undefined,
              category_id: categoryId || undefined,
              subcategory: row.subcategory?.trim() || undefined,
              cost: parseFloat(row.cost),
              price: parseFloat(row.price),
              mrp: row.mrp ? parseFloat(row.mrp) : undefined,
              stock: row.stock ? parseInt(row.stock) : 0,
            });
            successCount++;
          } catch (error: any) {
            errors.push(`Row ${i + 1}: ${error.message || 'Failed to import'}`);
            failedCount++;
          }
        }
      }

      setResults({
        success: successCount,
        failed: failedCount,
        errors: errors.slice(0, 20), // Show first 20 errors
      });
    } catch (error: any) {
      alert(`Import failed: ${error.message || 'Unknown error'}`);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    let csvContent = '';
    let filename = '';

    if (importType === 'categories') {
      filename = 'categories_template.csv';
      csvContent = 'name,subcategory,brand\nElectronics,Mobile Phones,Samsung\nElectronics,Laptops,HP\nFood,Snacks,\n';
    } else {
      filename = 'items_template.csv';
      csvContent = 'name,code,barcode,category_name,subcategory,cost,price,mrp,stock\nProduct 1,PROD001,1234567890,Electronics,Mobile Phones,100,150,200,50\nProduct 2,PROD002,,Electronics,Laptops,500,750,900,25\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="import-page">
      <div className="import-header">
        <h1>📥 Bulk Import</h1>
        <p>Import categories or items from CSV files</p>
      </div>

      <div className="card">
        <div className="import-type-selector">
          <button
            className={`btn ${importType === 'categories' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setImportType('categories');
            setFile(null);
            setPreview([]);
            setTotalRows(0);
            setResults(null);
            }}
          >
            Import Categories
          </button>
          <button
            className={`btn ${importType === 'items' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setImportType('items');
            setFile(null);
            setPreview([]);
            setTotalRows(0);
            setResults(null);
            }}
          >
            Import Items
          </button>
        </div>

        <div className="import-section">
          <h2>
            {importType === 'categories' ? '📁 Import Categories' : '📦 Import Items'}
          </h2>

          <div className="template-section">
            <p>Download a template CSV file to see the required format:</p>
            <button className="btn btn-secondary" onClick={downloadTemplate}>
              📄 Download Template
            </button>
          </div>

          <div className="file-upload-section">
            <label className="file-upload-label">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={importing}
                className="file-input"
              />
              <div className="file-upload-box">
                {file ? (
                  <div className="file-selected">
                    <span>✅ {file.name}</span>
                    <button
                      className="btn-link"
                      onClick={() => {
            setFile(null);
            setPreview([]);
            setTotalRows(0);
            setResults(null);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="file-upload-placeholder">
                    <span>📁 Click to select CSV file</span>
                    <small>or drag and drop</small>
                  </div>
                )}
              </div>
            </label>
          </div>

          {preview.length > 0 && (
            <div className="preview-section">
              <h3>Preview (First 5 rows):</h3>
              <div className="preview-table">
                <table>
                  <thead>
                    <tr>
                      {Object.keys(preview[0]).map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value, i) => (
                          <td key={i}>{value || '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="preview-note">
                Showing preview of first 5 rows. Total rows in file: {totalRows}
              </p>
            </div>
          )}

          {importing && (
            <div className="progress-section">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(progress.current / progress.total) * 100}%`,
                  }}
                />
              </div>
              <p>
                Importing... {progress.current} of {progress.total}
              </p>
            </div>
          )}

          {results && (
            <div className="results-section">
              <h3>Import Results:</h3>
              <div className="results-stats">
                <div className="stat success">
                  <span className="stat-label">✅ Successful:</span>
                  <span className="stat-value">{results.success}</span>
                </div>
                <div className="stat failed">
                  <span className="stat-label">❌ Failed:</span>
                  <span className="stat-value">{results.failed}</span>
                </div>
              </div>
              {results.errors.length > 0 && (
                <div className="errors-list">
                  <h4>Errors:</h4>
                  <ul>
                    {results.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                  {results.failed > 20 && (
                    <p className="error-note">
                      Showing first 20 errors. Total errors: {results.failed}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="import-actions">
            <button
              className="btn btn-primary btn-large"
              onClick={handleImport}
              disabled={!file || importing}
            >
              {importing ? 'Importing...' : `Import ${importType}`}
            </button>
          </div>

          <div className="import-instructions">
            <h3>📋 Instructions:</h3>
            {importType === 'categories' ? (
              <ul>
                <li><strong>Required columns:</strong> name</li>
                <li><strong>Optional columns:</strong> subcategory, brand</li>
                <li>Each row represents one category</li>
                <li>Categories with the same name will be grouped</li>
                <li>Use subcategory column to create subcategories</li>
              </ul>
            ) : (
              <ul>
                <li><strong>Required columns:</strong> name, code, cost, price</li>
                <li><strong>Optional columns:</strong> barcode, category_name (or category_id), subcategory, mrp, stock</li>
                <li>Each row represents one item</li>
                <li>Use <strong>category_name</strong> to reference category by name (recommended)</li>
                <li>Or use <strong>category_id</strong> with the UUID of an existing category</li>
                <li>If using category_name, the category must exist before importing items</li>
                <li>stock defaults to 0 if not provided</li>
                <li>mrp is optional and used for display purposes</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

