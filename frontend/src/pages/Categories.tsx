import { useState, useEffect } from 'react';
import { useInventoryStore } from '../store/inventoryStore';
import { Category } from '../types';
import './Categories.css';

export default function Categories() {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddingSubcategory, setIsAddingSubcategory] = useState(false);
  const [name, setName] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [brand, setBrand] = useState('');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBrand, setFilterBrand] = useState('');

  const { categories, loadCategories, addCategory, updateCategory, deleteCategory } =
    useInventoryStore();

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleAdd = () => {
    setEditingCategory(null);
    setIsAddingSubcategory(false);
    setName('');
    setSubcategory('');
    setBrand('');
    setModalVisible(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsAddingSubcategory(false);
    setName(category.name);
    setSubcategory(category.subcategory || '');
    setBrand(category.brand || '');
    setModalVisible(true);
  };

  const handleAddSubcategory = (mainCategory: Category) => {
    // Set the main category as the base, but we're adding a new subcategory
    setEditingCategory(null); // Not editing, creating new subcategory
    setIsAddingSubcategory(true); // Track that we're adding a subcategory
    setName(mainCategory.name); // Pre-fill with main category name
    setSubcategory(''); // Empty subcategory field
    setBrand(mainCategory.brand || ''); // Pre-fill brand if exists
    setModalVisible(true);
  };

  // Check if we're editing a subcategory OR adding a subcategory to an existing main category
  const isEditingSubcategory = !!(editingCategory && editingCategory.subcategory);
  const isMainCategoryReadOnly = isEditingSubcategory || isAddingSubcategory;

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a category name');
      return;
    }

    // If adding subcategory, subcategory name is required
    if (isAddingSubcategory && !subcategory.trim()) {
      alert('Please enter a subcategory name');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, { 
          name, 
          subcategory: subcategory || undefined, 
          brand: brand || undefined 
        });
      } else {
        await addCategory({ 
          name, 
          subcategory: subcategory || undefined, 
          brand: brand || undefined 
        });
      }
      setModalVisible(false);
      setIsAddingSubcategory(false);
      setName('');
      setSubcategory('');
      setBrand('');
      // Reload categories to show the new one
      loadCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      const errorMessage = error?.message || 'Failed to save category';
      alert(`Failed to save category: ${errorMessage}`);
    }
  };

  const handleDelete = (category: Category) => {
    if (confirm(`Are you sure you want to delete "${category.name}${category.subcategory ? ` / ${category.subcategory}` : ''}"?`)) {
      deleteCategory(category.id);
    }
  };

  // Filter categories
  const filteredCategories = categories.filter(category => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!category.name.toLowerCase().includes(query) &&
          !(category.subcategory && category.subcategory.toLowerCase().includes(query))) {
        return false;
      }
    }

    // Brand filter
    if (filterBrand && category.brand !== filterBrand) {
      return false;
    }

    return true;
  });

  // Get unique brands
  const uniqueBrands = [...new Set(categories.map(c => c.brand).filter((b): b is string => !!b))].sort();

  // Group categories by main category name
  const groupedCategories = filteredCategories.reduce((acc, category) => {
    const mainCategoryName = category.name;
    if (!acc[mainCategoryName]) {
      acc[mainCategoryName] = [];
    }
    acc[mainCategoryName].push(category);
    return acc;
  }, {} as Record<string, Category[]>);

  // Sort each group: main category first (no subcategory), then subcategories
  Object.keys(groupedCategories).forEach(key => {
    groupedCategories[key].sort((a, b) => {
      if (!a.subcategory && b.subcategory) return -1;
      if (a.subcategory && !b.subcategory) return 1;
      if (a.subcategory && b.subcategory) {
        return a.subcategory.localeCompare(b.subcategory);
      }
      return 0;
    });
  });

  return (
    <div className="categories">
      <div className="categories-header">
        <h1>📁 Categories</h1>
        <button className="btn btn-primary" onClick={handleAdd}>
          + Add Category
        </button>
      </div>

      {/* Filters */}
      <div className="card filters-card">
        <div className="filters-row">
          <div className="filter-group">
            <label>Search:</label>
            <input
              type="text"
              className="input"
              placeholder="Search by name or subcategory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {uniqueBrands.length > 0 && (
            <div className="filter-group">
              <label>Brand:</label>
              <select
                className="input"
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
              >
                <option value="">All Brands</option>
                {uniqueBrands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>
          )}
          {(searchQuery || filterBrand) && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSearchQuery('');
                setFilterBrand('');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {Object.keys(groupedCategories).length > 0 ? (
          <div className="categories-list">
            {Object.entries(groupedCategories).map(([mainCategoryName, categoryGroup]) => {
              const mainCategory = categoryGroup.find(c => !c.subcategory) || categoryGroup[0];
              const subcategories = categoryGroup.filter(c => c.subcategory);
              
              return (
                <div key={mainCategoryName} className="category-group">
                  <div className="main-category">
                    <div className="category-header">
                      <h3 className="category-name">{mainCategoryName}</h3>
                      {mainCategory.brand && (
                        <span className="category-brand-badge">{mainCategory.brand}</span>
                      )}
                    </div>
                    <div className="category-actions">
                      <button
                        className="icon-btn add-subcategory-btn"
                        onClick={() => handleAddSubcategory(mainCategory)}
                        title="Add Subcategory"
                      >
                        ➕
                      </button>
                      <button
                        className="icon-btn edit-btn"
                        onClick={() => handleEdit(mainCategory)}
                        title="Edit Category"
                      >
                        ✏️
                      </button>
                      <button
                        className="icon-btn delete-btn"
                        onClick={() => handleDelete(mainCategory)}
                        title="Delete Category"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  {subcategories.length > 0 && (
                    <div className="subcategories-list">
                      {subcategories.map((subcategory) => (
                        <div key={subcategory.id} className="subcategory-item">
                          <div className="subcategory-info">
                            <span className="subcategory-name">{subcategory.subcategory}</span>
                            {subcategory.brand && (
                              <span className="subcategory-brand">{subcategory.brand}</span>
                            )}
                          </div>
                          <div className="category-actions">
                            <button
                              className="icon-btn edit-btn"
                              onClick={() => handleEdit(subcategory)}
                              title="Edit Subcategory"
                            >
                              ✏️
                            </button>
                            <button
                              className="icon-btn delete-btn"
                              onClick={() => handleDelete(subcategory)}
                              title="Delete Subcategory"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : categories.length > 0 ? (
          <div className="empty-state">
            <p>📭 No categories match the filters</p>
            <p className="empty-subtext">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="empty-state">
            <p>📭 No categories yet</p>
            <p className="empty-subtext">Add a category to get started</p>
          </div>
        )}
      </div>

      {modalVisible && (
        <div className="modal-overlay" onClick={() => {
          setModalVisible(false);
          setIsAddingSubcategory(false);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              {isAddingSubcategory 
                ? 'Add Subcategory' 
                : editingCategory 
                  ? (isEditingSubcategory ? 'Edit Subcategory' : 'Edit Category')
                  : 'Add Category'}
            </h2>
            <label>
              Category Name *:
              <input
                type="text"
                className="input"
                placeholder="Category Name"
                value={name}
                onChange={(e) => !isMainCategoryReadOnly && setName(e.target.value)}
                readOnly={isMainCategoryReadOnly}
                disabled={isMainCategoryReadOnly}
                required
                style={isMainCategoryReadOnly ? { 
                  backgroundColor: '#f5f5f5', 
                  cursor: 'not-allowed',
                  opacity: 0.7
                } : {}}
              />
              {isMainCategoryReadOnly && (
                <small style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
                  {isAddingSubcategory 
                    ? 'Main category is locked when adding a subcategory' 
                    : 'Main category cannot be changed when editing subcategory'}
                </small>
              )}
            </label>
            <label>
              Subcategory {isAddingSubcategory ? '*' : '(Optional)'}:
              <input
                type="text"
                className="input"
                placeholder={isAddingSubcategory ? "Enter subcategory name" : "Subcategory"}
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                required={isAddingSubcategory}
              />
              {isAddingSubcategory && (
                <small style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
                  Adding a subcategory to "{name}"
                </small>
              )}
            </label>
            <label>
              Brand (Optional):
                <input
                  type="text"
                  className="input"
                placeholder="Brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                />
            </label>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => {
                setModalVisible(false);
                setIsAddingSubcategory(false);
              }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

