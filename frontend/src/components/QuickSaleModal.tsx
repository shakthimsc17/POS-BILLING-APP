import { useState } from 'react';
import { storageService } from '../services/storage';
import { useCartStore } from '../store/cartStore';
import { formatCurrency } from '../utils/formatters';
import './QuickSaleModal.css';

interface QuickSaleItem {
  id: string;
  name: string;
  quantity: number;
  price: string;
  cost: string;
  errors: Record<string, string>;
}

interface QuickSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToQuickSale?: () => void;
}

export default function QuickSaleModal({ isOpen, onClose, onAddToQuickSale }: QuickSaleModalProps) {
  const [items, setItems] = useState<QuickSaleItem[]>([
    { id: '1', name: '', quantity: 1, price: '', cost: '', errors: {} }
  ]);
  const [saving, setSaving] = useState(false);

  const { addItem } = useCartStore();

  const getTotalAmount = () => {
    return items.reduce((sum, item) => {
      const price = item.price ? parseFloat(item.price) : 0;
      return sum + (item.quantity * price);
    }, 0);
  };

  const validateItem = (item: QuickSaleItem): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (!item.name.trim()) {
      errors.name = 'Item name is required';
    }
    
    if (item.quantity < 1) {
      errors.quantity = 'Quantity must be at least 1';
    }
    
    if (!item.price || parseFloat(item.price) < 0) {
      errors.price = 'Price must be greater than or equal to 0';
    }

    if (item.cost !== undefined && item.cost !== '' && (parseFloat(item.cost) < 0 || isNaN(parseFloat(item.cost)))) {
      errors.cost = 'Cost must be 0 or greater';
    }

    return errors;
  };

  const validateAll = (): boolean => {
    let isValid = true;
    const updatedItems = items.map(item => {
      const errors = validateItem(item);
      if (Object.keys(errors).length > 0) {
        isValid = false;
      }
      return { ...item, errors };
    });
    setItems(updatedItems);
    return isValid;
  };

  const handleAddItem = () => {
    const newId = Date.now().toString();
    setItems([...items, { id: newId, name: '', quantity: 1, price: '', cost: '', errors: {} }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: 'name' | 'quantity' | 'price' | 'cost', value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Clear errors for this field
        const { [field]: _, ...restErrors } = updated.errors;
        return { ...updated, errors: restErrors };
      }
      return item;
    }));
  };

  const handleAddToQuickSale = async () => {
    if (!validateAll()) return;

    setSaving(true);
    try {
      // Save all items
      for (const item of items) {
        const costNum = item.cost !== undefined && item.cost !== '' ? parseFloat(item.cost) : undefined;
        await storageService.addQuickSaleItem({
          name: item.name.trim(),
          quantity: item.quantity,
          price: parseFloat(item.price),
          cost: costNum,
        });
      }

      // Show notification
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.textContent = `${items.length} item(s) added to quick sale`;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);

      // Reset form
      setItems([{ id: '1', name: '', quantity: 1, price: '', cost: '', errors: {} }]);

      if (onAddToQuickSale) {
        onAddToQuickSale();
      }

      onClose();
    } catch (error: any) {
      console.error('Error adding quick sale items:', error);
      alert(error.message || 'Failed to add quick sale items');
    } finally {
      setSaving(false);
    }
  };

  const handleAddToCart = async () => {
    if (!validateAll()) return;

    setSaving(true);
    try {
      // Save all items to quick sale and add to cart
      for (const item of items) {
        const costNum = item.cost !== undefined && item.cost !== '' ? parseFloat(item.cost) : 0;
        const quickSaleItem = await storageService.addQuickSaleItem({
          name: item.name.trim(),
          quantity: item.quantity,
          price: parseFloat(item.price),
          cost: costNum > 0 ? costNum : undefined,
        });

        // Create a temporary item for the cart (cost for profit calculation)
        const tempItem = {
          id: `quick-sale-${quickSaleItem.id}`,
          customer_id: '',
          name: item.name.trim(),
          code: `QS-${quickSaleItem.id.substring(0, 8)}`,
          price: parseFloat(item.price),
          cost: costNum,
          stock: 0,
          created_at: new Date().toISOString(),
        };

        // Add to cart
        addItem(tempItem as any, item.quantity);
      }

      // Show notification
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.textContent = `${items.length} item(s) added to cart`;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);

      // Reset form
      setItems([{ id: '1', name: '', quantity: 1, price: '', cost: '', errors: {} }]);

      onClose();
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      alert(error.message || 'Failed to add items to cart');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on the overlay, not on child elements
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault();
      handleAddToCart();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        className="modal-content quick-sale-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <h2>⚡ Quick Sale</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="items-list">
            {items.map((item, index) => {
              const itemTotal = item.quantity * (item.price ? parseFloat(item.price) : 0);
              return (
                <div key={item.id} className="quick-sale-item-card">
                  <div className="item-card-header">
                    <h3>Item {index + 1}</h3>
                    {items.length > 1 && (
                      <button
                        className="btn-remove-item"
                        onClick={() => handleRemoveItem(item.id)}
                        title="Remove item"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label>
                      Item Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className={`quick-sale-input ${item.errors.name ? 'error' : ''}`}
                      value={item.name}
                      onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                      placeholder="Enter item name"
                      autoFocus={index === 0 && item.name === ''}
                    />
                    {item.errors.name && <span className="error-message">{item.errors.name}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        Quantity <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        className={`quick-sale-input ${item.errors.quantity ? 'error' : ''}`}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                      />
                      {item.errors.quantity && <span className="error-message">{item.errors.quantity}</span>}
                    </div>

                    <div className="form-group">
                      <label>
                        Price (₹) <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        className={`quick-sale-input ${item.errors.price ? 'error' : ''}`}
                        value={item.price}
                        onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                      {item.errors.price && <span className="error-message">{item.errors.price}</span>}
                    </div>

                    <div className="form-group">
                      <label>Cost (₹) <span className="optional">optional</span></label>
                      <input
                        type="number"
                        className={`quick-sale-input ${item.errors.cost ? 'error' : ''}`}
                        value={item.cost}
                        onChange={(e) => handleItemChange(item.id, 'cost', e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                      {item.errors.cost && <span className="error-message">{item.errors.cost}</span>}
                    </div>
                  </div>

                  {item.price && item.quantity > 0 && (
                    <div className="item-total">
                      <span>Item Total:</span>
                      <span className="item-total-value">{formatCurrency(itemTotal)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="add-item-section">
            <button
              className="btn btn-secondary btn-add-item"
              onClick={handleAddItem}
              type="button"
            >
              + Add Another Item
            </button>
          </div>

          {items.some(item => item.price && item.quantity > 0) && (
            <div className="total-amount-display">
              <span>Grand Total:</span>
              <span className="total-value">{formatCurrency(getTotalAmount())}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleAddToQuickSale}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Add to Quick Sale'}
          </button>
          <button
            className="btn btn-success"
            onClick={handleAddToCart}
            disabled={saving}
          >
            {saving ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

