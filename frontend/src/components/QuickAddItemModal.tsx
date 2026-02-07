import { useState, useEffect } from 'react';
import { Item } from '../types';
import { useInventoryStore } from '../store/inventoryStore';
import { useCartStore } from '../store/cartStore';
import { formatCurrency } from '../utils/formatters';
import './QuickAddItemModal.css';

interface QuickAddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickAddItemModal({ isOpen, onClose }: QuickAddItemModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [searching, setSearching] = useState(false);

  const { searchItems } = useInventoryStore();
  const { addItem } = useCartStore();

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!searching) onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searching, onClose]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    const performSearch = async () => {
      setSearching(true);
      try {
        const results = await searchItems(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching items:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchItems]);

  const handleAddToCart = () => {
    if (selectedItem) {
      addItem(selectedItem, quantity);
      // Show notification
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.textContent = `${selectedItem.name} added to cart`;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
      
      // Reset and close
      setSelectedItem(null);
      setSearchQuery('');
      setQuantity(1);
      onClose();
    }
  };

  const handleItemSelect = (item: Item) => {
    setSelectedItem(item);
    setQuantity(1);
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on the overlay, not on child elements
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content quick-add-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Quick Add Item</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="search-section">
            <input
              type="text"
              className="input"
              placeholder="🔍 Search by name, code, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          {searching && (
            <div className="search-loading">
              <p>Searching...</p>
            </div>
          )}

          {!searching && searchQuery.trim() !== '' && searchResults.length === 0 && (
            <div className="search-empty">
              <p>No items found</p>
            </div>
          )}

          {!searching && searchResults.length > 0 && (
            <div className="search-results">
              <h3>Search Results ({searchResults.length})</h3>
              <div className="results-list">
                {searchResults.map((item) => {
                  const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`result-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleItemSelect(item)}
                    >
                      <div className="result-item-info">
                        <h4>{item.name}</h4>
                        <p className="result-code">Code: {item.code}</p>
                        <p className="result-price">{formatCurrency(itemPrice)}</p>
                        {item.stock > 0 ? (
                          <span className="result-stock">Stock: {item.stock}</span>
                        ) : (
                          <span className="result-stock out-of-stock">Out of Stock</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedItem && (
            <div className="selected-item-section">
              <h3>Selected Item</h3>
              <div className="selected-item-card">
                <div className="selected-item-info">
                  <h4>{selectedItem.name}</h4>
                  <p>Code: {selectedItem.code}</p>
                  <p className="selected-price">
                    {formatCurrency(typeof selectedItem.price === 'string' ? parseFloat(selectedItem.price) : selectedItem.price)}
                  </p>
                </div>
                <div className="quantity-selector">
                  <label>Quantity:</label>
                  <div className="quantity-controls">
                    <button
                      className="qty-btn"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      className="qty-input"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                    />
                    <button
                      className="qty-btn"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleAddToCart}
            disabled={!selectedItem}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

