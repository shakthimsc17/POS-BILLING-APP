import { useState, useEffect } from 'react';
import { useCartStore } from '../store/cartStore';
import { useInventoryStore } from '../store/inventoryStore';
import { storageService } from '../services/storage';
import { formatCurrency } from '../utils/formatters';
import { printReceipt } from '../utils/printer';
import { Customer } from '../types';
import './Payment.css';

interface PaymentProps {
  onNavigate: (page: 'dashboard') => void;
}

export default function Payment({ onNavigate }: PaymentProps) {
  const {
    items,
    paymentMethod,
    setPaymentMethod,
    getTotal,
    clearCart,
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
        printReceipt({
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
          printReceipt({
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
  const discount = change < 0 ? Math.abs(change) : 0;
  const actualChange = change > 0 ? change : 0;

  return (
    <div className="payment">
      <div className="payment-header">
        <h1>💳 Payment</h1>
        <button className="btn btn-secondary" onClick={() => onNavigate('dashboard')}>
          ← Back
        </button>
      </div>

      <div className="payment-content">
        <div className="card payment-summary">
          <h2>Order Summary</h2>
          <div className="summary-item">
            <span>Total Amount:</span>
            <span className="total-amount">{formatCurrency(total)}</span>
          </div>
          {paymentMethod === 'cash' && receivedAmount && discount > 0 && (
            <div className="summary-item discount-item">
              <span>Discount:</span>
              <span className="discount-value">-{formatCurrency(discount)}</span>
            </div>
          )}
          {paymentMethod === 'cash' && receivedAmount && actualChange > 0 && (
            <div className="summary-item change-item">
              <span>Change:</span>
              <span className="change-value">{formatCurrency(actualChange)}</span>
            </div>
          )}
          <div className="summary-item final-amount">
            <span>Amount to Pay:</span>
            <span className="final-amount-value">{formatCurrency(total)}</span>
          </div>
          {paymentMethod === 'cash' && !receivedAmount && (
            <div className="summary-item info-item">
              <span className="info-text">💡 No amount entered - will process as exact payment</span>
            </div>
          )}
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
          <h2>Select Payment Method</h2>
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
              Received Amount (₹) <span style={{fontSize: '0.85rem', color: '#666', fontWeight: 'normal'}}>(Optional - leave empty for exact payment)</span>:
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
                {discount > 0 ? (
                  <div className="discount-amount">
                    <span>Discount Applied:</span>
                    <span className="discount-value">-{formatCurrency(discount)}</span>
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

        <div className="payment-actions">
          <button
            className="btn btn-primary btn-large"
            onClick={handlePayment}
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Complete Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}

