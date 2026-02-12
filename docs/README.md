# POS Billing App - Local PostgreSQL Setup

This is a fully local version of the POS Billing application that runs entirely on your machine without any external dependencies like Supabase.

## 🚀 Quick Start

### For Non-Technical Users

**Windows Users:**
1. **Double-click** `START_APP.bat`
2. Wait for two windows to open (Backend and Frontend)
3. Open your browser and go to: **http://localhost:3000**
4. Login with:
   - Email: `admin@posbilling.com`
   - Password: `admin123`

**To Stop:** Close the two windows that opened.

**Mac/Linux Users:**
1. Open Terminal in the project folder
2. Run: `./start.sh`
3. Wait for the message "Application started successfully!"
4. Open your browser and go to: **http://localhost:5173**
5. Login with:
   - Email: `admin@posbilling.com`
   - Password: `admin123`

**To Stop:** Press `Ctrl+C` in the terminal, or run `./stop.sh`

### First Time Setup

If this is your first time installing:

1. Make sure you have **Node.js** installed (download from nodejs.org)
2. Make sure **PostgreSQL** is installed and running locally
3. Run the setup script:
   ```bash
   npm run setup
   ```
   This will:
   - Install all dependencies
   - Set up the database
   - Create the admin account

4. Then start the app using the Quick Start instructions above.

## Architecture

```
Frontend (React) → Express API → Prisma ORM → PostgreSQL
```

### Why Two package.json Files?

This is a **monorepo structure** with separate frontend and backend applications:

- **`backend/package.json`** - Express.js API server dependencies
  - Express, Prisma, JWT, bcrypt, etc.
  - Runs on port 3001
  
- **`frontend/package.json`** - React frontend dependencies
  - React, Vite, Zustand, etc.
  - Runs on port 3000 (default)

Each has its own `node_modules/` because they need different dependencies. This is standard practice for full-stack applications and allows:
- Independent version management
- Smaller bundle sizes
- Clear separation of concerns

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 15+ installed and running locally
- npm or yarn package manager

**Need detailed installation instructions?** See [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)

## Manual Setup

### 1. Database Setup

1. **Install PostgreSQL locally** (if not already installed)
   - Ubuntu/Debian: `sudo apt install postgresql postgresql-contrib`
   - macOS: `brew install postgresql@15`
   - Windows: Download from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)

2. **Create database and user:**
   ```bash
   sudo -u postgres psql
   ```
   Then run:
   ```sql
   CREATE DATABASE posbilling_db;
   CREATE USER posbilling WITH PASSWORD 'posbilling123';
   GRANT ALL PRIVILEGES ON DATABASE posbilling_db TO posbilling;
   \c posbilling_db
   GRANT ALL ON SCHEMA public TO posbilling;
   \q
   ```

3. **Run the schema script:**
   ```bash
   psql -U posbilling -d posbilling_db -f database/init.sql
   ```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate Prisma client
npm run prisma:generate

# Push database schema
npm run prisma:push

# Create admin account
npm run seed:admin

# Start backend server
npm run dev
```

The backend will run on `http://localhost:3001`

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_BASE_URL=http://localhost:3001/api" > .env

# Start frontend
npm run dev
```

The frontend will run on `http://localhost:3000`

## Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://posbilling:posbilling123@localhost:5432/posbilling_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
# FRONTEND_URL is optional - CORS automatically allows common localhost ports
# FRONTEND_URL="http://localhost:3000"
```

**Note:** The backend CORS is configured to automatically allow requests from common localhost ports (3000, 5173, 5174, 5175, 8080). The frontend defaults to port 3000. You can override this by setting `FRONTEND_URL` in your `.env` file.

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:3001/api
# VITE_PORT=3000  # Optional: Set custom port (defaults to 3000)
```

**Note:** The frontend port is configurable via `VITE_PORT` environment variable. The backend will automatically accept requests from any localhost port.

## Database Management

### Access PostgreSQL

```bash
psql -U posbilling -d posbilling_db
```

### Reset Database

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

### Prisma Studio (Database GUI)

```bash
cd backend
npm run prisma:studio
```

This opens a web interface at `http://localhost:5555` to view and edit database records.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/signin` - Sign in
- `GET /api/auth/me` - Get current user
- `POST /api/auth/signout` - Sign out

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Items
- `GET /api/items` - List items
- `POST /api/items` - Create item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `GET /api/items/search?q=query` - Search items
- `GET /api/items/barcode/:barcode` - Get item by barcode

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction

### Customers
- `GET /api/customers` - List business customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

## Development

### Backend Development

```bash
cd backend
npm run dev  # Runs with tsx watch for hot reload
```

### Frontend Development

```bash
cd frontend
npm run dev  # Runs Vite dev server
```

## Production Build

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm run build
# Output in frontend/dist
```

## Troubleshooting

### Database Connection Issues

1. Check if PostgreSQL is running:
   ```bash
   # Linux
   sudo systemctl status postgresql
   
   # macOS
   brew services list
   ```

2. Verify connection:
   ```bash
   psql -U posbilling -d posbilling_db -h localhost
   ```

3. Verify connection string in `backend/.env`

### Port Already in Use

- Backend default port: 3001 (change in `backend/.env`)
- Frontend default port: 3000 (Vite will auto-increment if port is in use)
- PostgreSQL port: 5432

### Prisma Issues

```bash
cd backend
npm run prisma:generate  # Regenerate client
npm run prisma:push      # Push schema to database
```

### Common Issues

**"Port already in use" error:**
- Close other applications using ports 3001 or 3000
- Or change ports in `.env` files

**"Cannot find module" error:**
- Run: `npm run install:all`

**Database connection error:**
- Check PostgreSQL is installed and running
- Verify database credentials in `backend/.env`

## Security Notes

- Change `JWT_SECRET` in production
- Use environment variables for all secrets
- Never commit `.env` files to version control
- Change default database password in production

## Differences from Supabase Version

1. **Authentication**: Uses JWT tokens instead of Supabase sessions
2. **Database**: Local PostgreSQL instead of Supabase cloud
3. **API Layer**: Express.js backend instead of direct Supabase client
4. **ORM**: Prisma instead of raw SQL queries
5. **Password Hashing**: Node.js bcrypt instead of PostgreSQL crypt()

## License

Same as original project.
