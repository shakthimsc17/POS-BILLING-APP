# POS Billing App - Complete Installation Guide

This guide will help you install and run the POS Billing App on a new system, even if you don't have technical knowledge.

## 📋 Prerequisites

Before starting, make sure you have these installed on your system:

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - Install and verify by opening terminal/command prompt and typing: `node --version`
   - Should show version 18.x.x or higher

2. **PostgreSQL Database** (version 15 or higher)
   - **Option A (Recommended)**: Docker Desktop
     - Download from: https://www.docker.com/products/docker-desktop/
     - Install Docker Desktop
   - **Option B**: Install PostgreSQL directly
     - Download from: https://www.postgresql.org/download/
     - Follow installation instructions for your operating system

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

#### Option A: Using Docker (Easiest - Recommended)

1. Make sure Docker Desktop is running
2. Open terminal in the project folder
3. Run:
   ```bash
   docker-compose up -d
   ```
4. Wait for the database to start (about 10-30 seconds)
5. Verify it's running:
   ```bash
   docker ps
   ```
   You should see a container named `posbilling_postgres` running

#### Option B: Manual PostgreSQL Setup

1. Open PostgreSQL command line (psql) or pgAdmin
2. Create database and user:
   ```sql
   CREATE DATABASE posbilling_db;
   CREATE USER posbilling WITH PASSWORD 'posbilling123';
   GRANT ALL PRIVILEGES ON DATABASE posbilling_db TO posbilling;
   ```
3. Exit PostgreSQL

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
   - Make sure Docker is running (if using Docker)
   - Check that PostgreSQL is running
   - Verify `.env` file has correct database URL

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

### Check if everything is running:

**Backend:**
- Open browser: http://localhost:3001/health
- Should show: `{"status":"ok","timestamp":"..."}`

**Frontend:**
- Open browser: http://localhost:5173
- Should show the login page

**Database (Docker):**
```bash
docker ps
```
Should show `posbilling_postgres` container

### Reset Everything (Fresh Start)

1. Stop all running processes (Ctrl+C in terminals)
2. Stop Docker container:
   ```bash
   docker-compose down -v
   ```
3. Delete `node_modules` folders:
   ```bash
   # Windows
   rmdir /s /q backend\node_modules frontend\node_modules
   
   # Mac/Linux
   rm -rf backend/node_modules frontend/node_modules
   ```
4. Start from Step 3 again

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

