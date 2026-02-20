import { useState, useEffect } from 'react';
import { useCompanyStore } from '../store/companyStore';
import './CompanySettings.css';

export default function CompanySettings() {
  const { company, loading, error, loadCompany, saveCompany } = useCompanyStore();
  const [formData, setFormData] = useState({
    name: 'My Store',
    nameTamil: '',
    address: '',
    addressTamil: '',
    city: '',
    cityTamil: '',
    state: '',
    stateTamil: '',
    pincode: '',
    phone: '',
    email: '',
    gstin: '',
    website: '',
    logo: '',
    business_type: '' as 'clothing' | 'cafe' | 'electrical' | '',
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load company data from database on mount
    loadCompany();
  }, [loadCompany]);

  useEffect(() => {
    // Update form data when company data is loaded from database
    if (company && !loading) {
      console.log('Company data updated in form:', {
        id: company.id,
        customer_id: company.customer_id,
        name: company.name,
        address: company.address,
        phone: company.phone,
        email: company.email,
        hasLogo: !!company.logo,
        logoLength: company.logo ? company.logo.length : 0,
      });
      setFormData({
        name: company.name || 'My Store',
        nameTamil: company.nameTamil || '',
        address: company.address || '',
        addressTamil: company.addressTamil || '',
        city: company.city || '',
        cityTamil: company.cityTamil || '',
        state: company.state || '',
        stateTamil: company.stateTamil || '',
        pincode: company.pincode || '',
        phone: company.phone || '',
        email: company.email || '',
        gstin: company.gstin || '',
        website: company.website || '',
        logo: company.logo || '',
        business_type: (company.business_type as 'clothing' | 'cafe' | 'electrical') || '',
      });
    }
  }, [company, loading]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Prepare data to save - exclude id, customer_id, created_at, updated_at
      const dataToSave = {
        name: formData.name || 'My Store',
        nameTamil: formData.nameTamil || '',
        address: formData.address || '',
        addressTamil: formData.addressTamil || '',
        city: formData.city || '',
        cityTamil: formData.cityTamil || '',
        state: formData.state || '',
        stateTamil: formData.stateTamil || '',
        pincode: formData.pincode || '',
        phone: formData.phone || '',
        email: formData.email || '',
        gstin: formData.gstin || '',
        website: formData.website || '',
        logo: formData.logo || '',
        business_type: formData.business_type || null,
      };
      console.log('Saving company data:', dataToSave);
      const saved = await saveCompany(dataToSave);
      console.log('Company saved successfully:', saved);
      // Reload company data after save
      await loadCompany();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving company:', error);
      alert(`Failed to save company details: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: company.name || 'My Store',
      nameTamil: company.nameTamil || '',
      address: company.address || '',
      addressTamil: company.addressTamil || '',
      city: company.city || '',
      cityTamil: company.cityTamil || '',
      state: company.state || '',
      stateTamil: company.stateTamil || '',
      pincode: company.pincode || '',
      phone: company.phone || '',
      email: company.email || '',
      gstin: company.gstin || '',
      website: company.website || '',
      logo: company.logo || '',
      business_type: (company.business_type as 'clothing' | 'cafe' | 'electrical') || '',
    });
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

  if (loading && (!company.name || company.name === 'My Store')) {
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

      <div className="company-settings-content">
        <div className="company-form-cards">
          {/* Card 1: Company Information */}
          <div className="card form-card">
            <h2>Company Information</h2>
            <div className="form-fields">
              <div className="form-group">
                <label>
                  Company Name *
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Company name"
                    required
                  />
                </label>
              </div>

              <div className="form-group">
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

          {/* Card 2: Contact Information */}
          <div className="card form-card">
            <h2>Contact Information</h2>
            <div className="form-fields">
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

          {/* Card 3: Tax Information & Logo */}
          <div className="card form-card">
            <h2>Tax Information & Logo</h2>
            <div className="form-fields">
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

              <div className="form-group">
                <label>
                  Business Type
                  <select
                    className="input"
                    value={formData.business_type}
                    onChange={(e) => handleChange('business_type', e.target.value)}
                  >
                    <option value="">Select Business Type</option>
                    <option value="clothing">Clothing</option>
                    <option value="cafe">Cafe</option>
                    <option value="electrical">Electrical</option>
                  </select>
                </label>
              </div>

              <div className="form-group">
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
        </div>

        {/* Card 4: Tamil Settings */}
        <div className="card form-card">
          <h2>தமிழ் அமைப்புகள் (Tamil Settings)</h2>
          <div className="form-fields">
            <div className="form-group">
              <label>
                நிறுவனத்தின் பெயர் (Company Name in Tamil)
                <input
                  type="text"
                  className="input"
                  value={formData.nameTamil}
                  onChange={(e) => handleChange('nameTamil', e.target.value)}
                  placeholder="நிறுவனத்தின் பெயரை தமிழில் உள்ளிடவும்"
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                முகவரி (Address in Tamil)
                <input
                  type="text"
                  className="input"
                  value={formData.addressTamil}
                  onChange={(e) => handleChange('addressTamil', e.target.value)}
                  placeholder="முகவரியை தமிழில் உள்ளிடவும்"
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                நகரம் (City in Tamil)
                <input
                  type="text"
                  className="input"
                  value={formData.cityTamil}
                  onChange={(e) => handleChange('cityTamil', e.target.value)}
                  placeholder="நகரத்தின் பெயரை தமிழில் உள்ளிடவும்"
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                மாநிலம் (State in Tamil)
                <input
                  type="text"
                  className="input"
                  value={formData.stateTamil}
                  onChange={(e) => handleChange('stateTamil', e.target.value)}
                  placeholder="மாநிலத்தின் பெயரை தமிழில் உள்ளிடவும்"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="card form-actions-card">
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

        {/* Preview Section */}
        <div className="card preview-section">
          <h2>Preview</h2>
          <div className="company-preview" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {/* English Preview */}
            <div style={{ flex: 1, minWidth: '250px' }}>
              <h4 style={{ marginBottom: '0.5rem', color: '#555' }}>🇬🇧 English</h4>
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

            {/* Tamil Preview */}
            {(formData.nameTamil || formData.addressTamil || formData.cityTamil || formData.stateTamil) && (
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h4 style={{ marginBottom: '0.5rem', color: '#555' }}>🇮🇳 தமிழ்</h4>
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
                  <h3>{formData.nameTamil || formData.name || 'நிறுவனத்தின் பெயர்'}</h3>
                  {(formData.addressTamil || formData.address) && <p>{formData.addressTamil || formData.address}</p>}
                  <p>
                    {[formData.cityTamil || formData.city, formData.stateTamil || formData.state, formData.pincode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  {formData.phone && <p>Phone: {formData.phone}</p>}
                  {formData.email && <p>Email: {formData.email}</p>}
                  {formData.website && <p>Website: {formData.website}</p>}
                  {formData.gstin && <p>GSTIN: {formData.gstin}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

