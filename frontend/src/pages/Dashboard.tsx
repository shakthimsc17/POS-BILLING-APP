import { useState, useEffect } from 'react';
import { useCartStore } from '../store/cartStore';
import { useInventoryStore } from '../store/inventoryStore';
import { useCompanyStore } from '../store/companyStore';
import ItemCard from '../components/ItemCard';
import CategoryFilter from '../components/CategoryFilter';
import { Item } from '../types';
import { formatCurrency } from '../utils/formatters';
import { storageService } from '../services/storage';
import './Dashboard.css';

interface DashboardProps {
  onNavigate: (page: 'cart' | 'categories' | 'items') => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [displayItems, setDisplayItems] = useState<Item[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]); // Store all categories for filtering

  const { items: cartItems, addItem, getTotal, getItemCount } = useCartStore();
  const { items, loadItems, searchItems } = useInventoryStore();
  const { company, loadCompany } = useCompanyStore();

  useEffect(() => {
    loadItems();
    loadCategories();
  }, [loadItems]);

  const loadCategories = async () => {
    try {
      const data = await storageService.getCategories();
      // Store all categories for filtering
      setAllCategories(data);
      // Filter to show only unique categories by name (keep first occurrence) for display
      const uniqueCategories = data.filter((category, index, self) =>
        index === self.findIndex((c) => c.name.toLowerCase() === category.name.toLowerCase())
      );
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  useEffect(() => {
    // Load company data from database
    loadCompany();
  }, [loadCompany]);

  useEffect(() => {
    filterItems();
  }, [searchQuery, items, selectedCategories]);

  const filterItems = async () => {
    let filtered: Item[] = [];

    // If categories are selected, filter by categories
    if (selectedCategories.length > 0) {
      // Get all category IDs that match the selected category names
      // This handles cases where multiple categories have the same name
      const selectedCategoryNames = categories
        .filter(cat => selectedCategories.includes(cat.id))
        .map(cat => cat.name.toLowerCase());
      
      const allMatchingCategoryIds = allCategories
        .filter(cat => selectedCategoryNames.includes(cat.name.toLowerCase()))
        .map(cat => cat.id);

      if (allMatchingCategoryIds.length > 0) {
        try {
          const categoryIds = allMatchingCategoryIds.join(',');
          const categoryItems = await storageService.getItemsByCategories(categoryIds);
          // Remove duplicates in case backend returns any
          const uniqueItems = categoryItems.filter((item, index, self) =>
            index === self.findIndex((i) => i.id === item.id)
          );
          filtered = uniqueItems;
        } catch (error) {
          console.error('Error fetching items by categories:', error);
          // Fallback to client-side filtering - show items from ANY selected category
          filtered = items.filter(item => 
            item.category_id && allMatchingCategoryIds.includes(item.category_id)
          );
        }
      }
    } else {
      filtered = items;
    }

    // Apply search filter if search query exists
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query) ||
        (item.barcode && item.barcode.toLowerCase().includes(query))
      );
    }

    // Sort items alphabetically by name
    const sortedItems = filtered.sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
    setDisplayItems(sortedItems);
  };

  const handleToggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleItemPress = (item: Item) => {
    addItem(item, 1);
    // Show notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = `${item.name} added to cart`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
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
          <h1>{company.logo ? '' : '🛒 '}Point of Sale Dashboard</h1>
          <p>Search and add items to cart</p>
        </div>
      </div>

      {/* Search Bar and Category Filter */}
      <div className="search-and-filter-container">
        <div className="card search-container">
          <input
            type="text"
            className="input"
            placeholder="🔍 Search items by name, code, or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {categories.length > 0 && (
          <div className="card category-filter-container">
            <CategoryFilter
              categories={categories}
              selectedCategories={selectedCategories}
              onToggleCategory={handleToggleCategory}
            />
          </div>
        )}
      </div>

      {/* Cart Summary */}
      {cartItems.length > 0 && (
        <div className="card cart-summary">
          <div className="cart-info">
            <div>
              <h3>Cart Summary</h3>
              <p>{getItemCount()} items • {formatCurrency(getTotal())}</p>
            </div>
            <button className="btn btn-primary" onClick={() => onNavigate('cart')}>
              View Cart →
            </button>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="card">
        <h2>Items ({displayItems.length})</h2>
        {displayItems.length > 0 ? (
          <div className="grid grid-small">
            {displayItems.map((item) => (
              <ItemCard key={item.id} item={item} onPress={handleItemPress} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>📭 No items found</p>
            <p className="empty-subtext">Add items to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

