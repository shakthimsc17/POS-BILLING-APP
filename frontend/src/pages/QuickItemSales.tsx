import { useState, useEffect, useCallback, useRef } from 'react';
import { useInventoryStore } from '../store/inventoryStore';
import { useCompanyStore } from '../store/companyStore';
import { Item, Category } from '../types';
import { storageService } from '../services/storage';
import LoadingSpinner from '../components/LoadingSpinner';
import './QuickItemSales.css';

interface ItemWithMappingCode extends Item {
  editingMappingCode?: string;
}

export default function QuickItemSales({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [items, setItems] = useState<ItemWithMappingCode[]>([]);
  const [displayItems, setDisplayItems] = useState<ItemWithMappingCode[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
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
  }, [selectedMainCategory, selectedSubcategory, items]);

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
      // First reload from store to ensure we have latest data
      await reloadItemsFromStore();
      // Then fetch fresh data from API
      const response = await storageService.getItems();
      const itemsArray = Array.isArray(response) ? response : [];
      // Ensure mapping_code is included in items
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
      await reloadItemsFromStore(); // Refresh from store first
      const response = await storageService.getItems();
      const itemsArray = Array.isArray(response) ? response : [];
      // Ensure mapping_code is included
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

  // Get unique main categories
  const getUniqueMainCategories = (): Category[] => {
    const unique = new Map<string, Category>();
    
    allCategories.forEach(cat => {
      if (!cat.subcategory) {
        const categoryName = cat.name.toLowerCase();
        if (!unique.has(categoryName)) {
          unique.set(categoryName, cat);
        }
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

  // Get subcategories for selected main category
  const getSubcategoriesForMainCategory = (): string[] => {
    if (!selectedMainCategory) return [];
    
    const mainCategory = allCategories.find(c => c.id === selectedMainCategory);
    if (!mainCategory) return [];
    
    const categoryName = mainCategory.name;
    const subcategories = allCategories
      .filter(c => c.name === categoryName && c.subcategory)
      .map(c => c.subcategory!)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
    
    return subcategories;
  };

  const filterItems = () => {
    let filtered: ItemWithMappingCode[] = [...items];

    // Filter by main category
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

        // Filter by subcategory if selected
        if (selectedSubcategory) {
          filtered = filtered.filter(item => 
            item.subcategory === selectedSubcategory
          );
        }
      }
    }

    setDisplayItems(filtered);
  };

  const handleMappingCodeChange = (itemId: string, value: string) => {
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
      // Get all items that have been edited (editingMappingCode is defined)
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
        setIsEditMode(false);
        return;
      }

      // Update all items
      await Promise.all(
        updates.map(update => 
          updateItem(update.id, { mapping_code: update.mappingCode })
        )
      );

      // Reload items to get latest data from database
      // updateItem already calls loadItems in store, but we need to refresh local state
      await reloadItemsFromStore(); // Refresh store (this calls loadItems internally)
      // Delay to ensure backend has processed all updates
      await new Promise(resolve => setTimeout(resolve, 800));
      // Reload local items with fresh data from API
      await loadItemsData(); // Reload local items
      
      // Reset edit mode
      setIsEditMode(false);
      setDisplayItems(prev => 
        prev.map(item => ({ ...item, editingMappingCode: undefined }))
      );

      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.textContent = `Successfully updated ${updates.length} item(s)`;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    } catch (error: any) {
      alert(error.message || 'Failed to save mapping codes');
    } finally {
      setSaving(false);
    }
  };

  const handleGlobalEdit = () => {
    // Initialize editing values with current mapping codes
    setDisplayItems(prev => 
      prev.map(item => ({
        ...item,
        editingMappingCode: item.mapping_code || '',
      }))
    );
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setDisplayItems(prev => 
      prev.map(item => ({ ...item, editingMappingCode: undefined }))
    );
    setIsEditMode(false);
  };

  const handleEditItem = (item: Item) => {
    if (onNavigate) {
      onNavigate('items');
      // Note: User will need to find and edit the item manually in Items page
      // For better UX, you could store the item ID and scroll to it
    }
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
          <p>View items with mapping codes</p>
        </div>
      </div>

      {/* Category Filters */}
      <div className="card filters-card">
        <div className="filters-row">
          <div className="filter-group">
            <label>Main Category:</label>
            <select
              className="input"
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
                className="input"
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
              >
                <option value="">All Subcategories</option>
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
          {!isEditMode ? (
            <button
              className="btn btn-primary"
              onClick={handleGlobalEdit}
              title="Edit all mapping codes"
            >
              ✏️ Edit All Mapping Codes
            </button>
          ) : (
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
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        {displayItems.length === 0 ? (
          <div className="empty-state">
            <p>📭 No items found</p>
          </div>
        ) : (
          <>
            <div className="quick-item-sales-table-container">
              <table className="quick-item-sales-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Item Code</th>
                    <th>Mapping Code</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map((item) => (
                    <tr key={item.id}>
                      <td className="item-name">{item.display_name || item.name}</td>
                      <td className="item-code">{item.code}</td>
                      <td className="mapping-code-cell">
                        {isEditMode ? (
                          <input
                            type="text"
                            className="input mapping-code-input"
                            value={item.editingMappingCode || ''}
                            onChange={(e) => handleMappingCodeChange(item.id, e.target.value)}
                            placeholder="Enter mapping code"
                          />
                        ) : (
                          <span className={item.mapping_code ? 'mapping-code-value' : 'mapping-code-empty'}>
                            {item.mapping_code || '-'}
                          </span>
                        )}
                      </td>
                      <td className="item-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEditItem(item)}
                          title="Edit item details"
                        >
                          Edit Item
                        </button>
                      </td>
                    </tr>
                  ))}
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
