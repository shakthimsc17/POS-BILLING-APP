import { useState, useEffect, useRef } from 'react';
import { useCartStore } from '../store/cartStore';
import { useInventoryStore } from '../store/inventoryStore';
import { storageService } from '../services/storage';
import { formatCurrency } from '../utils/formatters';
import { printReceipt } from '../utils/printer';
import { SalesCustomer } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import QuickAddItemModal from '../components/QuickAddItemModal';
import CustomerSelectModal from '../components/CustomerSelectModal';

import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import './Cart.css';

interface CartProps {
  onNavigate: (page: string) => void;
}

export default function Cart({ onNavigate }: CartProps) {
  const { language } = useLanguage();
  const cartStore = useCartStore();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getTax,
    getGST,
    getDiscount,
    getItemDiscounts,
    getActualSubtotal,
    getTotal,
    setTaxRate,
    setDiscount,
    taxRate,
    discount,
    paymentMethod,
    setPaymentMethod,
    saveCart,
    loadCart,
    isLoading
  } = cartStore;

  const [receivedAmount, setReceivedAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedSalesCustomer, setSelectedSalesCustomer] = useState<SalesCustomer | null>(null);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState<Record<string, string>>({});
  const [cartSavedNotification, setCartSavedNotification] = useState(false);


  // Refs for input fields that need to be focused
  const discountInputRef = useRef<HTMLInputElement>(null);
  const taxInputRef = useRef<HTMLInputElement>(null);
  const receivedAmountInputRef = useRef<HTMLInputElement>(null);

  const {
    setCustomPrice,
    getItemPrice,
    hasCustomPrice,
  } = useCartStore();

  const { loadItems } = useInventoryStore();

  // Load items and cart on mount
  useEffect(() => {
    // Ensure items are loaded for quick add functionality
    loadItems();

    // Load saved cart
    loadCart().then((result) => {
      if (result?.salesCustomerId) {
        // Load the sales customer if it was saved
        storageService.getSalesCustomers().then((customers) => {
          const customer = customers.find(c => c.id === result.salesCustomerId);
          if (customer) {
            setSelectedSalesCustomer(customer);
          }
        }).catch(console.error);
      }
    }).catch(console.error);
  }, [loadCart, loadItems]);

  // Auto-save cart when items, tax, discount, or payment method changes (debounced)
  useEffect(() => {
    if (isLoading) return; // Don't save while loading

    const timeoutId = setTimeout(async () => {
      if (items.length > 0 || taxRate > 0 || discount > 0 || paymentMethod) {
        try {
          await saveCart(selectedSalesCustomer?.id);
          setCartSavedNotification(true);
          setTimeout(() => setCartSavedNotification(false), 2000);
        } catch (error) {
          console.error('Error auto-saving cart:', error);
        }
      }
    }, 2000); // Debounce: save 2 seconds after last change

    return () => clearTimeout(timeoutId);
  }, [items, taxRate, discount, paymentMethod, selectedSalesCustomer, isLoading, saveCart]);

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

  // Keyboard shortcuts
  useKeyboardShortcuts({
    handlers: {
      onF2: () => {
        // F2 - Discount: Focus discount input
        discountInputRef.current?.focus();
        discountInputRef.current?.select();
      },
      onF3: () => {
        // F3 - Quick Add Item: Open Quick Add modal
        if (!processing && !showQuickAddModal && !showCustomerModal) {
          setShowQuickAddModal(true);
        }
      },
      onF4: () => {
        // F4 - Customer: Open customer selection modal
        if (!processing && !showQuickAddModal && !showCustomerModal) {
          setShowCustomerModal(true);
        }
      },
      onF6: () => {
        // F6 - Tax: Focus tax rate input
        taxInputRef.current?.focus();
        taxInputRef.current?.select();
      },
      onF8: () => {
        // F8 - New Sale/Clear Cart: Clear cart
        if (!processing && !showQuickAddModal && !showCustomerModal) {
          handleClearCart();
        }
      },
      onF9: () => {
        // F9 - Save Cart: Manually save cart
        if (!processing && !showQuickAddModal && !showCustomerModal) {
          saveCart(selectedSalesCustomer?.id).then(() => {
            setCartSavedNotification(true);
            setTimeout(() => setCartSavedNotification(false), 3000);
          }).catch((error) => {
            console.error('Error saving cart:', error);
            alert('Failed to save cart');
          });
        }
      },
      onF10: () => {
        // F10 - Complete Payment: Process payment
        if (!processing && paymentMethod && !showQuickAddModal && !showCustomerModal) {
          handlePayment();
        }
      },
      onF12: () => {
        // F12 - Cash Payment: Set payment method to Cash only
        if (!processing && !showQuickAddModal && !showCustomerModal) {
          setPaymentMethod('cash');
        }
      },
      onKeyTab: () => {
        // Tab - Cash Payment: Same as F12
        if (!processing && !showQuickAddModal && !showCustomerModal) {
          setPaymentMethod('cash');
        }
      },
      onEnter: () => {
        // Enter - Complete Payment: Same as F10
        if (!processing && paymentMethod && !showQuickAddModal && !showCustomerModal) {
          handlePayment();
        }
      },
      onEscape: () => {
        // Escape - Close modals
        if (showQuickAddModal) {
          setShowQuickAddModal(false);
        }
        if (showCustomerModal) {
          setShowCustomerModal(false);
        }
      },
    },
    enabled: true,
    disabledWhen: {
      modalsOpen: showQuickAddModal || showCustomerModal,
      processing: processing,
      inputFocused: false, // We handle input focus check in the hook itself
    },
  });

  const handleClearCart = async () => {
    if (confirm('Clear cart and start a new sale?')) {
      clearCart();
      setSelectedSalesCustomer(null);
      // Delete saved cart from database
      await storageService.deleteCart().catch(console.error);
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

      // Print receipt (use setting for auto-print)
      try {
        const { receiptSettings } = await import('../utils/receiptSettings');
        const autoPrint = await receiptSettings.getAutoPrint();
        console.log('Auto-print setting:', autoPrint);
        await printReceipt({
          items,
          transaction: savedTransaction,
          customer: selectedSalesCustomer,
          taxAmount: getTax(),
          discountAmount: getDiscount(),
          autoPrint,
          language // Add language parameter
        });
      } catch (printError) {
        console.error('Print error:', printError);
        // Don't block payment if print fails
      }

      // Clear cart and delete saved cart
      clearCart();
      await storageService.deleteCart().catch(console.error);

      // Show success message and navigate
      const discountAmount = changeAmount < 0 ? Math.abs(changeAmount) : 0;
      const changeMessage = discountAmount > 0
        ? `Discount: ${formatCurrency(discountAmount)}`
        : actualChange > 0
          ? `Change: ${formatCurrency(actualChange)}`
          : 'Exact amount';

      // Show brief success notification
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.style.background = '#27ae60';
      notification.textContent = `Payment successful! ${changeMessage}`;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);

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
      {cartSavedNotification && (
        <div className="cart-toast cart-toast-visible">
          <span className="cart-toast-icon">💾</span>
          <span>Cart saved</span>
        </div>
      )}
      <div className="cart-header">
        <h1>Sales Invoice</h1>

        <button className="btn btn-secondary" onClick={() => onNavigate('dashboard')}>
          ← Back to Dashboard
        </button>
      </div>

      <div className="cart-content">

        <div className="cart-items">
          <div className="card">
            <div className="cart-items-header">
              <h2>Items ({items.length})</h2>
              <div className="cart-items-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowQuickAddModal(true)}
                >
                  + Quick Add <span className="function-key-hint">F3</span>
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={async () => {
                    await saveCart(selectedSalesCustomer?.id);
                    setCartSavedNotification(true);
                    setTimeout(() => setCartSavedNotification(false), 3000);
                  }}
                >
                  💾 Save <span className="function-key-hint">F9</span>
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleClearCart}>
                  Clear <span className="function-key-hint">F8</span>
                </button>
              </div>
            </div>

            <div className="cart-list-header">
              <div className="header-item">Product</div>
              <div className="header-price">Price</div>
              <div className="header-qty">Quantity</div>
              <div className="header-total">Total</div>
              <div className="header-action"></div>
            </div>

            <div className="cart-items-list">
              {items.map((cartItem) => {
                const itemPrice = getItemPrice(cartItem.item.id);
                const isCustomPrice = hasCustomPrice(cartItem.item.id);
                const originalPrice = cartItem.originalPrice ?? (typeof cartItem.item.price === 'string' ? parseFloat(cartItem.item.price) : cartItem.item.price);
                const editingPriceValue = editingPrice[cartItem.item.id];

                const isQuickSaleItem = cartItem.item.code?.startsWith('QS-');

                return (
                  <div key={cartItem.item.id} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-icon">
                        {isQuickSaleItem ? '⚡' : '📦'}
                      </div>
                      <div className="cart-item-name-section">
                        <div className="item-name-row">
                          <h3>{cartItem.item.name}</h3>
                          {isQuickSaleItem && (
                            <span className="quick-sale-badge" title="Quick Sale Item">Quick Sale</span>
                          )}
                        </div>
                        <p className="item-code">{cartItem.item.code}</p>
                      </div>
                    </div>

                    <div className="cart-item-price-section">
                      <div className="price-input-wrapper-inline">
                        <span className="currency-symbol">₹</span>
                        <input
                          type="number"
                          className={`price-input-inline ${isCustomPrice ? 'custom-price' : ''}`}
                          value={editingPriceValue !== undefined ? editingPriceValue : itemPrice.toFixed(2)}
                          onChange={(e) => handlePriceChange(cartItem.item.id, e.target.value)}
                          onBlur={() => handlePriceBlur(cartItem.item.id)}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                        {isCustomPrice && (
                          <span className="custom-price-badge" title="Custom price">*</span>
                        )}
                      </div>
                      {isCustomPrice && (
                        <p className="original-price-hint-inline">Orig: {formatCurrency(originalPrice)}</p>
                      )}
                    </div>

                    <div className="cart-item-controls-wrapper">
                      <div className="cart-item-controls">
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="qty-value">
                          {cartItem.quantity}
                        </span>
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <span className="uom-label">{cartItem.item.uom_name || ''}</span>
                    </div>

                    <div className="cart-item-total">
                      {formatCurrency(cartItem.quantity * itemPrice)}
                    </div>

                    <div className="cart-item-action">
                      <button
                        className="btn-remove"
                        onClick={() => removeItem(cartItem.item.id)}
                        title="Remove Item"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="cart-checkout-summary">
          <div className="cart-summary-content">
            <div className="summary-card">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Customer <span className="function-key-hint">F4</span></span>
                <div className="summary-value summary-value-customer">
                  {selectedSalesCustomer ? (
                    <div className="selected-customer-inline" onClick={() => setShowCustomerModal(true)}>
                      <div className="customer-info-mini">
                        <span className="customer-name">{selectedSalesCustomer.name}</span>
                        {selectedSalesCustomer.mobile && (
                          <span className="customer-mobile">{selectedSalesCustomer.mobile}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-clear-customer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSalesCustomer(null);
                        }}
                        title="Remove customer"
                        aria-label="Remove customer"
                      >
                        <span aria-hidden>×</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowCustomerModal(true)}
                    >
                      Select Customer
                    </button>
                  )}
                </div>
              </div>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatCurrency(getActualSubtotal())}</span>
              </div>
              <div className="summary-row">
                <div className="summary-label-with-input">
                  <label>Tax Rate (%) <span className="function-key-hint">F6</span></label>
                  <input
                    ref={taxInputRef}
                    type="text"
                    className="input-sm"
                    value={taxRate}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setTaxRate(val === '' ? 0 : Number(val));
                      }
                    }}
                  />
                </div>
                <span className="summary-value-text">{formatCurrency(getTax())}</span>
              </div>
              {(() => {
                const gstInfo = getGST();
                if (gstInfo.gstBreakdown.length > 0) {
                  return gstInfo.gstBreakdown.map(gst => (
                    <div key={gst.rate} className="summary-row secondary">
                      <span style={{ fontSize: '0.8rem' }}>GST @ {gst.rate}%</span>
                      <span className="summary-value-text" style={{ fontSize: '0.8rem' }}>{formatCurrency(gst.amount)}</span>
                    </div>
                  ));
                }
                return null;
              })()}
              <div className="summary-row">
                <div className="summary-label-with-input">
                  <label>Extra Discount (₹) <span className="function-key-hint">F2</span></label>
                  <input
                    ref={discountInputRef}
                    type="text"
                    className="input-sm"
                    value={discount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setDiscount(val === '' ? 0 : Number(val));
                      }
                    }}
                  />
                </div>
                <span className="summary-value-text">{formatCurrency(getDiscount())}</span>
              </div>
              {getItemDiscounts() > 0 && (
                <div className="summary-row-hint">
                  <span>(Includes {formatCurrency(getItemDiscounts())} item discounts)</span>
                </div>
              )}
              <div className="summary-total">
                <span>Total Amount</span>
                <span className="total-amount">{formatCurrency(getTotal())}</span>
              </div>
            </div>

            <div className="card payment-section-compact">
              <h3>Payment Method</h3>
              <div className="payment-options">
                <button
                  className={`payment-option ${paymentMethod === 'cash' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  💵 Cash <span className="function-key-hint">F12</span>
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

              <div className={`payment-footer-grid ${paymentMethod === 'cash' ? 'cash-active' : ''}`}>
                {paymentMethod === 'cash' ? (
                  <>
                    <div className="payment-box cash-input-box">
                      <label>Cash Received</label>
                      <input
                        ref={receivedAmountInputRef}
                        type="text"
                        className="payment-input"
                        value={receivedAmount}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setReceivedAmount(val);
                          }
                        }}
                        onFocus={() => {
                          setReceivedAmount('');
                        }}
                        placeholder="0.00"
                      />
                      <div className="quick-amounts">
                        {[10, 20, 50, 100, 500].map(amt => (
                          <button
                            key={amt}
                            className="btn-quick-amt"
                            onClick={() => {
                              const current = Number(receivedAmount) || 0;
                              setReceivedAmount((current + amt).toString());
                            }}
                          >
                            +{amt}
                          </button>
                        ))}
                        <button
                          className="btn-quick-amt exact"
                          onClick={() => setReceivedAmount(getTotal().toString())}
                        >
                          Exact
                        </button>
                      </div>
                    </div>

                    <div className={`payment-box change-box ${discountAmount > 0 ? 'discount' : ''}`}>
                      <label>{discountAmount > 0 ? 'Extra Discount' : 'Change Due'}</label>
                      <div className="change-value">
                        {discountAmount > 0
                          ? `-${formatCurrency(discountAmount)}`
                          : formatCurrency(actualChange)}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="payment-box placeholder-box">
                    <label>Selected Method</label>
                    <div className="method-display">
                      {paymentMethod === 'card' ? '💳 Card' : paymentMethod === 'upi' ? '📱 UPI' : 'Select Method'}
                    </div>
                  </div>
                )}

                <div className="payment-box action-box">
                  <button
                    className="btn-complete-order"
                    onClick={handlePayment}
                    disabled={processing || !paymentMethod}
                  >
                    {processing ? '...' : (
                      <>
                        <span>Complete Order</span>
                        <span className="kb-hint">F10</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
