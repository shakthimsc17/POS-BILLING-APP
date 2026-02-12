import { useState, useEffect } from 'react';
import { useInventoryStore } from '../store/inventoryStore';
import { useCompanyStore } from '../store/companyStore';
import { formatCurrency } from '../utils/formatters';
import { UomMaster } from '../types';
import { uomService } from '../services/uomService';
import './ViewItem.css';

interface ViewItemProps {
  itemId?: string; // Optional prop for direct usage
  onNavigate?: (page: string) => void;
  onBack?: () => void;
}

export default function ViewItem({ itemId: propItemId, onNavigate, onBack }: ViewItemProps = {}) {
  const itemId = propItemId;

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  const [uoms, setUoms] = useState<UomMaster[]>([]);

  const { items, categories, updateItem } = useInventoryStore();
  const { company } = useCompanyStore();

  useEffect(() => {
    const loadUoms = async () => {
      try {
        const data = await uomService.getUoms();
        setUoms(data);
      } catch (error) {
        console.error('Error loading UOMs:', error);
      }
    };
    loadUoms();
  }, []);

  useEffect(() => {
    if (itemId) {
      loadItem();
    } else {
      setError('No item ID provided');
      setLoading(false);
    }
  }, [itemId]);

  const loadItem = () => {
    setLoading(true);
    try {
      if (!itemId) {
        setError('No item ID provided');
        return;
      }
      const foundItem = items.find(i => i.id === itemId);
      if (foundItem) {
        setItem(foundItem);
        setEditData(foundItem);
      } else {
        setError('Item not found');
      }
    } catch (err) {
      setError('Failed to load item');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    if (!categories || categories.length === 0) return 'Loading...';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '-';
  };

  const handleEdit = () => {
    setEditing(true);
    setEditData({ ...item });
  };

  const handleCancel = () => {
    setEditing(false);
    setEditData({ ...item });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (!itemId) return;
      await updateItem(itemId, editData);
      setItem({ ...item, ...editData });
      setEditing(false);

      // Show success message
      const notification = document.createElement('div');
      notification.className = 'notification success';
      notification.textContent = 'Item updated successfully!';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    } catch (err: any) {
      setError(`Failed to update item: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setEditData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      if (!itemId) return;
      await useInventoryStore.getState().deleteItem(itemId);
      if (onNavigate) {
        onNavigate('items');
      } else if (onBack) {
        onBack();
      }
    } catch (err: any) {
      setError(`Failed to delete item: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToItems = () => {
    if (onNavigate) {
      onNavigate('items');
    } else if (onBack) {
      onBack();
    }
  };

  if (loading && !item) {
    return (
      <div className="view-item-page">
        <div className="loading">Loading item details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-item-page">
        <div className="error">
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={handleBackToItems}>
            Back to Items
          </button>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="view-item-page">
        <div className="error">
          <p>Item not found</p>
          <button className="btn btn-secondary" onClick={handleBackToItems}>
            Back to Items
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="view-item-page">
      <div className="page-header">
        <div className="header-content">
          <button className="btn btn-secondary back-btn" onClick={handleBackToItems}>
            ← Back to Items
          </button>
          <h1>{editing ? 'Edit Item' : 'Item Details'}</h1>
        </div>
        <div className="header-actions">
          {!editing && (
            <>
              <button className="btn btn-primary" onClick={handleEdit}>
                Edit Item
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete Item
              </button>
            </>
          )}
        </div>
      </div>

      <div className="item-details-container">
        {/* Primary Details Section */}
        <div className="detail-section">
          <h2>Primary Details</h2>
          <div className="detail-grid">
            <div className="detail-field">
              <label>Item Name:</label>
              {editing ? (
                <input
                  type="text"
                  className="input"
                  value={editData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              ) : (
                <span className="value">{item.name}</span>
              )}
            </div>

            <div className="detail-field">
              <label>Display Name:</label>
              {editing ? (
                <input
                  type="text"
                  className="input"
                  value={editData.display_name || ''}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                />
              ) : (
                <span className="value">{item.display_name || '-'}</span>
              )}
            </div>

            <div className="detail-field">
              <label>Item Type:</label>
              {editing ? (
                <select
                  className="input"
                  value={editData.type || 'goods'}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                >
                  <option value="goods">Goods</option>
                  <option value="service">Service</option>
                </select>
              ) : (
                <span className="value">{item.type || 'Goods'}</span>
              )}
            </div>

            <div className="detail-field">
              <label>SKU:</label>
              {editing ? (
                <input
                  type="text"
                  className="input"
                  value={editData.sku || ''}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                />
              ) : (
                <span className="value">{item.sku || item.code}</span>
              )}
            </div>

            <div className="detail-field">
              <label>Category:</label>
              {editing ? (
                <select
                  className="input"
                  value={editData.category_id || ''}
                  onChange={(e) => handleInputChange('category_id', e.target.value)}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="value">{getCategoryName(item.category_id)}</span>
              )}
            </div>

            <div className="detail-field">
              <label>Subcategory:</label>
              {editing ? (
                <input
                  type="text"
                  className="input"
                  value={editData.subcategory || ''}
                  onChange={(e) => handleInputChange('subcategory', e.target.value)}
                />
              ) : (
                <span className="value">{item.subcategory || '-'}</span>
              )}
            </div>

            <div className="detail-field">
              <label>Brand:</label>
              {editing ? (
                <input
                  type="text"
                  className="input"
                  value={editData.brand || ''}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                />
              ) : (
                <span className="value">{item.brand || '-'}</span>
              )}
            </div>

            <div className="detail-field">
              <label>Manufacturer:</label>
              {editing ? (
                <input
                  type="text"
                  className="input"
                  value={editData.manufacturer || ''}
                  onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                />
              ) : (
                <span className="value">{item.manufacturer || '-'}</span>
              )}
            </div>

            <div className="detail-field">
              <label>UOM (Unit):</label>
              {editing ? (
                <select
                  className="input"
                  value={editData.uom_id || ''}
                  onChange={(e) => handleInputChange('uom_id', e.target.value)}
                >
                  <option value="">Select UOM</option>
                  {uoms.map(uom => (
                    <option key={uom.id} value={uom.id}>{uom.name} ({uom.code})</option>
                  ))}
                </select>
              ) : (
                <span className="value">{item.uom_name || '-'}</span>
              )}
            </div>

            <div className="detail-field full-width">
              <label>Description:</label>
              {editing ? (
                <textarea
                  className="input"
                  value={editData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              ) : (
                <span className="value">{item.description || '-'}</span>
              )}
            </div>
          </div>
        </div>

        {/* UOM & Dimensions Section */}
        <div className="detail-section">
          <h2>UOM & Dimensions</h2>
          <div className="detail-grid">
            <div className="detail-field">
              <label>Weight:</label>
              {editing ? (
                <input
                  type="number"
                  className="input"
                  value={editData.weight_per_unit || ''}
                  onChange={(e) => handleInputChange('weight_per_unit', e.target.value)}
                  step="0.01"
                />
              ) : (
                <span className="value">{item.weight_per_unit || '-'}</span>
              )}
            </div>
            <div className="detail-field">
              <label>Volume:</label>
              {editing ? (
                <input
                  type="number"
                  className="input"
                  value={editData.volume_per_unit || ''}
                  onChange={(e) => handleInputChange('volume_per_unit', e.target.value)}
                  step="0.01"
                />
              ) : (
                <span className="value">{item.volume_per_unit || '-'}</span>
              )}
            </div>
            <div className="detail-field">
              <label>Dimensions (LxWxH):</label>
              {editing ? (
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input type="number" placeholder="L" className="input" style={{ width: '60px' }} value={editData.length_per_unit || ''} onChange={e => handleInputChange('length_per_unit', e.target.value)} />
                  <input type="number" placeholder="W" className="input" style={{ width: '60px' }} value={editData.width_per_unit || ''} onChange={e => handleInputChange('width_per_unit', e.target.value)} />
                  <input type="number" placeholder="H" className="input" style={{ width: '60px' }} value={editData.height_per_unit || ''} onChange={e => handleInputChange('height_per_unit', e.target.value)} />
                </div>
              ) : (
                <span className="value">
                  {item.length_per_unit || item.width_per_unit || item.height_per_unit
                    ? `${item.length_per_unit || 0} x ${item.width_per_unit || 0} x ${item.height_per_unit || 0}`
                    : '-'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Extended Details Section */}
        <div className="detail-section">
          <h2>Extended Details</h2>
          <div className="detail-grid">
            <div className="detail-field">
              <label>Model Number:</label>
              {editing ? (
                <input
                  type="text"
                  className="input"
                  value={editData.model_number || ''}
                  onChange={(e) => handleInputChange('model_number', e.target.value)}
                />
              ) : (
                <span className="value">{item.model_number || '-'}</span>
              )}
            </div>
            <div className="detail-field">
              <label>Batch Number:</label>
              {editing ? (
                <input
                  type="text"
                  className="input"
                  value={editData.batch_number || ''}
                  onChange={(e) => handleInputChange('batch_number', e.target.value)}
                />
              ) : (
                <span className="value">{item.batch_number || '-'}</span>
              )}
            </div>
            <div className="detail-field">
              <label>Expiry Date:</label>
              {editing ? (
                <input
                  type="date"
                  className="input"
                  value={editData.expiry_date ? new Date(editData.expiry_date).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                />
              ) : (
                <span className="value">{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}</span>
              )}
            </div>
            <div className="detail-field">
              <label>Shelf Life (Days):</label>
              {editing ? (
                <input
                  type="number"
                  className="input"
                  value={editData.shelf_life_days || ''}
                  onChange={(e) => handleInputChange('shelf_life_days', e.target.value)}
                />
              ) : (
                <span className="value">{item.shelf_life_days || '-'}</span>
              )}
            </div>
            <div className="detail-field full-width">
              <label>Storage Conditions:</label>
              {editing ? (
                <input
                  type="text"
                  className="input"
                  value={editData.storage_conditions || ''}
                  onChange={(e) => handleInputChange('storage_conditions', e.target.value)}
                />
              ) : (
                <span className="value">{item.storage_conditions || '-'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Inventory Settings Section */}
        <div className="detail-section">
          <h2>Inventory Settings</h2>
          <div className="detail-grid">
            <div className="detail-field">
              <label>Min Stock Level:</label>
              {editing ? (
                <input
                  type="number"
                  className="input"
                  value={editData.min_stock_level || ''}
                  onChange={(e) => handleInputChange('min_stock_level', e.target.value)}
                />
              ) : (
                <span className="value">{item.min_stock_level || '-'}</span>
              )}
            </div>
            <div className="detail-field">
              <label>Max Stock Level:</label>
              {editing ? (
                <input
                  type="number"
                  className="input"
                  value={editData.max_stock_level || ''}
                  onChange={(e) => handleInputChange('max_stock_level', e.target.value)}
                />
              ) : (
                <span className="value">{item.max_stock_level || '-'}</span>
              )}
            </div>
            <div className="detail-field">
              <label>Reorder Level:</label>
              {editing ? (
                <input
                  type="number"
                  className="input"
                  value={editData.reorder_level || ''}
                  onChange={(e) => handleInputChange('reorder_level', e.target.value)}
                />
              ) : (
                <span className="value">{item.reorder_level || '-'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Sales Information Section */}
        <div className="detail-section">
          <h2>Sales Information</h2>
          <div className="detail-grid">
            <div className="detail-field">
              <label>Selling Price:</label>
              {editing ? (
                <input
                  type="number"
                  className="input"
                  value={editData.price || ''}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0"
                />
              ) : (
                <span className="value">{formatCurrency(item.price)}</span>
              )}
            </div>

            <div className="detail-field">
              <label>MRP:</label>
              {editing ? (
                <input
                  type="number"
                  className="input"
                  value={editData.mrp || ''}
                  onChange={(e) => handleInputChange('mrp', parseFloat(e.target.value) || undefined)}
                  step="0.01"
                  min="0"
                />
              ) : (
                <span className="value">{item.mrp ? formatCurrency(item.mrp) : '-'}</span>
              )}
            </div>

            <div className="detail-field">
              <label>Account (Sales):</label>
              {editing ? (
                <select
                  className="input"
                  value={editData.salesAccount || 'Sales'}
                  onChange={(e) => handleInputChange('salesAccount', e.target.value)}
                >
                  <option value="Sales">Sales</option>
                  <option value="Service Income">Service Income</option>
                  <option value="Other Income">Other Income</option>
                </select>
              ) : (
                <span className="value">{item.salesAccount || 'Sales'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Purchase Information Section */}
        <div className="detail-section">
          <h2>Purchase Information</h2>
          <div className="detail-grid">
            <div className="detail-field">
              <label>Cost Price:</label>
              {editing ? (
                <input
                  type="number"
                  className="input"
                  value={editData.cost || ''}
                  onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0"
                />
              ) : (
                <span className="value">{formatCurrency(item.cost)}</span>
              )}
            </div>

            <div className="detail-field">
              <label>Account (Cost of Goods Sold):</label>
              {editing ? (
                <select
                  className="input"
                  value={editData.costAccount || 'Cost of Goods Sold'}
                  onChange={(e) => handleInputChange('costAccount', e.target.value)}
                >
                  <option value="Cost of Goods Sold">Cost of Goods Sold</option>
                  <option value="Direct Costs">Direct Costs</option>
                  <option value="Expenses">Expenses</option>
                </select>
              ) : (
                <span className="value">{item.costAccount || 'Cost of Goods Sold'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Item Code & Identification Section */}
        <div className="detail-section">
          <h2>Item Code & Identification</h2>
          <div className="detail-grid">
            <div className="detail-field">
              <label>Item Code:</label>
              {editing ? (
                <input
                  type="text"
                  className="input"
                  value={editData.code || ''}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                />
              ) : (
                <span className="value">{item.code}</span>
              )}
            </div>

            <div className="detail-field">
              <label>Barcode:</label>
              {editing ? (
                <input
                  type="text"
                  className="input"
                  value={editData.barcode || ''}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                />
              ) : (
                <span className="value">{item.barcode || '-'}</span>
              )}
            </div>

            {company?.business_type === 'cafe' && (
              <div className="detail-field">
                <label>Mapping Code:</label>
                {editing ? (
                  <input
                    type="text"
                    className="input"
                    value={editData.mapping_code || ''}
                    onChange={(e) => handleInputChange('mapping_code', e.target.value)}
                  />
                ) : (
                  <span className="value">{item.mapping_code || '-'}</span>
                )}
              </div>
            )}

            <div className="detail-field">
              <label>HSN Code:</label>
              {editing ? (
                <input
                  type="text"
                  className="input"
                  value={editData.hsn_code || ''}
                  onChange={(e) => handleInputChange('hsn_code', e.target.value)}
                />
              ) : (
                <span className="value">{item.hsn_code || '-'}</span>
              )}
            </div>

            <div className="detail-field">
              <label>GST Rate:</label>
              {editing ? (
                <input
                  type="number"
                  className="input"
                  value={editData.gst_rate || ''}
                  onChange={(e) => handleInputChange('gst_rate', parseFloat(e.target.value) || undefined)}
                  step="0.01"
                  min="0"
                />
              ) : (
                <span className="value">{item.gst_rate ? `${item.gst_rate}%` : '-'}</span>
              )}
            </div>

            <div className="detail-field">
              <label>CESS Rate:</label>
              {editing ? (
                <input
                  type="number"
                  className="input"
                  value={editData.cess_rate || ''}
                  onChange={(e) => handleInputChange('cess_rate', parseFloat(e.target.value) || undefined)}
                  step="0.01"
                  min="0"
                />
              ) : (
                <span className="value">{item.cess_rate ? `${item.cess_rate}%` : '-'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Stock Information Section */}
        <div className="detail-section">
          <h2>Stock Information</h2>
          <div className="detail-grid">
            <div className="detail-field">
              <label>Opening Stock:</label>
              {editing ? (
                <input
                  type="number"
                  className="input"
                  value={editData.openingStock || ''}
                  onChange={(e) => handleInputChange('openingStock', parseInt(e.target.value) || 0)}
                  min="0"
                />
              ) : (
                <span className="value">{item.openingStock || '0'}</span>
              )}
            </div>

            <div className="detail-field">
              <label>Current Stock:</label>
              {editing ? (
                <input
                  type="number"
                  className="input"
                  value={editData.stock || ''}
                  onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                  min="0"
                />
              ) : (
                <span className="value">{item.stock}</span>
              )}
            </div>

            <div className="detail-field">
              <label>Stock on Hand:</label>
              <span className="value">{item.stock}</span>
            </div>

            <div className="detail-field">
              <label>Committed Stock:</label>
              <span className="value">0</span>
            </div>

            <div className="detail-field">
              <label>Available for Sale:</label>
              <span className="value">{item.stock}</span>
            </div>

            <div className="detail-field">
              <label>Inventory Account:</label>
              {editing ? (
                <select
                  className="input"
                  value={editData.inventoryAccount || 'Inventory Asset'}
                  onChange={(e) => handleInputChange('inventoryAccount', e.target.value)}
                >
                  <option value="Inventory Asset">Inventory Asset</option>
                  <option value="Stock">Stock</option>
                  <option value="Goods">Goods</option>
                </select>
              ) : (
                <span className="value">{item.inventoryAccount || 'Inventory Asset'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Images Section */}
        <div className="detail-section">
          <h2>Item Images</h2>
          <div className="images-section">
            <div className="image-upload-group">
              <div className="image-field">
                <label>Front View:</label>
                {item.image_url ? (
                  <div className="image-preview">
                    <img src={item.image_url} alt="Front view" />
                  </div>
                ) : (
                  <div className="no-image">
                    <p>No front image available</p>
                  </div>
                )}
              </div>

              <div className="image-field">
                <label>Rear View:</label>
                <div className="no-image">
                  <p>No rear image available</p>
                </div>
              </div>
            </div>

            <div className="image-field">
              <label>Other Images:</label>
              <div className="no-image">
                <p>No other images available</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        {editing && (
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={handleCancel} disabled={loading}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
