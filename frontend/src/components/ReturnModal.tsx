import { useState, useEffect } from 'react';
import { Item } from '../types';
import './ReturnModal.css';

export type ReturnType = 'full' | 'partial' | 'exchange' | 'refund';

export interface ReturnModalCartItem {
  item: Item;
  quantity: number;
  customPrice?: number;
  originalPrice?: number;
  subtotal: number;
}

export interface ReturnFormData {
  returnType: ReturnType;
  reason: string;
  restockedItems: { itemId: string; quantity: number; name: string }[] | null;
}

interface ReturnModalProps {
  isOpen: boolean;
  orderId: string;
  items: ReturnModalCartItem[];
  onClose: () => void;
  onSubmit: (data: ReturnFormData) => void;
  submitting?: boolean;
}

const RETURN_TYPES: { value: ReturnType; label: string }[] = [
  { value: 'full', label: 'Full Return' },
  { value: 'partial', label: 'Partial Return' },
  { value: 'exchange', label: 'Exchange' },
  { value: 'refund', label: 'Refund' },
];

export default function ReturnModal({
  isOpen,
  orderId,
  items,
  onClose,
  onSubmit,
  submitting = false,
}: ReturnModalProps) {
  const [returnType, setReturnType] = useState<ReturnType>('full');
  const [reason, setReason] = useState('');
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!submitting) onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const togglePartialItem = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      alert('Please enter a reason for the return.');
      return;
    }
    let restockedItems: { itemId: string; quantity: number; name: string }[] | null = null;
    if (returnType === 'partial' && selectedIndices.size > 0) {
      restockedItems = Array.from(selectedIndices)
        .sort((a, b) => a - b)
        .map((index) => ({
          itemId: items[index].item.id,
          quantity: items[index].quantity,
          name: items[index].item.name || items[index].item.display_name || 'Item',
        }));
    }
    onSubmit({
      returnType,
      reason: trimmedReason,
      restockedItems,
    });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay return-modal-overlay" onClick={handleOverlayClick}>
      <div className="return-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Request Return</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="return-modal-form">
          <div className="modal-body">
            <p className="return-modal-order-ref">Order: {orderId.slice(0, 8).toUpperCase()}…</p>

            <div className="form-group">
              <label>Return type</label>
              <div className="return-type-options">
                {RETURN_TYPES.map(({ value, label }) => (
                  <label key={value} className="return-type-option">
                    <input
                      type="radio"
                      name="returnType"
                      value={value}
                      checked={returnType === value}
                      onChange={() => setReturnType(value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="return-reason">Reason for return <span className="required">*</span></label>
              <textarea
                id="return-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Defective, Wrong size, Customer request"
                rows={3}
                required
              />
            </div>

            {returnType === 'partial' && (
              <div className="form-group partial-items">
                <label>Select items to return</label>
                <div className="partial-items-list">
                  {items.map((cartItem, index) => (
                    <label key={index} className="partial-item-row">
                      <input
                        type="checkbox"
                        checked={selectedIndices.has(index)}
                        onChange={() => togglePartialItem(index)}
                      />
                      <span className="partial-item-name">{cartItem.item.name || cartItem.item.display_name}</span>
                      <span className="partial-item-qty">Qty: {cartItem.quantity}</span>
                    </label>
                  ))}
                </div>
                {selectedIndices.size === 0 && (
                  <p className="partial-hint">Select at least one item to return.</p>
                )}
              </div>
            )}
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                submitting ||
                !reason.trim() ||
                (returnType === 'partial' && selectedIndices.size === 0)
              }
            >
              {submitting ? 'Submitting…' : 'Submit return request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
