import { useState, useEffect } from 'react';
import { SalesCustomer } from '../types';
import { storageService } from '../services/storage';
import './CustomerSelectModal.css';

interface CustomerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: SalesCustomer | null) => void;
  selectedCustomerId?: string;
}

export default function CustomerSelectModal({ isOpen, onClose, onSelect, selectedCustomerId }: CustomerSelectModalProps) {
  const [customers, setCustomers] = useState<SalesCustomer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<SalesCustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Add customer form state
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    place: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!loading && !saving) onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, saving, onClose]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(query) ||
        customer.mobile.toLowerCase().includes(query) ||
        (customer.place && customer.place.toLowerCase().includes(query)) ||
        (customer.email && customer.email.toLowerCase().includes(query))
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await storageService.getSalesCustomers();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      console.error('Error loading sales customers:', error);
      alert('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.mobile.trim()) {
      errors.mobile = 'Mobile number is required';
    } else if (!/^[0-9]{10,15}$/.test(formData.mobile.trim())) {
      errors.mobile = 'Please enter a valid mobile number';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddCustomer = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const newCustomer = await storageService.addSalesCustomer({
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim() || undefined,
        place: formData.place.trim() || undefined,
      });
      
      // Reload customers
      await loadCustomers();
      
      // Select the new customer
      onSelect(newCustomer);
      
      // Reset form
      setFormData({ name: '', mobile: '', email: '', place: '' });
      setShowAddForm(false);
      onClose();
    } catch (error: any) {
      console.error('Error adding customer:', error);
      alert(error.message || 'Failed to add customer');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectCustomer = (customer: SalesCustomer | null) => {
    onSelect(customer);
    onClose();
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
      <div className="modal-content customer-select-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Customer</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {!showAddForm ? (
            <>
              <div className="search-section">
                <input
                  type="text"
                  className="input"
                  placeholder="🔍 Search by name, mobile, place, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="customer-actions">
                <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
                  + Add New Customer
                </button>
                <button className="btn btn-secondary" onClick={() => handleSelectCustomer(null)}>
                  Walk-in Customer
                </button>
              </div>

              {loading ? (
                <div className="loading-state">
                  <p>Loading customers...</p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="empty-state">
                  <p>{searchQuery ? 'No customers found' : 'No customers yet'}</p>
                </div>
              ) : (
                <div className="customers-list">
                  <h3>Customers ({filteredCustomers.length})</h3>
                  <div className="customers-grid">
                    {filteredCustomers.map((customer) => {
                      const isSelected = selectedCustomerId === customer.id;
                      return (
                        <div
                          key={customer.id}
                          className={`customer-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelectCustomer(customer)}
                        >
                          <div className="customer-name">{customer.name}</div>
                          <div className="customer-mobile">{customer.mobile}</div>
                          {customer.place && (
                            <div className="customer-place">{customer.place}</div>
                          )}
                          {customer.email && (
                            <div className="customer-email">{customer.email}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="add-customer-form">
              <h3>Add New Customer</h3>
              <div className="form-group">
                <label>
                  Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className={`input ${formErrors.name ? 'error' : ''}`}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter customer name"
                />
                {formErrors.name && <span className="error-message">{formErrors.name}</span>}
              </div>

              <div className="form-group">
                <label>
                  Mobile Number <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  className={`input ${formErrors.mobile ? 'error' : ''}`}
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="Enter mobile number"
                />
                {formErrors.mobile && <span className="error-message">{formErrors.mobile}</span>}
              </div>

              <div className="form-group">
                <label>Email (Optional)</label>
                <input
                  type="email"
                  className={`input ${formErrors.email ? 'error' : ''}`}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
                {formErrors.email && <span className="error-message">{formErrors.email}</span>}
              </div>

              <div className="form-group">
                <label>Place (Optional)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.place}
                  onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                  placeholder="Enter place/city"
                />
              </div>

              <div className="form-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ name: '', mobile: '', email: '', place: '' });
                    setFormErrors({});
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAddCustomer}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

