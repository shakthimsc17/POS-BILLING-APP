import { useState, useEffect } from 'react';
import { useInventoryStore } from './store/inventoryStore';
import { useAuthStore } from './store/authStore';
import { useCartStore } from './store/cartStore';
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
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import { useCompanyStore } from './store/companyStore';
import './App.css';

type Page = 'dashboard' | 'cart' | 'categories' | 'items' | 'sales' | 'customers' | 'import' | 'reports' | 'calculators' | 'company' | 'settings' | 'activity-logs' | 'bulk-operations';
type AuthPage = 'signin' | 'signup';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [authPage, setAuthPage] = useState<AuthPage>('signin');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { loadCategories, loadItems } = useInventoryStore();
  const { customer, initialized, initialize, signOut } = useAuthStore();
  const { items: cartItems } = useCartStore();
  const { company, loadCompany } = useCompanyStore();

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

  // Show auth pages if not signed in
  if (!initialized) {
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
            <button
              className={currentPage === 'dashboard' ? 'active' : ''}
              onClick={() => setCurrentPage('dashboard')}
            >
              <span className="nav-icon">🏠</span>
              <span className="nav-text">Dashboard</span>
            </button>
            <button
              className={currentPage === 'cart' ? 'active' : ''}
              onClick={() => setCurrentPage('cart')}
            >
              <span className="nav-icon">🛒</span>
              <span className="nav-text">Cart</span>
            </button>
            <button
              className={currentPage === 'sales' ? 'active' : ''}
              onClick={() => setCurrentPage('sales')}
            >
              <span className="nav-icon">💼</span>
              <span className="nav-text">Sales</span>
            </button>
          </div>

          <div className="nav-section">
            <div className="nav-section-label">Inventory</div>
            <button
              className={currentPage === 'items' ? 'active' : ''}
              onClick={() => setCurrentPage('items')}
            >
              <span className="nav-icon">📦</span>
              <span className="nav-text">Items</span>
            </button>
            <button
              className={currentPage === 'categories' ? 'active' : ''}
              onClick={() => setCurrentPage('categories')}
            >
              <span className="nav-icon">📁</span>
              <span className="nav-text">Categories</span>
            </button>
            <button
              className={currentPage === 'import' ? 'active' : ''}
              onClick={() => setCurrentPage('import')}
            >
              <span className="nav-icon">📥</span>
              <span className="nav-text">Import</span>
            </button>
          </div>

          {customer?.isAdmin && (
            <div className="nav-section">
              <div className="nav-section-label">Admin</div>
              <button
                className={currentPage === 'customers' ? 'active' : ''}
                onClick={() => setCurrentPage('customers')}
              >
                <span className="nav-icon">👥</span>
                <span className="nav-text">Customers</span>
              </button>
              <button
                className={currentPage === 'reports' ? 'active' : ''}
                onClick={() => setCurrentPage('reports')}
              >
                <span className="nav-icon">📊</span>
                <span className="nav-text">Reports</span>
              </button>
              <button
                className={currentPage === 'activity-logs' ? 'active' : ''}
                onClick={() => setCurrentPage('activity-logs')}
              >
                <span className="nav-icon">📋</span>
                <span className="nav-text">Activity Logs</span>
              </button>
            </div>
          )}

          <div className="nav-section">
            <div className="nav-section-label">Tools</div>
            <button
              className={currentPage === 'bulk-operations' ? 'active' : ''}
              onClick={() => setCurrentPage('bulk-operations')}
            >
              <span className="nav-icon">⚡</span>
              <span className="nav-text">Bulk Operations</span>
            </button>
            <button
              className={currentPage === 'calculators' ? 'active' : ''}
              onClick={() => setCurrentPage('calculators')}
            >
              <span className="nav-icon">🧮</span>
              <span className="nav-text">Calculators</span>
            </button>
            <button
              className={currentPage === 'company' ? 'active' : ''}
              onClick={() => setCurrentPage('company')}
            >
              <span className="nav-icon">🏢</span>
              <span className="nav-text">Company</span>
            </button>
            <button
              className={currentPage === 'settings' ? 'active' : ''}
              onClick={() => setCurrentPage('settings')}
            >
              <span className="nav-icon">⚙️</span>
              <span className="nav-text">Settings</span>
            </button>
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
          {currentPage === 'dashboard' && <Dashboard onNavigate={setCurrentPage} />}
          {currentPage === 'cart' && <Cart onNavigate={setCurrentPage} />}
          {currentPage === 'categories' && <Categories onNavigate={setCurrentPage} />}
          {currentPage === 'items' && <Items onNavigate={setCurrentPage} />}
          {currentPage === 'sales' && <SalesOrders />}
          {currentPage === 'customers' && customer?.isAdmin && <Customers />}
          {currentPage === 'import' && <Import />}
          {currentPage === 'reports' && customer?.isAdmin && <Reports />}
          {currentPage === 'activity-logs' && customer?.isAdmin && <ActivityLogs />}
          {currentPage === 'bulk-operations' && <BulkOperations />}
          {currentPage === 'calculators' && <Calculators />}
          {currentPage === 'company' && <CompanySettings />}
          {currentPage === 'settings' && <Settings />}
        </div>

        {/* Show footer for all pages except dashboard and sales-related pages */}
        {!['dashboard', 'cart', 'sales'].includes(currentPage) && (
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

