import { Category } from '../types';
import './CategoryFilter.css';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategories: string[];
  onToggleCategory: (categoryId: string) => void;
}

// Default icon mapping for categories
const getCategoryIcon = (category: Category): string => {
  if (category.icon) {
    return category.icon;
  }

  const name = category.name.toLowerCase();
  
  // Professional default icon mapping
  if (name.includes('electronic') || name.includes('tech')) return '⚡';
  if (name.includes('cloth') || name.includes('apparel') || name.includes('wear')) return '👕';
  if (name.includes('food') || name.includes('grocery')) return '🍔';
  if (name.includes('beverage') || name.includes('drink') || name.includes('juice')) return '🥤';
  if (name.includes('book') || name.includes('stationery')) return '📚';
  if (name.includes('health') || name.includes('medicine') || name.includes('pharma')) return '💊';
  if (name.includes('sport') || name.includes('fitness')) return '⚽';
  if (name.includes('beauty') || name.includes('cosmetic')) return '💄';
  if (name.includes('toy') || name.includes('game')) return '🎮';
  if (name.includes('home') || name.includes('furniture')) return '🏠';
  if (name.includes('car') || name.includes('auto') || name.includes('vehicle')) return '🚗';
  if (name.includes('phone') || name.includes('mobile')) return '📱';
  if (name.includes('computer') || name.includes('laptop')) return '💻';
  
  return '📦'; // Default icon
};

export default function CategoryFilter({ categories, selectedCategories, onToggleCategory }: CategoryFilterProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="category-filter">
      <div className="category-filter-scroll">
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          return (
            <button
              key={category.id}
              className={`category-icon-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => onToggleCategory(category.id)}
              title={category.name}
            >
              <span className="category-icon">{getCategoryIcon(category)}</span>
              <span className="category-name">{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

