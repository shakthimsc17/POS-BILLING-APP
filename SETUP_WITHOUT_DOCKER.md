# Setup Without Docker

This guide helps you set up the POS Billing App using a local PostgreSQL installation instead of Docker.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 15+ installed and running locally
- npm or yarn package manager
- psql command-line tool (usually comes with PostgreSQL)

## Step 1: Install PostgreSQL (if not already installed)

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### macOS (using Homebrew):
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Windows:
Download and install from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)

## Step 2: Create Database and User

```bash
# Switch to postgres user (Linux/macOS)
sudo -u postgres psql

# Or on macOS with Homebrew:
psql postgres
```

Then run these SQL commands:

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

## Step 3: Run Database Schema Script

```bash
# From the project root directory
psql -U posbilling -d posbilling_db -f database/init.sql
```

If prompted for password, enter: `posbilling123`

**Alternative (if you need to specify host/port):**
```bash
psql -h localhost -p 5432 -U posbilling -d posbilling_db -f database/init.sql
```

## Step 4: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
DATABASE_URL="postgresql://posbilling:posbilling123@localhost:5432/posbilling_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
FRONTEND_URL="http://localhost:5173"
EOF

# Generate Prisma client
npm run prisma:generate

# Push database schema (optional, since we already ran init.sql)
npm run prisma:push

cd ..
```

## Step 5: Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_BASE_URL=http://localhost:3001/api" > .env

cd ..
```

## Step 6: Start the Application

### Terminal 1 - Start Backend:
```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:3001`

### Terminal 2 - Start Frontend:
```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

## Troubleshooting

### PostgreSQL Connection Issues

1. **Check if PostgreSQL is running:**
   ```bash
   # Linux
   sudo systemctl status postgresql
   
   # macOS
   brew services list
   ```

2. **Verify connection:**
   ```bash
   psql -U posbilling -d posbilling_db -h localhost
   ```

3. **Check PostgreSQL port (default is 5432):**
   ```bash
   sudo netstat -tulpn | grep 5432
   # or
   sudo ss -tulpn | grep 5432
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
```

## Quick Setup Script (Without Docker)

You can create a simple setup script for your environment:

```bash
#!/bin/bash
# save as setup-manual.sh

echo "🔧 Setting up POS Billing App (Manual Setup)"
echo ""

# Check if PostgreSQL is accessible
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL client (psql) not found. Please install PostgreSQL."
    exit 1
fi

# Setup Backend
echo "📦 Setting up backend..."
cd backend
npm install

if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
DATABASE_URL="postgresql://posbilling:posbilling123@localhost:5432/posbilling_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
FRONTEND_URL="http://localhost:5173"
EOF
fi

npm run prisma:generate
npm run prisma:push
cd ..

# Setup Frontend
echo "📦 Setting up frontend..."
cd frontend
npm install

if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    echo "VITE_API_BASE_URL=http://localhost:3001/api" > .env
fi

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "⚠️  Make sure PostgreSQL is running and database is created!"
echo "   Run: psql -U posbilling -d posbilling_db -f database/init.sql"
echo ""
echo "To start the application:"
echo "  1. Start backend:  cd backend && npm run dev"
echo "  2. Start frontend: cd frontend && npm run dev"
```

Make it executable:
```bash
chmod +x setup-manual.sh
./setup-manual.sh
```

