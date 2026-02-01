import { useState, useRef, useEffect } from 'react';
import { useCartStore } from '../store/cartStore';
import { storageService } from '../services/storage';
import { Item } from '../types';
import './SearchBarcodeInput.css';

interface SearchBarcodeInputProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  onItemAdded?: (item: Item) => void;
  onNavigate?: (page: string) => void;
}

export default function SearchBarcodeInput({
  searchQuery,
  onSearchChange,
  placeholder = '🔍 Search items...',
  onItemAdded,
  onNavigate,
}: SearchBarcodeInputProps) {
  const [showBarcode, setShowBarcode] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string>('');
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const { addItem } = useCartStore();

  // Focus appropriate input when mode changes
  useEffect(() => {
    if (showBarcode) {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    } else {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [showBarcode]);

  // Handle barcode input and auto-add
  useEffect(() => {
    if (!showBarcode || !barcode || barcode.trim().length < 8) return;

    const isCompleteBarcode = /^\d+$/.test(barcode.trim());

    if (isCompleteBarcode) {
      const timer = setTimeout(() => {
        searchAndAddItem(barcode.trim());
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [barcode, showBarcode]);

  const handleBarcodeKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && onNavigate) {
      e.preventDefault();
      onNavigate('cart');
    } else if (e.key === 'Enter' && barcode.trim().length > 0) {
      e.preventDefault();
      await searchAndAddItem(barcode.trim());
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && onNavigate) {
      e.preventDefault();
      onNavigate('cart');
    }
  };

  const searchAndAddItem = async (barcodeValue: string) => {
    const now = Date.now();
    if (barcodeValue === lastScannedBarcode && now - lastScanTime < 1000) {
      setBarcode('');
      barcodeInputRef.current?.focus();
      return;
    }

    setIsSearching(true);
    setLastScannedBarcode(barcodeValue);
    setLastScanTime(now);

    try {
      let item = await storageService.getItemByBarcode(barcodeValue);
      
      if (!item) {
        item = await storageService.searchItemByBarcode(barcodeValue);
      }

      if (item) {
        addItem(item, 1);
        showNotification(`${item.name} added to cart`, 'success');
        
        if (onItemAdded) {
          onItemAdded(item);
        }

        setBarcode('');
        setTimeout(() => {
          barcodeInputRef.current?.focus();
        }, 100);
      } else {
        showNotification('Item not found', 'error');
        setTimeout(() => {
          setBarcode('');
          barcodeInputRef.current?.focus();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error searching barcode:', error);
      showNotification('Error searching item', 'error');
      setBarcode('');
      setTimeout(() => {
        barcodeInputRef.current?.focus();
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

  const toggleMode = () => {
    setShowBarcode(!showBarcode);
    setBarcode('');
    onSearchChange('');
  };

  return (
    <div className="search-barcode-input-container">
      {!showBarcode ? (
        <div className="search-input-wrapper">
          <input
            ref={searchInputRef}
            type="text"
            className="input search-input"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <button
            type="button"
            className="barcode-toggle-btn"
            onClick={toggleMode}
            title="Switch to barcode scanner"
          >
            📷
          </button>
        </div>
      ) : (
        <div className="barcode-input-wrapper">
          <input
            ref={barcodeInputRef}
            type="text"
            className={`input barcode-input ${isSearching ? 'searching' : ''}`}
            placeholder="📷 Scan barcode or type..."
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={handleBarcodeKeyDown}
            disabled={isSearching}
          />
          {isSearching && <span className="barcode-loading">Searching...</span>}
          <button
            type="button"
            className="barcode-toggle-btn"
            onClick={toggleMode}
            title="Switch to search"
          >
            🔍
          </button>
        </div>
      )}
    </div>
  );
}
