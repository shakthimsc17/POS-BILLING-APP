import { useState, useEffect } from 'react';
import { useCartStore } from '../store/cartStore';
import { useInventoryStore } from '../store/inventoryStore';
import { useCompanyStore } from '../store/companyStore';
import ItemCard from '../components/ItemCard';
import CategoryFilter from '../components/CategoryFilter';
import QuickSaleModal from '../components/QuickSaleModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { Item } from '../types';
import { formatCurrency } from '../utils/formatters';
import { storageService } from '../services/storage';
import './Dashboard.css';

interface DashboardProps {
  onNavigate: (page: 'cart' | 'categories' | 'items') => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayItems, setDisplayItems] = useState<Item[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [showQuickSaleModal, setShowQuickSaleModal] = useState(false);

  const { items: cartItems, addItem, getTotal, getItemCount } = useCartStore();
  const { items, loadItems } = useInventoryStore();
  const { company, loadCompany } = useCompanyStore();

  /* ---------------- Initial Load ---------------- */

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        await Promise.all([loadItems(), loadCategories()]);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, [loadItems]);

  /* ---------------- Load Company ---------------- */

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  /* ---------------- Filtering ---------------- */

  useEffect(() => {
    filterItems();
  }, [searchQuery, items, selectedCategories]);

  const loadCategories = async () => {
    try {
      const data = await storageService.getCategories();
      setAllCategories(data);

      const uniqueCategories = data.filter(
        (category, index, self) =>
          index ===
          self.findIndex(
            (c) => c.name.toLowerCase() === category.name.toLowerCase()
          )
      );
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const filterItems = async () => {
    let filtered: Item[] = [];

    if (selectedCategories.length > 0) {
      const selectedCategoryNames = categories
        .filter((cat) => selectedCategories.includes(cat.id))
        .map((cat) => cat.name.toLowerCase());

      const allMatchingCategoryIds = allCategories
        .filter((cat) =>
          selectedCategoryNames.includes(cat.name.toLowerCase())
        )
        .map((cat) => cat.id);

      if (allMatchingCategoryIds.length > 0) {
        try {
          const categoryIds = allMatchingCategoryIds.join(',');
          const categoryItems =
            await storageService.getItemsByCategories(categoryIds);

          filtered = categoryItems.filter(
            (item, index, self) =>
              index === self.findIndex((i) => i.id === item.id)
          );
        } catch (error) {
          console.error('Error fetching items by categories:', error);
          filtered = items.filter(
            (item) =>
              item.category_id &&
              allMatchingCategoryIds.includes(item.category_id)
          );
        }
      }
    } else {
      filtered = items;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.code.toLowerCase().includes(query) ||
          (item.barcode &&
            item.barcode.toLowerCase().includes(query))
      );
    }

    filtered.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );

    setDisplayItems(filtered);
  };

  /* ---------------- Handlers ---------------- */

  const handleToggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleItemPress = (item: Item) => {
    try {
      addItem(item, 1);
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.textContent = `${item.name} added to cart`;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    } catch (error: any) {
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.style.background = '#e74c3c';
      notification.textContent =
        error.message || 'Failed to add item to cart';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    }
  };

  /* ---------------- Loading ---------------- */

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  /* ---------------- UI ---------------- */

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

        <div className="header-actions">
          <button
            className="btn btn-success quick-sale-btn"
            onClick={() => setShowQuickSaleModal(true)}
          >
            ⚡ Quick Sale
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="search-and-filter-container">
        <div className="card search-container">
          <input
            type="text"
            className="input"
            placeholder="🔍 Search items..."
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
              <p>
                {getItemCount()} items • {formatCurrency(getTotal())}
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => onNavigate('cart')}
            >
              View Cart →
            </button>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="card">
        <h2>Items ({displayItems.length})</h2>

        {displayItems.length > 0 ? (
          <div className="grid grid-small">
            {displayItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onPress={handleItemPress}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>📭 No items found</p>
            <p className="empty-subtext">Add items to get started</p>
          </div>
        )}
      </div>

      {/* Quick Sale */}
      <QuickSaleModal
        isOpen={showQuickSaleModal}
        onClose={() => setShowQuickSaleModal(false)}
      />
    </div>
  );
}
