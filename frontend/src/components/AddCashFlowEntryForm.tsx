import { useState } from 'react';
import { CashFlowCategory } from '../types';
import { formatCurrency } from '../utils/formatters';
import './AddCashFlowEntryForm.css';

interface AddCashFlowEntryFormProps {
  category: CashFlowCategory;
  onClose: () => void;
  onSubmit: (data: {
    type: 'income' | 'expense';
    category: string;
    amount: number;
    description?: string;
    entry_date: string;
  }) => void;
}

export default function AddCashFlowEntryForm({ category, onClose, onSubmit }: AddCashFlowEntryFormProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!entryDate) {
      newErrors.entryDate = 'Date is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      type: category.type,
      category: category.name,
      amount: parseFloat(amount),
      description: description.trim() || undefined,
      entry_date: new Date(entryDate).toISOString(),
    });
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="entry-form-overlay" onClick={handleOverlayClick}>
      <div className="entry-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="entry-form-header">
          <button className="entry-form-close" onClick={onClose}>×</button>
          <h2 className="entry-form-title">{category.name.toUpperCase()}</h2>
          <div className="entry-form-header-spacer"></div>
        </div>

        <div className="entry-form-body">
          <div className="entry-form-card">
            <div className="form-field">
              <label className="form-label">Enter Amount</label>
              <div className="amount-input-wrapper">
                <span className="currency-symbol">₹</span>
                <input
                  type="number"
                  className={`amount-input ${errors.amount ? 'error' : ''}`}
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) {
                      setErrors({ ...errors, amount: '' });
                    }
                  }}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  autoFocus
                />
                <div className="amount-underline"></div>
              </div>
              {errors.amount && <span className="error-message">{errors.amount}</span>}
            </div>

            <button
              className={`submit-button ${category.type === 'income' ? 'income' : 'expense'}`}
              onClick={handleSubmit}
            >
              {category.type === 'income' ? 'ADD INCOME' : 'ADD EXPENSE'}
            </button>

            <div className="date-field">
              <div className="date-display">{formatDate(entryDate)}</div>
              <label className="date-label">DATE</label>
              <input
                type="date"
                className="date-input"
                value={entryDate}
                onChange={(e) => {
                  setEntryDate(e.target.value);
                  if (errors.entryDate) {
                    setErrors({ ...errors, entryDate: '' });
                  }
                }}
              />
              {errors.entryDate && <span className="error-message">{errors.entryDate}</span>}
            </div>

            <div className="notes-field">
              <label className="notes-label">Notes</label>
              <input
                type="text"
                className="notes-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder=""
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

