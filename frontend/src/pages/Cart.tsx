import { useState, useEffect } from 'react';
import { useCartStore } from '../store/cartStore';
import { useInventoryStore } from '../store/inventoryStore';
import { storageService } from '../services/storage';
import { formatCurrency } from '../utils/formatters';
import { printReceipt } from '../utils/printer';
import { SalesCustomer } from '../types';
import QuickAddItemModal from '../components/QuickAddItemModal';
import CustomerSelectModal from '../components/CustomerSelectModal';
import './Cart.css';

interface CartProps {
  onNavigate: (page: 'dashboard') => void;
}

export default function Cart({ onNavigate }: CartProps) {
  const {
    items,
    removeItem,
    updateQuantity,
    getSubtotal,
    getTax,
    getDiscount,
    getTotal,
    setTaxRate,
    setDiscount,
    taxRate,
    discount,
    clearCart,
    paymentMethod,
    setPaymentMethod,
  } = useCartStore();

  const [receivedAmount, setReceivedAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedSalesCustomer, setSelectedSalesCustomer] = useState<SalesCustomer | null>(null);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState<Record<string, string>>({});

  const {
    setCustomPrice,
    getItemPrice,
    hasCustomPrice,
  } = useCartStore();

  const handlePriceChange = (itemId: string, newPrice: string) => {
    setEditingPrice(prev => ({ ...prev, [itemId]: newPrice }));
  };

  const handlePriceBlur = (itemId: string) => {
    const priceStr = editingPrice[itemId];
    if (priceStr) {
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price > 0) {
        setCustomPrice(itemId, price);
      }
    }
    setEditingPrice(prev => {
      const newState = { ...prev };
      delete newState[itemId];
      return newState;
    });
  };

  const handleQuickSale = async () => {
    if (items.length === 0) {
      alert('Cart is empty');
      return;
    }

    const confirmed = confirm('Process quick sale with default settings?');
    if (!confirmed) return;

    // Set default payment method if not set
    if (!paymentMethod) {
      setPaymentMethod('cash');
    }

    // Process payment with defaults
    await handlePayment();
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    setProcessing(true);

    try {
      const total = getTotal();
      // If cash payment and no amount entered, treat as exact payment (received = total)
      const received = paymentMethod === 'cash' 
        ? (receivedAmount ? Number(receivedAmount) : total)
        : total;
      // Calculate change (positive) or discount (negative)
      const changeAmount = paymentMethod === 'cash' ? received - total : 0;
      const actualChange = changeAmount > 0 ? changeAmount : 0;

      // Prepare items with custom prices for transaction
      const itemsWithPrices = items.map(cartItem => ({
        ...cartItem,
        originalPrice: cartItem.originalPrice ?? (typeof cartItem.item.price === 'string' ? parseFloat(cartItem.item.price) : cartItem.item.price),
        customPrice: cartItem.customPrice,
      }));

      // Save transaction
      // If change is negative, it means discount was applied
      const savedTransaction = await storageService.addTransaction({
        sales_customer_id: selectedSalesCustomer?.id || undefined,
        total_amount: total,
        payment_method: paymentMethod,
        received_amount: received,
        change_amount: actualChange, // Only positive change, discount is handled separately
        items_json: JSON.stringify(itemsWithPrices),
      });

      // Update item stock
      const { updateItem } = useInventoryStore.getState();
      for (const cartItem of items) {
        const item = cartItem.item;
        if (item.stock >= cartItem.quantity) {
          await updateItem(item.id, {
            stock: item.stock - cartItem.quantity,
          });
        }
      }

      // Print receipt
      try {
        await printReceipt({
          items,
          transaction: savedTransaction,
        });
      } catch (printError) {
        console.error('Print error:', printError);
        // Don't block payment if print fails
      }

      // Clear cart
      clearCart();

      // Show success with print option
      const discountAmount = changeAmount < 0 ? Math.abs(changeAmount) : 0;
      const changeMessage = discountAmount > 0 
        ? `Discount: ${formatCurrency(discountAmount)}` 
        : actualChange > 0 
        ? `Change: ${formatCurrency(actualChange)}` 
        : 'Exact amount';
      const printAgain = confirm(`Payment successful! ${changeMessage}\n\nWould you like to print the receipt again?`);
      if (printAgain) {
        try {
          const receiptItems = typeof savedTransaction.items_json === 'string' 
            ? JSON.parse(savedTransaction.items_json) 
            : savedTransaction.items_json;
          await printReceipt({
            items: receiptItems,
            transaction: savedTransaction,
          });
        } catch (printError) {
          console.error('Print error:', printError);
        }
      }
      
      onNavigate('dashboard');
    } catch (error) {
      alert('Payment failed. Please try again.');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const total = getTotal();
  // If cash payment and no amount entered, treat as exact payment (received = total)
  const received = paymentMethod === 'cash' 
    ? (receivedAmount ? Number(receivedAmount) : total)
    : total;
  const change = paymentMethod === 'cash' ? received - total : 0;
  const discountAmount = change < 0 ? Math.abs(change) : 0;
  const actualChange = change > 0 ? change : 0;

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <div className="card">
          <h2>🛒 Your Cart is Empty</h2>
          <p>Add items from the dashboard to get started</p>
          <button className="btn btn-primary" onClick={() => onNavigate('dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart">
      <div className="cart-header">
        <h1>Sales Invoice</h1>
        <button className="btn btn-secondary" onClick={() => onNavigate('dashboard')}>
          ← Back to Dashboard
        </button>
      </div>

      <div className="cart-content">
        <div className="cart-items">
          <div className="card">
            <h2>Items ({items.length})</h2>
            {items.map((cartItem) => {
              const itemPrice = getItemPrice(cartItem.item.id);
              const isCustomPrice = hasCustomPrice(cartItem.item.id);
              const originalPrice = cartItem.originalPrice ?? (typeof cartItem.item.price === 'string' ? parseFloat(cartItem.item.price) : cartItem.item.price);
              const editingPriceValue = editingPrice[cartItem.item.id];
              
              return (
                <div key={cartItem.item.id} className="cart-item">
                  <div className="cart-item-info">
                    <h3>{cartItem.item.name}</h3>
                    <p className="item-code">Code: {cartItem.item.code}</p>
                    <div className="price-editor">
                      <label>Price:</label>
                      <div className="price-input-wrapper">
                        <input
                          type="number"
                          className={`price-input ${isCustomPrice ? 'custom-price' : ''}`}
                          value={editingPriceValue !== undefined ? editingPriceValue : itemPrice.toFixed(2)}
                          onChange={(e) => handlePriceChange(cartItem.item.id, e.target.value)}
                          onBlur={() => handlePriceBlur(cartItem.item.id)}
                          min="0"
                          step="0.01"
                        />
                        {isCustomPrice && (
                          <span className="custom-price-badge" title="Custom price">*</span>
                        )}
                      </div>
                      {isCustomPrice && (
                        <p className="original-price-hint">Original: {formatCurrency(originalPrice)}</p>
                      )}
                    </div>
                  </div>
                  <div className="cart-item-controls">
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="qty-value">{cartItem.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity + 1)}
                    >
                      +
                    </button>
                    <div className="cart-item-total">
                      {formatCurrency(cartItem.quantity * itemPrice)}
                    </div>
                    <button
                      className="btn btn-danger"
                      onClick={() => removeItem(cartItem.item.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="cart-summary">
          <div className="card">
            <h2>Sales Summary</h2>
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>{formatCurrency(getSubtotal())}</span>
            </div>
            <div className="summary-row">
              <div>
                <label>Tax Rate (%):</label>
                <input
                  type="number"
                  className="input"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  min="0"
                  max="100"
                />
              </div>
              <span>{formatCurrency(getTax())}</span>
            </div>
            <div className="summary-row">
              <div>
                <label>Discount (₹):</label>
                <input
                  type="number"
                  className="input"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  min="0"
                />
              </div>
              <span>-{formatCurrency(getDiscount())}</span>
            </div>
            <div className="summary-total">
              <span>Total:</span>
              <span className="total-amount">{formatCurrency(getTotal())}</span>
            </div>
          </div>

          <div className="card customer-selection">
            <h2>Customer (Optional)</h2>
            <div className="customer-display">
              {selectedSalesCustomer ? (
                <div className="selected-customer">
                  <div className="customer-details">
                    <strong>{selectedSalesCustomer.name}</strong>
                    <span>{selectedSalesCustomer.mobile}</span>
                    {selectedSalesCustomer.place && <span>{selectedSalesCustomer.place}</span>}
                  </div>
                  <button
                    className="btn btn-small btn-secondary"
                    onClick={() => setSelectedSalesCustomer(null)}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowCustomerModal(true)}
                >
                  Select or Add Customer
                </button>
              )}
            </div>
          </div>

          <div className="card payment-methods">
            <h2>Payment Method</h2>
            <div className="payment-options">
              <button
                className={`payment-option ${paymentMethod === 'cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cash')}
              >
                💵 Cash
              </button>
              <button
                className={`payment-option ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                💳 Card
              </button>
              <button
                className={`payment-option ${paymentMethod === 'upi' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('upi')}
              >
                📱 UPI
              </button>
            </div>
          </div>

          {paymentMethod === 'cash' && (
            <div className="card cash-payment">
              <h2>Cash Payment</h2>
              <label>
                Received Amount (₹) <span style={{fontSize: '0.85rem', color: '#6c757d', fontWeight: 'normal'}}>(Optional - leave empty for exact payment)</span>:
                <input
                  type="number"
                  className="input"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="Enter received amount (or leave empty for exact payment)"
                />
              </label>
              {receivedAmount && Number(receivedAmount) > 0 && (
                <div className="amount-info">
                  {discountAmount > 0 ? (
                    <div className="discount-amount">
                      <span>Discount Applied:</span>
                      <span className="discount-value">-{formatCurrency(discountAmount)}</span>
                    </div>
                  ) : actualChange > 0 ? (
                    <div className="change-amount">
                      <span>Change:</span>
                      <span className="change-value">{formatCurrency(actualChange)}</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          <div className="cart-actions">
            <button
              className="btn btn-primary btn-large"
              onClick={handlePayment}
              disabled={processing || !paymentMethod}
            >
              {processing ? 'Processing...' : 'Complete Payment'}
            </button>
            <button
              className="btn btn-success btn-large"
              onClick={handleQuickSale}
              disabled={processing || items.length === 0}
            >
              ⚡ Quick Sale
            </button>
            <div className="cart-actions-row">
              <button
                className="btn btn-secondary"
                onClick={() => setShowQuickAddModal(true)}
              >
                + Quick Add Item
              </button>
              <button className="btn btn-secondary" onClick={clearCart}>
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <QuickAddItemModal
        isOpen={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
      />

      <CustomerSelectModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSelect={(customer) => setSelectedSalesCustomer(customer)}
        selectedCustomerId={selectedSalesCustomer?.id}
      />
    </div>
  );
}

