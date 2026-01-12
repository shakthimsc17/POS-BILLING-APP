import { useCartStore } from '../store/cartStore';
import { formatCurrency } from '../utils/formatters';
import './Cart.css';

interface CartProps {
  onNavigate: (page: 'payment' | 'dashboard') => void;
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
  } = useCartStore();

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
        <h1>🛒 Shopping Cart</h1>
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
            <h2>Order Summary</h2>
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
            <div className="cart-actions">
              <button className="btn btn-secondary" onClick={clearCart}>
                Clear Cart
              </button>
              <button
                className="btn btn-primary"
                onClick={() => onNavigate('payment')}
              >
                Proceed to Payment →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

