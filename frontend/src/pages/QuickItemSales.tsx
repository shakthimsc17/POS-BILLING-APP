import { useState, useEffect, useRef } from 'react';
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

export default function QuickItemSales() {
  const [items, setItems] = useState<ItemWithMappingCode[]>([]);
  const [displayItems, setDisplayItems] = useState<ItemWithMappingCode[]>([]);
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
    } catch (error) {
      console.error('Error loading categories:', error);
      setAllCategories([]);
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
        mapping_code: item.mapping_code || undefined,
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
        mapping_code: item.mapping_code || undefined,
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
          <p>Optimize your inventory with rapid mapping and price management</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filters-card">
        <div className="filters-row">
          <div className="filter-group">
            <label>Search Inventory</label>
            <input
              type="text"
              className="filter-input"
              placeholder="🔍 Name or Item Code"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Price Range</label>
            <div className="price-range-group">
              <input
                type="number"
                className="filter-input"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span style={{ color: '#94a3b8', fontWeight: 700 }}>→</span>
              <input
                type="number"
                className="filter-input"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select
              className="filter-select"
              value={selectedMainCategory}
              onChange={(e) => {
                setSelectedMainCategory(e.target.value);
                setSelectedSubcategory('');
              }}
            >
              <option value="">All Regions / Categories</option>
              {mainCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {selectedMainCategory && subcategories.length > 0 && (
            <div className="filter-group">
              <label>Sub-section</label>
              <select
                className="filter-select"
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
              >
                <option value="">All Sub-items</option>
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

      {/* Items List */}
      <div className="card">
        <div className="table-header-actions">
          <div className="header-titles">
            <h2>Tracked Items ({displayItems.length})</h2>
          </div>
          <div className="header-actions">
            {!isGlobalEditMode && !editingId ? (
              <button
                className="btn btn-primary"
                onClick={handleGlobalEdit}
              >
                ✏️ Bulk Edit Mapping
              </button>
            ) : isGlobalEditMode ? (
              <div className="edit-mode-actions">
                <button
                  className="btn btn-success"
                  onClick={handleGlobalSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : '💾 Apply All'}
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
              <span className="single-edit-notice">
                <span className="pulse-dot"></span>
                Editing Active Record
              </span>
            )}
          </div>
        </div>

        {displayItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <p>No matches found in your current inventory</p>
          </div>
        ) : (
          <div className="modern-grid-container">
            <div className="modern-grid">
              <div className="grid-row grid-header">
                <div className="grid-col">PRODUCT DETAILS</div>
                <div className="grid-col">ITEM CODE</div>
                <div className="grid-col" style={{ textAlign: 'right' }}>PRICE</div>
                <div className="grid-col">MAPPING CODE</div>
                <div className="grid-col" style={{ textAlign: 'right' }}>OPTIONS</div>
              </div>

              <div className="grid-body">
                {displayItems.map((item) => {
                  const isSingleEditing = editingId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`grid-row grid-body-row ${isSingleEditing ? 'editing' : ''}`}
                    >
                      <div className="grid-col item-name-col">
                        <span className="main-name">{item.display_name || item.name}</span>
                        <span className="sub-info">{item.subcategory || 'General'}</span>
                      </div>

                      <div className="grid-col">
                        <span className="item-code-badge">{item.code}</span>
                      </div>

                      <div className="grid-col col-price">
                        {formatCurrency(Number(item.price) || 0)}
                      </div>

                      <div className="grid-col">
                        {isGlobalEditMode ? (
                          <div className="mapping-input-wrapper">
                            <input
                              type="text"
                              className="modern-mapping-input"
                              value={item.editingMappingCode || ''}
                              onChange={(e) => handleGlobalMappingCodeChange(item.id, e.target.value)}
                              placeholder="Set mapping..."
                            />
                          </div>
                        ) : isSingleEditing ? (
                          <div className="mapping-input-wrapper">
                            <input
                              type="text"
                              className="modern-mapping-input"
                              value={singleEditCode}
                              onChange={(e) => setSingleEditCode(e.target.value)}
                              placeholder="Set mapping..."
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div className="mapping-display">
                            {item.mapping_code ? (
                              <span className="mapping-value-pill">
                                {item.mapping_code}
                              </span>
                            ) : (
                              <span className="mapping-empty">Unmapped</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid-col item-actions">
                        {isGlobalEditMode ? (
                          <span className="lock-icon">🔒</span>
                        ) : isSingleEditing ? (
                          <div className="edit-mode-actions">
                            <button
                              className="btn-ghost btn-success"
                              onClick={() => handleSaveSingleItem(item.id)}
                              disabled={saving}
                              title="Save"
                            >
                              ✅
                            </button>
                            <button
                              className="btn-ghost btn-secondary"
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
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {hasMore && (
          <div ref={observerTarget} className="load-more-indicator">
            {loadingMore ? (
              <p>Fetching more inventory...</p>
            ) : (
              <p>Scroll for more records</p>
            )}
          </div>
        )}
      </div>

      <style>{`
        .pulse-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          background-color: #f59e0b;
          border-radius: 50%;
          margin-right: 8px;
          box-shadow: 0 0 0 rgba(245, 158, 11, 0.4);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
        .single-edit-notice {
          display: flex;
          align-items: center;
          color: #92400e;
          font-weight: 600;
          font-size: 0.9rem;
          background: #fef3c7;
          padding: 0.5rem 1rem;
          border-radius: 99px;
        }
        .lock-icon {
          opacity: 0.3;
          font-size: 1.2rem;
        }
        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.2;
        }
      `}</style>
    </div>
  );
}
