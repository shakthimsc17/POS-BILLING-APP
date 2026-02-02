import { useState, useEffect } from 'react';
import { QuickSaleItem } from '../types';
import { storageService } from '../services/storage';
import { useCartStore } from '../store/cartStore';
import { useInventoryStore } from '../store/inventoryStore';
import { useCompanyStore } from '../store/companyStore';
import { formatCurrency } from '../utils/formatters';
import AddToInventoryModal from '../components/AddToInventoryModal';
import './QuickSaleItems.css';

interface QuickSaleItemsProps {
  onViewOrder?: (orderId: string) => void;
}

export default function QuickSaleItems({ onViewOrder }: QuickSaleItemsProps) {
  const [quickSaleItems, setQuickSaleItems] = useState<QuickSaleItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'added'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<QuickSaleItem | null>(null);
  const [showAddToInventoryModal, setShowAddToInventoryModal] = useState(false);

  const { addItem } = useCartStore();
  const { loadItems } = useInventoryStore();
  const { company, loadCompany } = useCompanyStore();

  useEffect(() => {
    loadCompany();
    loadQuickSaleItems();
  }, [filter]);

  const loadQuickSaleItems = async () => {
    setLoading(true);
    try {
      const data = await storageService.getQuickSaleItems(filter);
      setQuickSaleItems(data);
    } catch (error) {
      console.error('Error loading quick sale items:', error);
      alert('Failed to load quick sale items');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quick sale item?')) {
      return;
    }

    try {
      await storageService.deleteQuickSaleItem(id);
      await loadQuickSaleItems();
      
      // Show notification
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.textContent = 'Quick sale item deleted';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    } catch (error: any) {
      console.error('Error deleting quick sale item:', error);
      alert(error.message || 'Failed to delete quick sale item');
    }
  };

  const handleAddToCart = (item: QuickSaleItem) => {
    const costVal = item.cost != null && item.cost !== ''
      ? (typeof item.cost === 'string' ? parseFloat(item.cost) : item.cost)
      : 0;
    // Create a temporary item for the cart (cost for profit calculation)
    const tempItem = {
      id: `quick-sale-${item.id}`,
      customer_id: '',
      name: item.name,
      code: `QS-${item.id.substring(0, 8)}`,
      price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
      cost: typeof costVal === 'number' && !isNaN(costVal) ? costVal : 0,
      stock: 0,
      created_at: item.created_at,
    };

    addItem(tempItem as any, item.quantity);

    // Show notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = `${item.name} added to cart`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  const handleAddToInventory = (item: QuickSaleItem) => {
    setSelectedItem(item);
    setShowAddToInventoryModal(true);
  };

  const handleInventoryAdded = async () => {
    await loadQuickSaleItems();
    await loadItems(); // Refresh items list
    setShowAddToInventoryModal(false);
    setSelectedItem(null);
  };

  const filteredItems = quickSaleItems;

  return (
    <div className="quick-sale-items">
      <div className="quick-sale-items-header">
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
          <h1>{company.logo ? '' : '⚡ '}Quick Sale Items</h1>
          <p>Manage items sold without inventory</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="filter-section">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={`filter-btn ${filter === 'added' ? 'active' : ''}`}
            onClick={() => setFilter('added')}
          >
            Added to Inventory
          </button>
        </div>
      </div>

      {/* Items List */}
      {loading ? (
        <div className="loading-state">
          <p>Loading quick sale items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p>📭 No quick sale items found</p>
            <p className="empty-subtext">
              {filter === 'pending' 
                ? 'All items have been added to inventory' 
                : filter === 'added'
                ? 'No items have been added to inventory yet'
                : 'Create quick sale items from the dashboard'}
            </p>
          </div>
        </div>
      ) : (
        <div className="card">
          <h2>Quick Sale Items ({filteredItems.length})</h2>
          <div className="quick-sale-items-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Cost</th>
                  <th>Total</th>
                  <th>Sold At</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
                  const costVal = item.cost != null && item.cost !== ''
                    ? (typeof item.cost === 'string' ? parseFloat(item.cost) : item.cost)
                    : null;
                  const total = typeof item.total_amount === 'string' ? parseFloat(item.total_amount) : item.total_amount;
                  const soldAt = new Date(item.sold_at);
                  const hasTransaction = !!item.transaction_id;

                  return (
                    <tr key={item.id}>
                      <td className="item-name">{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(price)}</td>
                      <td>{costVal != null && !isNaN(costVal) ? formatCurrency(costVal) : '–'}</td>
                      <td className="total-cell">{formatCurrency(total)}</td>
                      <td className="date-cell">
                        {soldAt.toLocaleDateString()} {soldAt.toLocaleTimeString()}
                      </td>
                      <td>
                        {item.added_to_inventory ? (
                          <span className="status-badge added">✓ Added</span>
                        ) : (
                          <span className="status-badge pending">Pending</span>
                        )}
                        {hasTransaction && (
                          <>
                            <span className="status-badge in-transaction" title="Included in a sale">
                              In transaction
                            </span>
                            {onViewOrder && (
                              <button
                                type="button"
                                className="btn btn-small btn-link view-order-link"
                                onClick={() => onViewOrder(item.transaction_id!)}
                                title="View order"
                              >
                                View order
                              </button>
                            )}
                          </>
                        )}
                      </td>
                      <td className="actions-cell">
                        {!item.added_to_inventory && (
                          <>
                            <button
                              className="btn btn-small btn-primary"
                              onClick={() => handleAddToCart(item)}
                              title="Add to Cart"
                            >
                              🛒 Add to Cart
                            </button>
                            <button
                              className="btn btn-small btn-success"
                              onClick={() => handleAddToInventory(item)}
                              title="Add to Inventory"
                            >
                              ➕ Add to Inventory
                            </button>
                            <button
                              className="btn btn-small btn-danger"
                              onClick={() => handleDelete(item.id)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                        {item.added_to_inventory && (
                          <span className="added-info">Item in inventory</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add to Inventory Modal */}
      {selectedItem && (
        <AddToInventoryModal
          isOpen={showAddToInventoryModal}
          onClose={() => {
            setShowAddToInventoryModal(false);
            setSelectedItem(null);
          }}
          quickSaleItem={selectedItem}
          onSuccess={handleInventoryAdded}
        />
      )}
    </div>
  );
}

