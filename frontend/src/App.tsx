import { useState, useEffect } from 'react';
import { useInventoryStore } from './store/inventoryStore';
import { useAuthStore } from './store/authStore';
import { useCartStore } from './store/cartStore';
import Dashboard from './pages/Dashboard';
import Cart from './pages/Cart';
import Categories from './pages/Categories';
import Items from './pages/Items';
import Payment from './pages/Payment';
import SalesOrders from './pages/SalesOrders';
import Customers from './pages/Customers';
import Import from './pages/Import';
import Reports from './pages/Reports';
import Calculators from './pages/Calculators';
import CompanySettings from './pages/CompanySettings';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import { useCompanyStore } from './store/companyStore';
import './App.css';

type Page = 'dashboard' | 'cart' | 'categories' | 'items' | 'payment' | 'sales' | 'customers' | 'import' | 'reports' | 'calculators' | 'company';
type AuthPage = 'signin' | 'signup';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [authPage, setAuthPage] = useState<AuthPage>('signin');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { loadCategories, loadItems } = useInventoryStore();
  const { customer, initialized, initialize, signOut } = useAuthStore();
  const { items: cartItems } = useCartStore();
  const { company } = useCompanyStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (initialized && customer) {
    loadCategories();
    loadItems();
    }
  }, [initialized, customer, loadCategories, loadItems]);

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
          <h1>🛒 {company.name || 'POS System'}</h1>
          {company.phone && <p className="company-phone">{company.phone}</p>}
        </div>
        <nav className="sidebar-nav">
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
            className={currentPage === 'categories' ? 'active' : ''}
            onClick={() => setCurrentPage('categories')}
          >
            <span className="nav-icon">📁</span>
            <span className="nav-text">Categories</span>
          </button>
          <button
            className={currentPage === 'items' ? 'active' : ''}
            onClick={() => setCurrentPage('items')}
          >
            <span className="nav-icon">📦</span>
            <span className="nav-text">Items</span>
          </button>
          <button
            className={currentPage === 'sales' ? 'active' : ''}
            onClick={() => setCurrentPage('sales')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Sales</span>
          </button>
          <button
            className={currentPage === 'customers' ? 'active' : ''}
            onClick={() => setCurrentPage('customers')}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-text">Customers</span>
          </button>
          <button
            className={currentPage === 'import' ? 'active' : ''}
            onClick={() => setCurrentPage('import')}
          >
            <span className="nav-icon">📥</span>
            <span className="nav-text">Import</span>
          </button>
          <button
            className={currentPage === 'reports' ? 'active' : ''}
            onClick={() => setCurrentPage('reports')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Reports</span>
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
        </nav>
        
        {/* Quick Actions Section */}
        <div className="sidebar-quick-actions">
          <h3>Quick Actions</h3>
          <div className="quick-actions-buttons">
            <button 
              className="btn btn-secondary btn-sm btn-block" 
              onClick={() => setCurrentPage('categories')}
            >
              📁 Manage Categories
            </button>
            <button 
              className="btn btn-secondary btn-sm btn-block" 
              onClick={() => setCurrentPage('items')}
            >
              📦 Manage Items
            </button>
            {cartItems.length > 0 && (
              <button 
                className="btn btn-primary btn-sm btn-block" 
                onClick={() => setCurrentPage('cart')}
              >
                🛒 Go to Cart
              </button>
            )}
          </div>
        </div>

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
        {currentPage === 'dashboard' && <Dashboard onNavigate={setCurrentPage} />}
        {currentPage === 'cart' && <Cart onNavigate={setCurrentPage} />}
        {currentPage === 'categories' && <Categories />}
        {currentPage === 'items' && <Items />}
        {currentPage === 'payment' && <Payment onNavigate={setCurrentPage} />}
        {currentPage === 'sales' && <SalesOrders />}
        {currentPage === 'customers' && <Customers />}
        {currentPage === 'import' && <Import />}
        {currentPage === 'reports' && <Reports />}
        {currentPage === 'calculators' && <Calculators />}
        {currentPage === 'company' && <CompanySettings />}
      </main>
    </div>
  );
}

export default App;

