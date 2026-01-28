import { useState, useEffect } from 'react';
import { useTableStore } from '../store/tableStore';
import { useInventoryStore } from '../store/inventoryStore';
import { useCompanyStore } from '../store/companyStore';
import { Table, Item, CartItem } from '../types';
import { formatCurrency } from '../utils/formatters';
import SearchBarcodeInput from './SearchBarcodeInput';
import QuickItemSearch from './QuickItemSearch';
import ItemCard from './ItemCard';
import './TableOrderModal.css';

interface TableOrderModalProps {
  isOpen: boolean;
  table: Table | null;
  onClose: () => void;
  onOrderCreated: () => void;
}

export default function TableOrderModal({
  isOpen,
  table,
  onClose,
  onOrderCreated,
}: TableOrderModalProps) {
  const { createTableOrder, getActiveTableOrder, updateTableOrder, completeTableOrder } = useTableStore();
  const { items, loadItems } = useInventoryStore();
  const { company, loadCompany } = useCompanyStore();
  
  const [orderItems, setOrderItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayItems, setDisplayItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [existingOrder, setExistingOrder] = useState<any>(null);
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [useQuickSearch, setUseQuickSearch] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCompany();
      if (company.business_type === 'cafe') {
        setUseQuickSearch(true);
      }
    }
  }, [isOpen, company.business_type, loadCompany]);

  useEffect(() => {
    if (isOpen && table) {
      loadItems();
      checkExistingOrder();
    }
  }, [isOpen, table, loadItems]);

  const checkExistingOrder = async () => {
    if (!table) return;
    try {
      const order = await getActiveTableOrder(table.id);
      if (order) {
        setExistingOrder(order);
        // Load items from existing order
        const items = JSON.parse(order.items_json);
        setOrderItems(items.map((item: any) => {
          const itemData = item.item || item;
          const quantity = item.quantity || 1;
          const price = item.customPrice || parseFloat(itemData.price.toString());
          return {
            item: itemData,
            quantity,
            customPrice: item.customPrice,
            originalPrice: item.originalPrice || parseFloat(itemData.price.toString()),
            subtotal: price * quantity,
          };
        }));
        setTaxRate(parseFloat(order.tax_rate?.toString() || '0'));
        setDiscount(parseFloat(order.discount?.toString() || '0'));
      } else {
        setExistingOrder(null);
        setOrderItems([]);
      }
    } catch (error) {
      console.error('Error checking existing order:', error);
      setExistingOrder(null);
      setOrderItems([]);
    }
  };

  useEffect(() => {
    filterItems();
  }, [searchQuery, items]);

  const filterItems = () => {
    let filtered: Item[] = Array.isArray(items) ? items : [];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.code.toLowerCase().includes(query) ||
          (item.barcode && item.barcode.toLowerCase().includes(query))
      );
    }

    filtered.sort((a, b) => a.name.localeCompare(b.name));
    setDisplayItems(filtered);
  };

  const handleItemPress = (item: Item) => {
    const existingItem = orderItems.find(oi => oi.item.id === item.id);
    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;
      const price = existingItem.customPrice || parseFloat(item.price.toString());
      setOrderItems(orderItems.map(oi =>
        oi.item.id === item.id
          ? { ...oi, quantity: newQuantity, subtotal: price * newQuantity }
          : { ...oi, subtotal: (oi.customPrice || parseFloat(oi.item.price.toString())) * oi.quantity }
      ));
    } else {
      const price = parseFloat(item.price.toString());
      setOrderItems([...orderItems, {
        item,
        quantity: 1,
        originalPrice: price,
        subtotal: price,
      }]);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(orderItems.filter(oi => oi.item.id !== itemId));
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setOrderItems(orderItems.map(oi => {
      if (oi.item.id === itemId) {
        const price = oi.customPrice || parseFloat(oi.item.price.toString());
        return { ...oi, quantity, subtotal: price * quantity };
      }
      return oi;
    }));
  };

  const getSubtotal = () => {
    return orderItems.reduce((sum, item) => {
      const price = item.customPrice || parseFloat(item.item.price.toString());
      return sum + (price * item.quantity);
    }, 0);
  };

  const getTax = () => {
    return (getSubtotal() * taxRate) / 100;
  };

  const getDiscountAmount = () => {
    return discount;
  };

  const getTotal = () => {
    return getSubtotal() + getTax() - getDiscountAmount();
  };

  const handleSaveOrder = async () => {
    if (!table || orderItems.length === 0) {
      alert('Please add items to the order');
      return;
    }

    setLoading(true);
    try {
      const itemsJson = JSON.stringify(orderItems.map(item => ({
        item: item.item,
        quantity: item.quantity,
        subtotal: item.quantity * (item.customPrice || parseFloat(item.item.price.toString())),
      })));

      if (existingOrder) {
        // Update existing order
        await updateTableOrder(existingOrder.id, {
          items_json: itemsJson,
          tax_rate: taxRate,
          discount: discount,
          total_amount: getTotal(),
        });
      } else {
        // Create new order
        await createTableOrder({
          table_id: table.id,
          items_json: itemsJson,
          tax_rate: taxRate,
          discount: discount,
          total_amount: getTotal(),
        });
      }

      alert('Order saved successfully!');
      onOrderCreated();
      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to save order');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!table || orderItems.length === 0) {
      alert('Please add items to the order');
      return;
    }

    const paymentMethod = prompt('Payment method (cash/card/upi):', 'cash');
    if (!paymentMethod || !['cash', 'card', 'upi'].includes(paymentMethod)) {
      alert('Invalid payment method');
      return;
    }

    setLoading(true);
    try {
      let orderId = existingOrder?.id;

      if (!orderId) {
        // Create order first
        const itemsJson = JSON.stringify(orderItems.map(item => ({
          item: item.item,
          quantity: item.quantity,
          subtotal: item.quantity * (item.customPrice || parseFloat(item.item.price.toString())),
        })));

        const newOrder = await createTableOrder({
          table_id: table.id,
          items_json: itemsJson,
          tax_rate: taxRate,
          discount: discount,
          total_amount: getTotal(),
        });
        orderId = newOrder.id;
      }

      // Complete the order
      const result = await completeTableOrder(orderId, {
        payment_method: paymentMethod as 'cash' | 'card' | 'upi',
      });

      // Print receipt (use setting for auto-print)
      try {
        const { printReceipt } = await import('../utils/printer');
        const { receiptSettings } = await import('../utils/receiptSettings');
        const autoPrint = await receiptSettings.getAutoPrint();
        await printReceipt({
          items: orderItems,
          transaction: result.transaction,
          autoPrint,
        });
      } catch (printError) {
        console.error('Print error:', printError);
      }

      alert('Order completed successfully!');
      setOrderItems([]);
      onOrderCreated();
      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to complete order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !table) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="table-order-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Table {table.table_number} - {existingOrder ? 'Edit Order' : 'New Order'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="table-order-content">
          <div className="table-order-left">
            <div className="card">
              <div className="search-container">
                <div className="search-inputs-row">
                  {useQuickSearch ? (
                    <QuickItemSearch
                      onItemAdded={() => {
                        // Item is already added to orderItems via customAddItem
                        // Refresh if needed
                      }}
                      customAddItem={(item, quantity) => {
                        handleItemPress(item);
                      }}
                      autoFocus={true}
                      placeholder="Enter mapping code (e.g., 1, 2)..."
                    />
                  ) : (
                    <SearchBarcodeInput
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      placeholder="🔍 Search items..."
                    />
                  )}
                  <button
                    type="button"
                    className="search-mode-toggle"
                    onClick={() => setUseQuickSearch(!useQuickSearch)}
                    title={useQuickSearch ? "Switch to regular search" : "Switch to quick item search (mapping code)"}
                  >
                    {useQuickSearch ? '🔍' : '🔢'}
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <h3>Items ({displayItems.length})</h3>
              <div className="items-grid">
                {displayItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onPress={handleItemPress}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="table-order-right">
            <div className="card">
              <h3>Order Items ({orderItems.length})</h3>
              <div className="order-items-list">
                {orderItems.length === 0 ? (
                  <p className="empty-text">No items in order</p>
                ) : (
                  orderItems.map((orderItem) => {
                    const price = orderItem.customPrice || parseFloat(orderItem.item.price.toString());
                    return (
                      <div key={orderItem.item.id} className="order-item">
                        <div className="order-item-info">
                          <strong>{orderItem.item.name}</strong>
                          <span>{formatCurrency(price)} × {orderItem.quantity}</span>
                        </div>
                        <div className="order-item-controls">
                          <button
                            className="btn btn-sm"
                            onClick={() => handleUpdateQuantity(orderItem.item.id, orderItem.quantity - 1)}
                          >
                            −
                          </button>
                          <span>{orderItem.quantity}</span>
                          <button
                            className="btn btn-sm"
                            onClick={() => handleUpdateQuantity(orderItem.item.id, orderItem.quantity + 1)}
                          >
                            +
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemoveItem(orderItem.item.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="card">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>{formatCurrency(getSubtotal())}</span>
              </div>
              <div className="summary-row">
                <label>Tax (%):</label>
                <input
                  type="number"
                  className="input input-sm"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  min="0"
                  max="100"
                />
                <span>{formatCurrency(getTax())}</span>
              </div>
              <div className="summary-row">
                <label>Discount (₹):</label>
                <input
                  type="number"
                  className="input input-sm"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  min="0"
                />
                <span>-{formatCurrency(getDiscountAmount())}</span>
              </div>
              <div className="summary-total">
                <span>Total:</span>
                <span className="total-amount">{formatCurrency(getTotal())}</span>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={handleSaveOrder}
                disabled={loading || orderItems.length === 0}
              >
                {existingOrder ? 'Update Order' : 'Save Order'}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCompleteOrder}
                disabled={loading || orderItems.length === 0}
              >
                Complete Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
