import { useState, useEffect, useCallback, useRef } from 'react';
import { useInventoryStore } from '../store/inventoryStore';
import { useCompanyStore } from '../store/companyStore';
import { Item, Category } from '../types';
import { storageService } from '../services/storage';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/formatters';
import './QuickItemSales.css';

interface ItemWithMappingCode extends Item {
  editingMappingCode?: string;
}

export default function QuickItemSales({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [items, setItems] = useState<ItemWithMappingCode[]>([]);
  const [displayItems, setDisplayItems] = useState<ItemWithMappingCode[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  // Filters
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isGlobalEditMode, setIsGlobalEditMode] = useState(false); // Renamed for clarity
  const [saving, setSaving] = useState(false);

  // Single Item Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [singleEditCode, setSingleEditCode] = useState('');

  const observerTarget = useRef<HTMLDivElement>(null);
  const { company, loadCompany } = useCompanyStore();
  const { updateItem, loadItems: reloadItemsFromStore } = useInventoryStore();

  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    loadCompany();
    loadCategories();
    loadItemsData();
  }, []);

  useEffect(() => {
    filterItems();
  }, [selectedMainCategory, selectedSubcategory, searchQuery, minPrice, maxPrice, items]);

  // Lazy loading with Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreItems();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore]);

  const loadCategories = async () => {
    try {
      const data = await storageService.getCategories();
      const categoriesArray: Category[] = Array.isArray(data) ? data : [];
      setAllCategories(categoriesArray);
      setCategories(categoriesArray);
    } catch (error) {
      console.error('Error loading categories:', error);
      setAllCategories([]);
      setCategories([]);
    }
  };

  const loadItemsData = async () => {
    setLoading(true);
    try {
      await reloadItemsFromStore();
      const response = await storageService.getItems();
      const itemsArray = Array.isArray(response) ? response : [];
      const itemsWithMappingCode = itemsArray.map(item => ({
        ...item,
        mapping_code: item.mapping_code || null,
      }));
      setItems(itemsWithMappingCode.slice(0, ITEMS_PER_PAGE));
      setHasMore(itemsArray.length > ITEMS_PER_PAGE);
      setPage(1);
    } catch (error) {
      console.error('Error loading items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreItems = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      await reloadItemsFromStore();
      const response = await storageService.getItems();
      const itemsArray = Array.isArray(response) ? response : [];
      const itemsWithMappingCode = itemsArray.map(item => ({
        ...item,
        mapping_code: item.mapping_code || null,
      }));
      const nextPage = page + 1;
      const startIndex = 0;
      const endIndex = nextPage * ITEMS_PER_PAGE;
      const newItems = itemsWithMappingCode.slice(startIndex, endIndex);

      setItems(newItems);
      setPage(nextPage);
      setHasMore(endIndex < itemsArray.length);
    } catch (error) {
      console.error('Error loading more items:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const getUniqueMainCategories = (): Category[] => {
    const unique = new Map<string, Category>();
    allCategories.forEach(cat => {
      if (!cat.subcategory) {
        const categoryName = cat.name.toLowerCase();
        if (!unique.has(categoryName)) unique.set(categoryName, cat);
      }
    });
    allCategories.forEach(cat => {
      if (cat.subcategory) {
        const categoryName = cat.name.toLowerCase();
        if (!unique.has(categoryName)) {
          unique.set(categoryName, {
            id: cat.id,
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

  const getSubcategoriesForMainCategory = (): string[] => {
    if (!selectedMainCategory) return [];
    const mainCategory = allCategories.find(c => c.id === selectedMainCategory);
    if (!mainCategory) return [];
    const categoryName = mainCategory.name;
    return allCategories
      .filter(c => c.name === categoryName && c.subcategory)
      .map(c => c.subcategory!)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
  };

  const filterItems = () => {
    let filtered: ItemWithMappingCode[] = [...items];

    if (selectedMainCategory) {
      const mainCategory = allCategories.find(c => c.id === selectedMainCategory);
      if (mainCategory) {
        const categoryName = mainCategory.name;
        const categoryIds = allCategories
          .filter(c => c.name === categoryName)
          .map(c => c.id);

        filtered = filtered.filter(item =>
          item.category_id && categoryIds.includes(item.category_id)
        );

        if (selectedSubcategory) {
          filtered = filtered.filter(item =>
            item.subcategory === selectedSubcategory
          );
        }
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.code && item.code.toLowerCase().includes(query))
      );
    }

    if (minPrice) {
      filtered = filtered.filter(item => Number(item.price) >= Number(minPrice));
    }
    if (maxPrice) {
      filtered = filtered.filter(item => Number(item.price) <= Number(maxPrice));
    }

    setDisplayItems(filtered);
  };

  // Global Edit Handlers
  const handleGlobalMappingCodeChange = (itemId: string, value: string) => {
    setDisplayItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, editingMappingCode: value }
          : item
      )
    );
  };

  const handleGlobalSave = async () => {
    setSaving(true);
    try {
      const updates = displayItems
        .filter(item => item.editingMappingCode !== undefined)
        .map(item => {
          const trimmedValue = item.editingMappingCode?.trim() || '';
          return {
            id: item.id,
            mappingCode: trimmedValue === '' ? undefined : trimmedValue,
          };
        });

      if (updates.length === 0) {
        setIsGlobalEditMode(false);
        return;
      }

      await Promise.all(
        updates.map(update =>
          updateItem(update.id, { mapping_code: update.mappingCode })
        )
      );

      await reloadItemsFromStore();
      await new Promise(resolve => setTimeout(resolve, 800));
      await loadItemsData();

      setIsGlobalEditMode(false);
      setDisplayItems(prev =>
        prev.map(item => ({ ...item, editingMappingCode: undefined }))
      );

      showNotification(`Successfully updated ${updates.length} item(s)`);
    } catch (error: any) {
      alert(error.message || 'Failed to save mapping codes');
    } finally {
      setSaving(false);
    }
  };

  const handleGlobalEdit = () => {
    setDisplayItems(prev =>
      prev.map(item => ({
        ...item,
        editingMappingCode: item.mapping_code || '',
      }))
    );
    setIsGlobalEditMode(true);
    setEditingId(null); // Cancel any single edit
  };

  const handleCancelGlobalEdit = () => {
    setDisplayItems(prev =>
      prev.map(item => ({ ...item, editingMappingCode: undefined }))
    );
    setIsGlobalEditMode(false);
  };

  // Single Item Edit Handlers
  const handleEditSingleItem = (item: Item) => {
    if (isGlobalEditMode) return; // Prevent conflicts
    setEditingId(item.id);
    setSingleEditCode(item.mapping_code || '');
  };

  const handleCancelSingleEdit = () => {
    setEditingId(null);
    setSingleEditCode('');
  };

  const handleSaveSingleItem = async (itemId: string) => {
    setSaving(true);
    try {
      const trimmedValue = singleEditCode.trim();
      const codeToSave = trimmedValue === '' ? undefined : trimmedValue;

      await updateItem(itemId, { mapping_code: codeToSave });

      await reloadItemsFromStore();
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadItemsData();

      setEditingId(null);
      setSingleEditCode('');
      showNotification('Mapping code updated successfully');
    } catch (error: any) {
      alert('Failed to update mapping code');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const showNotification = (message: string) => {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  if (loading) {
    return <LoadingSpinner message="Loading items..." />;
  }

  const mainCategories = getUniqueMainCategories();
  const subcategories = getSubcategoriesForMainCategory();

  return (
    <div className="quick-item-sales">
      <div className="quick-item-sales-header">
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
          <h1>{company.logo ? '' : '⚡ '}Quick Item Sales</h1>
          <p>Manage quick sales items and mapping codes</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filters-card">
        <div className="filters-row">
          <div className="filter-group" style={{ flex: 2, minWidth: '300px' }}>
            <label>Search Items:</label>
            <input
              type="text"
              className="filter-input"
              placeholder="🔍 Search by Item Name or Code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Price Range:</label>
            <div className="price-range-group">
              <input
                type="number"
                className="filter-input"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                min="0"
              />
              <span style={{ color: '#aaa' }}>-</span>
              <input
                type="number"
                className="filter-input"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                min="0"
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Main Category:</label>
            <select
              className="filter-select"
              value={selectedMainCategory}
              onChange={(e) => {
                setSelectedMainCategory(e.target.value);
                setSelectedSubcategory('');
              }}
            >
              <option value="">All Categories</option>
              {mainCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {selectedMainCategory && subcategories.length > 0 && (
            <div className="filter-group">
              <label>Subcategory:</label>
              <select
                className="filter-select"
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
              >
                <option value="">All</option>
                {subcategories.map((subcat, idx) => (
                  <option key={idx} value={subcat}>
                    {subcat}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="card">
        <div className="table-header-actions">
          <h2>Items ({displayItems.length})</h2>
          {!isGlobalEditMode && !editingId ? (
            <button
              className="btn btn-primary"
              onClick={handleGlobalEdit}
              title="Edit all mapping codes"
            >
              ✏️ Edit All Mapping Codes
            </button>
          ) : isGlobalEditMode ? (
            <div className="edit-mode-actions">
              <button
                className="btn btn-success"
                onClick={handleGlobalSave}
                disabled={saving}
              >
                {saving ? '💾 Saving...' : '💾 Save All'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleCancelGlobalEdit}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          ) : (
            // Single edit active, hide global button (optional, or just disable)
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Editing Item...</span>
          )}
        </div>

        {displayItems.length === 0 ? (
          <div className="empty-state">
            <p>📭 No items found matching criteria</p>
          </div>
        ) : (
          <>
            <div className="quick-item-sales-table-container">
              <table className="quick-item-sales-table">
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Item Name</th>
                    <th style={{ width: '15%' }}>Code</th>
                    <th style={{ width: '15%' }}>Price</th>
                    <th style={{ width: '25%' }}>Mapping Code</th>
                    <th style={{ width: '15%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map((item) => {
                    const isSingleEditing = editingId === item.id;
                    return (
                      <tr key={item.id} style={isSingleEditing ? { background: '#fffbeb' } : {}}>
                        <td className="item-name">{item.display_name || item.name}</td>
                        <td>
                          <span className="item-code">{item.code}</span>
                        </td>
                        <td className="item-price">
                          {formatCurrency(Number(item.price) || 0)}
                        </td>
                        <td className="mapping-code-cell">
                          {isGlobalEditMode ? (
                            <input
                              type="text"
                              className="mapping-code-input"
                              value={item.editingMappingCode || ''}
                              onChange={(e) => handleGlobalMappingCodeChange(item.id, e.target.value)}
                              placeholder="Code"
                            />
                          ) : isSingleEditing ? (
                            <input
                              type="text"
                              className="mapping-code-input"
                              value={singleEditCode}
                              onChange={(e) => setSingleEditCode(e.target.value)}
                              placeholder="Code"
                              autoFocus
                            />
                          ) : (
                            <span className={item.mapping_code ? 'mapping-code-value' : 'mapping-code-empty'}>
                              {item.mapping_code || '-'}
                            </span>
                          )}
                        </td>
                        <td className="item-actions">
                          {isGlobalEditMode ? (
                            <span style={{ color: '#ccc' }}>-</span>
                          ) : isSingleEditing ? (
                            <div className="edit-mode-actions" style={{ gap: '0.5rem' }}>
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleSaveSingleItem(item.id)}
                                disabled={saving}
                                title="Save"
                              >
                                {saving ? '...' : 'Save'}
                              </button>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={handleCancelSingleEdit}
                                disabled={saving}
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleEditSingleItem(item)}
                              title="Edit Mapping Code"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {hasMore && (
              <div ref={observerTarget} className="load-more-indicator">
                {loadingMore ? (
                  <p>Loading more items...</p>
                ) : (
                  <p>Scroll to load more</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
