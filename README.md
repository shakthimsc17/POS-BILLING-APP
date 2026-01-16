# POS Billing App - Local PostgreSQL Setup

This is a fully local version of the POS Billing application that runs entirely on your machine without any external dependencies like Supabase.

## 🚀 Quick Start (For New Users)

**Just want to get started quickly?** See [QUICK_START.md](./QUICK_START.md)

**Need detailed installation instructions?** See [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)

### One-Click Start

- **Windows**: Double-click `START_APP.bat`
- **Mac/Linux**: Run `./start.sh` in terminal

That's it! The app will open at http://localhost:5173

**Default Admin Login:**
- Email: `admin@posbilling.com`
- Password: `admin123`

## Architecture

```
Frontend (React) → Express API → Prisma ORM → PostgreSQL (Docker)
```

### Why Two package.json Files?

This is a **monorepo structure** with separate frontend and backend applications:

- **`backend/package.json`** - Express.js API server dependencies
  - Express, Prisma, JWT, bcrypt, etc.
  - Runs on port 3001
  
- **`frontend/package.json`** - React frontend dependencies
  - React, Vite, Zustand, etc.
  - Runs on port 5173

Each has its own `node_modules/` because they need different dependencies. This is standard practice for full-stack applications and allows:
- Independent version management
- Smaller bundle sizes
- Clear separation of concerns

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 15+ installed (or Docker for containerized setup)
- npm or yarn package manager

**Note:** If you don't have Docker, see [SETUP_WITHOUT_DOCKER.md](./SETUP_WITHOUT_DOCKER.md) for manual setup instructions.

## Quick Start

### Option A: With Docker (Recommended)

#### 1. Start PostgreSQL Database

```bash
cd /var/www/html/database/POSBILLING/posbillingapp-local
docker-compose up -d
```

This will start PostgreSQL on port 5432 with:
- Database: `posbilling_db`
- User: `posbilling`
- Password: `posbilling123`

### Option B: Without Docker

If you don't have Docker, you need to:

1. **Install PostgreSQL locally** (if not already installed)
2. **Create database and user:**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE posbilling_db;
   CREATE USER posbilling WITH PASSWORD 'posbilling123';
   GRANT ALL PRIVILEGES ON DATABASE posbilling_db TO posbilling;
   \q
   ```

3. **Run the schema script:**
   ```bash
   psql -U posbilling -d posbilling_db -f database/init.sql
   ```

See [SETUP_WITHOUT_DOCKER.md](./SETUP_WITHOUT_DOCKER.md) for detailed instructions.

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

The frontend will run on `http://localhost:5173`

## Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://posbilling:posbilling123@localhost:5432/posbilling_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
# FRONTEND_URL is optional - CORS automatically allows common localhost ports
# FRONTEND_URL="http://localhost:3000"
```

**Note:** The backend CORS is configured to automatically allow requests from common localhost ports (3000, 5173, 5174, 5175, 8080). You can override this by setting `FRONTEND_URL` in your `.env` file.

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:3001/api
# VITE_PORT=3000  # Optional: Set custom port (defaults to 3000)
```

**Note:** The frontend port is configurable via `VITE_PORT` environment variable. The backend will automatically accept requests from any localhost port.

## Database Management

### Access PostgreSQL

```bash
docker exec -it posbilling_postgres psql -U posbilling -d posbilling_db
```

### Reset Database

```bash
# Stop and remove containers
docker-compose down -v

# Start fresh
docker-compose up -d

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

1. Check if PostgreSQL container is running:
   ```bash
   docker ps
   ```

2. Check database logs:
   ```bash
   docker logs posbilling_postgres
   ```

3. Verify connection string in `backend/.env`

### Port Already in Use

- Backend default port: 3001 (change in `backend/.env`)
- Frontend default port: 5173 (Vite will auto-increment)
- PostgreSQL port: 5432

### Prisma Issues

```bash
cd backend
npm run prisma:generate  # Regenerate client
npm run prisma:push      # Push schema to database
```

## Security Notes

- Change `JWT_SECRET` in production
- Change database password in `docker-compose.yml`
- Use environment variables for all secrets
- Never commit `.env` files to version control

## Differences from Supabase Version

1. **Authentication**: Uses JWT tokens instead of Supabase sessions
2. **Database**: Local PostgreSQL instead of Supabase cloud
3. **API Layer**: Express.js backend instead of direct Supabase client
4. **ORM**: Prisma instead of raw SQL queries
5. **Password Hashing**: Node.js bcrypt instead of PostgreSQL crypt()

## License

Same as original project.

