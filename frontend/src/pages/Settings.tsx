import { useState, useEffect } from 'react';
import { useCompanyStore } from '../store/companyStore';
import { storageService } from '../services/storage';
import { ItemCodePrefix, Settings as SettingsType } from '../types';
import './Settings.css';

export default function Settings() {
  const { company, loadCompany } = useCompanyStore();
  
  // Settings state
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Prefix management
  const [prefixes, setPrefixes] = useState<ItemCodePrefix[]>([]);
  const [showPrefixForm, setShowPrefixForm] = useState(false);
  const [prefixPrefix, setPrefixPrefix] = useState('');
  const [prefixDescription, setPrefixDescription] = useState('');
  const [editingPrefix, setEditingPrefix] = useState<ItemCodePrefix | null>(null);
  const [loadingPrefixes, setLoadingPrefixes] = useState(false);

  useEffect(() => {
    loadCompany();
    loadSettings();
    loadPrefixes();
  }, [loadCompany]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await storageService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (updates: Partial<SettingsType>) => {
    try {
      setSaving(true);
      const updated = await storageService.saveSettings(updates);
      setSettings(updated);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleActivityLogToggle = async (enabled: boolean) => {
    if (!settings) return;
    await saveSettings({ activity_log_enabled: enabled });
  };

  const handleItemLogActionsChange = async (value: 'all' | 'update_delete') => {
    if (!settings) return;
    await saveSettings({ item_log_actions: value });
  };

  const handleReceiptHeaderOptionChange = async (option: 'logo' | 'company_name' | 'both') => {
    if (!settings) return;
    await saveSettings({ receipt_header_option: option });
    // Clear receipt settings cache
    const { receiptSettings } = await import('../utils/receiptSettings');
    receiptSettings.clearCache();
  };

  const loadPrefixes = async () => {
    try {
      setLoadingPrefixes(true);
      const data = await storageService.getItemCodePrefixes();
      setPrefixes(data);
    } catch (error) {
      console.error('Error loading prefixes:', error);
    } finally {
      setLoadingPrefixes(false);
    }
  };

  const handleSavePrefix = async () => {
    if (!prefixPrefix.trim()) {
      alert('Prefix is required');
      return;
    }

    try {
      if (editingPrefix) {
        await storageService.updateItemCodePrefix(editingPrefix.id, {
          prefix: prefixPrefix.trim(),
          description: prefixDescription.trim() || undefined,
        });
      } else {
        await storageService.addItemCodePrefix({
          prefix: prefixPrefix.trim(),
          description: prefixDescription.trim() || undefined,
        });
      }
      await loadPrefixes();
      setShowPrefixForm(false);
      setPrefixPrefix('');
      setPrefixDescription('');
      setEditingPrefix(null);
    } catch (error: any) {
      alert(`Failed to save prefix: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEditPrefix = (prefix: ItemCodePrefix) => {
    setEditingPrefix(prefix);
    setPrefixPrefix(prefix.prefix);
    setPrefixDescription(prefix.description || '');
    setShowPrefixForm(true);
  };

  const handleDeletePrefix = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prefix?')) return;

    try {
      await storageService.deleteItemCodePrefix(id);
      await loadPrefixes();
    } catch (error: any) {
      alert(`Failed to delete prefix: ${error.message || 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="loading-state">
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="settings-page">
        <div className="loading-state">
          <p>Failed to load settings. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        {company.logo && (
          <div className="page-logo-container">
            <img 
              src={company.logo} 
              alt={company.name || 'Company Logo'} 
              className="page-logo"
            />
          </div>
        )}
        <div className="header-content">
          <h1>{company.logo ? '' : '⚙️ '}Settings</h1>
          <p className="subtitle">Configure application preferences and settings</p>
        </div>
      </div>

      <div className="settings-content">
        {/* Activity Log Settings */}
        <div className="card settings-card">
          <h2>📋 Activity Log Settings</h2>
          <div className="settings-table">
            <table>
              <thead>
                <tr>
                  <th>Setting</th>
                  <th>Value</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="setting-label">Enable Activity Log</td>
                  <td>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.activity_log_enabled}
                        onChange={(e) => handleActivityLogToggle(e.target.checked)}
                        disabled={saving}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td className="setting-description">
                    Track changes to items, categories, and transactions
                  </td>
                </tr>
                <tr>
                  <td className="setting-label">Item Log Actions</td>
                  <td>
                    <select
                      className="input"
                      value={settings.item_log_actions}
                      onChange={(e) => handleItemLogActionsChange(e.target.value as 'all' | 'update_delete')}
                      disabled={!settings.activity_log_enabled || saving}
                    >
                      <option value="update_delete">Update & Delete Only</option>
                      <option value="all">All Actions (Create, Update, Delete)</option>
                    </select>
                  </td>
                  <td className="setting-description">
                    {settings.item_log_actions === 'update_delete' 
                      ? 'Only log when items are updated or deleted (recommended)'
                      : 'Log all item actions including creation'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Receipt Settings */}
        <div className="card settings-card">
          <h2>🧾 Receipt Settings</h2>
          <div className="settings-table">
            <table>
              <thead>
                <tr>
                  <th>Setting</th>
                  <th>Value</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="setting-label">Receipt Header Display</td>
                  <td>
                    <div className="radio-group">
                      <label className="radio-option">
                        <input
                          type="radio"
                          name="receiptHeaderOption"
                          value="logo"
                          checked={settings.receipt_header_option === 'logo'}
                          onChange={() => handleReceiptHeaderOptionChange('logo')}
                          disabled={saving}
                        />
                        <span>Logo Only</span>
                      </label>
                      <label className="radio-option">
                        <input
                          type="radio"
                          name="receiptHeaderOption"
                          value="company_name"
                          checked={settings.receipt_header_option === 'company_name'}
                          onChange={() => handleReceiptHeaderOptionChange('company_name')}
                          disabled={saving}
                        />
                        <span>Company Name Only</span>
                      </label>
                      <label className="radio-option">
                        <input
                          type="radio"
                          name="receiptHeaderOption"
                          value="both"
                          checked={settings.receipt_header_option === 'both'}
                          onChange={() => handleReceiptHeaderOptionChange('both')}
                          disabled={saving}
                        />
                        <span>Both</span>
                      </label>
                    </div>
                  </td>
                  <td className="setting-description">
                    Controls how company information appears at the top of receipts
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Item Code Prefix Management */}
        <div className="card settings-card">
          <h2>🏷️ Item Code Prefixes</h2>
          <div className="prefix-section-header">
            <p className="section-description">Manage prefixes used for generating item codes</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setShowPrefixForm(!showPrefixForm);
                if (showPrefixForm) {
                  setEditingPrefix(null);
                  setPrefixPrefix('');
                  setPrefixDescription('');
                }
              }}
            >
              {showPrefixForm ? 'Cancel' : '+ Add Prefix'}
            </button>
          </div>

          {showPrefixForm && (
            <div className="prefix-form-container">
              <h3>{editingPrefix ? 'Edit' : 'Add'} Item Code Prefix</h3>
              <label>
                Prefix * (e.g., "shopname-place-"):
                <input
                  type="text"
                  className="input"
                  value={prefixPrefix}
                  onChange={(e) => setPrefixPrefix(e.target.value)}
                  placeholder="shopname-place-"
                />
              </label>
              <label>
                Description (optional):
                <input
                  type="text"
                  className="input"
                  value={prefixDescription}
                  onChange={(e) => setPrefixDescription(e.target.value)}
                  placeholder="Description for this prefix"
                />
              </label>
              <button className="btn btn-primary" onClick={handleSavePrefix}>
                {editingPrefix ? 'Update' : 'Save'} Prefix
              </button>
            </div>
          )}

          {loadingPrefixes ? (
            <p>Loading prefixes...</p>
          ) : prefixes.length === 0 ? (
            <div className="empty-state">
              <p>📭 No item code prefixes yet</p>
              <p className="empty-subtext">Add a prefix to get started</p>
            </div>
          ) : (
            <div className="settings-table">
              <table className="prefix-table">
                <thead>
                  <tr>
                    <th>Prefix</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prefixes.map((prefix) => (
                    <tr key={prefix.id}>
                      <td className="prefix-value">{prefix.prefix}</td>
                      <td>{prefix.description || '-'}</td>
                      <td className="prefix-actions">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEditPrefix(prefix)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDeletePrefix(prefix.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

