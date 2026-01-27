# POS Billing App - Complete Installation Guide

This guide will help you install and run the POS Billing App on a new system, even if you don't have technical knowledge.

## 📋 Prerequisites

Before starting, make sure you have these installed on your system:

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - Install and verify by opening terminal/command prompt and typing: `node --version`
   - Should show version 18.x.x or higher

2. **PostgreSQL Database** (version 15 or higher)
   - Download from: https://www.postgresql.org/download/
   - Follow installation instructions for your operating system
   - **Ubuntu/Debian**: `sudo apt install postgresql postgresql-contrib`
   - **macOS**: `brew install postgresql@15 && brew services start postgresql@15`
   - **Windows**: Download installer from PostgreSQL website

3. **Git** (to clone the project)
   - Download from: https://git-scm.com/downloads
   - Or use GitHub Desktop: https://desktop.github.com/

## 🚀 Step-by-Step Installation

### Step 1: Clone the Project

Open terminal/command prompt and run:

```bash
git clone <your-repository-url>
cd POS-BILLING-APP
```

Or if you have the project files, navigate to the project folder.

### Step 2: Database Setup

#### Install PostgreSQL (if not already installed)

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
Download and install from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)

#### Create Database and User

1. Open PostgreSQL command line:
   ```bash
   # Linux/macOS
   sudo -u postgres psql
   
   # macOS with Homebrew
   psql postgres
   
   # Windows (use Command Prompt as Administrator)
   psql -U postgres
   ```

2. Run these SQL commands:
   ```sql
   -- Create database
   CREATE DATABASE posbilling_db;
   
   -- Create user
   CREATE USER posbilling WITH PASSWORD 'posbilling123';
   
   -- Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE posbilling_db TO posbilling;
   
   -- Connect to the database
   \c posbilling_db
   
   -- Grant schema privileges
   GRANT ALL ON SCHEMA public TO posbilling;
   
   -- Exit psql
   \q
   ```

#### Run Database Schema Script

```bash
# From the project root directory
psql -U posbilling -d posbilling_db -f database/init.sql
```

If prompted for password, enter: `posbilling123`

**Alternative (if you need to specify host/port):**
```bash
psql -h localhost -p 5432 -U posbilling -d posbilling_db -f database/init.sql
```

### Step 3: Backend Setup

1. Open terminal/command prompt
2. Navigate to backend folder:
   ```bash
   cd backend
   ```

3. Install dependencies:
   ```bash
   npm install
   ```
   This may take 2-5 minutes. Wait until it completes.

4. Create environment file:
   - Create a file named `.env` in the `backend` folder
   - Copy and paste this content:
   ```env
   DATABASE_URL="postgresql://posbilling:posbilling123@localhost:5432/posbilling_db?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-12345"
   PORT=3001
   ```
   - Save the file

5. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

6. Create database tables:
   ```bash
   npm run prisma:push
   ```

7. Create admin account:
   ```bash
   npm run seed:admin
   ```
   This creates a default admin account:
   - Email: `admin@posbilling.com`
   - Password: `admin123`

### Step 4: Frontend Setup

1. Open a NEW terminal/command prompt window
2. Navigate to frontend folder:
   ```bash
   cd frontend
   ```

3. Install dependencies:
   ```bash
   npm install
   ```
   This may take 2-5 minutes. Wait until it completes.

4. Create environment file:
   - Create a file named `.env` in the `frontend` folder
   - Copy and paste this content:
   ```env
   VITE_API_BASE_URL=http://localhost:3001/api
   ```
   - Save the file

### Step 5: Start the Application

#### Method 1: One-Click Start (Easiest - Recommended)

Simply double-click the `START_APP.bat` file (Windows) or run `./start.sh` (Mac/Linux)

Or run in terminal:
```bash
# Windows
npm run start

# Mac/Linux
./start.sh
```

This will start both backend and frontend automatically.

#### Method 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Wait until you see: `🚀 Server running on http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Wait until you see: `Local: http://localhost:5173`

### Step 6: Access the Application

1. Open your web browser
2. Go to: `http://localhost:5173`
3. You should see the login page
4. Login with admin credentials:
   - Email: `admin@posbilling.com`
   - Password: `admin123`

## 🎯 Quick Start Scripts

### Windows Users

1. Double-click `START_APP.bat` to start everything
2. Double-click `STOP_APP.bat` to stop everything

### Mac/Linux Users

1. Run `./start.sh` to start everything
2. Press `Ctrl+C` to stop, or run `./stop.sh`

## 📝 Important Notes

### Default Admin Account
- **Email**: `admin@posbilling.com`
- **Password**: `admin123`
- **Important**: Change this password after first login!

### Ports Used
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432

### If Something Goes Wrong

1. **Database connection error:**
   - Check that PostgreSQL is running
   - Verify `.env` file has correct database URL
   - See troubleshooting section below

2. **Port already in use:**
   - Close other applications using ports 3001 or 5173
   - Or change ports in `.env` files

3. **npm install fails:**
   - Make sure Node.js is installed: `node --version`
   - Try deleting `node_modules` folder and `package-lock.json`, then run `npm install` again

4. **Prisma errors:**
   ```bash
   cd backend
   npm run prisma:generate
   npm run prisma:push
   ```

## 🔧 Troubleshooting

### PostgreSQL Connection Issues

1. **Check if PostgreSQL is running:**
   ```bash
   # Linux
   sudo systemctl status postgresql
   
   # macOS
   brew services list
   
   # Windows
   # Check Services (services.msc) for PostgreSQL service
   ```

2. **Verify connection:**
   ```bash
   psql -U posbilling -d posbilling_db -h localhost
   ```

3. **Check PostgreSQL port (default is 5432):**
   ```bash
   # Linux
   sudo netstat -tulpn | grep 5432
   # or
   sudo ss -tulpn | grep 5432
   
   # macOS
   lsof -i :5432
   ```

### Database Connection String

If your PostgreSQL is on a different host/port, update `backend/.env`:
```env
DATABASE_URL="postgresql://posbilling:posbilling123@localhost:5432/posbilling_db?schema=public"
```

Change `localhost:5432` to your PostgreSQL host and port.

### Permission Issues

If you get permission errors, you might need to:
```sql
-- Connect as postgres superuser
sudo -u postgres psql

-- Then run:
ALTER USER posbilling WITH SUPERUSER;
```

### Check if everything is running:

**Backend:**
- Open browser: http://localhost:3001/health
- Should show: `{"status":"ok","timestamp":"..."}`

**Frontend:**
- Open browser: http://localhost:5173
- Should show the login page

**Database:**
```bash
psql -U posbilling -d posbilling_db -h localhost
```
Should connect successfully

### Reset Database (if needed)

```bash
# Drop and recreate database
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS posbilling_db;
CREATE DATABASE posbilling_db;
GRANT ALL PRIVILEGES ON DATABASE posbilling_db TO posbilling;
EOF

# Re-run schema script
psql -U posbilling -d posbilling_db -f database/init.sql

# Re-run Prisma push
cd backend
npm run prisma:push
```

### Reset Everything (Fresh Start)

1. Stop all running processes (Ctrl+C in terminals)
2. Delete `node_modules` folders:
   ```bash
   # Windows
   rmdir /s /q backend\node_modules frontend\node_modules
   
   # Mac/Linux
   rm -rf backend/node_modules frontend/node_modules
   ```
3. Start from Step 3 again

## 📞 Support

If you encounter issues:
1. Check the error messages in terminal
2. Verify all prerequisites are installed
3. Make sure all steps were completed
4. Check that ports 3001 and 5173 are not in use

## 🎉 Success!

Once you see the login page, you're all set! You can now:
- Login with admin account
- Create new user accounts
- Add items and categories
- Start making sales!

---

**Note**: Keep both terminal windows open while using the app. Closing them will stop the application.
