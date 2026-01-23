import { useState } from 'react';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, CashFlowCategory } from '../types';
import './CategorySelector.css';

interface CategorySelectorProps {
  type: 'income' | 'expense';
  onSelectCategory: (category: CashFlowCategory) => void;
  onClose: () => void;
}

export default function CategorySelector({ type, onSelectCategory, onClose }: CategorySelectorProps) {
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>(type);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const categories = activeTab === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryClick = (category: CashFlowCategory) => {
    onSelectCategory(category);
  };

  return (
    <div className="category-selector-overlay" onClick={onClose}>
      <div className="category-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="category-selector-header">
          <button className="category-selector-back" onClick={onClose}>←</button>
          <div className="category-selector-tabs">
            <button
              className={`category-tab ${activeTab === 'expense' ? 'active' : ''}`}
              onClick={() => setActiveTab('expense')}
            >
              EXPENSE
            </button>
            <button
              className={`category-tab ${activeTab === 'income' ? 'active' : ''}`}
              onClick={() => setActiveTab('income')}
            >
              INCOME
            </button>
          </div>
          <button 
            className="category-selector-search" 
            onClick={() => {
              setShowSearch(!showSearch);
              if (!showSearch) {
                setSearchQuery('');
              }
            }}
            title="Search categories"
          >
            🔍
          </button>
        </div>

        <div className="category-selector-body">
          {showSearch && (
            <div className="category-search-input-wrapper">
              <input
                type="text"
                className="category-search-input"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          )}

          <div className="category-grid">
            {filteredCategories.map((category) => (
              <div
                key={category.name}
                className="category-card"
                onClick={() => handleCategoryClick(category)}
              >
                <div className={`category-icon ${category.type === 'income' ? 'income' : 'expense'}`}>
                  {category.icon}
                </div>
                <div className="category-name">{category.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

