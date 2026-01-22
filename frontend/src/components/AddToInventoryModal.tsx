import { useState, useEffect } from 'react';
import { QuickSaleItem, Category, Item } from '../types';
import { storageService } from '../services/storage';
import './AddToInventoryModal.css';

interface AddToInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  quickSaleItem: QuickSaleItem;
  onSuccess: () => void;
}

export default function AddToInventoryModal({ isOpen, onClose, quickSaleItem, onSuccess }: AddToInventoryModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: quickSaleItem.name,
    category_id: '',
    code: '',
    stock: 0,
    cost: 0,
    price: typeof quickSaleItem.price === 'string' ? parseFloat(quickSaleItem.price) : quickSaleItem.price,
    mrp: '',
    display_name: '',
    subcategory: '',
    barcode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadItems();
      // Reset form with quick sale item data
      setFormData({
        name: quickSaleItem.name,
        category_id: '',
        code: '',
        stock: 0,
        cost: 0,
        price: typeof quickSaleItem.price === 'string' ? parseFloat(quickSaleItem.price) : quickSaleItem.price,
        mrp: '',
        display_name: quickSaleItem.name, // Prepopulate with item name
        subcategory: '',
        barcode: '',
      });
      setErrors({});
      setSubcategories([]);
    }
  }, [isOpen, quickSaleItem]);

  useEffect(() => {
    // Update subcategories when category changes
    if (formData.category_id) {
      updateSubcategories(formData.category_id);
    } else {
      setSubcategories([]);
    }
  }, [formData.category_id, categories, items]);

  const loadCategories = async () => {
    try {
      const data = await storageService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadItems = async () => {
    try {
      const data = await storageService.getItems();
      setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const updateSubcategories = (categoryId: string) => {
    const selectedCategory = categories.find(c => c.id === categoryId);
    if (!selectedCategory) {
      setSubcategories([]);
      return;
    }

    // Get subcategories from items with this category_id
    const itemSubcategories = items
      .filter(item => item.category_id === categoryId && item.subcategory)
      .map(item => item.subcategory!)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();

    // Also get subcategories from categories with the same name
    const categorySubcategories = categories
      .filter(c => c.name === selectedCategory.name && c.subcategory)
      .map(c => c.subcategory!)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();

    // Combine and deduplicate
    const allSubcategories = [...new Set([...itemSubcategories, ...categorySubcategories])].sort();
    setSubcategories(allSubcategories);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    }
    
    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }
    
    if (!formData.code.trim()) {
      newErrors.code = 'Item code is required';
    }
    
    if (formData.stock < 0) {
      newErrors.stock = 'Stock must be 0 or greater';
    }
    
    if (formData.cost < 0) {
      newErrors.cost = 'Cost must be 0 or greater';
    }
    
    if (formData.price < 0) {
      newErrors.price = 'Price must be 0 or greater';
    }
    
    if (formData.mrp && parseFloat(formData.mrp) < 0) {
      newErrors.mrp = 'MRP must be 0 or greater';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      await storageService.addQuickSaleItemToInventory(quickSaleItem.id, {
        category_id: formData.category_id,
        code: formData.code.trim(),
        stock: formData.stock,
        cost: formData.cost,
        price: formData.price,
        mrp: formData.mrp ? parseFloat(formData.mrp) : undefined,
        display_name: formData.display_name.trim() || undefined,
        subcategory: formData.subcategory.trim() || undefined,
        barcode: formData.barcode.trim() || undefined,
      });

      // Show notification
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.textContent = 'Item added to inventory successfully';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);

      onSuccess();
    } catch (error: any) {
      console.error('Error adding to inventory:', error);
      alert(error.message || 'Failed to add item to inventory');
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

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content add-to-inventory-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add to Inventory</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>
              Item Name <span className="required">*</span>
            </label>
            <input
              type="text"
              className={`input ${errors.name ? 'error' : ''}`}
              value={formData.name}
              onChange={(e) => {
                const newName = e.target.value;
                setFormData({ 
                  ...formData, 
                  name: newName,
                  // Auto-update display_name if it matches the old name or is empty
                  display_name: formData.display_name === formData.name || !formData.display_name 
                    ? newName 
                    : formData.display_name
                });
              }}
              placeholder="Enter item name"
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

            <div className="form-group">
              <label>
                Category <span className="required">*</span>
              </label>
              <select
                className={`input ${errors.category_id ? 'error' : ''}`}
                value={formData.category_id}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    category_id: e.target.value,
                    subcategory: '' // Reset subcategory when category changes
                  });
                }}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category_id && <span className="error-message">{errors.category_id}</span>}
            </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Item Code <span className="required">*</span>
              </label>
              <input
                type="text"
                className={`input ${errors.code ? 'error' : ''}`}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Enter item code"
              />
              {errors.code && <span className="error-message">{errors.code}</span>}
            </div>

            <div className="form-group">
              <label>
                Stock <span className="required">*</span>
              </label>
              <input
                type="number"
                className={`input ${errors.stock ? 'error' : ''}`}
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                min="0"
              />
              {errors.stock && <span className="error-message">{errors.stock}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Cost (₹) <span className="required">*</span>
              </label>
              <input
                type="number"
                className={`input ${errors.cost ? 'error' : ''}`}
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
              />
              {errors.cost && <span className="error-message">{errors.cost}</span>}
            </div>

            <div className="form-group">
              <label>
                Price (₹) <span className="required">*</span>
              </label>
              <input
                type="number"
                className={`input ${errors.price ? 'error' : ''}`}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
              />
              {errors.price && <span className="error-message">{errors.price}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>MRP (₹) (Optional)</label>
            <input
              type="number"
              className={`input ${errors.mrp ? 'error' : ''}`}
              value={formData.mrp}
              onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
              min="0"
              step="0.01"
              placeholder="Optional"
            />
            {errors.mrp && <span className="error-message">{errors.mrp}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Display Name (Optional)</label>
              <input
                type="text"
                className="input"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Optional display name"
              />
            </div>

            <div className="form-group">
              <label>Subcategory (Optional)</label>
              {formData.category_id && subcategories.length > 0 ? (
                <select
                  className="input"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                >
                  <option value="">Select Subcategory (Optional)</option>
                  {subcategories.map((subcat) => (
                    <option key={subcat} value={subcat}>
                      {subcat}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="input"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  placeholder={formData.category_id ? "No subcategories available. Enter manually" : "Select category first"}
                  disabled={!formData.category_id}
                />
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Barcode (Optional)</label>
            <input
              type="text"
              className="input"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              placeholder="Optional barcode"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Adding...' : 'Add to Inventory'}
          </button>
        </div>
      </div>
    </div>
  );
}

