import { useState, useEffect } from 'react';
import { useInventoryStore } from '../store/inventoryStore';
import { Item, Category } from '../types';
import { formatCurrency } from '../utils/formatters';
import './Items.css';

export default function Items() {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [stock, setStock] = useState('0');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubcategory, setFilterSubcategory] = useState('');
  const [filterStock, setFilterStock] = useState<'all' | 'in-stock' | 'out-of-stock'>('all');

  const { items, categories, loadItems, loadCategories, addItem, updateItem, deleteItem } =
    useInventoryStore();

  useEffect(() => {
    loadItems();
    loadCategories();
  }, [loadItems, loadCategories]);

  const handleAdd = () => {
    setEditingItem(null);
    setName('');
    setCode('');
    setBarcode('');
    setCategoryId('');
    setSubcategory('');
    setCost('');
    setPrice('');
    setMrp('');
    setStock('0');
    setModalVisible(true);
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setName(item.name);
    setCode(item.code);
    setBarcode(item.barcode || '');
    setCategoryId(item.category_id || '');
    setSubcategory(item.subcategory || '');
    setCost(item.cost?.toString() || '');
    setPrice(item.price.toString());
    setMrp(item.mrp?.toString() || '');
    setStock(item.stock.toString());
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
    if (!name.trim() || !code.trim() || !price || !cost) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingItem) {
        await updateItem(editingItem.id, {
          name,
          code,
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
          code,
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

  const resetForm = () => {
    setName('');
    setCode('');
    setBarcode('');
    setCategoryId('');
    setSubcategory('');
    setCost('');
    setPrice('');
    setMrp('');
    setStock('0');
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

  // Get unique main category names (for filter dropdown)
  const getUniqueMainCategories = () => {
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
        <h1>📦 Items</h1>
        <button className="btn btn-primary" onClick={handleAdd}>
          + Add Item
        </button>
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
              Showing {filteredItems.length} of {items.length} items
            </div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Category</th>
                  <th>Cost</th>
                  <th>Sale Price</th>
                  <th>MRP</th>
                  <th>GM %</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const category = item.category_id 
                    ? categories.find(c => c.id === item.category_id)
                    : null;
                  const categoryName = category 
                    ? `${category.name}${item.subcategory ? ` / ${item.subcategory}` : ''}`
                    : '-';
                  // Calculate GM percentage: ((price - cost) / price) * 100
                  const gmPercentage = item.price > 0 && item.cost > 0 
                    ? ((item.price - item.cost) / item.price) * 100 
                    : 0;
                  return (
                    <tr key={item.id}>
                      <td className="item-name">{item.name}</td>
                      <td className="item-code">{item.code}</td>
                      <td className="item-category">{categoryName}</td>
                      <td className="item-cost">
                        {item.cost ? formatCurrency(item.cost) : '-'}
                      </td>
                      <td className="item-price">{formatCurrency(item.price)}</td>
                      <td className="item-mrp">
                        {item.mrp ? formatCurrency(item.mrp) : '-'}
                      </td>
                      <td className="item-gm">
                        {gmPercentage > 0 ? (
                          <span className={gmPercentage >= 30 ? 'gm-high' : gmPercentage >= 15 ? 'gm-medium' : 'gm-low'}>
                            {gmPercentage.toFixed(1)}%
                          </span>
                        ) : '-'}
                      </td>
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
              Code *:
              <input
                type="text"
                className="input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
            <label>
              Barcode:
              <input
                type="text"
                className="input"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
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
                {getUniqueMainCategories().map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
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
    </div>
  );
}

