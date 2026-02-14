import { useState, useEffect } from 'react';
import { useInventoryStore } from '../store/inventoryStore';
import { formatCurrency } from '../utils/formatters';
import { UomMaster } from '../types';
import { uomService } from '../services/uomService';
import './ViewItemMultiStage.css';

interface ViewItemMultiStageProps {
  itemId?: string;
  onNavigate?: (page: string) => void;
  onBack?: () => void;
}

export default function ViewItemMultiStage({ itemId: propItemId, onNavigate, onBack }: ViewItemMultiStageProps = {}) {
  const itemId = propItemId;
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [currentStage, setCurrentStage] = useState(1);
  const [editData, setEditData] = useState<any>({});
  const [uoms, setUoms] = useState<UomMaster[]>([]);

  const { items, categories, updateItem } = useInventoryStore();
  const totalStages = 5;

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

  const handleEdit = () => {
    setEditing(true);
    setEditData({ ...item });
    setCurrentStage(1);
  };

  const handleCancel = () => {
    setEditing(false);
    setEditData({ ...item });
    if (onBack) {
      onBack();
    } else if (onNavigate) {
      onNavigate('items');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (!itemId) return;
      await updateItem(itemId, editData);
      setItem({ ...item, ...editData });
      setEditing(false);

      const notification = document.createElement('div');
      notification.className = 'notification success';
      notification.textContent = 'Item updated successfully!';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    } catch (error: any) {
      alert(`Failed to update item: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStage < totalStages) {
      setCurrentStage(currentStage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStage > 1) {
      setCurrentStage(currentStage - 1);
    }
  };

  const renderStage = () => {
    if (!item) return null;

    switch (currentStage) {
      case 1:
        return (
          <div className="stage-content">
            <h2>Basic Information</h2>
            <div className="form-grid">
              <div className="form-field">
                <label>Item Name{editing && <span className="required-asterisk">*</span>}:</label>
                {editing ? (
                  <input className="input" value={editData.name || ''} onChange={(e) => setEditData({...editData, name: e.target.value})} />
                ) : (
                  <div className="value">{item.name}</div>
                )}
              </div>
              <div className="form-field">
                <label>Item Code{editing && <span className="required-asterisk">*</span>}:</label>
                {editing ? (
                  <input className="input" value={editData.code || ''} onChange={(e) => setEditData({...editData, code: e.target.value})} />
                ) : (
                  <div className="value">{item.code}</div>
                )}
              </div>
              <div className="form-field">
                <label>Type{editing && <span className="required-asterisk">*</span>}:</label>
                {editing ? (
                  <select className="input" value={editData.type || 'goods'} onChange={(e) => setEditData({...editData, type: e.target.value})}>
                    <option value="goods">Goods</option>
                    <option value="service">Service</option>
                  </select>
                ) : (
                  <div className="value">{item.type || 'Goods'}</div>
                )}
              </div>
              <div className="form-field">
                <label>Category:</label>
                {editing ? (
                  <select className="input" value={editData.category_id || ''} onChange={(e) => setEditData({...editData, category_id: e.target.value})}>
                    <option value="">Select Category</option>
                    {categories?.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="value">{item.category_id ? categories?.find(c => c.id === item.category_id)?.name : '-'}</div>
                )}
              </div>
              <div className="form-field">
                <label>Subcategory:</label>
                {editing ? (
                  <input className="input" value={editData.subcategory || ''} onChange={(e) => setEditData({...editData, subcategory: e.target.value})} />
                ) : (
                  <div className="value">{item.subcategory || '-'}</div>
                )}
              </div>
              <div className="form-field">
                <label>SKU:</label>
                {editing ? (
                  <input className="input" value={editData.sku || ''} onChange={(e) => setEditData({...editData, sku: e.target.value})} />
                ) : (
                  <div className="value">{item.sku || '-'}</div>
                )}
              </div>
              <div className="form-field">
                <label>Display Name:</label>
                {editing ? (
                  <input className="input" value={editData.display_name || ''} onChange={(e) => setEditData({...editData, display_name: e.target.value})} />
                ) : (
                  <div className="value">{item.display_name || '-'}</div>
                )}
              </div>
              <div className="form-field full-width">
                <label>Description:</label>
                {editing ? (
                  <textarea className="input" value={editData.description || ''} onChange={(e) => setEditData({...editData, description: e.target.value})} rows={3} />
                ) : (
                  <div className="value">{item.description || '-'}</div>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="stage-content">
            <h2>Item Code & Identification</h2>
            <div className="form-grid">
              <div className="form-field">
                <label>Barcode:</label>
                {editing ? (
                  <input className="input" value={editData.barcode || ''} onChange={(e) => setEditData({...editData, barcode: e.target.value})} />
                ) : (
                  <div className="value">{item.barcode || '-'}</div>
                )}
              </div>
              <div className="form-field">
                <label>Mapping Code:</label>
                {editing ? (
                  <input className="input" value={editData.mapping_code || ''} onChange={(e) => setEditData({...editData, mapping_code: e.target.value})} />
                ) : (
                  <div className="value">{item.mapping_code || '-'}</div>
                )}
              </div>
              <div className="form-field">
                <label>HSN Code:</label>
                {editing ? (
                  <input className="input" value={editData.hsn_code || ''} onChange={(e) => setEditData({...editData, hsn_code: e.target.value})} />
                ) : (
                  <div className="value">{item.hsn_code || '-'}</div>
                )}
              </div>
              <div className="form-field">
                <label>Brand:</label>
                {editing ? (
                  <input className="input" value={editData.brand?.name || ''} onChange={(e) => setEditData({...editData, brand: { name: e.target.value }})} />
                ) : (
                  <div className="value">{item.brand?.name || '-'}</div>
                )}
              </div>
              <div className="form-field">
                <label>Manufacturer:</label>
                {editing ? (
                  <input className="input" value={editData.manufacturer || ''} onChange={(e) => setEditData({...editData, manufacturer: e.target.value})} />
                ) : (
                  <div className="value">{item.manufacturer || '-'}</div>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="stage-content">
            <h2>Pricing & GST</h2>
            <div className="form-grid">
              <div className="form-field">
                <label>Cost Price{editing && <span className="required-asterisk">*</span>}:</label>
                {editing ? (
                  <input type="number" className="input" value={editData.cost || ''} onChange={(e) => setEditData({...editData, cost: e.target.value})} step="0.01" />
                ) : (
                  <div className="value">{formatCurrency(item.cost)}</div>
                )}
              </div>
              <div className="form-field">
                <label>Selling Price{editing && <span className="required-asterisk">*</span>}:</label>
                {editing ? (
                  <input type="number" className="input" value={editData.price || ''} onChange={(e) => setEditData({...editData, price: e.target.value})} step="0.01" />
                ) : (
                  <div className="value">{formatCurrency(item.price)}</div>
                )}
              </div>
              <div className="form-field">
                <label>MRP:</label>
                {editing ? (
                  <input type="number" className="input" value={editData.mrp || ''} onChange={(e) => setEditData({...editData, mrp: e.target.value})} step="0.01" />
                ) : (
                  <div className="value">{item.mrp ? formatCurrency(item.mrp) : '-'}</div>
                )}
              </div>
              <div className="form-field">
                <label>GST Rate (%):</label>
                {editing ? (
                  <input type="number" className="input" value={editData.gst_rate || ''} onChange={(e) => setEditData({...editData, gst_rate: e.target.value})} step="0.01" />
                ) : (
                  <div className="value">{item.gst_rate || '-'}%</div>
                )}
              </div>
              <div className="form-field">
                <label>CESS Rate (%):</label>
                {editing ? (
                  <input type="number" className="input" value={editData.cess_rate || ''} onChange={(e) => setEditData({...editData, cess_rate: e.target.value})} step="0.01" />
                ) : (
                  <div className="value">{item.cess_rate || '-'}%</div>
                )}
              </div>
              <div className="form-field">
                <label>Stock Quantity:</label>
                {editing ? (
                  <input type="number" className="input" value={editData.stock || ''} onChange={(e) => setEditData({...editData, stock: e.target.value})} />
                ) : (
                  <div className="value">{item.stock || 0}</div>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="stage-content">
            <h2>UOM & Dimensions</h2>
            <div className="form-grid">
              <div className="form-field">
                <label>UOM:</label>
                {editing ? (
                  <select className="input" value={editData.uom_id || ''} onChange={(e) => setEditData({...editData, uom_id: e.target.value})}>
                    <option value="">Select UOM</option>
                    {uoms.map(uom => (
                      <option key={uom.id} value={uom.id}>{uom.name} ({uom.code})</option>
                    ))}
                  </select>
                ) : (
                  <div className="value">{item.uom_id ? uoms.find(u => u.id === item.uom_id)?.name || '-' : '-'}</div>
                )}
              </div>
              <div className="form-field">
                <label>Weight per Unit:</label>
                {editing ? (
                  <input type="number" className="input" value={editData.weight_per_unit || ''} onChange={(e) => setEditData({...editData, weight_per_unit: e.target.value})} step="0.01" />
                ) : (
                  <div className="value">{item.weight_per_unit || '-'} {item.weight_per_unit ? 'kg' : ''}</div>
                )}
              </div>
              <div className="form-field">
                <label>Volume per Unit:</label>
                {editing ? (
                  <input type="number" className="input" value={editData.volume_per_unit || ''} onChange={(e) => setEditData({...editData, volume_per_unit: e.target.value})} step="0.01" />
                ) : (
                  <div className="value">{item.volume_per_unit || '-'} {item.volume_per_unit ? 'L' : ''}</div>
                )}
              </div>
              <div className="form-field">
                <label>Length:</label>
                {editing ? (
                  <input type="number" className="input" value={editData.length_per_unit || ''} onChange={(e) => setEditData({...editData, length_per_unit: e.target.value})} step="0.01" />
                ) : (
                  <div className="value">{item.length_per_unit || '-'} {item.length_per_unit ? 'cm' : ''}</div>
                )}
              </div>
              <div className="form-field">
                <label>Width:</label>
                {editing ? (
                  <input type="number" className="input" value={editData.width_per_unit || ''} onChange={(e) => setEditData({...editData, width_per_unit: e.target.value})} step="0.01" />
                ) : (
                  <div className="value">{item.width_per_unit || '-'} {item.width_per_unit ? 'cm' : ''}</div>
                )}
              </div>
              <div className="form-field">
                <label>Height:</label>
                {editing ? (
                  <input type="number" className="input" value={editData.height_per_unit || ''} onChange={(e) => setEditData({...editData, height_per_unit: e.target.value})} step="0.01" />
                ) : (
                  <div className="value">{item.height_per_unit || '-'} {item.height_per_unit ? 'cm' : ''}</div>
                )}
              </div>
              <div className="form-field">
                <label>Package Type:</label>
                {editing ? (
                  <input className="input" value={editData.package_type || ''} onChange={(e) => setEditData({...editData, package_type: e.target.value})} />
                ) : (
                  <div className="value">{item.package_type || '-'}</div>
                )}
              </div>
              <div className="form-field">
                <label>Package Quantity:</label>
                {editing ? (
                  <input type="number" className="input" value={editData.package_quantity || '1'} onChange={(e) => setEditData({...editData, package_quantity: e.target.value})} min="1" />
                ) : (
                  <div className="value">{item.package_quantity || 1}</div>
                )}
              </div>
              <div className="form-field">
                <label>Is Perishable:</label>
                {editing ? (
                  <label style={{ flexDirection: 'row', gap: '10px', alignItems: 'center' }}>
                    <input type="checkbox" checked={editData.is_perishable || false} onChange={(e) => setEditData({...editData, is_perishable: e.target.checked})} />
                    Yes
                  </label>
                ) : (
                  <div className="value">{item.is_perishable ? 'Yes' : 'No'}</div>
                )}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="stage-content">
            <h2>Additional Details</h2>
            <div className="form-grid">
              <div className="form-field">
                <label>Model Number:</label>
                {editing ? (
                  <input className="input" value={editData.model_number || ''} onChange={(e) => setEditData({...editData, model_number: e.target.value})} />
                ) : (
                  <div className="value">{item.model_number || '-'}</div>
                )}
              </div>
              <div className="form-field">
                <label>Batch Number:</label>
                {editing ? (
                  <input className="input" value={editData.batch_number || ''} onChange={(e) => setEditData({...editData, batch_number: e.target.value})} />
                ) : (
                  <div className="value">{item.batch_number || '-'}</div>
                )}
              </div>
              <div className="form-field">
                <label>Expiry Date:</label>
                {editing ? (
                  <input type="date" className="input" value={editData.expiry_date || ''} onChange={(e) => setEditData({...editData, expiry_date: e.target.value})} />
                ) : (
                  <div className="value">{item.expiry_date || '-'}</div>
                )}
              </div>
              <div className="form-field">
                <label>Shelf Life (Days):</label>
                {editing ? (
                  <input type="number" className="input" value={editData.shelf_life_days || ''} onChange={(e) => setEditData({...editData, shelf_life_days: e.target.value})} />
                ) : (
                  <div className="value">{item.shelf_life_days || '-'}</div>
                )}
              </div>
              <div className="form-field">
                <label>Min Stock Level:</label>
                {editing ? (
                  <input type="number" className="input" value={editData.min_stock_level || ''} onChange={(e) => setEditData({...editData, min_stock_level: e.target.value})} />
                ) : (
                  <div className="value">{item.min_stock_level || '-'}</div>
                )}
              </div>
              <div className="form-field">
                <label>Max Stock Level:</label>
                {editing ? (
                  <input type="number" className="input" value={editData.max_stock_level || ''} onChange={(e) => setEditData({...editData, max_stock_level: e.target.value})} />
                ) : (
                  <div className="value">{item.max_stock_level || '-'}</div>
                )}
              </div>
              <div className="form-field">
                <label>Reorder Level:</label>
                {editing ? (
                  <input type="number" className="input" value={editData.reorder_level || ''} onChange={(e) => setEditData({...editData, reorder_level: e.target.value})} />
                ) : (
                  <div className="value">{item.reorder_level || '-'}</div>
                )}
              </div>
              <div className="form-field full-width">
                <label>Storage Conditions:</label>
                {editing ? (
                  <input className="input" value={editData.storage_conditions || ''} onChange={(e) => setEditData({...editData, storage_conditions: e.target.value})} />
                ) : (
                  <div className="value">{item.storage_conditions || '-'}</div>
                )}
              </div>
              <div className="form-field">
                <label>Created At:</label>
                <div className="value">{new Date(item.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <div className="loading">Loading item details...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button className="btn btn-primary" onClick={handleCancel}>Back</button>
      </div>
    );
  }

  return (
    <div className="view-item-multistage-page">
      <div className="page-header">
        <div className="header-content">
          <button className="btn btn-secondary back-btn" onClick={handleCancel}>
            ← Back to Items
          </button>
          <h1>{editing ? 'Edit Item' : 'View Item'}</h1>
        </div>
        <div className="header-actions">
          {!editing && (
            <button className="btn btn-primary" onClick={handleEdit}>
              Edit Item
            </button>
          )}
        </div>
      </div>

      <div className="item-details-container">
        <div className="progress-indicator">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentStage - 1) / (totalStages - 1)) * 100}%` }}
            />
          </div>
          <div className="progress-steps">
            {['Basic Info', 'Item Code', 'Pricing', 'UOM & Dimensions', 'Additional Details'].map((step, index) => (
              <div 
                key={index} 
                className={`progress-step ${currentStage === index + 1 ? 'active' : ''} ${currentStage > index + 1 ? 'completed' : ''}`}
              >
                <div className="step-number">{index + 1}</div>
                <div className="step-label">{step}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-container">
          {renderStage()}
        </div>

        <div className="form-actions">
          {editing ? (
            <div className="navigation-buttons">
              <button className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
              
              {currentStage > 1 && (
                <button className="btn btn-secondary" onClick={handlePrevious}>
                  ← Back
                </button>
              )}
              
              {currentStage < totalStages ? (
                <button className="btn btn-primary" onClick={handleNext}>
                  Next →
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          ) : (
            <div className="navigation-buttons">
              <button className="btn btn-secondary" onClick={handleCancel}>
                Back to Items
              </button>
              
              {currentStage > 1 && (
                <button className="btn btn-secondary" onClick={handlePrevious}>
                  ← Back
                </button>
              )}
              
              {currentStage < totalStages ? (
                <button className="btn btn-primary" onClick={handleNext}>
                  Next →
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleEdit}>
                  Edit Item
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
