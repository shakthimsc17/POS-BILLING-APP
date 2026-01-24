import { useState, useEffect } from 'react';
import { useInventoryStore } from '../store/inventoryStore';
import { useCompanyStore } from '../store/companyStore';
import { storageService } from '../services/storage';
import { Category, Item, ItemCodePrefix } from '../types';
import './BulkOperations.css';

type BulkType = 'categories' | 'subcategories' | 'items';

interface BulkCategoryRow {
  id: string;
  name: string;
  subcategory: string;
  brand: string;
}

interface BulkSubcategoryRow {
  id: string;
  categoryId: string;
  categoryName: string;
  subcategory: string;
  brand: string;
}

interface BulkItemRow {
  id: string;
  categoryId: string;
  categoryName: string;
  subcategory: string;
  name: string;
  displayName: string;
  code: string;
  barcode: string;
  selectedPrefixId: string;
  productCodeSize: string;
  useManualCode: boolean;
  cost: string;
  price: string;
  mrp: string;
  stock: string;
}

export default function BulkOperations() {
  const [activeTab, setActiveTab] = useState<BulkType>('categories');
  const [saving, setSaving] = useState(false);
  
  // Categories
  const [categoryRows, setCategoryRows] = useState<BulkCategoryRow[]>([]);
  
  // Subcategories
  const [selectedCategoryForSubcat, setSelectedCategoryForSubcat] = useState<string>('');
  const [subcategoryRows, setSubcategoryRows] = useState<BulkSubcategoryRow[]>([]);
  
  // Items
  const [selectedCategoryForItem, setSelectedCategoryForItem] = useState<string>('');
  const [selectedSubcategoryForItem, setSelectedSubcategoryForItem] = useState<string>('');
  const [itemRows, setItemRows] = useState<BulkItemRow[]>([]);
  const [prefixes, setPrefixes] = useState<ItemCodePrefix[]>([]);

  const { categories, loadCategories, items, loadItems } = useInventoryStore();
  const { company, loadCompany } = useCompanyStore();

  useEffect(() => {
    loadCategories();
    loadItems();
    loadCompany();
    loadPrefixes();
  }, [loadCategories, loadItems, loadCompany]);

  const loadPrefixes = async () => {
    try {
      const data = await storageService.getItemCodePrefixes();
      setPrefixes(data);
    } catch (error) {
      console.error('Error loading prefixes:', error);
    }
  };

  // Get unique main categories - show ALL existing categories
  // This includes categories that exist as main categories AND categories that only exist with subcategories
  const getUniqueMainCategories = (): Category[] => {
    const unique = new Map<string, Category>();
    
    // First, add all main categories (no subcategory)
    categories.forEach(cat => {
      if (!cat.subcategory) {
        const categoryName = cat.name.toLowerCase();
        if (!unique.has(categoryName)) {
          unique.set(categoryName, cat);
        }
      }
    });
    
    // Then, for categories that only exist with subcategories, create a reference
    categories.forEach(cat => {
      if (cat.subcategory) {
        const categoryName = cat.name.toLowerCase();
        if (!unique.has(categoryName)) {
          // This category only exists with subcategories, create a reference entry
          unique.set(categoryName, {
            id: cat.id, // Use the first subcategory's ID as reference
            customer_id: cat.customer_id,
            name: cat.name,
            subcategory: undefined,
            brand: cat.brand,
            created_at: cat.created_at,
          });
        }
      }
    });
    
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  // Get subcategories for a category by category ID
  const getSubcategoriesForCategory = (categoryId: string): string[] => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return [];
    const categoryName = category.name;
    // Find all categories with the same name that have subcategories
    const subcategories = categories
      .filter(c => c.name === categoryName && c.subcategory)
      .map(c => c.subcategory!)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
    return subcategories;
  };

  // ========== CATEGORIES ==========
  const addCategoryRow = () => {
    setCategoryRows([...categoryRows, {
      id: `cat-${Date.now()}-${Math.random()}`,
      name: '',
      subcategory: '',
      brand: '',
    }]);
  };

  const removeCategoryRow = (id: string) => {
    setCategoryRows(categoryRows.filter(r => r.id !== id));
  };

  const updateCategoryRow = (id: string, field: keyof BulkCategoryRow, value: string) => {
    setCategoryRows(categoryRows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSaveCategories = async () => {
    const validRows = categoryRows.filter(r => r.name.trim());
    if (validRows.length === 0) {
      alert('Please add at least one category with a name');
      return;
    }

    // Validate unique category names (main categories only, no subcategory)
    const mainCategoryRows = validRows.filter(r => !r.subcategory.trim());
    const categoryNames = mainCategoryRows.map(r => r.name.trim().toLowerCase());
    const duplicateNames = categoryNames.filter((name, index) => categoryNames.indexOf(name) !== index);
    
    if (duplicateNames.length > 0) {
      alert(`Error: Duplicate category names found: ${[...new Set(duplicateNames)].join(', ')}. Category names must be unique.`);
      return;
    }

    // Check against existing categories
    const existingCategoryNames = categories
      .filter(c => !c.subcategory)
      .map(c => c.name.toLowerCase());
    
    const conflictingNames = categoryNames.filter(name => existingCategoryNames.includes(name));
    if (conflictingNames.length > 0) {
      alert(`Error: Category names already exist: ${conflictingNames.join(', ')}. Please use different names.`);
      return;
    }

    setSaving(true);
    try {
      const promises = validRows.map(row => 
        storageService.addCategory({
          name: row.name.trim(),
          subcategory: row.subcategory.trim() || undefined,
          brand: row.brand.trim() || undefined,
        })
      );
      await Promise.all(promises);
      alert(`Successfully created ${validRows.length} category(ies)`);
      setCategoryRows([]);
      loadCategories();
    } catch (error: any) {
      console.error('Error saving categories:', error);
      alert(`Failed to save categories: ${error?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // ========== SUBCATEGORIES ==========
  const addSubcategoryRow = () => {
    if (!selectedCategoryForSubcat) {
      alert('Please select a category first');
      return;
    }
    const category = categories.find(c => c.id === selectedCategoryForSubcat);
    if (!category) return;

    // Add row without clearing existing rows
    setSubcategoryRows([...subcategoryRows, {
      id: `subcat-${Date.now()}-${Math.random()}`,
      categoryId: selectedCategoryForSubcat,
      categoryName: category.name,
      subcategory: '',
      brand: '',
    }]);
  };

  const removeSubcategoryRow = (id: string) => {
    setSubcategoryRows(subcategoryRows.filter(r => r.id !== id));
  };

  const updateSubcategoryRow = (id: string, field: keyof BulkSubcategoryRow, value: string) => {
    setSubcategoryRows(subcategoryRows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSaveSubcategories = async () => {
    const validRows = subcategoryRows.filter(r => r.subcategory.trim());
    if (validRows.length === 0) {
      alert('Please add at least one subcategory');
      return;
    }

    // Validate unique subcategories within each category
    const categoryGroups = new Map<string, string[]>();
    validRows.forEach(row => {
      const key = row.categoryName.toLowerCase();
      if (!categoryGroups.has(key)) {
        categoryGroups.set(key, []);
      }
      categoryGroups.get(key)!.push(row.subcategory.trim().toLowerCase());
    });

    const errors: string[] = [];
    categoryGroups.forEach((subcats, categoryName) => {
      const duplicates = subcats.filter((subcat, index) => subcats.indexOf(subcat) !== index);
      if (duplicates.length > 0) {
        errors.push(`Category "${categoryName}": Duplicate subcategories: ${[...new Set(duplicates)].join(', ')}`);
      }
    });

    if (errors.length > 0) {
      alert(`Error: ${errors.join('\n')}\n\nSubcategories must be unique within each category.`);
      return;
    }

    // Check against existing subcategories
    const existingSubcategories = new Map<string, Set<string>>();
    categories.forEach(cat => {
      if (cat.subcategory) {
        const key = cat.name.toLowerCase();
        if (!existingSubcategories.has(key)) {
          existingSubcategories.set(key, new Set());
        }
        existingSubcategories.get(key)!.add(cat.subcategory.toLowerCase());
      }
    });

    const conflicting: string[] = [];
    validRows.forEach(row => {
      const key = row.categoryName.toLowerCase();
      const subcat = row.subcategory.trim().toLowerCase();
      if (existingSubcategories.has(key) && existingSubcategories.get(key)!.has(subcat)) {
        conflicting.push(`${row.categoryName} > ${row.subcategory.trim()}`);
      }
    });

    if (conflicting.length > 0) {
      alert(`Error: Subcategories already exist:\n${conflicting.join('\n')}\n\nPlease use different subcategory names.`);
      return;
    }

    setSaving(true);
    try {
      const promises = validRows.map(row => 
        storageService.addCategory({
          name: row.categoryName,
          subcategory: row.subcategory.trim(),
          brand: row.brand.trim() || undefined,
        })
      );
      await Promise.all(promises);
      alert(`Successfully created ${validRows.length} subcategory(ies)`);
      setSubcategoryRows([]);
      setSelectedCategoryForSubcat('');
      loadCategories();
    } catch (error: any) {
      console.error('Error saving subcategories:', error);
      alert(`Failed to save subcategories: ${error?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // ========== ITEMS ==========
  const addItemRow = () => {
    if (!selectedCategoryForItem) {
      alert('Please select a category first');
      return;
    }
    const category = categories.find(c => c.id === selectedCategoryForItem);
    if (!category) return;

    // Add row without clearing existing rows
    setItemRows([...itemRows, {
      id: `item-${Date.now()}-${Math.random()}`,
      categoryId: selectedCategoryForItem,
      categoryName: category.name,
      subcategory: selectedSubcategoryForItem || '',
      name: '',
      displayName: '',
      code: '',
      barcode: '',
      selectedPrefixId: '',
      productCodeSize: '',
      useManualCode: false,
      cost: '',
      price: '',
      mrp: '',
      stock: '0',
    }]);
  };

  const removeItemRow = (id: string) => {
    setItemRows(itemRows.filter(r => r.id !== id));
  };

  const updateItemRow = (id: string, field: keyof BulkItemRow, value: string | boolean) => {
    setItemRows(itemRows.map(r => {
      if (r.id === id) {
        const updated = { ...r, [field]: value };
        
        // Handle prefix selection
        if (field === 'selectedPrefixId') {
          if (value && typeof value === 'string') {
            // Prefix selected - switch to prefix mode
            updated.useManualCode = false;
            updated.code = ''; // Clear manual code, will be auto-generated
          } else {
            // Prefix cleared - switch to manual mode
            updated.useManualCode = true;
            updated.productCodeSize = '';
            updated.barcode = '';
          }
        }
        
        // Auto-update barcode and code when prefix + product code changes
        if (field === 'productCodeSize' || field === 'selectedPrefixId') {
          if (updated.selectedPrefixId && updated.productCodeSize && !updated.useManualCode) {
            const selectedPrefix = prefixes.find(p => p.id === updated.selectedPrefixId);
            if (selectedPrefix) {
              updated.barcode = `${selectedPrefix.prefix}${updated.productCodeSize}`;
              updated.code = updated.barcode; // Code is same as barcode when using prefix
            }
          } else if (!updated.useManualCode) {
            // Clear if prefix/product code removed
            updated.barcode = '';
            updated.code = '';
          }
        }
        
        // Handle manual code entry
        if (field === 'code' && typeof value === 'string') {
          // When user types in code field, switch to manual mode
          updated.useManualCode = true;
          updated.selectedPrefixId = '';
          updated.productCodeSize = '';
          // Keep barcode separate - user can set it manually
        }
        
        // Auto-populate display_name when name changes (only if displayName is empty or matches previous name)
        if (field === 'name' && typeof value === 'string') {
          // Only auto-populate if displayName is empty or was previously auto-populated from the old name
          if (!updated.displayName || updated.displayName === r.name || updated.displayName.trim() === '') {
            updated.displayName = value;
          }
        }
        
        return updated;
      }
      return r;
    }));
  };

  const handleSaveItems = async () => {
    // Validate rows - need either prefix+productCode OR manual code
    const invalidRows = itemRows.filter(r => {
      const hasPrefix = r.selectedPrefixId && r.productCodeSize.trim();
      const hasManualCode = r.useManualCode && r.code.trim();
      return !hasPrefix && !hasManualCode;
    });

    if (invalidRows.length > 0) {
      alert('Error: Some items are missing either a prefix+product code or manual code. Please complete all items.');
      return;
    }

    // Calculate final codes and barcodes for validation
    const processedRows = itemRows.map(row => {
      let finalCode = '';
      let finalBarcode = '';
      
      if (!row.useManualCode && row.selectedPrefixId && row.productCodeSize.trim()) {
        const selectedPrefix = prefixes.find(p => p.id === row.selectedPrefixId);
        if (selectedPrefix) {
          finalBarcode = `${selectedPrefix.prefix}${row.productCodeSize.trim()}`;
          finalCode = finalBarcode;
        }
      } else if (row.useManualCode && row.code.trim()) {
        finalCode = row.code.trim();
        finalBarcode = row.barcode.trim() || finalCode;
      }
      
      return {
        ...row,
        finalCode,
        finalBarcode,
      };
    });

    const validRows = processedRows.filter(r => r.finalCode && r.name.trim() && r.cost && r.price);
    if (validRows.length === 0) {
      alert('Please add at least one item with name, code, cost, and price');
      return;
    }

    // Validate unique item codes
    const codes = validRows.map(r => r.finalCode.toLowerCase());
    const duplicateCodes = codes.filter((code, index) => codes.indexOf(code) !== index);
    if (duplicateCodes.length > 0) {
      alert(`Error: Duplicate item codes found: ${[...new Set(duplicateCodes)].join(', ')}. Item codes must be unique.`);
      return;
    }

    // Validate unique barcodes (if provided)
    const barcodes = validRows
      .filter(r => r.finalBarcode)
      .map(r => r.finalBarcode.toLowerCase());
    const duplicateBarcodes = barcodes.filter((barcode, index) => barcodes.indexOf(barcode) !== index);
    if (duplicateBarcodes.length > 0) {
      alert(`Error: Duplicate barcodes found: ${[...new Set(duplicateBarcodes)].join(', ')}. Barcodes must be unique.`);
      return;
    }

    // Check against existing items
    const existingCodes = items.map(i => i.code.toLowerCase());
    const existingBarcodes = items
      .filter(i => i.barcode)
      .map(i => i.barcode!.toLowerCase());
    
    const conflictingCodes = codes.filter(code => existingCodes.includes(code));
    if (conflictingCodes.length > 0) {
      alert(`Error: Item codes already exist: ${conflictingCodes.join(', ')}. Please use different codes.`);
      return;
    }

    const conflictingBarcodes = barcodes.filter(barcode => existingBarcodes.includes(barcode));
    if (conflictingBarcodes.length > 0) {
      alert(`Error: Barcodes already exist: ${conflictingBarcodes.join(', ')}. Please use different barcodes.`);
      return;
    }

    setSaving(true);
    try {
      const promises = validRows.map(async (row) => {
        // Ensure prefix exists in database if using prefix
        if (!row.useManualCode && row.selectedPrefixId) {
          const selectedPrefix = prefixes.find(p => p.id === row.selectedPrefixId);
          if (selectedPrefix) {
            try {
              await storageService.addItemCodePrefix({
                prefix: selectedPrefix.prefix,
                description: selectedPrefix.description,
              });
            } catch (err) {
              // Prefix might already exist, ignore
            }
          }
        }
        
        return storageService.addItem({
          name: row.name.trim(),
          display_name: row.displayName && row.displayName.trim() ? row.displayName.trim() : undefined,
          code: row.finalCode,
          barcode: row.finalBarcode || undefined,
          category_id: row.categoryId,
          subcategory: row.subcategory.trim() || undefined,
          cost: parseFloat(row.cost) || 0,
          price: parseFloat(row.price) || 0,
          mrp: row.mrp ? parseFloat(row.mrp) : undefined,
          stock: parseInt(row.stock) || 0,
        });
      });
      await Promise.all(promises);
      alert(`Successfully created ${validRows.length} item(s)`);
      setItemRows([]);
      setSelectedCategoryForItem('');
      setSelectedSubcategoryForItem('');
      loadCategories();
      loadItems();
    } catch (error: any) {
      console.error('Error saving items:', error);
      alert(`Failed to save items: ${error?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bulk-operations-page">
      <div className="bulk-operations-header">
        {company.logo && (
          <div className="page-logo-container">
            <img 
              src={company.logo} 
              alt={company.name || 'Company Logo'} 
              className="page-logo"
            />
          </div>
        )}
        <div className="header-content">
          <h1>{company.logo ? '' : '⚡ '}Bulk Operations</h1>
          <p className="subtitle">Create multiple categories, subcategories, or items at once</p>
        </div>
      </div>

      <div className="bulk-tabs">
        <button
          className={`tab-button ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          📁 Bulk Categories
        </button>
        <button
          className={`tab-button ${activeTab === 'subcategories' ? 'active' : ''}`}
          onClick={() => setActiveTab('subcategories')}
        >
          📂 Bulk Subcategories
        </button>
        <button
          className={`tab-button ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          📦 Bulk Items
        </button>
      </div>

      <div className="card">
        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="bulk-section">
            <div className="section-header">
              <h2>Bulk Create Categories</h2>
              <button className="btn btn-primary" onClick={addCategoryRow}>
                ➕ Add Row
              </button>
            </div>
            {categoryRows.length === 0 ? (
              <div className="empty-state">
                <p>Click "Add Row" to start adding categories</p>
              </div>
            ) : (
              <>
                <div className="bulk-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Name *</th>
                        <th>Subcategory</th>
                        <th>Brand</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryRows.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <input
                              type="text"
                              className="input"
                              value={row.name}
                              onChange={(e) => updateCategoryRow(row.id, 'name', e.target.value)}
                              placeholder="Category name"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="input"
                              value={row.subcategory}
                              onChange={(e) => updateCategoryRow(row.id, 'subcategory', e.target.value)}
                              placeholder="Subcategory (optional)"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="input"
                              value={row.brand}
                              onChange={(e) => updateCategoryRow(row.id, 'brand', e.target.value)}
                              placeholder="Brand (optional)"
                            />
                          </td>
                          <td>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => removeCategoryRow(row.id)}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bulk-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveCategories}
                    disabled={saving || categoryRows.length === 0}
                  >
                    {saving ? 'Saving...' : `💾 Save ${categoryRows.filter(r => r.name.trim()).length} Category(ies)`}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setCategoryRows([])}
                    disabled={saving}
                  >
                    Clear All
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Subcategories Tab */}
        {activeTab === 'subcategories' && (
          <div className="bulk-section">
            <div className="section-header">
              <h2>Bulk Create Subcategories</h2>
              <div className="category-selector">
                <select
                  className="input"
                  value={selectedCategoryForSubcat}
                  onChange={(e) => {
                    setSelectedCategoryForSubcat(e.target.value);
                    // Don't clear rows - allow adding subcategories for multiple categories
                  }}
                >
                  <option value="">Select Category</option>
                  {getUniqueMainCategories().map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-primary"
                  onClick={addSubcategoryRow}
                  disabled={!selectedCategoryForSubcat}
                >
                  ➕ Add Subcategory
                </button>
              </div>
            </div>
            {subcategoryRows.length === 0 ? (
              <div className="empty-state">
                <p>Select a category and click "Add Subcategory" to start</p>
              </div>
            ) : (
              <>
                <div className="bulk-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Subcategory *</th>
                        <th>Brand</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subcategoryRows.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <input
                              type="text"
                              className="input"
                              value={row.categoryName}
                              readOnly
                              style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="input"
                              value={row.subcategory}
                              onChange={(e) => updateSubcategoryRow(row.id, 'subcategory', e.target.value)}
                              placeholder="Subcategory name"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="input"
                              value={row.brand}
                              onChange={(e) => updateSubcategoryRow(row.id, 'brand', e.target.value)}
                              placeholder="Brand (optional)"
                            />
                          </td>
                          <td>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => removeSubcategoryRow(row.id)}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bulk-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveSubcategories}
                    disabled={saving || subcategoryRows.length === 0}
                  >
                    {saving ? 'Saving...' : `💾 Save ${subcategoryRows.filter(r => r.subcategory.trim()).length} Subcategory(ies)`}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setSubcategoryRows([]);
                      setSelectedCategoryForSubcat('');
                    }}
                    disabled={saving}
                  >
                    Clear All
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Items Tab */}
        {activeTab === 'items' && (
          <div className="bulk-section">
            <div className="section-header">
              <h2>Bulk Create Items</h2>
              <div className="category-selector">
                <select
                  className="input"
                  value={selectedCategoryForItem}
                  onChange={(e) => {
                    setSelectedCategoryForItem(e.target.value);
                    setSelectedSubcategoryForItem('');
                    // Don't clear rows - allow adding items for multiple category/subcategory combinations
                  }}
                >
                  <option value="">Select Category</option>
                  {getUniqueMainCategories().map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {selectedCategoryForItem && (
                  <select
                    className="input"
                    value={selectedSubcategoryForItem}
                    onChange={(e) => {
                      setSelectedSubcategoryForItem(e.target.value);
                      // Don't clear rows - allow adding items for multiple category/subcategory combinations
                    }}
                  >
                    <option value="">No Subcategory</option>
                    {getSubcategoriesForCategory(selectedCategoryForItem).length > 0 ? (
                      getSubcategoriesForCategory(selectedCategoryForItem).map((subcat, idx) => (
                        <option key={idx} value={subcat}>
                          {subcat}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No subcategories available</option>
                    )}
                  </select>
                )}
                <button
                  className="btn btn-primary"
                  onClick={addItemRow}
                  disabled={!selectedCategoryForItem}
                >
                  ➕ Add Item
                </button>
              </div>
            </div>
            {itemRows.length === 0 ? (
              <div className="empty-state">
                <p>Select category and subcategory, then click "Add Item" to start</p>
              </div>
            ) : (
              <>
                <div className="bulk-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Name *</th>
                        <th>Display Name</th>
                        <th>Prefix</th>
                        <th>Product Code</th>
                        <th>Code *</th>
                        <th>Barcode</th>
                        <th>Cost *</th>
                        <th>Price *</th>
                        <th>MRP</th>
                        <th>Stock</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemRows.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <div className="item-row-label">
                              <span className="category-label">{row.categoryName}</span>
                              {row.subcategory && <span className="subcategory-label"> / {row.subcategory}</span>}
                            </div>
                            <input
                              type="text"
                              className="input"
                              value={row.name}
                              onChange={(e) => updateItemRow(row.id, 'name', e.target.value)}
                              placeholder="Item name"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="input"
                              value={row.displayName}
                              onChange={(e) => updateItemRow(row.id, 'displayName', e.target.value)}
                              placeholder="Display name (optional)"
                            />
                          </td>
                          <td>
                            <select
                              className="input"
                              value={row.selectedPrefixId}
                              onChange={(e) => {
                                updateItemRow(row.id, 'selectedPrefixId', e.target.value);
                              }}
                            >
                              <option value="">Manual</option>
                              {prefixes.map((prefix) => (
                                <option key={prefix.id} value={prefix.id}>
                                  {prefix.prefix} {prefix.description ? `(${prefix.description})` : ''}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            {!row.useManualCode && (
                              <input
                                type="text"
                                className="input"
                                value={row.productCodeSize}
                                onChange={(e) => updateItemRow(row.id, 'productCodeSize', e.target.value)}
                                placeholder="PROD001-L"
                                disabled={!row.selectedPrefixId}
                                style={!row.selectedPrefixId ? { 
                                  background: '#f5f5f5', 
                                  cursor: 'not-allowed',
                                  opacity: 0.6
                                } : {}}
                              />
                            )}
                          </td>
                          <td>
                            {row.useManualCode && (
                              <input
                                type="text"
                                className="input"
                                value={row.code}
                                onChange={(e) => updateItemRow(row.id, 'code', e.target.value)}
                                placeholder="Item code"
                              />
                            )}
                            {!row.useManualCode && row.selectedPrefixId && row.productCodeSize && (
                              <span className="auto-code-display" title="Auto-generated from prefix + product code">
                                {row.code || 'Auto-generated'}
                              </span>
                            )}
                            {!row.useManualCode && (!row.selectedPrefixId || !row.productCodeSize) && (
                              <span className="auto-code-display" style={{ opacity: 0.5 }}>
                                Select prefix & enter product code
                              </span>
                            )}
                          </td>
                          <td>
                            <input
                              type="text"
                              className="input"
                              value={row.barcode}
                              onChange={(e) => updateItemRow(row.id, 'barcode', e.target.value)}
                              placeholder="Barcode"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              className="input"
                              value={row.cost}
                              onChange={(e) => updateItemRow(row.id, 'cost', e.target.value)}
                              placeholder="0.00"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              className="input"
                              value={row.price}
                              onChange={(e) => updateItemRow(row.id, 'price', e.target.value)}
                              placeholder="0.00"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              className="input"
                              value={row.mrp}
                              onChange={(e) => updateItemRow(row.id, 'mrp', e.target.value)}
                              placeholder="0.00"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="input"
                              value={row.stock}
                              onChange={(e) => updateItemRow(row.id, 'stock', e.target.value)}
                              onFocus={(e) => {
                                if (e.target.value === '0') {
                                  e.target.value = '';
                                  updateItemRow(row.id, 'stock', '');
                                }
                              }}
                              onBlur={(e) => {
                                if (e.target.value === '') {
                                  updateItemRow(row.id, 'stock', '0');
                                }
                              }}
                              placeholder="0"
                            />
                          </td>
                          <td>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => removeItemRow(row.id)}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bulk-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveItems}
                    disabled={saving || itemRows.length === 0}
                  >
                    {saving ? 'Saving...' : `💾 Save ${itemRows.filter(r => r.name.trim() && r.code.trim() && r.cost && r.price).length} Item(s)`}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setItemRows([]);
                      setSelectedCategoryForItem('');
                      setSelectedSubcategoryForItem('');
                    }}
                    disabled={saving}
                  >
                    Clear All
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

