import { useState, useEffect, useRef } from 'react';
import { useCartStore } from '../store/cartStore';
import { storageService } from '../services/storage';
import { Item } from '../types';
import './BarcodeInput.css';

interface BarcodeInputProps {
  onItemAdded?: (item: Item) => void;
  placeholder?: string;
}

export default function BarcodeInput({ onItemAdded, placeholder = 'Scan or type barcode...' }: BarcodeInputProps) {
  const [barcode, setBarcode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string>('');
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addItem } = useCartStore();

  // Auto-focus on mount and after item added
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle barcode input and auto-add
  useEffect(() => {
    if (!barcode || barcode.trim().length < 8) return;

    // Check if this looks like a complete barcode (8+ digits)
    const isCompleteBarcode = /^\d+$/.test(barcode.trim());

    if (isCompleteBarcode) {
      // Debounce: wait 500ms after last character before searching
      const timer = setTimeout(() => {
        searchAndAddItem(barcode.trim());
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [barcode]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Enter key
    if (e.key === 'Enter' && barcode.trim().length > 0) {
      e.preventDefault();
      await searchAndAddItem(barcode.trim());
    }
  };

  const searchAndAddItem = async (barcodeValue: string) => {
    // Prevent duplicate rapid scans
    const now = Date.now();
    if (barcodeValue === lastScannedBarcode && now - lastScanTime < 1000) {
      setBarcode('');
      inputRef.current?.focus();
      return;
    }

    setIsSearching(true);
    setLastScannedBarcode(barcodeValue);
    setLastScanTime(now);

    try {
      // Try exact match first
      let item = await storageService.getItemByBarcode(barcodeValue);
      
      // If not found, try partial search
      if (!item) {
        item = await storageService.searchItemByBarcode(barcodeValue);
      }

      if (item) {
        // Add item to cart
        addItem(item, 1);
        
        // Show success notification
        showNotification(`${item.name} added to cart`, 'success');
        
        // Callback
        if (onItemAdded) {
          onItemAdded(item);
        }

        // Clear input and re-focus
        setBarcode('');
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      } else {
        // Item not found
        showNotification('Item not found', 'error');
        // Clear input after a delay
        setTimeout(() => {
          setBarcode('');
          inputRef.current?.focus();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error searching barcode:', error);
      showNotification('Error searching item', 'error');
      setBarcode('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 1000);
    } finally {
      setIsSearching(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.background = type === 'success' ? '#27ae60' : '#e74c3c';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  // Keyboard shortcut: F1 or Ctrl+B to focus
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F1' || (e.ctrlKey && e.key === 'b')) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="barcode-input-container">
      <input
        ref={inputRef}
        type="text"
        className={`barcode-input ${isSearching ? 'searching' : ''}`}
        value={barcode}
        onChange={(e) => {
          setBarcode(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus
        disabled={isSearching}
      />
      {isSearching && (
        <span className="barcode-loading">Searching...</span>
      )}
      <div className="barcode-hint">
        Press Enter or wait 500ms • F1 or Ctrl+B to focus
      </div>
    </div>
  );
}
