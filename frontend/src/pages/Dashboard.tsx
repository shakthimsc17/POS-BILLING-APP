import { useState, useEffect } from 'react';
import { useCartStore } from '../store/cartStore';
import { useInventoryStore } from '../store/inventoryStore';
import { useCompanyStore } from '../store/companyStore';
import ItemCard from '../components/ItemCard';
import { Item } from '../types';
import { formatCurrency } from '../utils/formatters';
import './Dashboard.css';

interface DashboardProps {
  onNavigate: (page: 'cart' | 'categories' | 'items' | 'payment') => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [displayItems, setDisplayItems] = useState<Item[]>([]);

  const { items: cartItems, addItem, getTotal, getItemCount } = useCartStore();
  const { items, loadItems, searchItems } = useInventoryStore();
  const { company, loadCompany } = useCompanyStore();

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    // Load company data from database
    loadCompany();
  }, [loadCompany]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      // Sort items alphabetically by name
      const sortedItems = [...items].sort((a, b) => 
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
      setDisplayItems(sortedItems);
    } else {
      handleSearch(searchQuery);
    }
  }, [searchQuery, items]);

  const handleSearch = async (query: string) => {
    if (query.trim() === '') {
      // Sort items alphabetically by name
      const sortedItems = [...items].sort((a, b) => 
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
      setDisplayItems(sortedItems);
      return;
    }
    const results = await searchItems(query);
    // Sort search results alphabetically too
    const sortedResults = [...results].sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
    setDisplayItems(sortedResults);
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

      {/* Search Bar */}
      <div className="card search-container">
        <input
          type="text"
          className="input"
          placeholder="🔍 Search items by name, code, or barcode..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
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

