import { useState, useEffect } from 'react';
import { Customer } from '../types';
import { storageService } from '../services/storage';
import './Customers.css';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await storageService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      alert('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    resetForm();
    setModalVisible(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setEmail(customer.email || '');
    setPhone(customer.phone || '');
    setAddress(customer.address || '');
    setCity(customer.city || '');
    setState(customer.state || '');
    setPincode(customer.pincode || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter customer name');
      return;
    }

    try {
      if (editingCustomer) {
        await storageService.updateCustomer(editingCustomer.id, {
          name,
          email: email || undefined,
          phone: phone || undefined,
          address: address || undefined,
          city: city || undefined,
          state: state || undefined,
          pincode: pincode || undefined,
        });
      } else {
        await storageService.addCustomer({
          name,
          email: email || undefined,
          phone: phone || undefined,
          address: address || undefined,
          city: city || undefined,
          state: state || undefined,
          pincode: pincode || undefined,
        });
      }
      setModalVisible(false);
      resetForm();
      loadCustomers();
    } catch (error: any) {
      console.error('Error saving customer:', error);
      const errorMessage = error?.message || 'Failed to save customer';
      alert(`Failed to save customer: ${errorMessage}`);
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (confirm(`Are you sure you want to delete "${customer.name}"?`)) {
      try {
        await storageService.deleteCustomer(customer.id);
        loadCustomers();
      } catch (error: any) {
        alert(`Failed to delete customer: ${error?.message || 'Unknown error'}`);
      }
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setCity('');
    setState('');
    setPincode('');
  };

  if (loading) {
    return (
      <div className="customers">
        <div className="loading-state">
          <p>Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="customers">
      <div className="customers-header">
        <h1>👥 Customers</h1>
        <button className="btn btn-primary" onClick={handleAdd}>
          + Add Customer
        </button>
      </div>

      <div className="card">
        {customers.length > 0 ? (
          <div className="customers-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="customer-name">{customer.name}</td>
                    <td>{customer.phone || '-'}</td>
                    <td>{customer.email || '-'}</td>
                    <td>
                      {customer.address && (
                        <div className="customer-address">
                          {customer.address}
                          {customer.city && `, ${customer.city}`}
                          {customer.state && `, ${customer.state}`}
                          {customer.pincode && ` - ${customer.pincode}`}
                        </div>
                      )}
                      {!customer.address && '-'}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEdit(customer)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(customer)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>📭 No customers yet</p>
            <p className="empty-subtext">Add a customer to get started</p>
          </div>
        )}
      </div>

      {modalVisible && (
        <div className="modal-overlay" onClick={() => setModalVisible(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h2>
            <label>
              Name *:
              <input
                type="text"
                className="input"
                placeholder="Customer Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <div className="form-row">
              <label>
                Phone:
                <input
                  type="tel"
                  className="input"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
              <label>
                Email:
                <input
                  type="email"
                  className="input"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            </div>
            <label>
              Address:
              <textarea
                className="input"
                placeholder="Street Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
              />
            </label>
            <div className="form-row">
              <label>
                City:
                <input
                  type="text"
                  className="input"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </label>
              <label>
                State:
                <input
                  type="text"
                  className="input"
                  placeholder="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </label>
              <label>
                Pincode:
                <input
                  type="text"
                  className="input"
                  placeholder="Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                />
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModalVisible(false)}>
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

