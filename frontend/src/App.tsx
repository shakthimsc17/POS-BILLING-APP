import { useState, useEffect } from 'react';
import { useInventoryStore } from './store/inventoryStore';
import { useAuthStore } from './store/authStore';
import { useCartStore } from './store/cartStore';
import { usePermissions } from './hooks/usePermissions';
import Dashboard from './pages/Dashboard';
import Cart from './pages/Cart';
import Categories from './pages/Categories';
import Items from './pages/Items';
import SalesOrders from './pages/SalesOrders';
import Customers from './pages/Customers';
import Import from './pages/Import';
import Reports from './pages/Reports';
import Calculators from './pages/Calculators';
import CompanySettings from './pages/CompanySettings';
import Settings from './pages/Settings';
import ActivityLogs from './pages/ActivityLogs';
import BulkOperations from './pages/BulkOperations';
import QuickSaleItems from './pages/QuickSaleItems';
import CashFlow from './pages/CashFlow';
import SalesPerformance from './pages/SalesPerformance';
import ACLPermissions from './pages/ACLPermissions';
import AccessDenied from './components/AccessDenied';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import { useCompanyStore } from './store/companyStore';
import './App.css';

type Page = 'dashboard' | 'cart' | 'categories' | 'items' | 'sales' | 'sales-performance' | 'customers' | 'import' | 'reports' | 'calculators' | 'company' | 'settings' | 'activity-logs' | 'bulk-operations' | 'quick-sale-items' | 'cash-flow' | 'acl-permissions';
type AuthPage = 'signin' | 'signup';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [authPage, setAuthPage] = useState<AuthPage>('signin');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { loadCategories, loadItems } = useInventoryStore();
  const { customer, initialized, initialize, signOut } = useAuthStore();
  const { items: cartItems } = useCartStore();
  const { company, loadCompany } = useCompanyStore();
  const { canView, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (initialized && customer) {
      loadCategories();
      loadItems();
      // Load company data from database
      loadCompany();
    }
  }, [initialized, customer, loadCategories, loadItems, loadCompany]);

  // Redirect to dashboard if trying to access a page without permission
  // Only redirect if permissions are loaded and user doesn't have access
  useEffect(() => {
    if (customer && !permissionsLoading && !customer.isAdmin && !canView(currentPage)) {
      console.log(`Access denied to ${currentPage} - redirecting to dashboard`);
      setCurrentPage('dashboard');
    }
  }, [currentPage, canView, customer, permissionsLoading]);

  // Show auth pages if not signed in
  if (!initialized || permissionsLoading) {
    return (
      <div className="app">
        <div className="loading-state">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="app">
        {authPage === 'signin' && <SignIn onNavigate={setAuthPage} />}
        {authPage === 'signup' && <SignUp onNavigate={setAuthPage} />}
      </div>
    );
  }

  return (
    <div className="app">
      <div 
        className="sidebar-trigger"
        onMouseEnter={() => setSidebarOpen(true)}
      />
      <aside 
        className={`sidebar ${sidebarOpen ? 'open' : ''}`}
        onMouseLeave={() => setSidebarOpen(false)}
        onMouseEnter={() => setSidebarOpen(true)}
      >
        <div className="sidebar-header">
          {company.logo && (
            <div className="sidebar-logo-container">
              <img 
                src={company.logo} 
                alt={company.name || 'Company Logo'} 
                className="sidebar-logo"
              />
            </div>
          )}
          <h1>{company.logo ? '' : '🛒 '}{company.name || 'POS System'}</h1>
          {company.phone && <p className="company-phone">{company.phone}</p>}
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-label">Main</div>
            {canView('dashboard') && (
              <button
                className={currentPage === 'dashboard' ? 'active' : ''}
                onClick={() => setCurrentPage('dashboard')}
              >
                <span className="nav-icon">🏠</span>
                <span className="nav-text">Dashboard</span>
              </button>
            )}
            {canView('cart') && (
              <button
                className={currentPage === 'cart' ? 'active' : ''}
                onClick={() => setCurrentPage('cart')}
              >
                <span className="nav-icon">🛒</span>
                <span className="nav-text">Cart</span>
              </button>
            )}
            {canView('sales') && (
              <button
                className={currentPage === 'sales' ? 'active' : ''}
                onClick={() => setCurrentPage('sales')}
              >
                <span className="nav-icon">💼</span>
                <span className="nav-text">Sales</span>
              </button>
            )}
            {canView('sales-performance') && (
              <button
                className={currentPage === 'sales-performance' ? 'active' : ''}
                onClick={() => setCurrentPage('sales-performance')}
              >
                <span className="nav-icon">📊</span>
                <span className="nav-text">Sales Performance</span>
              </button>
            )}
            {canView('cash-flow') && (
              <button
                className={currentPage === 'cash-flow' ? 'active' : ''}
                onClick={() => setCurrentPage('cash-flow')}
              >
                <span className="nav-icon">💰</span>
                <span className="nav-text">Cash Flow</span>
              </button>
            )}
          </div>

          <div className="nav-section">
            <div className="nav-section-label">Inventory</div>
            {canView('items') && (
              <button
                className={currentPage === 'items' ? 'active' : ''}
                onClick={() => setCurrentPage('items')}
              >
                <span className="nav-icon">📦</span>
                <span className="nav-text">Items</span>
              </button>
            )}
            {canView('categories') && (
              <button
                className={currentPage === 'categories' ? 'active' : ''}
                onClick={() => setCurrentPage('categories')}
              >
                <span className="nav-icon">📁</span>
                <span className="nav-text">Categories</span>
              </button>
            )}
            {canView('import') && (
              <button
                className={currentPage === 'import' ? 'active' : ''}
                onClick={() => setCurrentPage('import')}
              >
                <span className="nav-icon">📥</span>
                <span className="nav-text">Import</span>
              </button>
            )}
            {canView('quick-sale-items') && (
              <button
                className={currentPage === 'quick-sale-items' ? 'active' : ''}
                onClick={() => setCurrentPage('quick-sale-items')}
              >
                <span className="nav-icon">⚡</span>
                <span className="nav-text">Quick Sale Items</span>
              </button>
            )}
          </div>

          {(customer?.isAdmin || canView('customers') || canView('reports') || canView('activity-logs')) && (
            <div className="nav-section">
              <div className="nav-section-label">Admin</div>
              {(customer?.isAdmin || canView('customers')) && (
                <button
                  className={currentPage === 'customers' ? 'active' : ''}
                  onClick={() => setCurrentPage('customers')}
                >
                  <span className="nav-icon">👥</span>
                  <span className="nav-text">Customers</span>
                </button>
              )}
              {(customer?.isAdmin || canView('reports')) && (
                <button
                  className={currentPage === 'reports' ? 'active' : ''}
                  onClick={() => setCurrentPage('reports')}
                >
                  <span className="nav-icon">📊</span>
                  <span className="nav-text">Reports</span>
                </button>
              )}
              {(customer?.isAdmin || canView('activity-logs')) && (
                <button
                  className={currentPage === 'activity-logs' ? 'active' : ''}
                  onClick={() => setCurrentPage('activity-logs')}
                >
                  <span className="nav-icon">📋</span>
                  <span className="nav-text">Activity Logs</span>
                </button>
              )}
            </div>
          )}

          <div className="nav-section">
            <div className="nav-section-label">Tools</div>
            {canView('bulk-operations') && (
              <button
                className={currentPage === 'bulk-operations' ? 'active' : ''}
                onClick={() => setCurrentPage('bulk-operations')}
              >
                <span className="nav-icon">⚡</span>
                <span className="nav-text">Bulk Operations</span>
              </button>
            )}
            {canView('calculators') && (
              <button
                className={currentPage === 'calculators' ? 'active' : ''}
                onClick={() => setCurrentPage('calculators')}
              >
                <span className="nav-icon">🧮</span>
                <span className="nav-text">Calculators</span>
              </button>
            )}
            {canView('company') && (
              <button
                className={currentPage === 'company' ? 'active' : ''}
                onClick={() => setCurrentPage('company')}
              >
                <span className="nav-icon">🏢</span>
                <span className="nav-text">Company</span>
              </button>
            )}
            {canView('settings') && (
              <button
                className={currentPage === 'settings' ? 'active' : ''}
                onClick={() => setCurrentPage('settings')}
              >
                <span className="nav-icon">⚙️</span>
                <span className="nav-text">Settings</span>
              </button>
            )}
            {customer?.isAdmin && (
              <button
                className={currentPage === 'acl-permissions' ? 'active' : ''}
                onClick={() => setCurrentPage('acl-permissions')}
              >
                <span className="nav-icon">🔐</span>
                <span className="nav-text">ACL Permissions</span>
              </button>
            )}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-email">{customer.email || customer.name}</span>
          </div>
          <button className="btn btn-secondary btn-sm btn-block" onClick={signOut}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="page-content-wrapper">
          {currentPage === 'dashboard' && (canView('dashboard') ? <Dashboard onNavigate={setCurrentPage} /> : <AccessDenied />)}
          {currentPage === 'cart' && (canView('cart') ? <Cart onNavigate={setCurrentPage} /> : <AccessDenied />)}
          {currentPage === 'categories' && (canView('categories') ? <Categories onNavigate={setCurrentPage} /> : <AccessDenied />)}
          {currentPage === 'items' && (canView('items') ? <Items onNavigate={setCurrentPage} /> : <AccessDenied />)}
          {currentPage === 'sales' && (canView('sales') ? <SalesOrders /> : <AccessDenied />)}
          {currentPage === 'sales-performance' && (canView('sales-performance') ? <SalesPerformance /> : <AccessDenied />)}
          {currentPage === 'cash-flow' && (canView('cash-flow') ? <CashFlow /> : <AccessDenied />)}
          {currentPage === 'customers' && ((customer?.isAdmin || canView('customers')) ? <Customers /> : <AccessDenied />)}
          {currentPage === 'import' && (canView('import') ? <Import /> : <AccessDenied />)}
          {currentPage === 'quick-sale-items' && (canView('quick-sale-items') ? <QuickSaleItems /> : <AccessDenied />)}
          {currentPage === 'reports' && ((customer?.isAdmin || canView('reports')) ? <Reports /> : <AccessDenied />)}
          {currentPage === 'activity-logs' && ((customer?.isAdmin || canView('activity-logs')) ? <ActivityLogs /> : <AccessDenied />)}
          {currentPage === 'bulk-operations' && (canView('bulk-operations') ? <BulkOperations /> : <AccessDenied />)}
          {currentPage === 'calculators' && (canView('calculators') ? <Calculators /> : <AccessDenied />)}
          {currentPage === 'company' && (canView('company') ? <CompanySettings /> : <AccessDenied />)}
          {currentPage === 'settings' && (canView('settings') ? <Settings /> : <AccessDenied />)}
          {currentPage === 'acl-permissions' && customer?.isAdmin && <ACLPermissions />}
        </div>

        {/* Show footer for all pages except dashboard and sales-related pages */}
        {!['dashboard', 'cart', 'sales', 'quick-sale-items'].includes(currentPage) && (
          <footer className="page-footer">
            <div className="footer-content">
              <p className="footer-text">Powered by <strong>SSS Soft Solution</strong></p>
            </div>
          </footer>
        )}
      </main>
    </div>
  );
}

export default App;

