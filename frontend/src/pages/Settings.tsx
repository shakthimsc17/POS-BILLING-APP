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

  // Cloud Backup state
  const [backupConfigured, setBackupConfigured] = useState(false);
  const [backupMaskedUrl, setBackupMaskedUrl] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [lastSyncStatus, setLastSyncStatus] = useState<string | null>(null);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [showBackupForm, setShowBackupForm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [savingConnection, setSavingConnection] = useState(false);

  useEffect(() => {
    loadCompany();
    loadSettings();
    loadPrefixes();
    loadBackupStatus();
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

  const handleReceiptAutoPrintToggle = async (enabled: boolean) => {
    if (!settings) return;
    await saveSettings({ receipt_auto_print: enabled });
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

  // Cloud Backup functions
  const loadBackupStatus = async () => {
    try {
      const status = await storageService.getBackupStatus();
      setBackupConfigured(status.configured);
      setBackupMaskedUrl(status.maskedUrl);
      setLastSyncAt(status.lastSyncAt);
      setLastSyncStatus(status.lastSyncStatus);
    } catch (error) {
      console.error('Error loading backup status:', error);
    }
  };

  const handleSaveConnection = async () => {
    if (!supabaseUrl.trim()) {
      alert('Please enter a Supabase connection URL');
      return;
    }

    if (!supabaseUrl.startsWith('postgresql://') && !supabaseUrl.startsWith('postgres://')) {
      alert('Invalid connection URL. Must start with postgresql://');
      return;
    }

    try {
      setSavingConnection(true);
      const result = await storageService.saveBackupConnection(supabaseUrl);
      setBackupConfigured(true);
      setBackupMaskedUrl(result.maskedUrl);
      setSupabaseUrl('');
      setShowBackupForm(false);
      alert('Connection saved successfully!');
    } catch (error: any) {
      alert(`Failed to save connection: ${error.message || 'Unknown error'}`);
    } finally {
      setSavingConnection(false);
    }
  };

  const handleSyncNow = async () => {
    if (!confirm('This will sync your entire database to Supabase. Continue?')) return;

    try {
      setSyncing(true);
      const result = await storageService.syncToSupabase();
      setLastSyncAt(result.syncedAt);
      setLastSyncStatus('success');
      alert('Database synced successfully!');
    } catch (error: any) {
      setLastSyncStatus('failed');
      alert(`Sync failed: ${error.message || 'Unknown error'}`);
    } finally {
      setSyncing(false);
      loadBackupStatus();
    }
  };

  const handleRemoveConnection = async () => {
    if (!confirm('Remove cloud backup connection?')) return;

    try {
      await storageService.removeBackupConnection();
      setBackupConfigured(false);
      setBackupMaskedUrl(null);
      setLastSyncAt(null);
      setLastSyncStatus(null);
      alert('Connection removed');
    } catch (error: any) {
      alert(`Failed to remove connection: ${error.message || 'Unknown error'}`);
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
                <tr>
                  <td className="setting-label">Auto Print Receipts</td>
                  <td>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.receipt_auto_print !== undefined ? settings.receipt_auto_print : true}
                        onChange={(e) => handleReceiptAutoPrintToggle(e.target.checked)}
                        disabled={saving}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td className="setting-description">
                    <div>
                      <p style={{ marginBottom: '0.5rem' }}>Automatically print receipts after payment completion.</p>
                      <p style={{ fontSize: '0.85rem', color: '#e74c3c', fontWeight: '600', margin: 0 }}>
                        ⚠️ Browser security requires user interaction - print dialog will still appear.
                      </p>
                      <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem', marginBottom: 0 }}>
                        For true silent printing, use Chrome with <code>--kiosk-printing</code> flag. See PRINTER_SETUP.md.
                      </p>
                    </div>
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

        {/* Cloud Backup Settings */}
        <div className="card settings-card">
          <h2>☁️ Cloud Backup (Supabase)</h2>
          <p className="section-description">
            Sync your local database to a remote Supabase PostgreSQL for backup and recovery.
          </p>

          {backupConfigured ? (
            <div className="backup-status">
              <div className="settings-table">
                <table>
                  <tbody>
                    <tr>
                      <td className="setting-label">Connection</td>
                      <td>
                        <span className="backup-connected">✅ Connected</span>
                        <span className="backup-url">{backupMaskedUrl}</span>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={handleRemoveConnection}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="setting-label">Last Sync</td>
                      <td colSpan={2}>
                        {lastSyncAt ? (
                          <>
                            <span className={`sync-status ${lastSyncStatus}`}>
                              {lastSyncStatus === 'success' ? '✅' : lastSyncStatus === 'failed' ? '❌' : '⏳'}
                              {lastSyncStatus}
                            </span>
                            <span className="sync-time">
                              {new Date(lastSyncAt).toLocaleString()}
                            </span>
                          </>
                        ) : (
                          <span className="sync-never">Never synced</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="backup-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleSyncNow}
                  disabled={syncing}
                >
                  {syncing ? '🔄 Syncing...' : '🔄 Sync Now'}
                </button>
              </div>
            </div>
          ) : (
            <div className="backup-setup">
              {showBackupForm ? (
                <div className="backup-form">
                  <p className="form-help">
                    Enter your Supabase PostgreSQL connection string.<br />
                    Find it in Supabase Dashboard → Settings → Database → Connection String (URI).
                  </p>
                  <label>
                    Connection URL:
                    <input
                      type="password"
                      className="input"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      placeholder="postgresql://postgres:password@host:5432/postgres"
                    />
                  </label>
                  <div className="form-actions">
                    <button
                      className="btn btn-primary"
                      onClick={handleSaveConnection}
                      disabled={savingConnection}
                    >
                      {savingConnection ? 'Saving...' : 'Save Connection'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowBackupForm(false);
                        setSupabaseUrl('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>📭 No cloud backup configured</p>
                  <p className="empty-subtext">Connect to Supabase to enable daily backups</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowBackupForm(true)}
                  >
                    + Configure Backup
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

