import { useState, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import LoadingSpinner from '../components/LoadingSpinner';
import AccessDenied from '../components/AccessDenied';
import './Brands.css';

interface Brand {
  id: string;
  customer_id: string;
  name: string;
  code?: string;
  description?: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function Brands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    website: '',
    contact_email: '',
    contact_phone: '',
    is_active: true,
  });

  const { canView, canEdit, canDelete } = usePermissions();

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/brands', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('pos_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch brands`);
      }

      const data = await response.json();
      setBrands(data || []);
    } catch (err) {
      // Only set error if it's a real error, not just empty results
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setError(err.message);
      } else {
        setError(null);
        setBrands([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingBrand ? `/api/brands/${editingBrand.id}` : '/api/brands';
      const method = editingBrand ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('pos_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save brand');
      }

      await fetchBrands();
      setShowAddModal(false);
      setEditingBrand(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        website: '',
        contact_email: '',
        contact_phone: '',
        is_active: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save brand');
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      code: brand.code || '',
      description: brand.description || '',
      website: brand.website || '',
      contact_email: brand.contact_email || '',
      contact_phone: brand.contact_phone || '',
      is_active: brand.is_active,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (brandId: string) => {
    if (!confirm('Are you sure you want to delete this brand? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/brands/${brandId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('pos_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete brand');
      }

      await fetchBrands();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete brand');
    }
  };

  const openAddModal = () => {
    setEditingBrand(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      website: '',
      contact_email: '',
      contact_phone: '',
      is_active: true,
    });
    setShowAddModal(true);
  };

  if (!canView('brands')) {
    return <AccessDenied />;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="brands-page">
      <div className="page-header">
        <h1>Brands Management</h1>
        {canEdit('brands') && (
          <button className="btn btn-primary" onClick={openAddModal}>
            + Add Brand
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="brands-list">
        {brands.length === 0 ? (
          <div className="empty-state">
            <p>No brands found. Add your first brand to get started.</p>
          </div>
        ) : (
          <div className="brands-grid">
            {brands.map((brand) => (
              <div key={brand.id} className="brand-card">
                <div className="brand-header">
                  <h3>{brand.name}</h3>
                  {brand.code && <span className="brand-code">({brand.code})</span>}
                  <span className={`status ${brand.is_active ? 'active' : 'inactive'}`}>
                    {brand.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="brand-details">
                  {brand.description && (
                    <p className="description">{brand.description}</p>
                  )}
                  
                  <div className="brand-info">
                    {brand.website && (
                      <div className="info-item">
                        <strong>Website:</strong>
                        <a href={brand.website} target="_blank" rel="noopener noreferrer">
                          {brand.website}
                        </a>
                      </div>
                    )}
                    
                    {brand.contact_email && (
                      <div className="info-item">
                        <strong>Email:</strong>
                        <a href={`mailto:${brand.contact_email}`}>{brand.contact_email}</a>
                      </div>
                    )}
                    
                    {brand.contact_phone && (
                      <div className="info-item">
                        <strong>Phone:</strong>
                        <a href={`tel:${brand.contact_phone}`}>{brand.contact_phone}</a>
                      </div>
                    )}
                  </div>
                </div>

                {canEdit('brands') && (
                  <div className="brand-actions">
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleEdit(brand)}
                    >
                      Edit
                    </button>
                    {canDelete('brands') && (
                      <button 
                        className="btn btn-danger" 
                        onClick={() => handleDelete(brand.id)}
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
              <h2>{editingBrand ? 'Edit Brand' : 'Add Brand'}</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="brand-form">
              <div className="form-group">
                <label htmlFor="name">Brand Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="code">Brand Code</label>
                <input
                  type="text"
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="Optional auto-generated code"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="website">Website</label>
                <input
                  type="url"
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="https://example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact_email">Contact Email</label>
                <input
                  type="email"
                  id="contact_email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact_phone">Contact Phone</label>
                <input
                  type="tel"
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                />
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
                  {editingBrand ? 'Update' : 'Save'} Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
