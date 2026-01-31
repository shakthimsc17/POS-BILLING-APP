# POS Billing Application - Feature Document

## Overview
This document provides a comprehensive list of all features organized by pages/modules in the POS Billing Application.

---

## 1. Authentication Pages

### 1.1 Sign In (`SignIn.tsx`)
**Features:**
- Email and password authentication
- JWT token-based session management
- Redirect to dashboard on successful login
- Error handling for invalid credentials
- Link to sign up page

### 1.2 Sign Up (`SignUp.tsx`)
**Features:**
- New user registration
- Email validation and uniqueness check
- Password strength requirement (minimum 6 characters)
- Optional user details (name, phone, address, city, state, pincode)
- Automatic login after registration
- Link to sign in page

---

## 2. Sales & Finance Pages

### 2.1 Dashboard (`Dashboard.tsx`)
**Features:**
- **Item Display:**
  - Grid view of all inventory items
  - Real-time item search by name, code, or barcode
  - Category-based filtering (multiple selection supported)
  - Horizontal scrolling category icons with custom icons
  - Item cards showing: name, price, stock, image
  - Quick add to cart functionality
  
- **Quick Sale Button:**
  - Opens Quick Sale modal for unlisted items
  - Allows manual entry of item name, quantity, and price
  - Saves to QuickSaleItem table for later inventory addition
  
- **Company Logo Display:**
  - Shows company logo from company settings
  - Responsive header layout
  
- **Cart Summary:**
  - Quick view of cart items count
  - Total amount preview
  - Direct navigation to cart page

**Access Control:** Requires `dashboard` permission

### 2.2 Cart (`Cart.tsx`)
**Features:**
- **Cart Management:**
  - Add/remove items
  - Update quantities
  - Edit item prices (custom pricing per transaction)
  - Visual indicator for custom-priced items
  - Real-time subtotal, tax, discount, and total calculations
  
- **Quick Item Add:**
  - Modal to quickly search and add existing items
  - Horizontal layout for search results
  - Shows item code, price, and stock
  
- **Customer Selection:**
  - Link transaction to SalesCustomer
  - Search customers by name, mobile, or place
  - Create new sales customer on-the-fly
  
- **Payment Processing:**
  - Payment method selection (Cash, Card, UPI)
  - Received amount input
  - Automatic change calculation
  - Transaction completion with receipt generation
  
- **Receipt Features:**
  - Print receipt functionality
  - Export as PDF/HTML
  - Company details on receipt
  - Itemized list with quantities and prices

**Access Control:** Requires `cart` permission

### 2.3 Sales Orders (`SalesOrders.tsx`)
**Features:**
- **Order Management:**
  - View all completed transactions
  - Filter by date range (today, week, month, year, custom)
  - Search by order ID, customer name, or payment method
  - Sort by date, amount, or items count
  
- **Order Details:**
  - Order ID, date, time
  - Customer information
  - Items count
  - Payment method
  - Total amount
  - Profit/Loss (if permission granted)
  
- **Export Options:**
  - Export to CSV
  - Export to HTML
  - Print receipt for any order
  
- **Summary Cards:**
  - Total Sales (filtered)
  - Total Profit (if permission granted)
  - Total Loss (if permission granted)
  - Net Profit (if permission granted)

**Access Control:** Requires `sales` permission
**Profit Data:** Requires `can_view_profit` permission

### 2.4 Sales Performance (`SalesPerformance.tsx`)
**Features:**
- **Sales Reports:**
  - Last 7 days sales chart
  - Weekly sales report
  - Monthly sales report
  - Yearly sales report
  - Overall sales report
  
- **Profit Reports:**
  - Last 7 days profit chart
  - Weekly profit data
  - Monthly profit data
  - Yearly profit data
  - All-time profit data
  
- **Analytics:**
  - Top-selling items chart
  - Sales by payment method (pie chart)
  - Sales vs Profit comparison chart
  - Hourly sales progress chart (8 AM - 10 PM)
  - Single date filter for hourly reports
  
- **Data Visualization:**
  - Line charts for trends
  - Bar charts for comparisons
  - Pie charts for distributions
  - Responsive chart layouts

**Access Control:** Requires `sales-performance` permission
**Profit Data:** Requires `can_view_profit` permission

### 2.5 Cash Flow (`CashFlow.tsx`)
**Features:**
- **Income Management:**
  - Add manual income entries
  - Total Sales display (from transactions)
  - Manual Income entries
  - Predefined income categories with icons
  
- **Expense Management:**
  - Add expense entries
  - Employee salary tracking
  - Daily expenses (tea, snacks, etc.)
  - Stock investment tracking
  - Predefined expense categories with icons
  
- **Date Filtering:**
  - Daily view
  - Weekly view
  - Monthly view
  - Yearly view
  - Custom date range
  
- **Summary:**
  - Total Income (filtered)
  - Total Expense (filtered)
  - Net Cash Flow (all-time calculation)
  - Tree view display of income/expense entries
  
- **Net Cash Flow Calculation:**
  - Formula: `(All-time Sales + All-time Manual Income) - (All-time Expenses + Current Stock Investment)`
  - Not affected by date filters

**Access Control:** Requires `cash-flow` permission

### 2.6 Quick Sale Items (`QuickSaleItems.tsx`)
**Features:**
- **Quick Sale Management:**
  - View all quick sale items
  - Filter by added/not added to inventory
  - Display item name, quantity, price, total amount
  - Show sale date
  
- **Add to Inventory:**
  - Convert quick sale items to inventory items
  - Modal form with fields:
    - Category selection
    - Subcategory (dynamic based on category)
    - Item code
    - Display name (prepopulated from item name)
    - Stock quantity
    - Cost price
    - MRP (optional)
  - Link quick sale item to inventory item
  
- **Status Tracking:**
  - Mark items as added to inventory
  - Prevent duplicate additions

**Access Control:** Requires `quick-sale-items` permission

---

## 3. Inventory Management Pages

### 3.1 Categories (`Categories.tsx`)
**Features:**
- **Category Management:**
  - Create categories with name, subcategory, brand
  - Custom icon selection for categories
  - Edit existing categories
  - Delete categories (with confirmation)
  - View all categories in table format
  
- **Category Display:**
  - Icon display
  - Name, subcategory, brand
  - Creation date
  - Actions (edit, delete)

**Access Control:** Requires `categories` permission

### 3.2 Items (`Items.tsx`)
**Features:**
- **Item Management:**
  - Create items with full details:
    - Name and display name
    - Item code (with prefix support)
    - Barcode
    - Category and subcategory
    - Cost, Price, MRP
    - Stock quantity
    - Image upload (base64)
  
- **Item Operations:**
  - Edit items
  - Delete items (with confirmation)
  - Bulk operations support
  - Stock updates
  
- **Search & Filter:**
  - Search by name, code, or barcode
  - Filter by category
  - Sort by various fields
  
- **Display:**
  - Grid/list view toggle
  - Item images
  - Stock status indicators
  - Price information

**Access Control:** Requires `items` permission

### 3.3 Import (`Import.tsx`)
**Features:**
- **Bulk Import:**
  - CSV file import for items
  - CSV file import for categories
  - Data validation
  - Error reporting
  - Preview before import
  - Batch processing

**Access Control:** Requires `import` permission

---

## 4. Settings & Administration Pages

### 4.1 Customers (`Customers.tsx`)
**Features:**
- **User Management:**
  - Create system users (sales person, manager, Admin)
  - Edit user details
  - Delete users
  - Customer type assignment
  - Display customer type with color-coded badges
  
- **Customer Types:**
  - Sales Person (default)
  - Manager
  - Admin
  
- **User Details:**
  - Name, email, phone
  - Address, city, state, pincode
  - Customer type badge display

**Access Control:** Admin only or requires `customers` permission

### 4.2 ACL Permissions (`ACLPermissions.tsx`)
**Features:**
- **Permission Management:**
  - Select customer type (sales person, manager, Admin)
  - Configure page-level permissions:
    - Can View
    - Can Edit
    - Can Delete
    - Can View Profit
  - Tree view organized by categories:
    - Sales & Finance
    - Inventory
    - Settings
    - Reports
  
- **Permission Features:**
  - Prepopulate existing permissions when selecting customer type
  - Save permissions for customer type
  - Visual checkbox interface
  - Dependent permission logic (edit/delete require view)
  
- **Pages Covered:**
  - Dashboard, Cart, Sales Orders, Sales Performance, Cash Flow
  - Categories, Items, Quick Sale Items
  - Customers, Reports, Company Settings, Settings
  - Activity Logs, Bulk Operations

**Access Control:** Admin only

### 4.3 Company Settings (`CompanySettings.tsx`)
**Features:**
- **Company Information:**
  - Company name
  - Address, city, state, pincode
  - Phone, email
  - GSTIN
  - Website
  - Business type
  - Logo upload (base64)
  
- **Logo Management:**
  - Upload company logo
  - Display logo on receipts
  - Logo preview

**Access Control:** Requires `company` permission

### 4.4 Settings (`Settings.tsx`)
**Features:**
- **Application Settings:**
  - Activity log enable/disable
  - Item log actions (update/delete)
  - Receipt header options (logo/text/both)
  - Save preferences

**Access Control:** Requires `settings` permission

### 4.5 Activity Logs (`ActivityLogs.tsx`)
**Features:**
- **Activity Tracking:**
  - View all system activities
  - Filter by entity type (item, category, transaction, etc.)
  - Filter by action (create, update, delete)
  - Filter by user
  - Date range filtering
  
- **Log Details:**
  - Entity type and ID
  - Action performed
  - Changed by (user)
  - Changes made (JSON diff)
  - Timestamp

**Access Control:** Admin only or requires `activity-logs` permission

### 4.6 Bulk Operations (`BulkOperations.tsx`)
**Features:**
- **Bulk Actions:**
  - Bulk update item prices
  - Bulk update stock quantities
  - Bulk category assignment
  - Bulk delete items
  - CSV export for bulk editing

**Access Control:** Requires `bulk-operations` permission

### 4.7 Reports (`Reports.tsx`)
**Features:**
- **Report Generation:**
  - Sales reports
  - Inventory reports
  - Customer reports
  - Financial reports
  - Export options (PDF, CSV, Excel)

**Access Control:** Admin only or requires `reports` permission

### 4.8 Calculators (`Calculators.tsx`)
**Features:**
- **Utility Calculators:**
  - Price calculator
  - Discount calculator
  - Tax calculator
  - Profit margin calculator
  - Currency converter

**Access Control:** Requires `calculators` permission

---

## 5. Shared Components

### 5.1 CategoryFilter (`CategoryFilter.tsx`)
- Horizontal scrolling category filter
- Multiple category selection
- Icon display
- Selected state indication

### 5.2 ItemCard (`ItemCard.tsx`)
- Item display card
- Add to cart button
- Stock indicator
- Price display

### 5.3 QuickSaleModal (`QuickSaleModal.tsx`)
- Add unlisted items for quick sale
- Multiple items support
- Quantity and price input

### 5.4 QuickAddItemModal (`QuickAddItemModal.tsx`)
- Quick search and add items to cart
- Horizontal result layout
- Item code, price, stock display

### 5.5 CustomerSelectModal (`CustomerSelectModal.tsx`)
- Select or create sales customer
- Search by name, mobile, place
- Customer creation form

### 5.6 AddToInventoryModal (`AddToInventoryModal.tsx`)
- Convert quick sale item to inventory
- Dynamic subcategory dropdown
- Display name prepopulation

### 5.7 AddCashFlowEntryForm (`AddCashFlowEntryForm.tsx`)
- Add income/expense entries
- Category selection with icons
- Date picker
- Amount and description input

### 5.8 AccessDenied (`AccessDenied.tsx`)
- Permission denied message
- User-friendly error display

---

## 6. Core Features

### 6.1 Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Customer type-based permissions
- Admin bypass for all permissions

### 6.2 State Management
- Zustand stores:
  - `authStore`: User authentication state
  - `cartStore`: Shopping cart state
  - `inventoryStore`: Items and categories state
  - `companyStore`: Company information state

### 6.3 Data Persistence
- PostgreSQL database
- Prisma ORM
- Transaction support
- Cascade deletes

### 6.4 API Architecture
- RESTful API design
- Express.js backend
- Request validation with express-validator
- Error handling middleware
- CORS configuration

### 6.5 Security Features
- Password hashing (bcrypt)
- JWT token expiration
- Input validation
- SQL injection prevention (Prisma)
- XSS protection

---

## 7. Database Schema

### 7.1 Core Tables
- `customers`: System users
- `categories`: Product categories
- `items`: Inventory items
- `transactions`: Sales transactions
- `sales_customers`: Sales customers (separate from system users)
- `quick_sale_items`: Unlisted items sold
- `cash_flow_entries`: Income/expense entries
- `permissions`: ACL permissions
- `companies`: Company information
- `settings`: Application settings
- `activity_logs`: System activity tracking

### 7.2 Relationships
- Customer → Categories (1:N)
- Customer → Items (1:N)
- Customer → Transactions (1:N)
- Category → Items (1:N)
- Transaction → SalesCustomer (N:1)
- QuickSaleItem → Item (N:1)
- Customer → CashFlowEntry (1:N)
- Customer → Permission (via customer_type)

---

## 8. Technical Stack

### 8.1 Frontend
- React 18
- TypeScript
- Vite
- Zustand (state management)
- Recharts (data visualization)
- CSS3

### 8.2 Backend
- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT (authentication)
- bcrypt (password hashing)

### 8.3 Development Tools
- PostgreSQL (local installation)
- Prisma Studio
- npm scripts
- Git version control

---

## 9. Access Control Summary

### 9.1 Admin Users
- Full access to all pages
- Can manage permissions
- Can view all profit data
- Can manage users

### 9.2 Manager Users
- Access based on ACL permissions
- Can be granted profit viewing
- Can manage inventory

### 9.3 Sales Person Users
- Access based on ACL permissions
- Default access if no permissions configured
- Profit data hidden by default
- Focus on sales operations

---

## 10. Future Enhancement Opportunities

1. **Multi-currency support**
2. **Barcode scanner integration**
3. **Receipt printer integration**
4. **Mobile app (React Native)**
5. **Offline mode support**
6. **Advanced reporting with scheduled reports**
7. **Email/SMS notifications**
8. **Inventory alerts (low stock)**
9. **Supplier management**
10. **Purchase orders**

---

*Last Updated: January 2025*
*Version: 1.0*

