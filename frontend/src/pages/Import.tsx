import { useState, useEffect } from 'react';
import { useInventoryStore } from '../store/inventoryStore';
import { Category, Item, ItemCodePrefix } from '../types';
import { storageService } from '../services/storage';
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

  // Item code prefix states
  const [prefixes, setPrefixes] = useState<ItemCodePrefix[]>([]);
  const [showPrefixForm, setShowPrefixForm] = useState(false);
  const [prefixPrefix, setPrefixPrefix] = useState('');
  const [prefixDescription, setPrefixDescription] = useState('');
  const [editingPrefix, setEditingPrefix] = useState<ItemCodePrefix | null>(null);
  const [loadingPrefixes, setLoadingPrefixes] = useState(false);

  const { categories, loadCategories, addCategory, addItem } = useInventoryStore();

  useEffect(() => {
    // Load categories when component mounts (needed for item import)
    loadCategories();
    loadPrefixes();
  }, [loadCategories]);

  const loadPrefixes = async () => {
    try {
      setLoadingPrefixes(true);
      const data = await storageService.getItemCodePrefixes();
      setPrefixes(data);
    } catch (error) {
      console.error('Error loading prefixes:', error);
    } finally {
      setLoadingPrefixes(false);
    }
  };

  const handleSavePrefix = async () => {
    if (!prefixPrefix.trim()) {
      alert('Prefix is required');
      return;
    }

    try {
      if (editingPrefix) {
        await storageService.updateItemCodePrefix(editingPrefix.id, {
          prefix: prefixPrefix.trim(),
          description: prefixDescription.trim() || undefined,
        });
      } else {
        await storageService.addItemCodePrefix({
          prefix: prefixPrefix.trim(),
          description: prefixDescription.trim() || undefined,
        });
      }
      await loadPrefixes();
      setShowPrefixForm(false);
      setPrefixPrefix('');
      setPrefixDescription('');
      setEditingPrefix(null);
    } catch (error: any) {
      alert(`Failed to save prefix: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEditPrefix = (prefix: ItemCodePrefix) => {
    setEditingPrefix(prefix);
    setPrefixPrefix(prefix.prefix);
    setPrefixDescription(prefix.description || '');
    setShowPrefixForm(true);
  };

  const handleDeletePrefix = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prefix?')) return;

    try {
      await storageService.deleteItemCodePrefix(id);
      await loadPrefixes();
    } catch (error: any) {
      alert(`Failed to delete prefix: ${error.message || 'Unknown error'}`);
    }
  };

  // Helper to find category ID by name (and optionally subcategory)
  const findCategoryId = (categoryName?: string, subcategoryName?: string, categoriesList?: Category[]): string | undefined => {
    if (!categoryName) return undefined;
    
    const categoriesToSearch = categoriesList || categories;
    const trimmedName = categoryName.trim();
    const trimmedSubcategory = subcategoryName?.trim();
    
    // First try to find exact match with subcategory
    if (trimmedSubcategory) {
      const category = categoriesToSearch.find(
        c => c.name.toLowerCase() === trimmedName.toLowerCase() && 
             c.subcategory?.toLowerCase() === trimmedSubcategory.toLowerCase()
      );
      if (category) {
        console.log('Found category with subcategory:', { name: category.name, id: category.id });
        return category.id;
      }
    }
    
    // Then try to find main category (no subcategory)
    const mainCategory = categoriesToSearch.find(
      c => c.name.toLowerCase() === trimmedName.toLowerCase() && !c.subcategory
    );
    if (mainCategory) {
      console.log('Found main category:', { name: mainCategory.name, id: mainCategory.id });
      return mainCategory.id;
    }
    
    // If no exact match, return first category with matching name (case-insensitive)
    const anyCategory = categoriesToSearch.find(c => c.name.toLowerCase() === trimmedName.toLowerCase());
    if (anyCategory) {
      console.log('Found category by name match:', { name: anyCategory.name, id: anyCategory.id });
      return anyCategory.id;
    }
    
    console.warn('Category not found:', { categoryName: trimmedName, subcategory: trimmedSubcategory, availableCategories: categoriesToSearch.map(c => ({ name: c.name, subcategory: c.subcategory })) });
    return undefined;
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
      // Ensure categories are loaded before importing items
      let categoriesToUse = categories;
      if (importType === 'items') {
        console.log('Loading categories before item import...');
        await loadCategories();
        // Get fresh categories from store after loading
        const store = useInventoryStore.getState();
        categoriesToUse = store.categories;
        console.log('Categories loaded:', categoriesToUse.length, categoriesToUse);
        if (categoriesToUse.length === 0) {
          alert('No categories found. Please create categories first before importing items.');
          setImporting(false);
          return;
        }
      }

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
            // Check for various column name variations
            const categoryName = row.category_name?.trim() || row['Category Name']?.trim() || row.category?.trim() || '';
            const categoryIdFromCSV = row.category_id?.trim() || row['Category ID']?.trim() || '';
            const subcategoryName = row.subcategory?.trim() || row['Subcategory']?.trim() || '';
            
            let categoryId = categoryIdFromCSV;
            
            console.log(`Row ${i + 1}: Processing category lookup`, {
              categoryName,
              categoryIdFromCSV,
              subcategoryName,
              availableCategories: categoriesToUse.length,
              rowKeys: Object.keys(row)
            });
            
            // If category_name is provided, look it up using the loaded categories
            if (categoryName) {
              const foundCategoryId = findCategoryId(categoryName, subcategoryName, categoriesToUse);
              if (foundCategoryId) {
                categoryId = foundCategoryId;
                console.log(`Row ${i + 1}: Found category ID for "${categoryName}": ${categoryId}`);
              } else {
                const errorMsg = `Row ${i + 1}: Category "${categoryName}"${subcategoryName ? ` / ${subcategoryName}` : ''} not found. Available categories: ${categoriesToUse.map(c => `${c.name}${c.subcategory ? ` / ${c.subcategory}` : ''}`).join(', ')}`;
                console.error(errorMsg);
                errors.push(errorMsg);
                failedCount++;
                continue;
              }
            }

            // Validate that we have category_id if category_name was provided
            if (categoryName && !categoryId) {
              const errorMsg = `Row ${i + 1}: Could not find category "${categoryName}". Please create the category first.`;
              console.error(errorMsg);
              errors.push(errorMsg);
              failedCount++;
              continue;
            }

            // Log the final category_id being used
            console.log(`Row ${i + 1}: Final category_id for item "${row.name}":`, categoryId || 'undefined (no category)');

            await addItem({
              name: row.name.trim(),
              code: row.code.trim(),
              barcode: row.barcode?.trim() || undefined,
              category_id: categoryId || undefined,
              subcategory: subcategoryName || undefined,
              cost: parseFloat(row.cost),
              price: parseFloat(row.price),
              mrp: row.mrp ? parseFloat(row.mrp) : undefined,
              stock: row.stock ? parseInt(row.stock) : 0,
            });
            successCount++;
          } catch (error: any) {
            const errorMsg = `Row ${i + 1}: ${error.message || 'Failed to import'}`;
            console.error(errorMsg, error);
            errors.push(errorMsg);
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

      {/* Item Code Prefix Management */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="import-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2>🏷️ Item Code Prefixes</h2>
            <button
              className="btn btn-primary"
              onClick={() => {
                setShowPrefixForm(!showPrefixForm);
                if (showPrefixForm) {
                  setEditingPrefix(null);
                  setPrefixPrefix('');
                  setPrefixDescription('');
                }
              }}
            >
              {showPrefixForm ? 'Cancel' : '+ Add Prefix'}
            </button>
          </div>

          {showPrefixForm && (
            <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
              <h3>{editingPrefix ? 'Edit' : 'Add'} Item Code Prefix</h3>
              <label style={{ display: 'block', marginBottom: '10px' }}>
                Prefix * (e.g., "shopname-place-"):
                <input
                  type="text"
                  className="input"
                  value={prefixPrefix}
                  onChange={(e) => setPrefixPrefix(e.target.value)}
                  placeholder="shopname-place-"
                  style={{ marginTop: '5px' }}
                />
              </label>
              <label style={{ display: 'block', marginBottom: '10px' }}>
                Description (optional):
                <input
                  type="text"
                  className="input"
                  value={prefixDescription}
                  onChange={(e) => setPrefixDescription(e.target.value)}
                  placeholder="Description for this prefix"
                  style={{ marginTop: '5px' }}
                />
              </label>
              <button className="btn btn-primary" onClick={handleSavePrefix}>
                {editingPrefix ? 'Update' : 'Save'} Prefix
              </button>
            </div>
          )}

          {loadingPrefixes ? (
            <p>Loading prefixes...</p>
          ) : prefixes.length === 0 ? (
            <div className="empty-state">
              <p>📭 No item code prefixes yet</p>
              <p className="empty-subtext">Add a prefix to get started</p>
            </div>
          ) : (
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Prefix</th>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Description</th>
                    <th style={{ textAlign: 'right', padding: '10px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prefixes.map((prefix) => (
                    <tr key={prefix.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{prefix.prefix}</td>
                      <td style={{ padding: '10px' }}>{prefix.description || '-'}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEditPrefix(prefix)}
                          style={{ marginRight: '5px' }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDeletePrefix(prefix.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="import-instructions" style={{ marginTop: '20px' }}>
            <h3>📋 About Item Code Prefixes:</h3>
            <ul>
              <li>Prefixes help reduce redundant data in item codes</li>
              <li>Example: If prefix is "shopname-place-", item code will be "shopname-place-PROD001-L" (prefix + product code-size)</li>
              <li>When adding items, you can select a prefix from the dropdown</li>
              <li>Product code and size will auto-fill the barcode field</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

