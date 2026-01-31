import { useState, useEffect, lazy, Suspense } from 'react';
import { useInventoryStore } from './store/inventoryStore';
import { useAuthStore } from './store/authStore';
import { useCartStore } from './store/cartStore';
import { usePermissions } from './hooks/usePermissions';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import AccessDenied from './components/AccessDenied';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import { useCompanyStore } from './store/companyStore';
import './App.css';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Cart = lazy(() => import('./pages/Cart'));
const Categories = lazy(() => import('./pages/Categories'));
const Items = lazy(() => import('./pages/Items'));
const SalesOrders = lazy(() => import('./pages/SalesOrders'));
const Customers = lazy(() => import('./pages/Customers'));
const Import = lazy(() => import('./pages/Import'));
const Reports = lazy(() => import('./pages/Reports'));
const Export = lazy(() => import('./pages/Export'));
const Calculators = lazy(() => import('./pages/Calculators'));
const CompanySettings = lazy(() => import('./pages/CompanySettings'));
const Settings = lazy(() => import('./pages/Settings'));
const ActivityLogs = lazy(() => import('./pages/ActivityLogs'));
const BulkOperations = lazy(() => import('./pages/BulkOperations'));
const QuickSaleItems = lazy(() => import('./pages/QuickSaleItems'));
const QuickItemSales = lazy(() => import('./pages/QuickItemSales'));
const CashFlow = lazy(() => import('./pages/CashFlow'));
const SalesPerformance = lazy(() => import('./pages/SalesPerformance'));
const ACLPermissions = lazy(() => import('./pages/ACLPermissions'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));
const Tables = lazy(() => import('./pages/Tables'));
const TableOrders = lazy(() => import('./pages/TableOrders'));

type Page = 'dashboard' | 'cart' | 'categories' | 'items' | 'sales' | 'sales-performance' | 'customers' | 'import' | 'reports' | 'export' | 'calculators' | 'company' | 'settings' | 'activity-logs' | 'bulk-operations' | 'quick-sale-items' | 'quick-item-sales' | 'cash-flow' | 'acl-permissions' | 'order-details' | 'tables' | 'table-orders';
type AuthPage = 'signin' | 'signup';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [authPage, setAuthPage] = useState<AuthPage>('signin');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { loadCategories, loadItems } = useInventoryStore();
  const { customer, initialized, initialize, signOut } = useAuthStore();
  const { company, loadCompany } = useCompanyStore();
  const { canView, isHidden, loading: permissionsLoading } = usePermissions();

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

  // Redirect to dashboard if trying to access a page without permission or if page is hidden
  // Only redirect if permissions are loaded and user doesn't have access
  useEffect(() => {
    if (customer && !permissionsLoading) {
      // For admin users, check if page is hidden
      if (customer.isAdmin && isHidden(currentPage)) {
        console.log(`Page ${currentPage} is hidden - redirecting to dashboard`);
        setCurrentPage('dashboard');
        return;
      }
      // For non-admin users, check if they have view permission
      if (!customer.isAdmin && !canView(currentPage)) {
        console.log(`Access denied to ${currentPage} - redirecting to dashboard`);
        setCurrentPage('dashboard');
      }
    }
  }, [currentPage, canView, isHidden, customer, permissionsLoading]);

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
    <ErrorBoundary>
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
            {canView('dashboard') && !isHidden('dashboard') && (
            <button
              className={currentPage === 'dashboard' ? 'active' : ''}
              onClick={() => setCurrentPage('dashboard')}
            >
              <span className="nav-icon">🏠</span>
              <span className="nav-text">Dashboard</span>
            </button>
            )}
            {canView('cart') && !isHidden('cart') && (
            <button
              className={currentPage === 'cart' ? 'active' : ''}
              onClick={() => setCurrentPage('cart')}
            >
              <span className="nav-icon">🛒</span>
              <span className="nav-text">Cart</span>
            </button>
            )}
            {canView('sales') && !isHidden('sales') && (
            <button
              className={currentPage === 'sales' ? 'active' : ''}
              onClick={() => setCurrentPage('sales')}
            >
              <span className="nav-icon">💼</span>
              <span className="nav-text">Sales</span>
            </button>
            )}
            {canView('sales-performance') && !isHidden('sales-performance') && (
              <button
                className={currentPage === 'sales-performance' ? 'active' : ''}
                onClick={() => setCurrentPage('sales-performance')}
              >
                <span className="nav-icon">📊</span>
                <span className="nav-text">Sales Performance</span>
              </button>
            )}
            {canView('cash-flow') && !isHidden('cash-flow') && (
              <button
                className={currentPage === 'cash-flow' ? 'active' : ''}
                onClick={() => setCurrentPage('cash-flow')}
              >
                <span className="nav-icon">💰</span>
                <span className="nav-text">Cash Flow</span>
              </button>
            )}
          </div>

          {company.business_type === 'cafe' && (
            <div className="nav-section">
              <div className="nav-section-label">Cafe</div>
              <button
                className={currentPage === 'tables' ? 'active' : ''}
                onClick={() => setCurrentPage('tables')}
              >
                <span className="nav-icon">🪑</span>
                <span className="nav-text">Tables</span>
              </button>
              <button
                className={currentPage === 'table-orders' ? 'active' : ''}
                onClick={() => setCurrentPage('table-orders')}
              >
                <span className="nav-icon">📋</span>
                <span className="nav-text">Table Orders</span>
              </button>
            </div>
          )}

          <div className="nav-section">
            <div className="nav-section-label">Inventory</div>
            {canView('items') && !isHidden('items') && (
            <button
              className={currentPage === 'items' ? 'active' : ''}
              onClick={() => setCurrentPage('items')}
            >
              <span className="nav-icon">📦</span>
              <span className="nav-text">Items</span>
            </button>
            )}
            {canView('categories') && !isHidden('categories') && (
            <button
              className={currentPage === 'categories' ? 'active' : ''}
              onClick={() => setCurrentPage('categories')}
            >
              <span className="nav-icon">📁</span>
              <span className="nav-text">Categories</span>
            </button>
            )}
            {canView('import') && !isHidden('import') && (
            <button
              className={currentPage === 'import' ? 'active' : ''}
              onClick={() => setCurrentPage('import')}
            >
              <span className="nav-icon">📥</span>
              <span className="nav-text">Import</span>
            </button>
            )}
            {canView('quick-sale-items') && !isHidden('quick-sale-items') && (
              <button
                className={currentPage === 'quick-sale-items' ? 'active' : ''}
                onClick={() => setCurrentPage('quick-sale-items')}
              >
                <span className="nav-icon">⚡</span>
                <span className="nav-text">Quick Sale Items</span>
              </button>
            )}
            {canView('quick-item-sales') && !isHidden('quick-item-sales') && (
              <button
                className={currentPage === 'quick-item-sales' ? 'active' : ''}
                onClick={() => setCurrentPage('quick-item-sales')}
              >
                <span className="nav-icon">🔢</span>
                <span className="nav-text">Quick Item Sales</span>
              </button>
            )}
          </div>

          {(customer?.isAdmin || canView('customers') || canView('reports') || canView('activity-logs')) && (
            <div className="nav-section">
              <div className="nav-section-label">Admin</div>
              {(customer?.isAdmin || canView('customers')) && !isHidden('customers') && (
              <button
                className={currentPage === 'customers' ? 'active' : ''}
                onClick={() => setCurrentPage('customers')}
              >
                <span className="nav-icon">👥</span>
                <span className="nav-text">Customers</span>
              </button>
              )}
              {(customer?.isAdmin || canView('reports')) && !isHidden('reports') && (
              <button
                className={currentPage === 'reports' ? 'active' : ''}
                onClick={() => setCurrentPage('reports')}
              >
                <span className="nav-icon">📊</span>
                <span className="nav-text">Reports</span>
              </button>
              )}
              {(customer?.isAdmin || canView('export')) && !isHidden('export') && (
              <button
                className={currentPage === 'export' ? 'active' : ''}
                onClick={() => setCurrentPage('export')}
              >
                <span className="nav-icon">📤</span>
                <span className="nav-text">Export</span>
              </button>
              )}
              {(customer?.isAdmin || canView('activity-logs')) && !isHidden('activity-logs') && (
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
            {canView('bulk-operations') && !isHidden('bulk-operations') && (
            <button
              className={currentPage === 'bulk-operations' ? 'active' : ''}
              onClick={() => setCurrentPage('bulk-operations')}
            >
              <span className="nav-icon">⚡</span>
              <span className="nav-text">Bulk Operations</span>
            </button>
            )}
            {canView('calculators') && !isHidden('calculators') && (
            <button
              className={currentPage === 'calculators' ? 'active' : ''}
              onClick={() => setCurrentPage('calculators')}
            >
              <span className="nav-icon">🧮</span>
              <span className="nav-text">Calculators</span>
            </button>
            )}
            {canView('company') && !isHidden('company') && (
            <button
              className={currentPage === 'company' ? 'active' : ''}
              onClick={() => setCurrentPage('company')}
            >
              <span className="nav-icon">🏢</span>
              <span className="nav-text">Company</span>
            </button>
            )}
            {canView('settings') && !isHidden('settings') && (
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
          <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
            {currentPage === 'dashboard' && (canView('dashboard') && !isHidden('dashboard') ? <Dashboard onNavigate={setCurrentPage} /> : <AccessDenied />)}
            {currentPage === 'cart' && (canView('cart') && !isHidden('cart') ? <Cart onNavigate={setCurrentPage} /> : <AccessDenied />)}
            {currentPage === 'categories' && (canView('categories') && !isHidden('categories') ? <Categories onNavigate={setCurrentPage} /> : <AccessDenied />)}
            {currentPage === 'items' && (canView('items') && !isHidden('items') ? <Items onNavigate={setCurrentPage} /> : <AccessDenied />)}
            {currentPage === 'sales' && (canView('sales') && !isHidden('sales') ? <SalesOrders onNavigate={(page, orderId) => { if (page === 'order-details' && orderId) { setSelectedOrderId(orderId); setCurrentPage('order-details'); } }} /> : <AccessDenied />)}
            {currentPage === 'order-details' && selectedOrderId && (canView('sales') && !isHidden('sales') ? <OrderDetails orderId={selectedOrderId} onBack={() => { setCurrentPage('sales'); setSelectedOrderId(null); }} /> : <AccessDenied />)}
            {currentPage === 'sales-performance' && (canView('sales-performance') && !isHidden('sales-performance') ? <SalesPerformance /> : <AccessDenied />)}
            {currentPage === 'cash-flow' && (canView('cash-flow') && !isHidden('cash-flow') ? <CashFlow /> : <AccessDenied />)}
            {currentPage === 'customers' && ((customer?.isAdmin || canView('customers')) && !isHidden('customers') ? <Customers /> : <AccessDenied />)}
            {currentPage === 'import' && (canView('import') && !isHidden('import') ? <Import /> : <AccessDenied />)}
            {currentPage === 'quick-sale-items' && (canView('quick-sale-items') && !isHidden('quick-sale-items') ? <QuickSaleItems /> : <AccessDenied />)}
            {currentPage === 'quick-item-sales' && (canView('quick-item-sales') && !isHidden('quick-item-sales') ? <QuickItemSales onNavigate={setCurrentPage} /> : <AccessDenied />)}
            {currentPage === 'reports' && ((customer?.isAdmin || canView('reports')) && !isHidden('reports') ? <Reports /> : <AccessDenied />)}
            {currentPage === 'export' && ((customer?.isAdmin || canView('export')) && !isHidden('export') ? <Export /> : <AccessDenied />)}
            {currentPage === 'activity-logs' && ((customer?.isAdmin || canView('activity-logs')) && !isHidden('activity-logs') ? <ActivityLogs /> : <AccessDenied />)}
            {currentPage === 'bulk-operations' && (canView('bulk-operations') && !isHidden('bulk-operations') ? <BulkOperations /> : <AccessDenied />)}
            {currentPage === 'calculators' && (canView('calculators') && !isHidden('calculators') ? <Calculators /> : <AccessDenied />)}
            {currentPage === 'company' && (canView('company') && !isHidden('company') ? <CompanySettings /> : <AccessDenied />)}
            {currentPage === 'settings' && (canView('settings') && !isHidden('settings') ? <Settings /> : <AccessDenied />)}
            {currentPage === 'acl-permissions' && customer?.isAdmin && <ACLPermissions />}
            {currentPage === 'tables' && company.business_type === 'cafe' && <Tables onNavigate={setCurrentPage} />}
            {currentPage === 'table-orders' && company.business_type === 'cafe' && <TableOrders onNavigate={setCurrentPage} />}
          </Suspense>
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
    </ErrorBoundary>
  );
}

export default App;

