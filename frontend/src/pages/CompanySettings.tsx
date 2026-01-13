import { useState, useEffect } from 'react';
import { useCompanyStore } from '../store/companyStore';
import './CompanySettings.css';

export default function CompanySettings() {
  const { company, loading, error, loadCompany, saveCompany } = useCompanyStore();
  const [formData, setFormData] = useState(company);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  useEffect(() => {
    if (company) {
      setFormData(company);
    }
  }, [company]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveCompany(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving company:', error);
      alert('Failed to save company details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(company);
    setSaved(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setFormData((prev) => ({ ...prev, logo: base64String }));
      setSaved(false);
    };
    reader.onerror = () => {
      alert('Error reading image file');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logo: '' }));
    setSaved(false);
  };

  if (loading && !company.name) {
    return (
      <div className="company-settings">
        <div className="loading-state">
          <p>Loading company details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="company-settings">
      <div className="company-settings-header">
        <h1>🏢 Company Details</h1>
        <p>Manage your company information that appears on bills and reports</p>
      </div>

      {error && (
        <div className="card error-message">
          <p>❌ Error: {error}</p>
        </div>
      )}

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

        <div className="form-section">
          <h2>Company Logo</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>
                Logo Image
                <div className="logo-upload-section">
                  {formData.logo ? (
                    <div className="logo-preview-container">
                      <img 
                        src={formData.logo} 
                        alt="Company Logo" 
                        className="logo-preview"
                      />
                      <div className="logo-actions">
                        <label className="btn btn-secondary btn-sm">
                          Change Logo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={handleRemoveLogo}
                        >
                          Remove Logo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="logo-upload-placeholder">
                      <label className="logo-upload-button">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          style={{ display: 'none' }}
                        />
                        <span>📷 Upload Logo</span>
                        <small>Recommended: Square image, max 2MB</small>
                      </label>
                    </div>
                  )}
                </div>
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
            <button className="btn btn-secondary" onClick={handleReset} disabled={saving}>
              Reset
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="card preview-section">
        <h2>Preview</h2>
        <div className="company-preview">
          <div className="preview-header">
            {formData.logo && (
              <div className="preview-logo-container">
                <img 
                  src={formData.logo} 
                  alt="Company Logo" 
                  className="preview-logo"
                />
              </div>
            )}
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

