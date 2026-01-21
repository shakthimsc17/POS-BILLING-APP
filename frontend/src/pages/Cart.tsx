import { useState, useEffect } from 'react';
import { useCartStore } from '../store/cartStore';
import { useInventoryStore } from '../store/inventoryStore';
import { storageService } from '../services/storage';
import { formatCurrency } from '../utils/formatters';
import { printReceipt } from '../utils/printer';
import { Customer } from '../types';
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await storageService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
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

      // Save transaction
      // If change is negative, it means discount was applied
      const savedTransaction = await storageService.addTransaction({
        customer_id: selectedCustomerId || undefined,
        total_amount: total,
        payment_method: paymentMethod,
        received_amount: received,
        change_amount: actualChange, // Only positive change, discount is handled separately
        items_json: JSON.stringify(items),
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
            {items.map((cartItem) => (
              <div key={cartItem.item.id} className="cart-item">
                <div className="cart-item-info">
                  <h3>{cartItem.item.name}</h3>
                  <p className="item-code">Code: {cartItem.item.code}</p>
                  <p className="item-price">{formatCurrency(cartItem.item.price)} each</p>
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
                    {formatCurrency(cartItem.subtotal)}
                  </div>
                  <button
                    className="btn btn-danger"
                    onClick={() => removeItem(cartItem.item.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
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
            <label>
              Select Customer:
              <select
                className="input"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">Walk-in Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.phone && `(${customer.phone})`}
                  </option>
                ))}
              </select>
            </label>
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
            <button className="btn btn-secondary" onClick={clearCart}>
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

