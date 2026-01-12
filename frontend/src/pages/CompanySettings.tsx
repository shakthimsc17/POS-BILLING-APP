import { useState, useEffect } from 'react';
import { useCompanyStore } from '../store/companyStore';
import './CompanySettings.css';

export default function CompanySettings() {
  const { company, setCompany } = useCompanyStore();
  const [formData, setFormData] = useState(company);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFormData(company);
  }, [company]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setCompany(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setFormData(company);
    setSaved(false);
  };

  return (
    <div className="company-settings">
      <div className="company-settings-header">
        <h1>🏢 Company Details</h1>
        <p>Manage your company information that appears on bills and reports</p>
      </div>

      <div className="card">
        <div className="form-section">
          <h2>Basic Information</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>
                Company Name *
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter company name"
                  required
                />
              </label>
            </div>

            <div className="form-group full-width">
              <label>
                Address
                <input
                  type="text"
                  className="input"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Street address"
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                City
                <input
                  type="text"
                  className="input"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="City"
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                State
                <input
                  type="text"
                  className="input"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  placeholder="State"
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                Pincode
                <input
                  type="text"
                  className="input"
                  value={formData.pincode}
                  onChange={(e) => handleChange('pincode', e.target.value)}
                  placeholder="Pincode"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Contact Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>
                Phone *
                <input
                  type="tel"
                  className="input"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Phone number"
                  required
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                Email
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Email address"
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                Website
                <input
                  type="url"
                  className="input"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://example.com"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Tax Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>
                GSTIN
                <input
                  type="text"
                  className="input"
                  value={formData.gstin}
                  onChange={(e) => handleChange('gstin', e.target.value)}
                  placeholder="GSTIN number"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="form-actions">
          {saved && (
            <div className="success-message">
              ✅ Company details saved successfully!
            </div>
          )}
          <div className="action-buttons">
            <button className="btn btn-secondary" onClick={handleReset}>
              Reset
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="card preview-section">
        <h2>Preview</h2>
        <div className="company-preview">
          <div className="preview-header">
            <h3>{formData.name || 'Company Name'}</h3>
            {formData.address && <p>{formData.address}</p>}
            <p>
              {[formData.city, formData.state, formData.pincode]
                .filter(Boolean)
                .join(', ')}
            </p>
            {formData.phone && <p>Phone: {formData.phone}</p>}
            {formData.email && <p>Email: {formData.email}</p>}
            {formData.website && <p>Website: {formData.website}</p>}
            {formData.gstin && <p>GSTIN: {formData.gstin}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

