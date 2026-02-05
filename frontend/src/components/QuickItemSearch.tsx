import { useState, useRef, useEffect } from 'react';
import { useInventoryStore } from '../store/inventoryStore';
import { useCartStore } from '../store/cartStore';
import { storageService } from '../services/storage';
import './QuickItemSearch.css';

interface QuickItemSearchProps {
  onItemAdded?: () => void;
  onNavigate?: (page: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
  customAddItem?: (item: any, quantity: number) => void; // Custom add function for table orders
}

export default function QuickItemSearch({
  onItemAdded,
  onNavigate,
  autoFocus = true,
  placeholder = 'Enter mapping code...',
  customAddItem,
}: QuickItemSearchProps) {
  const [mappingCode, setMappingCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addItem: cartAddItem } = useCartStore();

  // Use custom add function if provided, otherwise use cart
  const addItem = customAddItem || cartAddItem;

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && mappingCode.trim()) {
      e.preventDefault();
      await searchAndAddItem(mappingCode.trim());
    } else if (e.key === 'Tab' && onNavigate) {
      e.preventDefault();
      onNavigate('cart');
    }
  };

  // Note: 's' key navigation is handled at Dashboard level to avoid conflicts

  const searchAndAddItem = async (code: string) => {
    if (!code) return;

    setIsSearching(true);
    try {
      const item = await storageService.searchItemByMappingCode(code);
      if (item) {
        addItem(item, 1);
        setMappingCode('');

        // Show notification
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = `${item.name || item.display_name} added to cart`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);

        if (onItemAdded) {
          onItemAdded();
        }
      } else {
        alert('Item not found');
      }
    } catch (error: any) {
      console.error('Error searching item:', error);
      alert(error.message || 'Item not found');
    } finally {
      setIsSearching(false);
      // Refocus input after a short delay to ensure it works
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  };

  return (
    <div className="quick-item-search-container">
      <div className="quick-item-search-wrapper">
        <input
          ref={inputRef}
          type="text"
          className={`quick-item-search-input ${isSearching ? 'searching' : ''}`}
          placeholder={placeholder}
          value={mappingCode}
          onChange={(e) => setMappingCode(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSearching}
          autoFocus={autoFocus}
        />
        {isSearching && <span className="quick-item-search-loading">Searching...</span>}
      </div>
      <div className="quick-item-search-hint">
        Press Enter to add • Tab to go to Cart
      </div>
    </div>
  );
}
