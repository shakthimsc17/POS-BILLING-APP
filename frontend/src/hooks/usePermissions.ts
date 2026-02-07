import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { storageService } from '../services/storage';
import { Permission } from '../types';

interface PagePermission {
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_view_profit: boolean;
  is_hidden?: boolean;
}

export function usePermissions() {
  const { customer } = useAuthStore();
  const [permissions, setPermissions] = useState<Map<string, PagePermission>>(new Map());
  const [hiddenPages, setHiddenPages] = useState<Set<string>>(new Set()); // Track hidden pages for admin
  const [loading, setLoading] = useState(true);
  const [permissionsConfigured, setPermissionsConfigured] = useState(false); // Track if permissions have been explicitly configured

  useEffect(() => {
    loadPermissions();
  }, [customer?.customer_type]);

  const loadPermissions = async () => {
    if (!customer) {
      setPermissionsConfigured(false);
      setLoading(false);
      return;
    }

    // If customer_type is not set, allow default access
    if (!customer.customer_type) {
      setPermissionsConfigured(false); // No type = no restrictions configured
      setPermissions(new Map());
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // If user is admin, they have all permissions - but check for hidden pages
      if (customer.isAdmin) {
        const allPermissions = new Map<string, PagePermission>();
        // Admin has full access to all pages
        const pages = [
          'dashboard', 'cart', 'sales', 'sales-performance', 'cash-flow',
          'categories', 'items', 'quick-sale-items', 'customers', 'reports', 'export',
          'company', 'settings', 'activity-logs', 'bulk-operations', 'barcode-generator'
        ];
        pages.forEach(page => {
          allPermissions.set(page, {
            can_view: true,
            can_edit: true,
            can_delete: true,
            can_view_profit: true,
          });
        });
        setPermissions(allPermissions);
        
        // Load hidden pages for admin
        try {
          const adminPerms = await storageService.getPermissionsByType('Admin');
          const hidden = new Set<string>();
          adminPerms.forEach((perm: Permission) => {
            if (perm.is_hidden) {
              hidden.add(perm.page);
            }
          });
          setHiddenPages(hidden);
        } catch (error) {
          console.error('Error loading hidden pages for admin:', error);
          setHiddenPages(new Set());
        }
        
        setPermissionsConfigured(true); // Admin always has permissions configured
        setLoading(false);
        return;
      }

      // For non-admin users, fetch permissions from API
      try {
        const perms = await storageService.getPermissionsByType(customer.customer_type);
        const permMap = new Map<string, PagePermission>();
        
        perms.forEach((perm: Permission) => {
          permMap.set(perm.page, {
            can_view: perm.can_view,
            can_edit: perm.can_edit,
            can_delete: perm.can_delete,
            can_view_profit: perm.can_view_profit,
            is_hidden: perm.is_hidden,
          });
        });

        // If permissions array is empty, it means no ACL entries exist yet
        // Allow default access until admin configures permissions
        if (perms.length === 0) {
          console.log(`ℹ️ No permissions configured for ${customer.customer_type} - allowing default access`);
          setPermissions(new Map());
          setPermissionsConfigured(false); // No permissions configured - allow default access
        } else {
          setPermissions(permMap);
          setPermissionsConfigured(true); // Permissions have been explicitly configured
          console.log(`✅ Loaded ${permMap.size} permissions for ${customer.customer_type}`);
        }
      } catch (error: any) {
        // If API call fails (404 or other error), allow access by default (fail-open)
        // Admin can later restrict access via ACL Permissions page
        const status = error?.response?.status;
        const message = error?.message || '';
        if (status === 404 || message.includes('not found') || message.includes('404')) {
          console.log(`ℹ️ No permissions found for ${customer.customer_type} (404) - allowing default access`);
          setPermissions(new Map());
          setPermissionsConfigured(false); // No permissions configured - allow default access
        } else {
          console.error('Error loading permissions:', error);
          // On error, allow access by default to prevent blocking users
          setPermissions(new Map());
          setPermissionsConfigured(false);
        }
      }
    } catch (error) {
      console.error('Error in loadPermissions:', error);
      // Allow access by default on any error
      setPermissions(new Map());
    } finally {
      setLoading(false);
    }
  };

  const isHidden = (page: string): boolean => {
    if (!customer || !customer.isAdmin) return false;
    return hiddenPages.has(page);
  };

  const canView = (page: string): boolean => {
    if (!customer) return false;
    
    // Check if this is a new customer (created recently, no customer_type set)
    // For new customers, restrict to specific menu items only
    if (!customer.customer_type || customer.customer_type.trim() === '') {
      const allowedPagesForNewCustomer = [
        'dashboard', 'sales', 'cart', 'items', 'categories', 
        'quick-sale-items', 'quick-item-sales', 'bulk-operations', 
        'calculators', 'barcode-generator', 'settings'
      ];
      return allowedPagesForNewCustomer.includes(page);
    }
    
    // Admin has unlimited access to everything - but check if page is hidden
    if (customer.isAdmin) {
      return !isHidden(page);
    }
    
    // Allow access during loading to prevent blocking
    if (loading) return true;
    
    // If permissions haven't been configured yet (no ACL entries exist), allow default access
    // This allows users to work until admin configures restrictions
    if (!permissionsConfigured) return true;
    
    // If permissions are configured, check them strictly
    // If permissions map is empty but configured, deny access (admin removed all permissions)
    if (permissions.size === 0) return false;
    
    const perm = permissions.get(page);
    return perm?.can_view === true; // Strict check - must be explicitly true
  };

  const canEdit = (page: string): boolean => {
    if (!customer) return false;
    
    // Check if this is a new customer (no customer_type set)
    // For new customers, allow edit on allowed pages
    if (!customer.customer_type || customer.customer_type.trim() === '') {
      const allowedPagesForNewCustomer = [
        'dashboard', 'sales', 'cart', 'items', 'categories', 
        'quick-sale-items', 'quick-item-sales', 'bulk-operations', 
        'calculators', 'barcode-generator', 'settings'
      ];
      return allowedPagesForNewCustomer.includes(page);
    }
    
    if (customer.isAdmin) return true; // Admin can edit everything
    if (loading) return true; // Allow during loading
    if (!permissionsConfigured) return true; // Default allow if no permissions configured
    if (permissions.size === 0) return false; // If configured but empty, deny
    const perm = permissions.get(page);
    return perm?.can_view === true && perm?.can_edit === true; // Both must be true
  };

  const canDelete = (page: string): boolean => {
    if (!customer) return false;
    
    // Check if this is a new customer (no customer_type set)
    // For new customers, allow delete on allowed pages
    if (!customer.customer_type || customer.customer_type.trim() === '') {
      const allowedPagesForNewCustomer = [
        'dashboard', 'sales', 'cart', 'items', 'categories', 
        'quick-sale-items', 'quick-item-sales', 'bulk-operations', 
        'calculators', 'barcode-generator', 'settings'
      ];
      return allowedPagesForNewCustomer.includes(page);
    }
    
    if (customer.isAdmin) return true; // Admin can delete everything
    if (loading) return true; // Allow during loading
    if (!permissionsConfigured) return true; // Default allow if no permissions configured
    if (permissions.size === 0) return false; // If configured but empty, deny
    const perm = permissions.get(page);
    return perm?.can_view === true && perm?.can_delete === true; // Both must be true
  };

  const canViewProfit = (page: string): boolean => {
    if (!customer) return false;
    
    // Check if this is a new customer (no customer_type set)
    // For new customers, deny profit viewing by default for security
    if (!customer.customer_type || customer.customer_type.trim() === '') {
      return false; // New customers cannot view profit data
    }
    
    if (customer.isAdmin) return true; // Admin can view all profit data
    if (loading) return false; // Don't show profit during loading (more secure)
    // For profit, default to false (more restrictive) if no permissions configured
    // This ensures profit data is hidden by default until explicitly granted
    if (!permissionsConfigured) return false;
    if (permissions.size === 0) return false; // If configured but empty, deny
    const perm = permissions.get(page);
    return perm?.can_view === true && perm?.can_view_profit === true; // Both must be true
  };

  return {
    permissions,
    loading,
    canView,
    canEdit,
    canDelete,
    canViewProfit,
    isHidden,
    reloadPermissions: loadPermissions,
  };
}

