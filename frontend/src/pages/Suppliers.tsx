import { useState, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import LoadingSpinner from '../components/LoadingSpinner';
import AccessDenied from '../components/AccessDenied';
import './Suppliers.css';

interface Supplier {
  id: string;
  customer_id: string;
  name: string;
  code?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  pan_number?: string;
  payment_terms?: string;
  credit_limit?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  brands?: Array<{
    id: string;
    name: string;
    code?: string;
    supplier_brand_code?: string;
    is_preferred: boolean;
  }>;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contact_person: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    pan_number: '',
    payment_terms: '',
    credit_limit: '',
    is_active: true,
  });

  const { canView, canEdit, canDelete } = usePermissions();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/suppliers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('pos_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch suppliers`);
      }

      const data = await response.json();
      setSuppliers(data || []);
    } catch (err) {
      // Only set error if it's a real error, not just empty results
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setError(err.message);
      } else {
        setError(null);
        setSuppliers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers';
      const method = editingSupplier ? 'PUT' : 'POST';
      
      const submitData = {
        ...formData,
        credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : null,
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('pos_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save supplier');
      }

      await fetchSuppliers();
      setShowAddModal(false);
      setEditingSupplier(null);
      setFormData({
        name: '',
        code: '',
        contact_person: '',
        email: '',
        phone: '',
        mobile: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        gstin: '',
        pan_number: '',
        payment_terms: '',
        credit_limit: '',
        is_active: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save supplier');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      code: supplier.code || '',
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      mobile: supplier.mobile || '',
      address: supplier.address || '',
      city: supplier.city || '',
      state: supplier.state || '',
      pincode: supplier.pincode || '',
      gstin: supplier.gstin || '',
      pan_number: supplier.pan_number || '',
      payment_terms: supplier.payment_terms || '',
      credit_limit: supplier.credit_limit?.toString() || '',
      is_active: supplier.is_active,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (supplierId: string) => {
    if (!confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/suppliers/${supplierId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('pos_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete supplier');
      }

      await fetchSuppliers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete supplier');
    }
  };

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      code: '',
      contact_person: '',
      email: '',
      phone: '',
      mobile: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      gstin: '',
      pan_number: '',
      payment_terms: '',
      credit_limit: '',
      is_active: true,
    });
    setShowAddModal(true);
  };

  if (!canView('suppliers')) {
    return <AccessDenied />;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="suppliers-page">
      <div className="page-header">
        <h1>Suppliers Management</h1>
        {canEdit('suppliers') && (
          <button className="btn btn-primary" onClick={openAddModal}>
            + Add Supplier
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="suppliers-list">
        {suppliers.length === 0 ? (
          <div className="empty-state">
            <p>No suppliers found. Add your first supplier to get started.</p>
          </div>
        ) : (
          <div className="suppliers-grid">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="supplier-card">
                <div className="supplier-header">
                  <div className="supplier-title">
                    <h3>{supplier.name}</h3>
                    {supplier.code && <span className="supplier-code">({supplier.code})</span>}
                  </div>
                  <span className={`status ${supplier.is_active ? 'active' : 'inactive'}`}>
                    {supplier.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="supplier-details">
                  <div className="contact-info">
                    {supplier.contact_person && (
                      <div className="info-item">
                        <strong>Contact Person:</strong>
                        <span>{supplier.contact_person}</span>
                      </div>
                    )}
                    
                    {supplier.email && (
                      <div className="info-item">
                        <strong>Email:</strong>
                        <a href={`mailto:${supplier.email}`}>{supplier.email}</a>
                      </div>
                    )}
                    
                    {supplier.phone && (
                      <div className="info-item">
                        <strong>Phone:</strong>
                        <a href={`tel:${supplier.phone}`}>{supplier.phone}</a>
                      </div>
                    )}
                    
                    {supplier.mobile && (
                      <div className="info-item">
                        <strong>Mobile:</strong>
                        <a href={`tel:${supplier.mobile}`}>{supplier.mobile}</a>
                      </div>
                    )}
                  </div>
                  
                  <div className="address-info">
                    {supplier.address && (
                      <div className="info-item">
                        <strong>Address:</strong>
                        <span>{supplier.address}</span>
                      </div>
                    )}
                    
                    {(supplier.city || supplier.state) && (
                      <div className="info-item">
                        <strong>City/State:</strong>
                        <span>{supplier.city}{supplier.city && supplier.state ? ', ' : ''}{supplier.state}</span>
                      </div>
                    )}
                    
                    {supplier.pincode && (
                      <div className="info-item">
                        <strong>Pincode:</strong>
                        <span>{supplier.pincode}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="business-info">
                    {supplier.gstin && (
                      <div className="info-item">
                        <strong>GSTIN:</strong>
                        <span>{supplier.gstin}</span>
                      </div>
                    )}
                    
                    {supplier.pan_number && (
                      <div className="info-item">
                        <strong>PAN:</strong>
                        <span>{supplier.pan_number}</span>
                      </div>
                    )}
                    
                    {supplier.payment_terms && (
                      <div className="info-item">
                        <strong>Payment Terms:</strong>
                        <span>{supplier.payment_terms}</span>
                      </div>
                    )}
                    
                    {supplier.credit_limit && (
                      <div className="info-item">
                        <strong>Credit Limit:</strong>
                        <span>₹{supplier.credit_limit.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {supplier.brands && supplier.brands.length > 0 && (
                  <div className="brands-section">
                    <h4>Associated Brands</h4>
                    <div className="brands-list">
                      {supplier.brands.map((brand) => (
                        <div key={brand.id} className="brand-item">
                          <span className="brand-name">{brand.name}</span>
                          {brand.code && <span className="brand-code">({brand.code})</span>}
                          {brand.is_preferred && <span className="preferred-badge">Preferred</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {canEdit('suppliers') && (
                  <div className="supplier-actions">
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleEdit(supplier)}
                    >
                      Edit
                    </button>
                    {canDelete('suppliers') && (
                      <button 
                        className="btn btn-danger" 
                        onClick={() => handleDelete(supplier.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="supplier-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Supplier Name *</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="code">Supplier Code</label>
                  <input
                    type="text"
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="Optional auto-generated code"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="contact_person">Contact Person</label>
                <input
                  type="text"
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="mobile">Mobile</label>
                  <input
                    type="tel"
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="gstin">GSTIN</label>
                  <input
                    type="text"
                    id="gstin"
                    value={formData.gstin}
                    onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                    placeholder="29ABCDE1234F1ZV"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address">Address</label>
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows={2}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="state">State</label>
                  <input
                    type="text"
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="pincode">Pincode</label>
                  <input
                    type="text"
                    id="pincode"
                    value={formData.pincode}
                    onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="pan_number">PAN Number</label>
                  <input
                    type="text"
                    id="pan_number"
                    value={formData.pan_number}
                    onChange={(e) => setFormData({...formData, pan_number: e.target.value})}
                    placeholder="ABCDE1234F"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="payment_terms">Payment Terms</label>
                  <input
                    type="text"
                    id="payment_terms"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({...formData, payment_terms: e.target.value})}
                    placeholder="NET 30, COD, etc."
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="credit_limit">Credit Limit</label>
                  <input
                    type="number"
                    id="credit_limit"
                    value={formData.credit_limit}
                    onChange={(e) => setFormData({...formData, credit_limit: e.target.value})}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  Active
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSupplier ? 'Update' : 'Save'} Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
