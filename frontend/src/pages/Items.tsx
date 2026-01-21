import { useState, useEffect } from 'react';
import { useInventoryStore } from '../store/inventoryStore';
import { useAuthStore } from '../store/authStore';
import { useCompanyStore } from '../store/companyStore';
import { Item, Category, ItemCodePrefix } from '../types';
import { formatCurrency } from '../utils/formatters';
import { storageService } from '../services/storage';
import './Items.css';

interface ItemsProps {
  onNavigate?: (page: string) => void;
}

export default function Items({ onNavigate }: ItemsProps = {}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteAllModalVisible, setDeleteAllModalVisible] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [code, setCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [stock, setStock] = useState('0');
  
  // Item code prefix states
  const [prefixes, setPrefixes] = useState<ItemCodePrefix[]>([]);
  const [selectedPrefixId, setSelectedPrefixId] = useState('');
  const [productCodeSize, setProductCodeSize] = useState('');
  const [useManualCode, setUseManualCode] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubcategory, setFilterSubcategory] = useState('');
  const [filterStock, setFilterStock] = useState<'all' | 'in-stock' | 'out-of-stock'>('all');

  // Lazy loading states
  const [displayedItemsCount, setDisplayedItemsCount] = useState(20);
  const ITEMS_PER_PAGE = 20;

  const { items, categories, loadItems, loadCategories, addItem, updateItem, deleteItem, deleteAllItems } =
    useInventoryStore();
  const { customer } = useAuthStore();
  const { company, loadCompany } = useCompanyStore();
  const isAdmin = customer?.isAdmin || false;

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadCategories(),
        loadItems(),
        loadPrefixes(),
      ]);
    };
    loadData();
  }, [loadItems, loadCategories]);


  useEffect(() => {
    // Load company data from database
    loadCompany();
  }, [loadCompany]);

  const loadPrefixes = async () => {
    try {
      const data = await storageService.getItemCodePrefixes();
      setPrefixes(data);
    } catch (error) {
      console.error('Error loading prefixes:', error);
    }
  };

  // Auto-fill barcode when product code and size are entered
  useEffect(() => {
    if (!useManualCode && productCodeSize && selectedPrefixId) {
      const selectedPrefix = prefixes.find(p => p.id === selectedPrefixId);
      if (selectedPrefix) {
        const fullBarcode = `${selectedPrefix.prefix}${productCodeSize}`;
        setBarcode(fullBarcode);
        setCode(fullBarcode);
      }
    }
  }, [productCodeSize, selectedPrefixId, prefixes, useManualCode]);

  // Auto-populate display_name when name is typed (only if display_name is empty or matches previous name)
  useEffect(() => {
    if (name && (!displayName || displayName === editingItem?.name)) {
      setDisplayName(name);
    }
  }, [name]);

  const handleAdd = async () => {
    // Ensure categories are loaded before opening modal
    if (categories.length === 0) {
      await loadCategories();
    }
    setEditingItem(null);
    setName('');
    setDisplayName('');
    setCode('');
    setBarcode('');
    setCategoryId('');
    setSubcategory('');
    setCost('');
    setPrice('');
    setMrp('');
    setStock('0');
    setSelectedPrefixId('');
    setProductCodeSize('');
    setUseManualCode(false);
    setModalVisible(true);
  };

  const handleEdit = async (item: Item) => {
    // Ensure categories are loaded before opening modal
    if (categories.length === 0) {
      await loadCategories();
    }
    setEditingItem(item);
    setName(item.name);
    setDisplayName(item.display_name || '');
    setCode(item.code);
    setBarcode(item.barcode || '');
    setCategoryId(item.category_id || '');
    setSubcategory(item.subcategory || '');
    setCost(item.cost?.toString() || '');
    setPrice(item.price.toString());
    setMrp(item.mrp?.toString() || '');
    setStock(item.stock.toString());
    
    // Try to extract prefix and product code-size from item code
    const matchingPrefix = prefixes.find(p => item.code.startsWith(p.prefix));
    if (matchingPrefix) {
      setSelectedPrefixId(matchingPrefix.id);
      const productCodeSizeValue = item.code.replace(matchingPrefix.prefix, '');
      setProductCodeSize(productCodeSizeValue);
      setUseManualCode(false);
    } else {
      setSelectedPrefixId('');
      setProductCodeSize('');
      setUseManualCode(true);
    }
    
    setModalVisible(true);
  };

  // Get unique subcategories for selected category
  const getSubcategories = () => {
    if (!categoryId) return [];
    const selectedCategory = categories.find(c => c.id === categoryId);
    if (!selectedCategory) return [];
    // Get all subcategories that belong to this main category (same name)
    const subcats = categories
      .filter(c => c.name === selectedCategory.name && c.subcategory)
      .map(c => c.subcategory)
      .filter((sub): sub is string => !!sub);
    return [...new Set(subcats)];
  };

  const handleSave = async () => {
    // Validate: either prefix+productCodeSize OR manual code entry
    if (!useManualCode && selectedPrefixId && !productCodeSize.trim()) {
      alert('Please enter product code-size when a prefix is selected');
      return;
    }
    if (useManualCode && !code.trim()) {
      alert('Please enter item code manually');
      return;
    }
    if (!name.trim() || !price || !cost) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      let finalCode = code.trim();
      
      // If manual code entry, check if prefix exists, if not try to create it
      if (useManualCode && code.trim()) {
        // First check if code starts with any existing prefix
        const matchingPrefix = prefixes.find(p => finalCode.startsWith(p.prefix));
        
        if (!matchingPrefix) {
          // Try to extract a potential prefix (everything before the last dash/underscore + separator)
          const separators = /[-_]/;
          const lastSeparatorIndex = finalCode.search(separators);
          
          if (lastSeparatorIndex > 0) {
            // Find the last separator
            let lastIndex = -1;
            for (let i = finalCode.length - 1; i >= 0; i--) {
              if (finalCode[i] === '-' || finalCode[i] === '_') {
                lastIndex = i;
                break;
              }
            }
            
            if (lastIndex > 0) {
              const potentialPrefix = finalCode.substring(0, lastIndex + 1);
              const existingPrefix = prefixes.find(p => p.prefix === potentialPrefix);
              
              if (!existingPrefix && potentialPrefix.length > 0) {
                // Auto-create the prefix
                try {
                  await storageService.addItemCodePrefix({
                    prefix: potentialPrefix,
                    description: 'Auto-created from item code',
                  });
                  await loadPrefixes(); // Reload prefixes
                } catch (error: any) {
                  // If prefix already exists (race condition), just continue
                  console.log('Prefix might already exist:', error);
                }
              }
            }
          }
        }
      }

      if (editingItem) {
        await updateItem(editingItem.id, {
          name,
          display_name: displayName || undefined,
          code: finalCode,
          barcode: barcode || undefined,
          category_id: categoryId || undefined,
          subcategory: subcategory || undefined,
          cost: Number(cost),
          price: Number(price),
          mrp: mrp ? Number(mrp) : undefined,
          stock: Number(stock),
        });
      } else {
        await addItem({
          name,
          display_name: displayName || undefined,
          code: finalCode,
          barcode: barcode || undefined,
          category_id: categoryId || undefined,
          subcategory: subcategory || undefined,
          cost: Number(cost),
          price: Number(price),
          mrp: mrp ? Number(mrp) : undefined,
          stock: Number(stock),
        });
      }
      setModalVisible(false);
      resetForm();
      // Reload items to show the new one
      loadItems();
    } catch (error: any) {
      console.error('Error saving item:', error);
      const errorMessage = error?.message || 'Failed to save item';
      alert(`Failed to save item: ${errorMessage}`);
    }
  };

  const handleDelete = (item: Item) => {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      deleteItem(item.id);
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      const result = await deleteAllItems();
      alert(`Successfully deleted ${result.count} item${result.count === 1 ? '' : 's'}`);
      setDeleteAllModalVisible(false);
      loadItems();
    } catch (error) {
      console.error('Error deleting all items:', error);
      alert('Failed to delete all items');
    } finally {
      setDeletingAll(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDisplayName('');
    setCode('');
    setBarcode('');
    setCategoryId('');
    setSubcategory('');
    setCost('');
    setPrice('');
    setMrp('');
    setStock('0');
    setSelectedPrefixId('');
    setProductCodeSize('');
    setUseManualCode(false);
  };

  // Filter items
  const filteredItems = items.filter(item => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!item.name.toLowerCase().includes(query) && 
          !item.code.toLowerCase().includes(query) &&
          !(item.barcode && item.barcode.toLowerCase().includes(query))) {
        return false;
      }
    }

    // Category filter - match by category name
    if (filterCategory) {
      const selectedCategory = categories.find(c => c.id === filterCategory);
      if (selectedCategory) {
        const itemCategory = item.category_id 
          ? categories.find(c => c.id === item.category_id)
          : null;
        if (!itemCategory || itemCategory.name !== selectedCategory.name) {
          return false;
        }
      }
    }

    // Subcategory filter
    if (filterSubcategory && item.subcategory !== filterSubcategory) {
      return false;
    }

    // Stock filter
    if (filterStock === 'in-stock' && item.stock <= 0) {
      return false;
    }
    if (filterStock === 'out-of-stock' && item.stock > 0) {
      return false;
    }

    return true;
  });

  // Reset displayed items count when filters change
  useEffect(() => {
    setDisplayedItemsCount(ITEMS_PER_PAGE);
  }, [searchQuery, filterCategory, filterSubcategory, filterStock]);

  // Items to display (lazy loaded)
  const displayedItems = filteredItems.slice(0, displayedItemsCount);
  const hasMoreItems = displayedItemsCount < filteredItems.length;

  // Scroll handler for lazy loading
  useEffect(() => {
    const handleScroll = () => {
      // Check if user scrolled near the bottom (within 200px)
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 200
      ) {
        if (hasMoreItems) {
          setDisplayedItemsCount(prev => prev + ITEMS_PER_PAGE);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMoreItems]);

  // Get unique main category names (for filter dropdown)
  const getUniqueMainCategories = () => {
    if (!categories || categories.length === 0) {
      return [];
    }
    const mainCategoryNames = [...new Set(categories.map(c => c.name))];
    return mainCategoryNames.map(name => {
      // Find the main category (without subcategory) or first category with this name
      return categories.find(c => c.name === name && !c.subcategory) || 
             categories.find(c => c.name === name);
    }).filter((cat): cat is Category => !!cat);
  };

  // Get unique subcategories for filter
  const getFilterSubcategories = () => {
    if (!filterCategory) return [];
    const category = categories.find(c => c.id === filterCategory);
    if (!category) return [];
    const subcats = categories
      .filter(c => c.name === category.name && c.subcategory)
      .map(c => c.subcategory)
      .filter((sub): sub is string => !!sub);
    return [...new Set(subcats)];
  };

  return (
    <div className="items">
      <div className="items-header">
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
          <h1>{company.logo ? '' : '📦 '}Items</h1>
        </div>
        <div className="header-actions">
          {items.length > 0 && (
            <button 
              className="btn btn-danger" 
              onClick={() => setDeleteAllModalVisible(true)}
              style={{ marginRight: '10px' }}
            >
              🗑️ Delete All
            </button>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handleAdd}>
              + Add Item
            </button>
            {onNavigate && (
              <button 
                className="btn btn-secondary" 
                onClick={() => onNavigate('bulk-operations')}
                title="Bulk Create Items"
              >
                ⚡ Bulk Create
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card filters-card">
        <div className="filters-row">
          <div className="filter-group">
            <label>Search:</label>
            <input
              type="text"
              className="input"
              placeholder="Search by name, code, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Category:</label>
            <select
              className="input"
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setFilterSubcategory('');
              }}
            >
              <option value="">All Categories</option>
              {getUniqueMainCategories().map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          {filterCategory && getFilterSubcategories().length > 0 && (
            <div className="filter-group">
              <label>Subcategory:</label>
              <select
                className="input"
                value={filterSubcategory}
                onChange={(e) => setFilterSubcategory(e.target.value)}
              >
                <option value="">All Subcategories</option>
                {getFilterSubcategories().map((subcat, idx) => (
                  <option key={idx} value={subcat}>
                    {subcat}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="filter-group">
            <label>Stock:</label>
            <select
              className="input"
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value as 'all' | 'in-stock' | 'out-of-stock')}
            >
              <option value="all">All</option>
              <option value="in-stock">In Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
          {(searchQuery || filterCategory || filterSubcategory || filterStock !== 'all') && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('');
                setFilterSubcategory('');
                setFilterStock('all');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {filteredItems.length > 0 ? (
          <div className="items-table">
            <div className="items-count">
              Showing {displayedItems.length} of {filteredItems.length} filtered items ({items.length} total)
            </div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Category</th>
                  {isAdmin && <th>Cost</th>}
                  <th>Sale Price</th>
                  <th>MRP</th>
                  {isAdmin && <th>GM %</th>}
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedItems.map((item) => {
                  // Find category by matching category_id - always show category name
                  let categoryName = '-';
                  
                  if (item.category_id) {
                    if (categories.length === 0) {
                      // Categories not loaded yet
                      categoryName = 'Loading...';
                    } else {
                      // Try to find category by ID
                      const category = categories.find(c => c.id === item.category_id);
                      
                      if (category) {
                        // Show category name with subcategory if available
                        categoryName = category.name;
                        if (item.subcategory) {
                          categoryName += ` / ${item.subcategory}`;
                        }
                      } else {
                        // Category ID exists but category not found
                        console.warn('Category not found for item:', {
                          itemName: item.name,
                          itemCategoryId: item.category_id,
                          itemCategoryIdType: typeof item.category_id,
                          availableCategoryIds: categories.map(c => ({ id: c.id, name: c.name })),
                          totalCategories: categories.length,
                        });
                        categoryName = '-';
                      }
                    }
                  }
                  // Calculate GM percentage: ((price - cost) / price) * 100
                  const gmPercentage = item.price > 0 && item.cost > 0 
                    ? ((item.price - item.cost) / item.price) * 100 
                    : 0;
                  return (
                    <tr key={item.id}>
                      <td className="item-name">{item.name}</td>
                      <td className="item-code">{item.code}</td>
                      <td className="item-category">{categoryName}</td>
                      {isAdmin && (
                        <td className="item-cost">
                          {item.cost ? formatCurrency(item.cost) : '-'}
                        </td>
                      )}
                      <td className="item-price">{formatCurrency(item.price)}</td>
                      <td className="item-mrp">
                        {item.mrp ? formatCurrency(item.mrp) : '-'}
                      </td>
                      {isAdmin && (
                        <td className="item-gm">
                          {gmPercentage > 0 ? (
                            <span className={gmPercentage >= 30 ? 'gm-high' : gmPercentage >= 15 ? 'gm-medium' : 'gm-low'}>
                              {gmPercentage.toFixed(1)}%
                            </span>
                          ) : '-'}
                        </td>
                      )}
                      <td>
                        <span className={item.stock > 0 ? 'stock-ok' : 'stock-out'}>
                          {item.stock}
                        </span>
                      </td>
                      <td className="item-actions">
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(item)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {hasMoreItems && (
              <div className="load-more-indicator">
                <p>Scroll down to load more items...</p>
              </div>
            )}
          </div>
        ) : items.length > 0 ? (
          <div className="empty-state">
            <p>📭 No items match the filters</p>
            <p className="empty-subtext">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="empty-state">
            <p>📭 No items yet</p>
            <p className="empty-subtext">Add an item to get started</p>
          </div>
        )}
      </div>

      {modalVisible && (
        <div className="modal-overlay" onClick={() => setModalVisible(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingItem ? 'Edit Item' : 'Add Item'}</h2>
            <label>
              Name *:
              <input
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Display Name (for receipt):
              <input
                type="text"
                className="input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Auto-filled from name, can be modified"
              />
              <small style={{ fontSize: '11px', color: '#666', display: 'block', marginTop: '4px' }}>
                This name will be shown on receipts. Leave empty to use item name.
              </small>
            </label>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="radio"
                  checked={!useManualCode}
                  onChange={() => {
                    setUseManualCode(false);
                    setCode('');
                    setBarcode('');
                  }}
                />
                <span>Use Prefix Dropdown</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="radio"
                  checked={useManualCode}
                  onChange={() => {
                    setUseManualCode(true);
                    setSelectedPrefixId('');
                    setProductCodeSize('');
                  }}
                />
                <span>Enter Code Manually</span>
              </label>
            </div>

            {!useManualCode ? (
              <>
                <label>
                  Item Code Prefix *:
                  <select
                    className="input"
                    value={selectedPrefixId}
                    onChange={(e) => {
                      setSelectedPrefixId(e.target.value);
                      setProductCodeSize('');
                      setCode('');
                      setBarcode('');
                    }}
                  >
                    <option value="">Select prefix...</option>
                    {prefixes.map((prefix) => (
                      <option key={prefix.id} value={prefix.id}>
                        {prefix.prefix} {prefix.description ? `(${prefix.description})` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedPrefixId && (
                  <label>
                    Product Code-Size (e.g., "PROD001-L"):
                    <input
                      type="text"
                      className="input"
                      value={productCodeSize}
                      onChange={(e) => setProductCodeSize(e.target.value)}
                      placeholder="PROD001-L"
                    />
                    <small style={{ fontSize: '11px', color: '#666', display: 'block', marginTop: '4px' }}>
                      This will auto-fill the barcode and code fields
                    </small>
                  </label>
                )}
              </>
            ) : (
              <label>
                Item Code * (Manual Entry):
                <input
                  type="text"
                  className="input"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    // Auto-fill barcode with the same value
                    setBarcode(e.target.value);
                  }}
                  placeholder="Enter item code (e.g., shopname-place-PROD001-L)"
                />
                <small style={{ fontSize: '11px', color: '#666', display: 'block', marginTop: '4px' }}>
                  New codes will be automatically added to the prefix list
                </small>
              </label>
            )}
            <label>
              Barcode:
              <input
                type="text"
                className="input"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Auto-filled from prefix + product code-size"
              />
            </label>
            <label>
              Category:
              <select
                className="input"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategory(''); // Reset subcategory when category changes
                }}
              >
                <option value="">None</option>
                {categories.length === 0 ? (
                  <option value="" disabled>Loading categories...</option>
                ) : (
                  getUniqueMainCategories().map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))
                )}
              </select>
              {categories.length === 0 && (
                <small style={{ fontSize: '11px', color: '#666', display: 'block', marginTop: '4px' }}>
                  No categories available. Create categories first.
                </small>
              )}
            </label>
            {categoryId && getSubcategories().length > 0 && (
              <label>
                Subcategory:
                <select
                  className="input"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                >
                  <option value="">None</option>
                  {getSubcategories().map((subcat, idx) => (
                    <option key={idx} value={subcat}>
                      {subcat}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {categoryId && getSubcategories().length === 0 && (
              <label>
                Subcategory (Optional):
                <input
                  type="text"
                  className="input"
                  placeholder="Enter subcategory"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                />
              </label>
            )}
            <div className="form-row">
              <label>
                Cost (₹) *:
                <input
                  type="number"
                  className="input"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="Purchase cost"
                />
              </label>
              <label>
                Sale Price (₹) *:
                <input
                  type="number"
                  className="input"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="Selling price"
                />
              </label>
            </div>
            <label>
              MRP (₹) (Optional - for display):
              <input
                type="number"
                className="input"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                step="0.01"
                min="0"
                placeholder="Maximum Retail Price"
              />
            </label>
            <label>
              Stock:
              <input
                type="number"
                className="input"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                min="0"
              />
            </label>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModalVisible(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {deleteAllModalVisible && (
        <div className="modal-overlay" onClick={() => setDeleteAllModalVisible(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Delete All Items</h2>
            <p>
              Are you sure you want to delete <strong>all {items.length} item{items.length === 1 ? '' : 's'}</strong>?
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteAllModalVisible(false)}
                disabled={deletingAll}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteAll}
                disabled={deletingAll}
              >
                {deletingAll ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

