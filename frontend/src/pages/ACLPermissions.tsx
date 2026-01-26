import { useState, useEffect } from 'react';
import { Permission, PagePermission } from '../types';
import { storageService } from '../services/storage';
import './ACLPermissions.css';

interface Page {
  id: string;
  label: string;
  category: string;
}

export default function ACLPermissions() {
  const [selectedCustomerType, setSelectedCustomerType] = useState<string>('sales person');
  const [pages, setPages] = useState<Page[]>([]);
  const [permissions, setPermissions] = useState<PagePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const customerTypes = ['sales person', 'manager', 'Admin'];

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    // Only load permissions after pages are loaded
    if (pages.length > 0) {
      loadPermissions();
    }
  }, [selectedCustomerType, pages.length]);

  const loadPages = async () => {
    try {
      const data = await storageService.getAvailablePages();
      setPages(data);
      // Expand all categories by default
      const categories = new Set(data.map((p: Page) => p.category));
      setExpandedCategories(categories);
    } catch (error) {
      console.error('Error loading pages:', error);
      alert('Failed to load pages');
    }
  };

  const loadPermissions = async () => {
    try {
      setLoading(true);
      
      // Get all pages first (use cached if available, otherwise fetch)
      let allPages = pages;
      if (allPages.length === 0) {
        allPages = await storageService.getAvailablePages();
        setPages(allPages);
        // Expand all categories by default
        const categories = new Set(allPages.map((p: Page) => p.category));
        setExpandedCategories(categories);
      }
      
      // Try to load existing permissions for this customer type
      let existingPermissions: Permission[] = [];
      try {
        existingPermissions = await storageService.getPermissionsByType(selectedCustomerType);
        console.log(`✅ Loaded ${existingPermissions.length} existing permissions for "${selectedCustomerType}"`);
      } catch (error: any) {
        // If no permissions exist yet (404 or empty), that's okay - we'll use defaults
        const status = error?.response?.status;
        const message = error?.message || '';
        if (status === 404 || message.includes('not found') || message.includes('404')) {
          console.log(`ℹ️ No existing permissions found for "${selectedCustomerType}" - using defaults`);
        } else {
          console.warn('Error loading permissions:', error);
        }
        // Continue with empty permissions array - will use defaults
      }
      
      // Create a map of existing permissions for quick lookup
      const pageMap = new Map(existingPermissions.map(p => [p.page, p]));
      
      // Create permission entries for all pages, using existing values if available
      const pagePermissions: PagePermission[] = allPages.map((page: Page) => {
        const existing = pageMap.get(page.id);
        return {
          page: page.id,
          label: page.label,
          can_view: existing?.can_view ?? false,
          can_edit: existing?.can_edit ?? false,
          can_delete: existing?.can_delete ?? false,
          can_view_profit: existing?.can_view_profit ?? false,
          is_hidden: existing?.is_hidden ?? false,
        };
      });

      setPermissions(pagePermissions);
      const viewCount = pagePermissions.filter(p => p.can_view).length;
      console.log(`✅ Permissions prepopulated for "${selectedCustomerType}": ${viewCount} pages with view access`);
    } catch (error) {
      console.error('Error loading permissions:', error);
      const errorMessage = (error as any)?.response?.data?.error || (error as any)?.message || '';
      if (!errorMessage.includes('not found') && !errorMessage.includes('404')) {
        alert('Failed to load permissions');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (pageId: string, field: keyof PagePermission, value: boolean) => {
    setPermissions(prev => prev.map(p => {
      if (p.page === pageId) {
        const updated = { ...p, [field]: value };
        // If can_view is false, disable other permissions
        if (field === 'can_view' && !value) {
          updated.can_edit = false;
          updated.can_delete = false;
          updated.can_view_profit = false;
        }
        return updated;
      }
      return p;
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Filter out permissions that don't have a valid page
      const validPermissions = permissions.filter(p => p.page && p.page.trim() !== '');
      if (validPermissions.length === 0) {
        alert('No valid permissions to save');
        return;
      }
      await storageService.savePermissions(selectedCustomerType, validPermissions);
      alert('Permissions saved successfully!');
      // Reload permissions to reflect changes
      await loadPermissions();
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Unknown error';
      alert(`Failed to save permissions: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const groupedPages = pages.reduce((acc, page) => {
    if (!acc[page.category]) {
      acc[page.category] = [];
    }
    acc[page.category].push(page);
    return acc;
  }, {} as Record<string, Page[]>);

  if (loading) {
    return (
      <div className="acl-permissions">
        <div className="loading-state">
          <p>Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="acl-permissions">
      <div className="acl-header">
        <h1>🔐 Access Control List (ACL) Permissions</h1>
        <div className="customer-type-selector">
          <label>Customer Type:</label>
          <select
            className="input"
            value={selectedCustomerType}
            onChange={(e) => setSelectedCustomerType(e.target.value)}
          >
            {customerTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="permissions-tree">
          {Object.entries(groupedPages).map(([category, categoryPages]) => (
            <div key={category} className="permission-category">
              <div
                className="category-header"
                onClick={() => toggleCategory(category)}
              >
                <span className="category-icon">
                  {expandedCategories.has(category) ? '▼' : '▶'}
                </span>
                <span className="category-name">{category}</span>
              </div>
              {expandedCategories.has(category) && (
                <div className="category-pages">
                  {categoryPages.map((page) => {
                    const permission = permissions.find(p => p.page === page.id);
                    if (!permission) return null;

                    return (
                      <div key={page.id} className="permission-item">
                        <div className="permission-page-info">
                          <span className="page-name">{page.label}</span>
                        </div>
                        <div className="permission-checkboxes">
                          <label className="permission-checkbox">
                            <input
                              type="checkbox"
                              checked={permission.can_view}
                              onChange={(e) => handlePermissionChange(page.id, 'can_view', e.target.checked)}
                            />
                            <span>View</span>
                          </label>
                          <label className="permission-checkbox">
                            <input
                              type="checkbox"
                              checked={permission.can_edit}
                              onChange={(e) => handlePermissionChange(page.id, 'can_edit', e.target.checked)}
                              disabled={!permission.can_view}
                            />
                            <span>Edit</span>
                          </label>
                          <label className="permission-checkbox">
                            <input
                              type="checkbox"
                              checked={permission.can_delete}
                              onChange={(e) => handlePermissionChange(page.id, 'can_delete', e.target.checked)}
                              disabled={!permission.can_view}
                            />
                            <span>Delete</span>
                          </label>
                          <label className="permission-checkbox">
                            <input
                              type="checkbox"
                              checked={permission.can_view_profit}
                              onChange={(e) => handlePermissionChange(page.id, 'can_view_profit', e.target.checked)}
                              disabled={!permission.can_view}
                            />
                            <span>View Profit</span>
                          </label>
                          {selectedCustomerType === 'Admin' && (
                            <label className="permission-checkbox" title="Hide this page from admin navigation">
                              <input
                                type="checkbox"
                                checked={permission.is_hidden ?? false}
                                onChange={(e) => handlePermissionChange(page.id, 'is_hidden', e.target.checked)}
                              />
                              <span>Hide</span>
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="permissions-actions">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </div>
    </div>
  );
}

